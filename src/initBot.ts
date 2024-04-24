import { autoRetry } from "@grammyjs/auto-retry";
import { ParseModeFlavor, hydrateReply } from "@grammyjs/parse-mode";
import { Bot, Context } from "grammy";
import { HydrateFlavor, hydrate } from "@grammyjs/hydrate";
import {
  checkChatExistsOrCreate,
  checkUserExistsOrCreate,
} from "./utils/checkExistsOrCreate";
import { errorHandler } from "./errorHandler";
import { MenuFlavor } from "@grammyjs/menu";
import { JokeModule } from "./modules/JokeModule";
import { GreetingModule } from "./modules/GreetingModule";
import { DashboardModule } from "./modules/DashboardModule";
import { limit } from "@grammyjs/ratelimiter";
import { GeminiModule } from "./modules/GeminiModule";

type BotContext = ParseModeFlavor<HydrateFlavor<Context>> & MenuFlavor;

export function initBot() {
  const bot = new Bot<BotContext>(process.env.BOT_TOKEN!);

  bot.api.setMyDescription("Бот SwiftSoft");

  bot.api.config.use(autoRetry());

  bot.use(hydrate());
  bot.use(hydrateReply);

  // ignore forwarded messages
  bot.on("msg:forward_origin", () => {});

  bot.use(checkUserExistsOrCreate<BotContext>);
  bot.use(checkChatExistsOrCreate<BotContext>);

  const gemini = new GeminiModule(bot);
  const dashboard = new DashboardModule(bot);
  const greeting = new GreetingModule(bot);
  const joke = new JokeModule(bot);

  bot.api.setMyCommands([
    ...gemini.commands,
    ...dashboard.commands,
    ...greeting.commands,
    ...joke.commands,
  ]);

  bot.catch(errorHandler);

  bot.start({
    onStart(botInfo) {
      console.log(`Bot @${botInfo.username} is started!`);
    },
  });
}
