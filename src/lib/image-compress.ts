export interface CompressedImageResult {
  base64Data: string;
  mimeType: string;
  previewUrl: string;
  sizeKb: number;
}

/**
 * Mengompres foto di sisi browser menggunakan Canvas agar upload cepat & hemat storage Drive.
 * Target: lebar maksimal 1280px, format JPEG kualitas 0.78 (~150–250 KB).
 */
export async function compressImageFile(
  file: File,
  maxWidth: number = 1280,
  quality: number = 0.78
): Promise<CompressedImageResult> {
  if (!file.type.startsWith('image/')) {
    throw new Error('File harus berupa gambar (JPG, PNG, atau WebP).');
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Format gambar tidak valid.'));
    image.src = dataUrl;
  });

  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;

  if (width > maxWidth) {
    height = Math.round((height * maxWidth) / width);
    width = maxWidth;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Browser tidak mendukung kompresi gambar.');
  }

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  const mimeType = 'image/jpeg';
  const compressedDataUrl = canvas.toDataURL(mimeType, quality);
  const base64Data = compressedDataUrl.split(',')[1] || '';
  const sizeKb = Math.round((base64Data.length * 3) / 4 / 1024);

  return {
    base64Data,
    mimeType,
    previewUrl: compressedDataUrl,
    sizeKb,
  };
}
