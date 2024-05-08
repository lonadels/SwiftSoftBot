import {Bot, Context} from "grammy";
import {BotCommand} from "grammy/types";
import {BotCommandScope} from "@grammyjs/types/settings";

export interface CommandWithScope extends BotCommand {
    scope?: BotCommandScope;
}

export abstract class Module<T extends Context = Context> {
    private readonly _bot: Bot<T>;

    public readonly commands: CommandWithScope[] = [];

    protected get bot(): Bot<T> {
        return this._bot;
    }

    protected constructor(bot: Bot<T>) {
        console.log(`Initializing module ${this.constructor.name}...`);
        this._bot = bot;
    }
}
