const { WatsonXAI } = require('@ibm-cloud/watsonx-ai');
const { IamAuthenticator } = require('ibm-cloud-sdk-core');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db.cjs');

let client = null;

function getClient() {
  if (!client) {
    client = WatsonXAI.newInstance({
      authenticator: new IamAuthenticator({ apikey: process.env.WATSONX_API_KEY }),
      serviceUrl: process.env.WATSONX_URL || 'https://us-south.ml.cloud.ibm.com',
      version: '2024-05-31',
    });
  }
  return client;
}

function extractFirstJSON(text) {
  // Strip markdown code fences if present
  text = text.replace(/```(?:json)?\n?/gi, '').trim();
  const start = text.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}' && --depth === 0) {
      try { return JSON.parse(text.slice(start, i + 1)); } catch { return null; }
    }
  }
  return null;
}

async function runAnalysis() {
  const meds = db.prepare('SELECT * FROM medications WHERE active = 1').all();
  if (meds.length === 0) return { message: 'No active medications to analyse' };

  const logs = db.prepare(`
    SELECT dl.*, m.name AS med_name
    FROM dose_logs dl
    JOIN medications m ON m.id = dl.medication_id
    WHERE dl.date >= date('now', '-7 days')
    ORDER BY dl.date, dl.medication_id, dl.scheduled_time
  `).all();

  const adherence = meds.map(m => {
    const medLogs = logs.filter(l => l.medication_id === m.id);
    const taken = medLogs.filter(l => l.status === 'taken');
    const total = medLogs.length;

    const delays = taken
      .filter(l => l.taken_at)
      .map(l => {
        const [h, min] = l.scheduled_time.split(':').map(Number);
        const actual = new Date(l.taken_at);
        const scheduled = new Date(actual);
        scheduled.setHours(h, min, 0, 0);
        return Math.round((actual - scheduled) / 60000);
      });

    const avgDelay = delays.length
      ? Math.round(delays.reduce((a, b) => a + b, 0) / delays.length)
      : null;

    return {
      medication: m.name,
      dosage: m.dosage,
      scheduled_times: JSON.parse(m.times),
      doses_taken: taken.length,
      doses_total: total,
      adherence_pct: total ? Math.round((taken.length / total) * 100) : 0,
      avg_delay_minutes: avgDelay,
    };
  });

  const prompt = `You are a medication adherence assistant. Analyse the weekly adherence data below and respond ONLY with valid JSON — no markdown, no explanation outside the JSON.

Adherence data (past 7 days):
${JSON.stringify(adherence, null, 2)}

Respond with this exact structure:
{
  "summary": "one or two sentence overall assessment",
  "recommendations": [
    {
      "medication": "medication name",
      "suggestion": "brief explanation of what to change and why"
    }
  ]
}

Only include an entry in recommendations when a schedule change is genuinely warranted. If adherence is good, leave recommendations as an empty array.`;

  const response = await getClient().generateText({
    modelId: process.env.WATSONX_MODEL_ID || 'meta-llama/llama-3-1-70b-instruct',
    projectId: process.env.WATSONX_PROJECT_ID,
    input: prompt,
    parameters: { max_new_tokens: 600, temperature: 0.2 },
  });

  const raw = response.result.results[0].generated_text.trim();
  const parsed = extractFirstJSON(raw);
  if (!parsed) throw new Error('WatsonX returned a non-JSON response');
  const id = uuidv4();

  db.prepare('INSERT INTO ai_analyses (id, summary, recommendations) VALUES (?, ?, ?)').run(
    id, parsed.summary, JSON.stringify(parsed.recommendations ?? [])
  );

  return {
    id,
    summary: parsed.summary,
    recommendations: parsed.recommendations ?? [],
    ran_at: new Date().toISOString(),
  };
}

module.exports = { runAnalysis };
