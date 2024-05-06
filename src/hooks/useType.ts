import {Context} from "grammy";

class TypeStatus {
    private _typing: boolean = true;

    constructor(private readonly ctx: Context) {
    }

    get isTyping(): boolean {
        return this._typing;
    }

    public async start() {
        do {
            await this.ctx.replyWithChatAction("typing");
            await new Promise((r) => setTimeout(r, 2000));
        } while (this.isTyping);
    }

    public stop() {
        this._typing = false;
    }
}

export function useType(ctx: Context): TypeStatus {
    const typeStatus = new TypeStatus(ctx);
    typeStatus.start().finally();

    return typeStatus;
}
