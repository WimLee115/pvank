import archiver from 'archiver';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Snapshot } from './snapshot';
import { sha256, sha256Hex } from './hash';
import { stampOtsForData } from './ots';

export interface UrlInput {
  kind: 'url';
  url: string;
  snapshot: Snapshot;
}

export interface FileInput {
  kind: 'file';
  filename: string;
  buf: Buffer;
}

export type BundleInput = UrlInput | FileInput;

export interface BundleResult {
  zip: Buffer;
  ankerHash: string;
}

export async function buildBundle(input: BundleInput): Promise<BundleResult> {
  const items: Record<string, Buffer> = {};

  if (input.kind === 'url') {
    items['snapshot.html'] = Buffer.from(input.snapshot.html, 'utf8');
    items['snapshot.png'] = input.snapshot.png;
    items['headers.json'] = Buffer.from(
      JSON.stringify(
        {
          requestedUrl: input.url,
          finalUrl: input.snapshot.finalUrl,
          status: input.snapshot.status,
          headers: input.snapshot.headers,
          capturedAt: input.snapshot.capturedAt,
        },
        null,
        2
      ),
      'utf8'
    );
  } else {
    items[input.filename] = input.buf;
  }

  const contents = Object.fromEntries(
    Object.entries(items).map(([name, buf]) => [name, sha256Hex(buf)])
  );

  const manifest = {
    pvank: '0.1',
    kind: input.kind,
    capturedAt: new Date().toISOString(),
    source:
      input.kind === 'url'
        ? { url: input.url, finalUrl: input.snapshot.finalUrl }
        : { filename: input.filename, size: input.buf.byteLength },
    contents,
    note:
      'manifest.json.ots is een OpenTimestamps-receipt over SHA-256(manifest.json). ' +
      'Verifieer met: ots verify manifest.json.ots',
  };

  const manifestJson = Buffer.from(JSON.stringify(manifest, null, 2), 'utf8');
  const ankerHash = sha256(manifestJson);
  const ankerHashHex = ankerHash.toString('hex');

  let ots: Buffer;
  try {
    ots = await stampOtsForData(manifestJson);
  } catch (err) {
    throw new Error(
      'OTS-stamping mislukt (calendar-server onbereikbaar?): ' +
        (err instanceof Error ? err.message : String(err))
    );
  }

  let verifyHtml: string | null = null;
  try {
    verifyHtml = await readFile(
      join(process.cwd(), 'templates', 'verify.html'),
      'utf8'
    );
  } catch {
    /* template optioneel */
  }

  const archive = archiver('zip', { zlib: { level: 9 } });
  const chunks: Buffer[] = [];
  archive.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
  const done = new Promise<void>((resolve, reject) => {
    archive.on('end', resolve);
    archive.on('error', reject);
  });

  for (const [name, buf] of Object.entries(items)) {
    archive.append(buf, { name });
  }
  archive.append(manifestJson, { name: 'manifest.json' });
  archive.append(ots, { name: 'manifest.json.ots' });
  if (verifyHtml) {
    archive.append(verifyHtml, { name: 'verify.html' });
  }

  await archive.finalize();
  await done;

  return { zip: Buffer.concat(chunks), ankerHash: ankerHashHex };
}
