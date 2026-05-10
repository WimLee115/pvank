import { promises as dns } from 'node:dns';
import { connect } from 'node:tls';
import { spawn } from 'node:child_process';

export interface DnsRecords {
  A: string[];
  AAAA: string[];
  NS: string[];
  MX: string[];
  TXT: string[];
}

export interface TlsInfo {
  issuer: string;
  subject: string;
  validFrom: string;
  validTo: string;
  fingerprintSha256: string;
}

export interface DutchEntityHints {
  kvkNumbers: string[];
  btwNumbers: string[];
  ibans: string[];
}

export interface TegenpartijInfo {
  hostname: string;
  protocol: string;
  capturedAt: string;
  whois: string | null;
  dnsRecords: DnsRecords;
  tlsCertificate: TlsInfo | null;
  dutchEntityHints?: DutchEntityHints;
  notes: string[];
}

/**
 * Verzamel publieke context over de tegenpartij achter een URL:
 * WHOIS, DNS-records (A/AAAA/NS/MX/TXT) en het TLS-certificaat (HTTPS).
 *
 * Faalt nooit hard — onbereikbare onderdelen worden `null` of leeg, met een
 * aantekening in `notes`. Bewijs is bewijs van wat we WEL konden zien.
 */
export async function gatherTegenpartij(url: string): Promise<TegenpartijInfo> {
  const parsed = new URL(url);
  const hostname = parsed.hostname;
  const protocol = parsed.protocol;
  const notes: string[] = [];

  const [dnsRes, whoisRes, tlsRes] = await Promise.allSettled([
    gatherDns(hostname),
    runWhois(hostname),
    protocol === 'https:' ? gatherTls(hostname) : Promise.resolve(null),
  ]);

  const dnsRecords =
    dnsRes.status === 'fulfilled'
      ? dnsRes.value
      : { A: [], AAAA: [], NS: [], MX: [], TXT: [] };
  if (dnsRes.status === 'rejected') {
    notes.push('DNS-lookup faalde: ' + reason(dnsRes.reason));
  }

  const whoisText = whoisRes.status === 'fulfilled' ? whoisRes.value : null;
  if (whoisRes.status === 'rejected') {
    notes.push('whois faalde: ' + reason(whoisRes.reason));
  }

  const tls = tlsRes.status === 'fulfilled' ? tlsRes.value : null;
  if (tlsRes.status === 'rejected') {
    notes.push('TLS-cert ophalen faalde: ' + reason(tlsRes.reason));
  } else if (protocol !== 'https:') {
    notes.push('niet-HTTPS — geen TLS-certificaat');
  }

  return {
    hostname,
    protocol,
    capturedAt: new Date().toISOString(),
    whois: whoisText,
    dnsRecords,
    tlsCertificate: tls,
    notes,
  };
}

/**
 * Doorzoek HTML op Nederlandse entiteit-identifiers:
 * KvK-nummer (8 cijfers, met label), BTW-nummer (NL...B..), IBAN (NL..AAAA..).
 *
 * Hints, geen claims — false positives kunnen voorkomen op pathological pagina's.
 * Bedoeld als startpunt voor handmatige verificatie via KvK / Belastingdienst.
 */
export function extractDutchEntityHints(html: string): DutchEntityHints {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&');

  const kvkRegex =
    /\b(?:KvK|KVK|Kamer\s+van\s+Koophandel|Handelsregister)[\s.:\-]*(?:nr\.?|nummer|#|no\.?)?[\s.:\-]*(\d{8})\b/gi;
  const btwRegex = /\bNL[\s.]?(\d{9})[\s.]?B[\s.]?(\d{2})\b/gi;
  const ibanRegex = /\bNL(\d{2})[\s.]?([A-Z]{4})[\s.]?((?:\d[\s.]?){10})\b/gi;

  const kvkSet = new Set<string>();
  for (const m of text.matchAll(kvkRegex)) kvkSet.add(m[1]);

  const btwSet = new Set<string>();
  for (const m of text.matchAll(btwRegex)) {
    btwSet.add(`NL${m[1]}B${m[2]}`);
  }

  const ibanSet = new Set<string>();
  for (const m of text.matchAll(ibanRegex)) {
    const digits = m[3].replace(/[\s.]/g, '');
    ibanSet.add(`NL${m[1]}${m[2]}${digits}`);
  }

  return {
    kvkNumbers: [...kvkSet].sort(),
    btwNumbers: [...btwSet].sort(),
    ibans: [...ibanSet].sort(),
  };
}

async function gatherDns(hostname: string): Promise<DnsRecords> {
  const [a, aaaa, ns, mx, txt] = await Promise.allSettled([
    dns.resolve4(hostname),
    dns.resolve6(hostname),
    dns.resolveNs(hostname),
    dns.resolveMx(hostname),
    dns.resolveTxt(hostname),
  ]);

  return {
    A: a.status === 'fulfilled' ? a.value : [],
    AAAA: aaaa.status === 'fulfilled' ? aaaa.value : [],
    NS: ns.status === 'fulfilled' ? ns.value : [],
    MX:
      mx.status === 'fulfilled'
        ? mx.value.map((m) => `${m.priority} ${m.exchange}`)
        : [],
    TXT: txt.status === 'fulfilled' ? txt.value.map((t) => t.join('')) : [],
  };
}

function runWhois(hostname: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn('whois', [hostname], {
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 15_000,
    });
    let out = '';
    let err = '';
    child.stdout.on('data', (d) => (out += d.toString()));
    child.stderr.on('data', (d) => (err += d.toString()));
    child.on('error', (e) =>
      reject(new Error(`whois niet uitvoerbaar: ${e.message}`))
    );
    child.on('exit', (code) => {
      if (code === 0) resolve(out.trim());
      else
        reject(
          new Error(
            `whois exit ${code}: ${err.trim() || out.trim() || '(geen output)'}`
          )
        );
    });
  });
}

function gatherTls(hostname: string): Promise<TlsInfo> {
  return new Promise((resolve, reject) => {
    const socket = connect(
      {
        host: hostname,
        port: 443,
        servername: hostname,
        timeout: 10_000,
      },
      () => {
        try {
          const cert = socket.getPeerCertificate(false);
          if (!cert || !cert.subject) {
            socket.end();
            reject(new Error('geen certificaat ontvangen'));
            return;
          }
          const info: TlsInfo = {
            issuer: formatDn(cert.issuer),
            subject: formatDn(cert.subject),
            validFrom: cert.valid_from,
            validTo: cert.valid_to,
            fingerprintSha256: cert.fingerprint256 ?? '',
          };
          socket.end();
          resolve(info);
        } catch (e) {
          socket.destroy();
          reject(e instanceof Error ? e : new Error(String(e)));
        }
      }
    );
    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error('TLS-timeout'));
    });
    socket.on('error', reject);
  });
}

function formatDn(
  dn: Record<string, string | string[] | undefined>
): string {
  return Object.entries(dn)
    .filter(([, v]) => v != null)
    .map(([k, v]) => `${k}=${Array.isArray(v) ? v.join(',') : v}`)
    .join(', ');
}

function reason(r: unknown): string {
  return r instanceof Error ? r.message : String(r);
}
