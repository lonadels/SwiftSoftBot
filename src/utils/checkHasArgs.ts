import { Context } from "grammy";

export default async function checkHasArgs(ctx: Context): Promise<boolean> {
  const match = ctx.match;

  if (!match) {
    await ctx.reply(`Usage: /tts [text to speach]`, {
      reply_parameters: {
        allow_sending_without_reply: false,
        message_id: ctx.message!.message_id,
      },
    });
    return false;
  }

  return true;
}
