import { createHash } from 'node:crypto';

export function sha256(data: Buffer | string): Buffer {
  return createHash('sha256').update(data).digest();
}

export function sha256Hex(data: Buffer | string): string {
  return createHash('sha256').update(data).digest('hex');
}
