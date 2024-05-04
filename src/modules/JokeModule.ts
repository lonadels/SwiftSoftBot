import {Bot, Context} from "grammy";
import {Module} from "./Module";

type Phrases = "да" | "нет" | "где" | "ясно";

export class JokeModule<T extends Context> extends Module<T> {
    constructor(bot: Bot<T>) {
        super(bot);
        this.bot.hears(/^((да|нет|где|ясно)[^\s\w]*)$/i, (ctx) => {
            const matchTest: Phrases = ctx.match[2].toLowerCase() as Phrases;
            const variants: { [key in Phrases]: () => string } = {
                ["да"]: () => this.jokeAnswer(ctx.match, "Пиз"),
                ["нет"]: () => this.jokeAnswer(ctx.match, "Ми"),
                ["ясно"]: () => this.jokeAnswer(ctx.match, "Ху"),
                ["где"]: () => this.jokeAnswer(["", ctx.match[1].slice(1)], "В пиз"),
            };

            ctx.reply(variants[matchTest](), {
                reply_parameters: {
                    allow_sending_without_reply: false,
                    message_id: ctx.message!.message_id,
                },
            });
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
