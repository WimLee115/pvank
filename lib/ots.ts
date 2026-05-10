import { spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * Stempel de SHA-256 van `data` via de canonical OpenTimestamps-client.
 * Vereist `ots` op PATH (pip install opentimestamps-client).
 * Retourneert de OTS-receipt als Buffer.
 */
export async function stampOtsForData(data: Buffer): Promise<Buffer> {
  const dir = await mkdtemp(join(tmpdir(), 'pvank-ots-'));
  const target = join(dir, 'payload');
  try {
    await writeFile(target, data);
    await runOts(['stamp', target]);
    return await readFile(target + '.ots');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function runOts(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('ots', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', (err) =>
      reject(
        new Error(
          `ots niet uitvoerbaar (pip install opentimestamps-client?): ${err.message}`
        )
      )
    );
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else
        reject(
          new Error(
            `ots faalde (exit ${code}): ${stderr.trim() || '(geen output)'}`
          )
        );
    });
  });
}
