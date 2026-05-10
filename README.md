<div align="center">

```
░▒▓ PVANK ▓▒░
   Privacyverzet · Anker
   verankerd in tijd
```

**Cryptografisch bewijs voor elke Nederlander**

</div>

---

> "De taal waarin bedrijven niet kunnen liegen."

PVANK verankert digitaal bewijs in de Bitcoin-blockchain. Voor de burger die ooit moet bewijzen wat een instantie écht zei, schreef of toonde — voordat het verdwijnt.

## Wat het doet

Plak een URL of upload een bestand. PVANK levert binnen seconden een `pvank-bewijs.zip`:

```
pvank-bewijs.zip
├── snapshot.html       — origineel HTML (URL-modus) of jouw bestand
├── snapshot.png        — full-page screenshot (URL-modus)
├── headers.json        — HTTP-headers + final URL (URL-modus)
├── manifest.json       — alle hashes + metadata + tijdstempel
├── manifest.json.ots   — OpenTimestamps-receipt (Bitcoin-blockchain)
└── verify.html         — open in elke browser, controleer alles
```

`verify.html` werkt offline en zonder PVANK. Drop de bestanden erin → SHA-256 wordt opnieuw berekend en vergeleken met het manifest. Voor blockchain-verificatie:

```bash
pip install opentimestamps-client
ots verify manifest.json.ots
```

## Waarom

Notarissen rekenen €50–150 per document. archive.org is geen bewijswaarde. opentimestamps.org bestaat — maar is voor cryptografen. Daartussen staat de burger met lege handen tegenover gemeente, energieleverancier, zorgverzekeraar, werkgever, verhuurder, bewindvoerder, school, BKR, UWV, Belastingdienst.

PVANK sluit dat gat. Gratis. Open. Auditeerbaar.

## Pijlers

- **Soevereiniteit** — eigen bewijs, eigen ZIP. Nooit afhankelijk van PVANK na export.
- **Anonimiteit** — geen account, geen tracking, geen telemetrie. Hashes lekken geen inhoud.
- **Verzet** — bewijs dat instanties niet kunnen weghalen, herschrijven of ontkennen.
- **Vakmanschap** — SHA-256, OpenTimestamps, Bitcoin-blockchain. Dezelfde methodologie als Dossier 608 (5.411 OTS-timestamps · 876k scans).
- **Open zee** — AGPL-3.0. Bewijs-software moet auditeerbaar zijn.

## Quick start

```bash
pip install opentimestamps-client     # de officiële `ots` CLI
pnpm install
pnpm playwright install chromium
pnpm dev
```

Open `http://localhost:3000`.

## Stack

- **Next.js 15** + App Router + TypeScript strict
- **Playwright** voor server-side snapshots (incl. JS-rendered pagina's)
- **`opentimestamps-client`** (Python, canonical) — via subprocess `ots stamp`
- **`archiver`** voor ZIP-output
- **Web Crypto API** voor browser-side hash-verificatie in `verify.html`

PVANK gebruikt bewust de officiële Python `ots`-client en niet de oude
`javascript-opentimestamps` npm-package — die laatste sleept `request@2.x` en
`bitcore-lib@8.14` mee, met >10 critical CVE's. Bewijs-software verdraagt geen
oude transitives.

## Architectuur

```
  browser ──form──▶  /api/anker
                        │
                        ├─▶ Playwright snapshot (URL)
                        │     html · png · headers
                        │
                        ├─▶ SHA-256 per onderdeel
                        ├─▶ manifest.json bouwen
                        ├─▶ SHA-256(manifest.json) → ankerhash
                        ├─▶ OpenTimestamps stamp
                        │     ankerhash + receipt
                        │
                        └─▶ ZIP terug naar browser
```

Het stuk dat OTS-stamped wordt is uitsluitend `SHA-256(manifest.json)`. De manifest bevat de hashes van alle losse bestanden — zo verifieer je met één blockchain-aanker de hele bundel.

## Status

`v0.1` skeleton. Werkt voor URL's en bestand-uploads. Nog te doen:

- [ ] WHOIS- en Handelsregister-snapshot van de tegenpartij meenemen
- [ ] Browser-extensie ("verzegel deze pagina")
- [ ] Mobile / PWA met camera-import (foto's instant verzegelen)
- [ ] Bulk-mode voor advocaten / journalisten
- [ ] Optionele Tor-fetch voor anoniem snapshotten
- [ ] EML-import voor e-mail-bewijs
- [ ] In-browser OTS-verify in `verify.html` (geen CLI meer nodig)

## Brand

Onderdeel van de [Privacyverzet](https://github.com/WimLee115)-vloot.

`Captain WimLee115 — Aan boord. Anoniem. Onverzettelijk.`

## Licentie

[AGPL-3.0-or-later](LICENSE). Bewijs-software moet auditeerbaar zijn.
