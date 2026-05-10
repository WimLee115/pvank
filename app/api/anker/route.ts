import { NextResponse, type NextRequest } from 'next/server';
import { snapshotUrl } from '@/lib/snapshot';
import { gatherTegenpartij } from '@/lib/tegenpartij';
import { buildBundle } from '@/lib/bundle';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const mode = form.get('mode');

    if (mode === 'url') {
      const url = form.get('url');
      if (typeof url !== 'string' || !url) {
        return NextResponse.json(
          { error: 'url ontbreekt' },
          { status: 400 }
        );
      }
      try {
        new URL(url);
      } catch {
        return NextResponse.json(
          { error: 'ongeldige URL' },
          { status: 400 }
        );
      }

      const [snapshot, tegenpartij] = await Promise.all([
        snapshotUrl(url),
        gatherTegenpartij(url),
      ]);
      const { zip } = await buildBundle({
        kind: 'url',
        url,
        snapshot,
        tegenpartij,
      });
      return new NextResponse(new Uint8Array(zip), {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': 'attachment; filename="pvank-bewijs.zip"',
        },
      });
    }

    if (mode === 'file') {
      const file = form.get('file');
      if (!(file instanceof Blob)) {
        return NextResponse.json(
          { error: 'bestand ontbreekt' },
          { status: 400 }
        );
      }
      const buf = Buffer.from(await file.arrayBuffer());
      const filename =
        'name' in file && typeof (file as File).name === 'string'
          ? (file as File).name
          : 'document';
      const { zip } = await buildBundle({ kind: 'file', filename, buf });
      return new NextResponse(new Uint8Array(zip), {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': 'attachment; filename="pvank-bewijs.zip"',
        },
      });
    }

    return NextResponse.json({ error: 'onbekende modus' }, { status: 400 });
  } catch (err) {
    console.error('[pvank/anker]', err);
    const msg = err instanceof Error ? err.message : 'onbekende fout';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
