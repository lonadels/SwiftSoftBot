import * as fs from "fs";

// Функция для чтения данных из текстового файла
export function readDataFromFile(filename: string): string[] {
  try {
    const data = fs.readFileSync(filename, "utf8");
    return data.split("\n").filter(Boolean); // Разделить данные на строки и удалить пустые строки
  } catch (err) {
    console.error(`Ошибка чтения файла: ${err}`);
    return [];
  }
}
