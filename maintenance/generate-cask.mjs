#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
export const OCI_DESKTOP_PUBLIC_BASE_URL = "https://objectstorage.ap-seoul-1.oraclecloud.com/n/cn8fx3trhyfq/b/agent-dress-releases/o";
const PRODUCTS = {
  "agent-dress": { artifactName: "agent-dress-desktop", prefix: "macos", displayName: "Agent Dress", bundleId: "kr.yee.dress.desktop", codeName: "dress", cliName: "agent-dress" },
  "salus-cabinet": { artifactName: "salus-cabinet-desktop", prefix: "macos/salus-cabinet", displayName: "Salus Cabinet", bundleId: "io.saluscare.cabinet.desktop", codeName: "cabinet", cliName: "cabinet" },
};
export function getProductConfig(product) {
  if (!Object.hasOwn(PRODUCTS, product)) throw new Error(`Unsupported product: ${product}`);
  return PRODUCTS[product];
}
function objectUrl(base, object) { return `${base}/${object}`; }

/** Only published, immutable package coordinates may enter an executable Ruby cask. */
export function renderCask(product, release) {
  const config = getProductConfig(product);
  const identity = config;
  const version = release.version;
  if (release.schema !== "agent-dress.desktop-release.v1" || release.platform !== "darwin" || release.arch !== "arm64") {
    throw new Error("Unsupported desktop release schema/platform/architecture");
  }
  if (typeof version !== "string" || !/^\d+\.\d+\.\d+$/.test(version)) {
    throw new Error("Homebrew requires a stable release version");
  }
  const filename = `${config.artifactName}-${version}-darwin-arm64.pkg`;
  const object = `${config.prefix}/${version}/${filename}`;
  const url = objectUrl(OCI_DESKTOP_PUBLIC_BASE_URL, object);
  if (release.package?.filename !== filename || release.package?.object !== object || release.package?.url !== url) {
    throw new Error("Package coordinates do not match the product and immutable public release");
  }
  if (!/^[a-f0-9]{64}$/.test(release.package.sha256 ?? "") ||
      !Number.isSafeInteger(release.package.size) || release.package.size <= 0) {
    throw new Error("Invalid package checksum or size");
  }
  const other = product === "agent-dress" ? "salus-cabinet" : "agent-dress";
  const homepage = product === "agent-dress" ? "https://dress.yees.kr" : "https://cabinet.saluscare.io";
  return `# Generated from published desktop-release metadata; do not edit by hand.
cask "${product}" do
  version "${version}"
  sha256 "${release.package.sha256}"

  url "${url}"
  name "${identity.displayName}"
  desc "${product === "agent-dress" ? "AI agent persona and local runtime" : "SALUSCARE AI agent desktop runtime"}"
  homepage "${homepage}"

  depends_on arch: :arm64
  conflicts_with cask: "${other}"

  pkg "${filename}"

  # Homebrew also runs uninstall during upgrades. Runtime cleanup is deliberately
  # explicit so upgrades preserve settings, data, MCP registrations and hooks.
  uninstall quit:    "${identity.bundleId}",
            pkgutil: "${identity.bundleId}"

  caveats <<~EOS
    Open ${identity.displayName} after installation to provision or update the runtime.
    This developer package is not Apple notarized; macOS may require explicit approval.
    Cask removal removes the desktop app only. To remove the runtime as well,
    first run ~/.${identity.codeName}/bin/${identity.cliName} uninstall --product ${product}
    as the installing user. Runtime uninstall preserves data and skills.
    Existing .pkg installations can be replaced; back up settings and data first.
  EOS
end
`;
}

async function main() {
  const [product, metadataFile, outputDir] = process.argv.slice(2);
  if (!product || !metadataFile || !outputDir) {
    throw new Error("Usage: node scripts/generate-homebrew-cask.mjs <agent-dress|salus-cabinet> <published latest.json> <Casks directory>");
  }
  const cask = renderCask(product, JSON.parse(await fs.readFile(metadataFile, "utf8")));
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(path.join(outputDir, `${product}.rb`), cask);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
