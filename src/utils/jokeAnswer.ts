export function jokeAnswer(match: string | RegExpMatchArray, answer: string) {
  const isUpper = match[1] === match[1].toUpperCase();
  const isLower = match[1] === match[1].toLowerCase();
  const isCamel =
    match[1][0] === match[1][0].toUpperCase() &&
    match[1][1] === match[1][1].toLowerCase();

  return `${
    isUpper ? answer.toUpperCase() : isLower ? answer.toLowerCase() : answer
  }${isCamel ? match[1].toLowerCase() : match[1]}`;
}
