import { mkdir, writeFile } from "node:fs/promises";

const previewUrl = process.argv[2];
const auditDirectory = process.argv[3] ?? "/home/ubuntu/mobile-audit";
const viewports = [320, 375, 390];

if (!previewUrl) {
  throw new Error("Informe a URL da pré-visualização como primeiro argumento.");
}

const version = await fetch("http://127.0.0.1:9222/json/version").then(response => response.json());

function connect(url) {
  const socket = new WebSocket(url);
  const pending = new Map();
  let sequence = 0;

  socket.addEventListener("message", event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      message.error ? reject(new Error(message.error.message)) : resolve(message.result);
    }
  });

  return new Promise(resolve => {
    socket.addEventListener("open", () => resolve({
      send(method, params = {}) {
        const id = ++sequence;
        socket.send(JSON.stringify({ id, method, params }));
        return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
      },
      close() { socket.close(); },
    }));
  });
}

const browser = await connect(version.webSocketDebuggerUrl);
const { targetId } = await browser.send("Target.createTarget", { url: "about:blank" });
const targets = await fetch("http://127.0.0.1:9222/json/list").then(response => response.json());
const target = targets.find(item => item.id === targetId);
if (!target?.webSocketDebuggerUrl) {
  throw new Error("Não foi possível abrir a guia isolada para a auditoria mobile.");
}
const page = await connect(target.webSocketDebuggerUrl);

await mkdir(auditDirectory, { recursive: true });
const results = [];

for (const width of viewports) {
  await page.send("Emulation.setDeviceMetricsOverride", {
    width,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await page.send("Page.enable");
  await page.send("Page.navigate", { url: previewUrl });
  await new Promise(resolve => setTimeout(resolve, 4000));

  const source = `(() => {
    const nodes = [...document.querySelectorAll('body *')]
      .filter(el => el instanceof HTMLElement && el.scrollWidth > el.clientWidth + 1)
      .slice(0, 25)
      .map(el => ({ tag: el.tagName, className: el.className, clientWidth: el.clientWidth, scrollWidth: el.scrollWidth, text: (el.innerText || '').slice(0, 80) }));
    return { viewport: window.innerWidth, documentWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth, overflowing: nodes };
  })()`;
  const result = await page.send("Runtime.evaluate", {
    expression: source,
    returnByValue: true,
    awaitPromise: true,
  });
  const payload = result?.result?.value ?? null;
  const screenshot = await page.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
  const screenshotData = screenshot?.data;
  if (screenshotData) {
    await writeFile(`${auditDirectory}/home-${width}.png`, Buffer.from(screenshotData, "base64"));
  }
  results.push({ width, ...payload, screenshot: `${auditDirectory}/home-${width}.png` });
}

await writeFile(`${auditDirectory}/results.json`, JSON.stringify(results, null, 2));
await browser.send("Target.closeTarget", { targetId });
page.close();
browser.close();
console.log(JSON.stringify(results, null, 2));
