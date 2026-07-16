import { createPrivateKey, sign } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { canonicalizeJson } from './release-utils.mjs';

function option(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1];
}

const manifestPath = resolve(option('--manifest') || 'dist/release/manifest.unsigned.json');
const outputPath = resolve(option('--output') || 'dist/release/manifest.json');
const privateKeyPath = option('--private-key') || process.env.POWERSNEXUS_RELEASE_PRIVATE_KEY_FILE;
if (!privateKeyPath) throw new Error('必须通过 --private-key 或 POWERSNEXUS_RELEASE_PRIVATE_KEY_FILE 指定私钥文件。');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
delete manifest.signature;
const key = createPrivateKey(readFileSync(resolve(privateKeyPath)));
if (key.asymmetricKeyType !== 'ed25519') throw new Error('发布私钥必须是 Ed25519。');
manifest.signature = sign(null, Buffer.from(canonicalizeJson(manifest), 'utf8'), key).toString('base64');
writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, { encoding: 'utf8', mode: 0o644 });
console.log(JSON.stringify({ manifest: outputPath, keyID: manifest.keyID, signed: true }));
