const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db.cjs');
const { sendPush } = require('../services/push.cjs');

router.get('/vapid-public-key', (_req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

router.post('/subscribe', (req, res) => {
  const { endpoint, keys } = req.body;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({ error: 'endpoint, keys.p256dh and keys.auth are required' });
  }
  const id = uuidv4();
  db.prepare(
    `INSERT INTO push_subscriptions (id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?)
     ON CONFLICT(endpoint) DO UPDATE SET p256dh=excluded.p256dh, auth=excluded.auth`
  ).run(id, endpoint, keys.p256dh, keys.auth);
  res.status(201).json({ ok: true });
});

router.delete('/subscribe', (req, res) => {
  const { endpoint } = req.body;
  if (!endpoint) return res.status(400).json({ error: 'endpoint is required' });
  db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').run(endpoint);
  res.json({ ok: true });
});

router.post('/test', async (_req, res) => {
  const subs = db.prepare('SELECT * FROM push_subscriptions').all();
  if (subs.length === 0) return res.status(404).json({ error: 'No subscriptions found — subscribe first' });
  let sent = 0;
  for (const sub of subs) {
    try {
      await sendPush(sub, { title: 'Medication Reminder', body: 'Push notifications are working!' });
      sent++;
    } catch (err) {
      if (err.expired) db.prepare('DELETE FROM push_subscriptions WHERE id = ?').run(sub.id);
    }
  }
  res.json({ ok: true, sent });
});

module.exports = router;
