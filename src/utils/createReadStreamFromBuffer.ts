import * as fs from "fs";
import path from "path";

// Функция для создания ReadStream из Buffer
export function createReadStreamFromBuffer(
  buffer: Buffer,
  fileName: string
): fs.ReadStream {
  const tempDir = "./tmp"; // Папка для временных файлов
  const tempFilePath = path.join(tempDir, fileName); // Путь к временному файлу

  // Проверяем существование папки
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir); // Создаем папку, если она не существует
  }

  fs.writeFileSync(tempFilePath, buffer); // Записываем данные в файл
  return fs.createReadStream(tempFilePath); // Создаем ReadStream из файла
}
