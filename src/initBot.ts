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
import {CommandWithScope} from "./modules/Module";

type BotContext = ParseModeFlavor<HydrateFlavor<Context>> & MenuFlavor;

export async function initBot() {
    const bot = new Bot<BotContext>(process.env.BOT_TOKEN!);

    await bot.api.setMyDescription("Бот SwiftSoft");

    bot.api.config.use(autoRetry());

    bot.use(hydrate());
    bot.use(hydrateReply);

    bot.catch(errorHandler);

    bot.use(checkUserExistsOrCreate);
    bot.use(checkChatExistsOrCreate);

    const commands: CommandWithScope[][] = [];

    const modules = [DashboardModule, GreetingModule, JokeModule, GeminiModule];
    modules.forEach(module => {
        const initializedModule = new module(bot);
        commands.push(initializedModule.commands);
    });

    const commandsByScope = commands
        .flatMap(commandGroup => commandGroup)
        .reduce((map, command) => {
            const scope = command.scope ?? {type: "default"};
            const commands = map.get(JSON.stringify(scope)) || [];
            return map.set(JSON.stringify(scope), [...commands, command]);
        }, new Map<string, CommandWithScope[]>());

    for (const [scope, commands] of commandsByScope.entries()) {
        await bot.api.setMyCommands(commands, {scope: JSON.parse(scope)});
    }

    await bot.start({
        onStart(botInfo) {
            console.log(`Bot @${botInfo.username} is started!`);
        },
    });
}
