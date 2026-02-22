export async function resizeImage(file: File, maxSize = 1920): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;

  if (width <= maxSize && height <= maxSize) {
    return file;
  }

  const ratio = Math.min(maxSize / width, maxSize / height);
  const newWidth = Math.round(width * ratio);
  const newHeight = Math.round(height * ratio);

  const canvas = new OffscreenCanvas(newWidth, newHeight);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0, newWidth, newHeight);
  bitmap.close();

  return canvas.convertToBlob({ type: 'image/webp', quality: 0.8 });
}
