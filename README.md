<div align="center">

```
░▒▓ PVANK ▓▒░
   Privacyverzet · Anker
   verankerd in tijd
```

**Cryptografisch bewijs voor elke Nederlander**

[![License](https://img.shields.io/badge/License-AGPL_3.0-FF6B35?style=flat-square)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.4.0-0b7fdb?style=flat-square)](https://github.com/WimLee115/pvank/releases)
[![Made in NL](https://img.shields.io/badge/Made_in-NL-FF4500?style=flat-square)](https://github.com/WimLee115)
[![Privacy First](https://img.shields.io/badge/Privacy-First-00FF41?style=flat-square)](#)
[![OpenTimestamps](https://img.shields.io/badge/OpenTimestamps-Bitcoin-7C3AED?style=flat-square)](https://opentimestamps.org)

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
├── tegenpartij.json    — WHOIS · DNS (A/AAAA/NS/MX/TXT) · TLS-cert · NL-hints (KvK/BTW/IBAN)
├── manifest.json       — alle hashes + metadata + tijdstempel
├── manifest.json.ots   — OpenTimestamps-receipt (Bitcoin-blockchain)
└── verify.html         — open in elke browser, controleer alles
```

`verify.html` werkt offline en zonder PVANK. Drop de bestanden erin → SHA-256 wordt opnieuw berekend en vergeleken met het manifest. Voor blockchain-verificatie:

```bash
pip install opentimestamps-client
ots verify manifest.json.ots
```

## Interface

```text
┌─────────────────────────────────────────────────────┐
│                                                     │
│  ░▒▓ PVANK ▓▒░                                      │
│  verankerd in tijd                                  │
│                                                     │
│  Cryptografisch bewijs voor elke Nederlander.       │
│  SHA-256 + OpenTimestamps op de Bitcoin-blockchain. │
│                                                     │
│  ┌── wat verankeren? ──────────────────────────┐    │
│  │  ⊙ een webpagina      ○ een bestand         │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  [ https://...                                  ]   │
│                                                     │
│  [▒▒ ANKER NEERLATEN ▒▒]                            │
│                                                     │
└─────────────────────────────────────────────────────┘
   zwart fond · JetBrains Mono · bloedoranje accent
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

`v0.4` — werkt voor URL's en bestand-uploads. Bij URL's verzamelt PVANK
publieke context (WHOIS · DNS · TLS-cert) plus auto-extractie van
Nederlandse entiteit-hints (KvK · BTW · IBAN). `verify.html` parseert
OTS-receipts en checkt of de stamped hash gelijk is aan SHA-256(manifest)
— allemaal in de browser, zonder CLI.

Nog te doen:

- [ ] Volledige Bitcoin block-header verify in browser (zware lift)
- [ ] KvK-API-koppeling voor authoritative bedrijfsinfo (key required)
- [ ] Browser-extensie ("verzegel deze pagina")
- [ ] Mobile / PWA met camera-import (foto's instant verzegelen)
- [ ] Bulk-mode voor advocaten / journalisten
- [ ] Optionele Tor-fetch voor anoniem snapshotten
- [ ] EML-import voor e-mail-bewijs

## Brand

Onderdeel van de [Privacyverzet](https://github.com/WimLee115)-vloot.

`Captain WimLee115 — Aan boord. Anoniem. Onverzettelijk.`

## Licentie

[AGPL-3.0-or-later](LICENSE). Bewijs-software moet auditeerbaar zijn.
