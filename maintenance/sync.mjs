import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { renderCask, getProductConfig, OCI_DESKTOP_PUBLIC_BASE_URL } from "./generate-cask.mjs";

export function compareVersions(a, b) {
  const left = a.split(".").map(Number), right = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) if (left[i] !== right[i]) return Math.sign(left[i] - right[i]);
  return 0;
}

async function json(url, fetcher) {
  const response = await fetcher(url, { signal: AbortSignal.timeout(30000), redirect: "error" });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Metadata HTTP ${response.status}`);
  const text = await response.text();
  if (text.length > 1024 * 1024) throw new Error("Metadata too large");
  return JSON.parse(text);
}

/** Validate every candidate before writing any file. Missing first releases are expected. */
export async function sync({ directory = "Casks", fetcher = fetch } = {}) {
  const updates = [];
  for (const product of ["agent-dress", "salus-cabinet"]) {
    const config = getProductConfig(product);
    const release = await json(`${OCI_DESKTOP_PUBLIC_BASE_URL}/${config.prefix}/latest/latest.json`, fetcher);
    if (!release) { console.log(`${product}: no public release yet`); continue; }
    const content = renderCask(product, release);
    const target = path.join(directory, `${product}.rb`);
    let current = "";
    try { current = await readFile(target, "utf8"); } catch (error) { if (error.code !== "ENOENT") throw error; }
    const currentVersion = /^\s*version "(\d+\.\d+\.\d+)"/m.exec(current)?.[1];
    if (current && !currentVersion) throw new Error(`Invalid existing Cask: ${product}`);
    if (currentVersion) {
      const order = compareVersions(release.version, currentVersion);
      if (order < 0) throw new Error(`Refusing downgrade: ${product}`);
      if (order === 0) {
        if (!current.includes(`sha256 "${release.package.sha256}"`) || !current.includes(`url "${release.package.url}"`)) {
          throw new Error(`Immutable release changed: ${product}`);
        }
        console.log(`${product}: unchanged ${currentVersion}`); continue;
      }
    }
    const immutable = await json(`${OCI_DESKTOP_PUBLIC_BASE_URL}/${config.prefix}/${release.version}/latest.json`, fetcher);
    if (!immutable || renderCask(product, immutable) !== content) throw new Error(`Incomplete immutable release: ${product}`);
    if (release.package.size > 512 * 1024 * 1024) throw new Error("Package too large");
    const response = await fetcher(release.package.url, { signal: AbortSignal.timeout(300000), redirect: "error" });
    if (!response.ok || !response.body) throw new Error(`Package unavailable: ${product}`);
    const digest = createHash("sha256"); let size = 0;
    for await (const chunk of response.body) {
      size += chunk.length;
      if (size > release.package.size) throw new Error(`Package exceeds expected size: ${product}`);
      digest.update(chunk);
    }
    if (size !== release.package.size || digest.digest("hex") !== release.package.sha256) throw new Error(`Package integrity mismatch: ${product}`);
    updates.push({ target, content, product, version: release.version });
  }
  await mkdir(directory, { recursive: true });
  for (const update of updates) {
    await writeFile(update.target, update.content);
    console.log(`${update.product}: updated to ${update.version}`);
  }
  return updates;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  sync().catch(error => { console.error(error.message); process.exitCode = 1; });
}
