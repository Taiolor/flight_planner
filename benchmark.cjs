const { performance } = require('node:perf_hooks');

// Mock network delay function
const mockSendPush = async (endpoint) => {
  return new Promise(resolve => setTimeout(() => resolve(true), 50));
};

async function sequential(subs) {
  let sent = 0;
  for (const sub of subs) {
    const ok = await mockSendPush(sub.endpoint);
    if (ok) sent++;
  }
  return sent;
}

async function parallel(subs) {
  const results = await Promise.all(
    subs.map(sub => mockSendPush(sub.endpoint))
  );
  return results.filter(Boolean).length;
}

async function run() {
  const subs = Array.from({ length: 50 }, (_, i) => ({ endpoint: `endpoint-${i}` }));

  console.log("Starting benchmark...");

  const startSeq = performance.now();
  await sequential(subs);
  const endSeq = performance.now();
  const timeSeq = endSeq - startSeq;

  const startPar = performance.now();
  await parallel(subs);
  const endPar = performance.now();
  const timePar = endPar - startPar;

  console.log(`Sequential: ${timeSeq.toFixed(2)}ms`);
  console.log(`Parallel:   ${timePar.toFixed(2)}ms`);
  console.log(`Speedup:    ${(timeSeq / timePar).toFixed(2)}x`);
}

run();
