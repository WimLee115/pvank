import { chromium } from 'playwright';

export interface Snapshot {
  html: string;
  png: Buffer;
  headers: Record<string, string>;
  status: number;
  finalUrl: string;
  capturedAt: string;
}

export async function snapshotUrl(url: string): Promise<Snapshot> {
  const browser = await chromium.launch({ headless: true });
  try {
    const ctx = await browser.newContext({
      userAgent: 'PVANK/0.1 (+https://github.com/WimLee115/pvank)',
      viewport: { width: 1280, height: 800 },
    });
    const page = await ctx.newPage();
    const response = await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30_000,
    });
    if (!response) throw new Error('geen response van target');

    const finalUrl = page.url();
    const html = await page.content();
    const png = await page.screenshot({ fullPage: true });
    const headers = response.headers();
    const status = response.status();

    return {
      html,
      png: Buffer.from(png),
      headers,
      status,
      finalUrl,
      capturedAt: new Date().toISOString(),
    };
  } finally {
    await browser.close();
  }
}
