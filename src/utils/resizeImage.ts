import sharp from "sharp";

export async function resizeImage(buffer: Buffer): Promise<Buffer> {
  const image = sharp(buffer);
  const metadata = await image.metadata();

  // Определить максимальный размер файла в байтах (20 МБ)
  const maxFileSize = 5 * 1024 * 1024;

  if (!metadata.size) throw new Error("Size is undefined");

  if (metadata.size <= maxFileSize) {
    return image.toBuffer();
  }

  // Рассчитать коэффициент сжатия
  const compressionRatio = Math.sqrt(maxFileSize / metadata.size);

  if (!metadata.width || !metadata.height)
    throw new Error("Dimensions is undefined");

  // Уменьшить размеры изображения, сохраняя пропорции
  const newWidth = Math.floor(metadata.width * compressionRatio);
  const newHeight = Math.floor(metadata.height * compressionRatio);

  return image.resize(newWidth, newHeight).toBuffer();
}
