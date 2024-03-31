import { Context } from "grammy";

export default function checkHasArgs(ctx: Context): boolean {
  const match = ctx.match;

  if (!match) {
    ctx.reply(`Usage: ${ctx.message?.text} [prompt]`, {
      reply_parameters: {
        allow_sending_without_reply: false,
        message_id: ctx.message!.message_id,
      },
    });
    return false;
  }

  return true;
}
