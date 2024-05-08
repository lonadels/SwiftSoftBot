import {Bot, Context} from "grammy";
import {CommandWithScope, Module} from "./Module";

export class GreetingModule<T extends Context> extends Module<T> {
    public readonly commands: CommandWithScope[] = [
        {command: "start", description: "Запустить бота"}
    ];

    constructor(bot: Bot<T>) {
        super(bot);
        this.bot.command("start", (ctx) => this.greet(ctx));
        this.bot.on(":new_chat_members:me", async (ctx) => this.greet(ctx))
    }

    private async greet(ctx: Context) {
        await ctx.reply(
            `Привет! Меня зовут Свифи. Для разговора в групповых чатах нужно обращаться ко мне по имени (например: <code>"Свифи, привет!"</code>), в личных диалогах это необязательно.`,
            {parse_mode: "HTML"}
        );
    }
}
