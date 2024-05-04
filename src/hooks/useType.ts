import {Context} from "grammy";

class TypeStatus {
    private _typing: boolean = true;

    get isTyping(): boolean {
        return this._typing;
    }

    public stop() {
        this._typing = false;
    }
}

export function useType(ctx: Context): TypeStatus {
    const typeStatus = new TypeStatus();

    new Promise(async (resolve) => {
        do {
            await ctx.replyWithChatAction("typing");
            await new Promise((r) => setTimeout(r, 2000));
        } while (typeStatus.isTyping);
        resolve(0);
    });

    return typeStatus;
}
