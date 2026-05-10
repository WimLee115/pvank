'use client';

import { useState, type FormEvent } from 'react';

type Mode = 'url' | 'file';

export default function Home() {
  const [mode, setMode] = useState<Mode>('url');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('mode', mode);
      if (mode === 'url') fd.append('url', url);
      if (mode === 'file' && file) fd.append('file', file);

      const res = await fetch('/api/anker', { method: 'POST', body: fd });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `pvank-bewijs-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'onbekende fout');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main>
      <pre className="ascii">{`░▒▓ PVANK ▓▒░
verankerd in tijd`}</pre>

      <p className="manifest">
        Cryptografisch bewijs voor elke Nederlander.
        <br />
        SHA-256 + OpenTimestamps op de Bitcoin-blockchain. Gratis. Open.
      </p>

      <form onSubmit={handleSubmit}>
        <fieldset>
          <legend>wat verankeren?</legend>
          <label>
            <input
              type="radio"
              name="mode"
              value="url"
              checked={mode === 'url'}
              onChange={() => setMode('url')}
            />
            een webpagina
          </label>
          <label>
            <input
              type="radio"
              name="mode"
              value="file"
              checked={mode === 'file'}
              onChange={() => setMode('file')}
            />
            een bestand
          </label>
        </fieldset>

        {mode === 'url' ? (
          <input
            key="url-input"
            type="url"
            placeholder="https://..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
        ) : (
          <input
            key="file-input"
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            required
          />
        )}

        <button type="submit" disabled={busy}>
          {busy ? '▒▒ verankeren... ▒▒' : '▒▒ ANKER NEERLATEN ▒▒'}
        </button>

        {error ? <p className="error">fout: {error}</p> : null}
      </form>

      <footer>
        <p>
          PVANK is open source (AGPL-3.0). Onderdeel van de{' '}
          <a href="https://github.com/WimLee115">Privacyverzet</a>-vloot.
          <br />
          Captain WimLee115 — <em>Aan boord. Anoniem. Onverzettelijk.</em>
        </p>
      </footer>
    </main>
  );
}
