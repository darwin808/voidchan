import { encode } from 'blurhash';

export async function generateBlurhash(blob: Blob): Promise<string> {
  const bitmap = await createImageBitmap(blob);

  const size = 32;
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0, size, size);
  bitmap.close();

  const imageData = ctx.getImageData(0, 0, size, size);
  return encode(imageData.data, size, size, 4, 3);
}
