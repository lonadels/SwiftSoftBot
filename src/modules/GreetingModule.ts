import { Bot, CommandContext, Context } from "grammy";
import { Module } from "./Module";

export class GreetingModule<T extends Context> extends Module<T> {
  initModule() {
    this.bot.command("start", this.greet);
  }

  private greet(ctx: CommandContext<T>) {
    ctx.reply(
      "Привет! Меня зовут Свифи. Для разговора в беседах Вы можете обращаться ко мне по имени, в личных диалогах это необязательно."
    );
  }
}
