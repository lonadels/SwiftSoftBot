export function declOfNum(number: number, titles: string[]): string {
  const cases = [2, 0, 1, 1, 1, 2];
  return titles[
    number % 100 > 4 && number % 100 < 20
      ? 2
      : cases[number % 10 < 5 ? number % 10 : 5]
  ];
}

export function daysDiff(date1: Date, date2: Date): number {
  const timeDiff = Math.abs(date2.getTime() - date1.getTime());
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.ceil(timeDiff / oneDay);
}

export function upFirst(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
