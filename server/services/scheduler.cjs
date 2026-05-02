const cron = require('node-cron');
const { db } = require('../db.cjs');
const { sendPush } = require('./push.cjs');
const { runAnalysis } = require('./watsonx.cjs');

function startScheduler() {
  cron.schedule('* * * * *', sendDueReminders);
  cron.schedule(process.env.AI_WEEKLY_CRON || '0 2 * * 0', runWeeklyAnalysis);
  console.log('Scheduler started');
}

async function sendDueReminders() {
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const today = now.toISOString().slice(0, 10);

  const meds = db.prepare('SELECT * FROM medications WHERE active = 1').all();

  for (const med of meds) {
    const times = JSON.parse(med.times);
    if (!times.includes(currentTime)) continue;

    const alreadyLogged = db.prepare(
      'SELECT id FROM dose_logs WHERE medication_id = ? AND date = ? AND scheduled_time = ?'
    ).get(med.id, today, currentTime);
    if (alreadyLogged) continue;

    const subs = db.prepare('SELECT * FROM push_subscriptions').all();
    for (const sub of subs) {
      try {
        await sendPush(sub, {
          title: `Time for ${med.name}`,
          body: `${med.dosage} — scheduled at ${currentTime}`,
          tag: `med-${med.id}-${today}-${currentTime}`,
        });
      } catch (err) {
        if (err.expired) db.prepare('DELETE FROM push_subscriptions WHERE id = ?').run(sub.id);
      }
    }
  }
}

async function runWeeklyAnalysis() {
  try {
    await runAnalysis();
    console.log('Weekly AI analysis completed');
  } catch (err) {
    console.error(`Weekly AI analysis failed: ${err.message}`);
  }
}

module.exports = { startScheduler };
