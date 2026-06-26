import { getAllFlightWeeks, getNotificationSettings } from './server/db.js';
import { db } from './server/db.js';

async function run() {
  const start = performance.now();
  for (let i = 0; i < 50; i++) {
    await getAllFlightWeeks();
    await getNotificationSettings();
  }
  const end = performance.now();
  console.log(`Sequential: ${end - start} ms`);

  const start2 = performance.now();
  for (let i = 0; i < 50; i++) {
    await Promise.all([getAllFlightWeeks(), getNotificationSettings()]);
  }
  const end2 = performance.now();
  console.log(`Parallel: ${end2 - start2} ms`);
}

run().then(() => process.exit(0)).catch(console.error);
