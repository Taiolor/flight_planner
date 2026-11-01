import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(
  new URL("../.github/workflows/ci.yml", import.meta.url),
  "utf8"
);
const packageJson = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8")
) as {
  packageManager: string;
  devDependencies: { pnpm: string };
};
const lockfile = readFileSync(
  new URL("../pnpm-lock.yaml", import.meta.url),
  "utf8"
);
const steps = workflow.split(/\n(?=\s+- name:)/);
const pnpmSteps = steps.filter(step =>
  /uses:\s*pnpm\/action-setup@/.test(step)
);
const pnpmVersion = packageJson.packageManager
  .replace(/^pnpm@/, "")
  .split("+")[0];

function unquote(value: string): string {
  return value.trim().replace(/^["']|["']$/g, "");
}

describe("CI package manager configuration", () => {
  it("pins a precise pnpm version in packageManager", () => {
    expect(packageJson.packageManager).toMatch(
      /^pnpm@\d+\.\d+\.\d+(?:\+sha\d+\.[a-f0-9]+)?$/
    );
  });

  it("lets one setup action read the version from packageManager", () => {
    expect(pnpmSteps).toHaveLength(1);
    expect(pnpmSteps[0]).not.toMatch(/^\s+version:/m);
    expect(pnpmSteps[0]).not.toMatch(/^\s+package_json_file:/m);
  });

  it("keeps the pnpm dependency range aligned with the pinned version", () => {
    expect(packageJson.devDependencies.pnpm).toBe(`^${pnpmVersion}`);
  });

  it("keeps the pnpm lockfile importer aligned with package.json", () => {
    const importer = lockfile.match(
      /^ {6}pnpm:\s*\n {8}specifier: ([^\n]+)\n {8}version: ([^\n]+)/m
    );
    expect(importer).not.toBeNull();
    expect(unquote(importer![1])).toBe(packageJson.devDependencies.pnpm);
    expect(unquote(importer![2]).split("(")[0]).toBe(pnpmVersion);
  });

  it("prepares pnpm before initializing the Node pnpm cache", () => {
    const pnpmIndex = steps.indexOf(pnpmSteps[0]);
    const cacheIndex = steps.findIndex(
      step => /uses:\s*actions\/setup-node@/.test(step) &&
        /^\s+cache:\s*pnpm\s*$/m.test(step)
    );
    expect(pnpmIndex).toBeGreaterThanOrEqual(0);
    expect(cacheIndex).toBeGreaterThan(pnpmIndex);
  });

  it("installs from the frozen lockfile without bypassing it", () => {
    expect(workflow).toMatch(/run:\s*pnpm install --frozen-lockfile/);
    expect(workflow).not.toMatch(/--no-frozen-lockfile|--force/);
  });
});
