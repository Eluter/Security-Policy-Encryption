import { readFile, stat, writeFile } from 'node:fs/promises';
import * as openpgp from 'openpgp';
import { EXPECTED_FINGERPRINT, PUBLIC_KEY_ARMORED } from './key.js';

export const MAX_ADVISED_BYTES = 20 * 1024 * 1024; // 20 MB

export interface EncryptResult {
  outputPath: string;
  fingerprint: string;
  inputBytes: number;
  outputBytes: number;
}

export async function readKeyFingerprint(armoredKey: string = PUBLIC_KEY_ARMORED): Promise<string> {
  const key = await openpgp.readKey({ armoredKey });
  return key.getFingerprint().toLowerCase();
}

export async function assertEmbeddedKeyFingerprint(): Promise<string> {
  const fingerprint = await readKeyFingerprint(PUBLIC_KEY_ARMORED);
  if (fingerprint !== EXPECTED_FINGERPRINT) {
    throw new Error(
      `Embedded PGP key fingerprint mismatch.\n` +
        `  expected: ${EXPECTED_FINGERPRINT}\n` +
        `  actual:   ${fingerprint}\n` +
        `Update src/key.ts or EXPECTED_FINGERPRINT.`,
    );
  }
  return fingerprint;
}

export async function encryptFile(
  inputPath: string,
  publicKeyArmored: string = PUBLIC_KEY_ARMORED,
): Promise<EncryptResult> {
  let inputStat;
  try {
    inputStat = await stat(inputPath);
  } catch {
    throw new Error(`File not found: ${inputPath}`);
  }

  if (inputStat.isDirectory()) {
    throw new Error(
      `"${inputPath}" is a directory, not a file.\n` +
        `Please compress it into a single archive first (for example .zip or .tar.gz) ` +
        `and encrypt that archive instead.`,
    );
  }
  if (!inputStat.isFile()) {
    throw new Error(`Unsupported file type: ${inputPath}`);
  }

  const key = await openpgp.readKey({ armoredKey: publicKeyArmored });
  const fingerprint = key.getFingerprint().toLowerCase();
  const data = await readFile(inputPath);
  const message = await openpgp.createMessage({ binary: data });
  const armored = await openpgp.encrypt({ message, encryptionKeys: key });

  const outputPath = `${inputPath}.asc`;
  await writeFile(outputPath, armored, 'utf8');

  const outputStat = await stat(outputPath);
  return {
    outputPath,
    fingerprint,
    inputBytes: inputStat.size,
    outputBytes: outputStat.size,
  };
}
