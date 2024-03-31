import sharp from "sharp";

// Функция для конвертации изображения в нужный формат
export async function convertImageFormat(buffer: Buffer): Promise<Buffer> {
  return await sharp(buffer).png().toBuffer();
}
