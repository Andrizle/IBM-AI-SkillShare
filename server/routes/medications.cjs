const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db.cjs');

router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM medications WHERE active = 1 ORDER BY name').all();
  res.json(rows.map(r => ({ ...r, times: JSON.parse(r.times) })));
});

router.get('/:id', (req, res) => {
  const med = db.prepare('SELECT * FROM medications WHERE id = ?').get(req.params.id);
  if (!med) return res.status(404).json({ error: 'Not found' });
  const logs = db.prepare(
    'SELECT * FROM dose_logs WHERE medication_id = ? ORDER BY date DESC, scheduled_time DESC LIMIT 30'
  ).all(med.id);
  res.json({ ...med, times: JSON.parse(med.times), recent_logs: logs });
});

router.post('/', (req, res) => {
  const { name, dosage, times, notes } = req.body;
  if (!name || !dosage || !Array.isArray(times) || times.length === 0) {
    return res.status(400).json({ error: 'name, dosage, and times[] are required' });
  }
  const id = uuidv4();
  db.prepare('INSERT INTO medications (id, name, dosage, times, notes) VALUES (?, ?, ?, ?, ?)').run(
    id, name, dosage, JSON.stringify(times), notes || null
  );
  res.status(201).json({ id, name, dosage, times, notes: notes || null, active: 1 });
});

router.put('/:id', (req, res) => {
  const med = db.prepare('SELECT * FROM medications WHERE id = ?').get(req.params.id);
  if (!med) return res.status(404).json({ error: 'Not found' });
  const { name, dosage, times, notes } = req.body;
  db.prepare('UPDATE medications SET name=?, dosage=?, times=?, notes=? WHERE id=?').run(
    name   ?? med.name,
    dosage ?? med.dosage,
    times  ? JSON.stringify(times) : med.times,
    notes  !== undefined ? notes : med.notes,
    med.id
  );
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  const info = db.prepare('UPDATE medications SET active = 0 WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

router.post('/:id/log', (req, res) => {
  const { scheduled_time, taken_at, status, date } = req.body;
  if (!scheduled_time || !status || !date) {
    return res.status(400).json({ error: 'scheduled_time, status, and date are required' });
  }
  if (!['taken', 'missed', 'pending'].includes(status)) {
    return res.status(400).json({ error: 'status must be taken, missed, or pending' });
  }
  const med = db.prepare('SELECT id FROM medications WHERE id = ?').get(req.params.id);
  if (!med) return res.status(404).json({ error: 'Not found' });

  const existing = db.prepare(
    'SELECT id FROM dose_logs WHERE medication_id = ? AND date = ? AND scheduled_time = ?'
  ).get(med.id, date, scheduled_time);

  if (existing) {
    db.prepare('UPDATE dose_logs SET status = ?, taken_at = ? WHERE id = ?')
      .run(status, taken_at || null, existing.id);
    res.json({ id: existing.id, medication_id: med.id, scheduled_time, taken_at: taken_at || null, date, status });
  } else {
    const id = uuidv4();
    db.prepare(
      'INSERT INTO dose_logs (id, medication_id, scheduled_time, taken_at, date, status) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, med.id, scheduled_time, taken_at || null, date, status);
    res.status(201).json({ id, medication_id: med.id, scheduled_time, taken_at: taken_at || null, date, status });
  }
});

router.get('/:id/logs', (req, res) => {
  const med = db.prepare('SELECT id FROM medications WHERE id = ?').get(req.params.id);
  if (!med) return res.status(404).json({ error: 'Not found' });
  const logs = db.prepare(
    'SELECT * FROM dose_logs WHERE medication_id = ? ORDER BY date DESC, scheduled_time DESC'
  ).all(med.id);
  res.json(logs);
});

module.exports = router;
