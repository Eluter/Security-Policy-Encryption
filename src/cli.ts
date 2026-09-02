#!/usr/bin/env node
import { realpathSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MAX_ADVISED_BYTES,
  assertEmbeddedKeyFingerprint,
  encryptFile,
  readKeyFingerprint,
} from './encrypt.js';
import { RECIPIENT, SECURITY_TXT_URL } from './key.js';

const HELP = `security-encrypt — encrypt a file for Eluter's security team

Usage:
  security-encrypt <file>       Encrypt <file> with PGP and write <file>.asc
  security-encrypt --fingerprint
                               Print the PGP fingerprint Eluter uses and the
                               link to verify it. Does not encrypt anything.
  security-encrypt --help       Show this help.

Options:
  -h, --help                    Print this help and exit.
  -f, --fingerprint             Print fingerprint + verification link and exit.

Examples:
  security-encrypt report.zip               ->  report.zip.asc
  npx @eluter/security-encrypt report.zip   ->  report.zip.asc

Notes:
  - The output is ASCII-armored OpenPGP, ready to attach to an email.
  - The CLI never contacts the network and never reads or writes private keys.
  - It does not zip directories for you: compress first, then encrypt.`;

const EXIT_OK = 0;
const EXIT_ERROR = 1;

interface ParsedArgs {
  action: 'help' | 'fingerprint' | 'encrypt';
  file?: string;
}

function parseArgs(argv: string[]): ParsedArgs {
  if (argv.includes('--help') || argv.includes('-h')) {
    return { action: 'help' };
  }
  if (argv.includes('--fingerprint') || argv.includes('-f')) {
    return { action: 'fingerprint' };
  }

  const opts = argv.filter((a) => a.startsWith('-'));
  if (opts.length > 0) {
    throw new Error(`Unknown option: ${opts.join(' ')}\n\n${HELP}`);
  }

  const positional = argv.filter((a) => !a.startsWith('-'));
  if (positional.length === 0) {
    throw new Error(`Missing filename.\n\n${HELP}`);
  }
  if (positional.length > 1) {
    throw new Error(`Expected one filename, got: ${positional.join(', ')}\n\n${HELP}`);
  }

  return { action: 'encrypt', file: positional[0] };
}

async function resolveInput(file: string): Promise<string> {
  const inputPath = resolve(file);
  let st;
  try {
    st = await stat(inputPath);
  } catch {
    throw new Error(`File not found: ${file}`);
  }
  if (st.isDirectory()) {
    throw new Error(
      `"${file}" is a directory, not a file.\n` +
        `Please compress it into a single archive first (for example .zip or .tar.gz) ` +
        `and encrypt that archive instead.`,
    );
  }
  if (!st.isFile()) {
    throw new Error(`Unsupported file type: ${file}`);
  }
  return inputPath;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KiB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MiB`;
}

export async function main(argv: string[]): Promise<number> {
  let parsed: ParsedArgs;
  try {
    parsed = parseArgs(argv);
  } catch (err) {
    process.stderr.write(`${(err as Error).message}\n`);
    return EXIT_ERROR;
  }

  if (parsed.action === 'help') {
    process.stdout.write(`${HELP}\n`);
    return EXIT_OK;
  }

  if (parsed.action === 'fingerprint') {
    try {
      const fingerprint = await readKeyFingerprint();
      process.stdout.write(`Eluter's PGP fingerprint:\n\n  ${fingerprint}\n\n`);
      process.stdout.write(`Verify it at: ${SECURITY_TXT_URL}\n`);
      return EXIT_OK;
    } catch (err) {
      process.stderr.write(`${(err as Error).message}\n`);
      return EXIT_ERROR;
    }
  }

  try {
    // Refuse to encrypt if the embedded key and its fingerprint drift apart.
    await assertEmbeddedKeyFingerprint();

    const inputPath = await resolveInput(parsed.file as string);
    const result = await encryptFile(inputPath);

    process.stdout.write(`✓ Encrypted for:    ${RECIPIENT}\n`);
    process.stdout.write(`✓ Recipient key fingerprint:\n      ${result.fingerprint}\n`);
    process.stdout.write(`      Verify at: ${SECURITY_TXT_URL}\n`);
    process.stdout.write(`✓ Generated:        ${result.outputPath}\n`);
    process.stdout.write(
      `✓ Size:             ${formatBytes(result.outputBytes)} (input ${formatBytes(result.inputBytes)})\n\n`,
    );
    process.stdout.write(
      `Next step: attach "${basename(result.outputPath)}" to an email to ${RECIPIENT}.\n` +
        `The plaintext file is not sent. Keep "${basename(inputPath)}" safe.\n`,
    );

    if (result.outputBytes > MAX_ADVISED_BYTES) {
      process.stderr.write(
        `\nWarning: the encrypted output is ${formatBytes(result.outputBytes)}, ` +
          `larger than the ${formatBytes(MAX_ADVISED_BYTES)} advisory limit for email attachments.\n` +
          `Consider compressing the report more or splitting it into smaller archives.\n`,
      );
    }
    return EXIT_OK;
  } catch (err) {
    process.stderr.write(`Error: ${(err as Error).message}\n`);
    return EXIT_ERROR;
  }
}

// Run only when executed directly (e.g. `node dist/cli.js`), not when imported
// in tests. realpathSync resolves the npm bin symlink to the real file.
const invokedPath = process.argv[1] ? realpathSync(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then((code) => {
    process.exitCode = code;
  });
}
