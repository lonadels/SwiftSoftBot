import {GrammyError, HttpError} from "grammy";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function errorHandler(err: any) {
    const ctx = err.ctx;
    console.error(`Error while handling update ${ctx.update.update_id}:`);
    const e = err.error;
    if (e instanceof GrammyError) {
        console.error("Error in request:", e.description);
    } else if (e instanceof HttpError) {
        console.error("Could not contact Telegram:", e);
    } else {
        console.error("Unknown error:", e);
    }
}
