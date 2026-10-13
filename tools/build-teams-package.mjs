// Builds the Teams app upload package: dist-teams/aa-app-<version>.zip
// containing manifest.json, color.png and outline.png at the zip root.
//
// Usage: npm run teams:package
//        npm run teams:package -- --allow-placeholders   (local check only)
//
// Reads src/config.ts directly (Node >= 23.6 strips TypeScript types).
// No dependencies: the zip is written with Node's zlib (deflate + crc32).

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { crc32, deflateRawSync } from "node:zlib";
import { appHost, config, privacyUrl, tabUrls, termsUrl } from "../src/config.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const allowPlaceholders = process.argv.includes("--allow-placeholders");

// Manifest schema 1.29: newest version listed as generally available on
// https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema
// (checked 2026-10-12).
const MANIFEST_VERSION = "1.29";

// Every address below derives from config.appUrl (see src/config.ts).
const manifest = {
  $schema: `https://developer.microsoft.com/json-schemas/teams/v${MANIFEST_VERSION}/MicrosoftTeams.schema.json`,
  manifestVersion: MANIFEST_VERSION,
  version: config.teamsApp.version,
  id: config.teamsApp.id,
  developer: {
    name: "Agency Artifact",
    websiteUrl: config.teamsApp.developerWebsiteUrl,
    privacyUrl,
    termsOfUseUrl: termsUrl,
  },
  name: {
    short: "Agency Artifact",
    full: "Agency Artifact",
  },
  description: {
    short: "Agency Artifact timecard and projects.",
    full: "Agency Artifact internal app: timecard, tasks and project status. Stage 0 build: test screens only.",
  },
  icons: {
    color: "color.png",
    outline: "outline.png",
  },
  accentColor: "#000000",
  staticTabs: [
    {
      entityId: "home",
      name: "Home",
      contentUrl: tabUrls.home,
      websiteUrl: tabUrls.home,
      scopes: ["personal"],
      context: ["personalTab"],
    },
    // Kept until stage 0 closes.
    {
      entityId: "diagnostic",
      name: "Diagnostic",
      contentUrl: tabUrls.diagnostic,
      websiteUrl: tabUrls.diagnostic,
      scopes: ["personal"],
      context: ["personalTab"],
    },
  ],
  validDomains: [appHost],
  // Recommended for nested app authentication so admins can see and approve
  // the app's Entra registration in the Teams admin center.
  webApplicationInfo: {
    id: config.entra.clientId,
  },
};

const manifestText = JSON.stringify(manifest, null, 2);
if (manifestText.includes("REPLACE_ME") && !allowPlaceholders) {
  console.error("src/config.ts still contains REPLACE_ME values. Fill them in first.");
  process.exit(1);
}

// --- minimal zip writer -----------------------------------------------------

function dosDateTime(d) {
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  const date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  return { time, date };
}

function zip(files) {
  const { time, date } = dosDateTime(new Date());
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const { name, data } of files) {
    const nameBuf = Buffer.from(name, "utf8");
    const compressed = deflateRawSync(data);
    const crc = crc32(data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // version needed
    local.writeUInt16LE(0x0800, 6); // UTF-8 names
    local.writeUInt16LE(8, 8); // deflate
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    locals.push(local, nameBuf, compressed);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4); // version made by
    central.writeUInt16LE(20, 6); // version needed
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(time, 12);
    central.writeUInt16LE(date, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, nameBuf);

    offset += local.length + nameBuf.length + compressed.length;
  }
  const centralSize = centrals.reduce((n, b) => n + b.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, ...centrals, end]);
}

// ----------------------------------------------------------------------------

const outDir = join(root, "dist-teams");
mkdirSync(outDir, { recursive: true });
const outFile = join(outDir, `aa-app-${config.teamsApp.version}.zip`);
writeFileSync(join(outDir, "manifest.json"), manifestText);
writeFileSync(
  outFile,
  zip([
    { name: "manifest.json", data: Buffer.from(manifestText, "utf8") },
    { name: "color.png", data: readFileSync(join(root, "teams", "icons", "color.png")) },
    { name: "outline.png", data: readFileSync(join(root, "teams", "icons", "outline.png")) },
  ]),
);
console.log(`Wrote ${outFile}`);
console.log(`Home tab:       ${tabUrls.home}`);
console.log(`Diagnostic tab: ${tabUrls.diagnostic}`);
console.log(`Valid domain:   ${appHost}`);
