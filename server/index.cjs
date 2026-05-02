// CommonJS entry point — sidesteps the "type":"module" in package.json
require('dotenv').config();
const app = require('./app.cjs');
const { initDb } = require('./db.cjs');
const { startScheduler } = require('./services/scheduler.cjs');

const PORT = process.env.PORT || 3000;

initDb();
startScheduler();

app.listen(PORT, () => {
  console.log(`Medication reminder running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
});
