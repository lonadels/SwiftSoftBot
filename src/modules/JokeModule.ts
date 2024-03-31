import { Bot, Context } from "grammy";
import { Module } from "./Module";

export class JokeModule<T extends Context> extends Module<T> {
  initModule() {
    this.bot.hears(/^((да|нет)[^\s\w]*)$/i, (ctx) => {
      ctx.reply(
        this.jokeAnswer(
          ctx.match,
          ctx.match[2].toLowerCase() == "да" ? "Пиз" : "Ми"
        ),
        {
          reply_parameters: {
            allow_sending_without_reply: false,
            message_id: ctx.message!.message_id,
          },
        }
      );
    });
  }

  private jokeAnswer(match: string | RegExpMatchArray, answer: string): string {
    const isUpper = match[1] === match[1].toUpperCase();
    const isLower = match[1] === match[1].toLowerCase();
    const isCamel =
      match[1][0] === match[1][0].toUpperCase() &&
      match[1][1] === match[1][1].toLowerCase();

    return `${
      isUpper ? answer.toUpperCase() : isLower ? answer.toLowerCase() : answer
    }${isCamel ? match[1].toLowerCase() : match[1]}`;
  }
}
