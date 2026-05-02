const router = require('express').Router();
const { db } = require('../db.cjs');
const { runAnalysis } = require('../services/watsonx.cjs');

router.get('/analyses', (_req, res) => {
  const rows = db.prepare('SELECT * FROM ai_analyses ORDER BY ran_at DESC LIMIT 10').all();
  res.json(rows.map(r => ({ ...r, recommendations: JSON.parse(r.recommendations) })));
});

router.post('/analyse', async (_req, res) => {
  try {
    const result = await runAnalysis();
    res.json(result);
  } catch (err) {
    res.status(502).json({ error: `WatsonX analysis failed: ${err.message}` });
  }
});

module.exports = router;
