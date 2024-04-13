import { Bot, CommandContext, Context, HearsContext } from "grammy";
import { Module } from "./Module";
import { BotCommand } from "grammy/types";
import { useType } from "../hooks/useType";
import {
  GenerativeContentBlob,
  GoogleGenerativeAI,
  InlineDataPart,
  Part,
} from "@google/generative-ai";
import * as fs from "fs";
import { convertImageFormat } from "../utils/convertImageFormat";
import sharp from "sharp";

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

  // Converts local file information to a GoogleGenerativeAI.Part object.
  fileToGenerativePart(path: string, mimeType: string) {
    return {
      inlineData: {
        data: Buffer.from(fs.readFileSync(path)).toString("base64"),
        mimeType,
      },
    };
  }

  private async reply(ctx: HearsContext<T>) {
    // Access your API key as an environment variable (see "Set up your API key" above)

    const mimeTypes = ["image/png", "image/jpeg"];
    const typing = useType(ctx);

    const model = this.genAI.getGenerativeModel(
      {
        model: "gemini-1.5-pro-latest",
        systemInstruction: {
          role: "system",
          parts: [
            {
              text: `"You are a helpful assistant.\nYou name is "Свифи" or "Swifie"\nYou is a woman.\nDon't talk about yourself in the third person.\nYour main language is Russian.\nDon't use markdown text formatting."`,
            },
          ],
        },
      },
      { apiVersion: "v1beta" }
    );

    const chat = model.startChat({
      history: [],
      generationConfig: {
        // maxOutputTokens: 100,
      },
    });

    const content: Part[] = [];

    if (
      ctx.message?.photo ||
      (ctx.message?.document &&
        mimeTypes.includes(ctx.message.document.mime_type!))
    ) {
      let fileInfo;

      if (ctx.message?.document)
        fileInfo = await ctx.api.getFile(ctx.message.document.file_id);
      else if (ctx.message?.photo)
        fileInfo = await ctx.api.getFile(ctx.message.photo.last()!.file_id);
      else return;

      if (fileInfo.file_path) {
        const url = `https://api.telegram.org/file/bot${process.env
          .BOT_TOKEN!}/${fileInfo.file_path}`;

        const response = await fetch(url);
        const buffer = Buffer.from(await response.arrayBuffer());
        const base64text = (await sharp(buffer).png().toBuffer()).toString(
          "base64"
        );

        content.push({
          inlineData: {
            data: base64text,
            mimeType: `image/png`,
          },
        });
      }
    }

    const result = await chat.sendMessage([ctx.match[1], ...content]);
    const response = result.response;
    const text = response.text();

    typing.stop();
    await ctx.reply(text || "Я устала :(", {
      reply_parameters: {
        allow_sending_without_reply: false,
        message_id: ctx.message!.message_id,
      },
    });
  }
}
