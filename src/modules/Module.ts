import { Bot, Context } from "grammy";

export abstract class Module<T extends Context = Context> {
  private readonly _bot: Bot<T>;

  protected get bot(): Bot<T> {
    return this._bot;
  }

  constructor(bot: Bot<T>) {
    this._bot = bot;

    console.log(`Initializing module ${this.constructor.name}...`);

    this.initModule();
  }

  abstract initModule(): void;
}
