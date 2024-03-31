import { Bot, CommandContext, Context } from "grammy";
import { Module } from "./Module";
import { BotCommand } from "grammy/types";

export class GreetingModule<T extends Context> extends Module<T> {
  public readonly commands: BotCommand[] = [
    { command: "start", description: "Запустить бота" },
  ];

  constructor(bot: Bot<T>) {
    super(bot);
    this.bot.command("start", (ctx) => this.greet(ctx));
  }

  private greet(ctx: CommandContext<T>) {
    ctx.reply(
      "Привет! Меня зовут Свифи. Для разговора в беседах Вы можете обращаться ко мне по имени, в личных диалогах это необязательно."
    );
  }
}
