// Writes the .env values into the two generated files that need them at runtime, so no account
// identifier is ever committed. Run by npm prestart and pretest; also `npm run setup`.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { OPERATOR_PROFILES, withClickId } from '../core/constants/operators.js';

const ENV_FILE = '.env';
const MANIFEST_FILE = 'browser-extension/manifest.json';
const AFFILIATE_FILE = 'core/constants/affiliate.js';
const EXTENSION_FILE = 'browser-extension/operators.js';
const GENERATED_NOTE = '// Generated from .env. Not committed, and edits here are overwritten.';

if (!existsSync(ENV_FILE)) {
  console.error('No .env found. Copy .env.example to .env and fill in your affiliate values.');
  process.exit(1);
}

process.loadEnvFile();

function readEnvValues(profile) {
  const values = {};
  for (const [field, variableName] of Object.entries(profile.env)) {
    const value = process.env[variableName];
    if (value) {
      values[field] = value;
    } else if (field === 'url') {
      console.error(`.env is missing ${variableName}, the click URL for operator "${profile.key}".`);
      process.exit(1);
    } else {
      console.warn(`${variableName} is not set — the POCs that need ${profile.key} "${field}" will say so instead of running.`);
    }
  }
  return values;
}

function extensionOperator(profile, values) {
  const operator = {
    key: profile.key,
    label: `${profile.label} — ${profile.network}`,
    url: withClickId(profile, values.url),
    landingParams: profile.landingParams,
  };
  if (profile.attributionCookie) {
    operator.cookie = { domain: profile.cookieDomain, prefix: profile.attributionCookie };
  }
  return operator;
}

// A manifest is static JSON and cannot read .env, so a new operator's hosts have to be added there
// by hand. This only tells you which ones are missing.
function warnAboutHostPermissions(profiles) {
  const manifest = JSON.parse(readFileSync(MANIFEST_FILE, 'utf8'));
  const hosts = profiles.flatMap((profile) => [profile.clickHost, profile.cookieDomain]).filter(Boolean);
  const missing = hosts.filter((host) => !manifest.host_permissions.some((pattern) => pattern.includes(host)));
  if (missing.length > 0) {
    console.warn(`Add these to host_permissions in ${MANIFEST_FILE}: ${missing.join(', ')}`);
  }
}

const entries = OPERATOR_PROFILES.map((profile) => ({ profile, values: readEnvValues(profile) }));

const affiliateLines = entries.map(({ profile, values }) => `  ${profile.key}: ${JSON.stringify(values)},`);
writeFileSync(AFFILIATE_FILE, `${GENERATED_NOTE}\nexport const AFFILIATE = {\n${affiliateLines.join('\n')}\n};\n`);

const extensionLines = entries.map(({ profile, values }) => `  ${JSON.stringify(extensionOperator(profile, values))},`);
writeFileSync(EXTENSION_FILE, `${GENERATED_NOTE}\nexport const OPERATORS = [\n${extensionLines.join('\n')}\n];\n`);

console.log(`wrote ${AFFILIATE_FILE} and ${EXTENSION_FILE} for: ${entries.map(({ profile }) => profile.key).join(', ')}`);
warnAboutHostPermissions(OPERATOR_PROFILES);
