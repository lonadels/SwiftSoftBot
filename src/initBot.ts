import { autoRetry } from "@grammyjs/auto-retry";
import { ParseModeFlavor, hydrateReply } from "@grammyjs/parse-mode";
import { Bot, Context } from "grammy";
import { HydrateFlavor, hydrate } from "@grammyjs/hydrate";
import { SubscriptionModule } from "./modules/SubscriptionModule";
import { checkUserExistsOrCreate } from "./utils/checkUserExistsOrCreate";
import { errorHandler } from "./errorHandler";
import { GPTModule } from "./modules/GPTModule";
import { MenuFlavor } from "@grammyjs/menu";
import { JokeModule } from "./modules/JokeModule";
import { GreetingModule } from "./modules/GreetingModule";

type BotContext = ParseModeFlavor<HydrateFlavor<Context>> & MenuFlavor;

export function initBot() {
  const bot = new Bot<BotContext>(process.env.BOT_TOKEN!);

  bot.api.setMyCommands([
    { command: "start", description: "Запустить бота" },
    { command: "tts", description: "Озвучить текст" },
    { command: "img", description: "Сгенерирвать изображение" },
  ]);

  bot.api.setMyDescription("Бот SwiftSoft");

  bot.api.config.use(autoRetry());

  bot.use(hydrate());
  bot.use(hydrateReply);

  // ignore forwarded messages
  bot.on("msg:forward_origin");

  bot.use(checkUserExistsOrCreate);

  new GreetingModule<BotContext>(bot);
  new JokeModule<BotContext>(bot);
  new GPTModule<BotContext>(bot, {
    subscriptionModule: new SubscriptionModule<BotContext>(bot),
  });

  bot.catch(errorHandler);

  bot.start({
    onStart(botInfo) {
      console.log(`Bot @${botInfo.username} is started!`);
    },
  });
}
