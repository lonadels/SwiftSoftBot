import { Bot, CommandContext, Context, HearsContext } from "grammy";
import { Module } from "./Module";
import { BotCommand } from "grammy/types";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useType } from "../hooks/useType";

export class GeminiModule<T extends Context> extends Module<T> {
  private readonly genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY!);

  public readonly commands: BotCommand[] = [
    // { command: "gemini", description: "Gemini Test" },
  ];

  constructor(bot: Bot<T>) {
    super(bot);
    // this.bot.command(["gemini", "google", "ai"], (ctx) => this.reply(ctx));
    this.bot.hears(/^((свифи|swifie)?.+)/ims, async (ctx) => {
      if (
        ctx.match[2] ||
        ctx.chat.type == "private" ||
        ctx.message?.reply_to_message?.from!.id === this.bot.botInfo.id
      )
        this.reply(ctx);
    });
  }

  private async reply(ctx: HearsContext<T>) {
    // Access your API key as an environment variable (see "Set up your API key" above)

    const typing = useType(ctx);

    const model = this.genAI.getGenerativeModel(
      {
        model: "gemini-1.5-pro-latest",
        system_instruction: "You are a cat. Your name is Neko.",
      },
      { apiVersion: "v1beta" }
    );

    const prompt = ctx.match[1];

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    await ctx.reply(text);
    typing.stop();
  }
}
