export class MessageBuilder {
  private _raw: string = "";

  private _lines: string[] = [];

  public get lines(): string[] {
    return this._lines;
  }

  public get raw(): string {
    return this._raw;
  }

  readonly separator;

  constructor(separator: string) {
    this.separator = separator;
  }

  async buildMessage(
    content: string,
    onBuild?: (line: string) => Promise<void>
  ) {
    this._raw += content;
    this._lines.last = (this._lines.last || "") + content;

    const separated = this._lines.last.split(this.separator);
    separated.first && (this._lines.last = separated.first);

    for (const [index, line] of separated.entries()) {
      if (index < separated.length - 1) await onBuild?.(line);
      if (index > 0) this._lines.push(line);
    }
  }
}
