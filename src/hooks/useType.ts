import { BotContext } from "../main";

class TypeStatus {
  private _typing: boolean = true;
  get isTyping(): boolean {
    return this._typing;
  }
  public stop() {
    this._typing = false;
  }
}

export function useType(ctx: BotContext): TypeStatus {
  const typeStatus = new TypeStatus();

  new Promise(async (resolve) => {
    do {
      await ctx.replyWithChatAction("typing");
      await new Promise((r) => setTimeout(r, 1000));
    } while (typeStatus);
    resolve(0);
  });

  return typeStatus;
}
