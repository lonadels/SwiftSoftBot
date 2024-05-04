import {autoRetry} from "@grammyjs/auto-retry";
import {hydrateReply, ParseModeFlavor} from "@grammyjs/parse-mode";
import {Bot, Context} from "grammy";
import {hydrate, HydrateFlavor} from "@grammyjs/hydrate";
import {checkChatExistsOrCreate, checkUserExistsOrCreate,} from "./utils/checkExistsOrCreate";
import {errorHandler} from "./errorHandler";
import {MenuFlavor} from "@grammyjs/menu";
import {JokeModule} from "./modules/JokeModule";
import {GreetingModule} from "./modules/GreetingModule";
import {DashboardModule} from "./modules/DashboardModule";
import {GeminiModule} from "./modules/GeminiModule";

type BotContext = ParseModeFlavor<HydrateFlavor<Context>> & MenuFlavor;

export async function initBot() {
    const bot = new Bot<BotContext>(process.env.BOT_TOKEN!);

    await bot.api.setMyDescription("Бот SwiftSoft");

    bot.api.config.use(autoRetry());

    bot.use(hydrate());
    bot.use(hydrateReply);

    bot.catch(errorHandler);

    // ignore forwarded messages
    //bot.drop(matchFilter("msg:forward_origin"));
    bot.on("msg:forward_origin", () => {
    });

    bot.use(checkUserExistsOrCreate);
    bot.use(checkChatExistsOrCreate);

    const dashboard = new DashboardModule(bot);
    const greeting = new GreetingModule(bot);
    const joke = new JokeModule(bot);
    const gemini = new GeminiModule(bot);

    await bot.api.setMyCommands([
        ...dashboard.commands,
        ...greeting.commands,
        ...joke.commands,
        ...gemini.commands,
    ]);

    await bot.start({
        onStart(botInfo) {
            console.log(`Bot @${botInfo.username} is started!`);
        },
    });
}
