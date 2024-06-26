import { autoRetry } from "@grammyjs/auto-retry";
import { ParseModeFlavor, hydrateReply } from "@grammyjs/parse-mode";
import { Bot, Context } from "grammy";
import { HydrateFlavor, hydrate } from "@grammyjs/hydrate";
import { SubscriptionModule } from "./modules/SubscriptionModule";
import {
  checkChatExistsOrCreate,
  checkUserExistsOrCreate,
} from "./utils/checkExistsOrCreate";
import { errorHandler } from "./errorHandler";
import { GPTModule } from "./modules/GPTModule";
import { MenuFlavor } from "@grammyjs/menu";
import { JokeModule } from "./modules/JokeModule";
import { GreetingModule } from "./modules/GreetingModule";
import { DashboardModule } from "./modules/DashboardModule";
import { limit } from "@grammyjs/ratelimiter";

type BotContext = ParseModeFlavor<HydrateFlavor<Context>> & MenuFlavor;

export function initBot() {
  const bot = new Bot<BotContext>(process.env.BOT_TOKEN!);

  bot.api.setMyDescription("Бот SwiftSoft");

  bot.api.config.use(autoRetry());

  bot.use(
    limit({
      timeFrame: 2000,
      limit: 3,
      async onLimitExceeded(ctx, next) {
        await new Promise((r) => setTimeout(r, 2000));
        next();
      },
    })
  );

  bot.use(hydrate());
  bot.use(hydrateReply);

  // ignore forwarded messages
  bot.on("msg:forward_origin", () => {});

  bot.use(checkUserExistsOrCreate);
  bot.use(checkChatExistsOrCreate);

  const dashboard = new DashboardModule(bot);
  const greeting = new GreetingModule(bot);
  const joke = new JokeModule(bot);
  const sub = new SubscriptionModule(bot);

  const gpt = new GPTModule(bot, {
    subscriptionModule: sub,
  });

  bot.api.setMyCommands([
    ...dashboard.commands,
    ...greeting.commands,
    ...joke.commands,
    ...sub.commands,
    ...gpt.commands,
  ]);

  bot.catch(errorHandler);

  bot.start({
    onStart(botInfo) {
      console.log(`Bot @${botInfo.username} is started!`);
    },
  });
}
