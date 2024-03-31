// Функция для вычисления разницы между двумя датами в днях
export default function daysDiff(date1: Date, date2: Date): number {
  const timeDiff = Math.abs(date2.getTime() - date1.getTime());
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.ceil(timeDiff / oneDay);
}
