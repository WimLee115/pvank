// @ts-expect-error — javascript-opentimestamps heeft geen types
import OpenTimestamps from 'javascript-opentimestamps';

export async function stampOts(digest: Buffer): Promise<Buffer> {
  const op = new OpenTimestamps.Ops.OpSHA256();
  const detached = OpenTimestamps.DetachedTimestampFile.fromHash(
    op,
    new Uint8Array(digest)
  );
  await OpenTimestamps.stamp(detached);
  return Buffer.from(detached.serializeToBytes());
}
