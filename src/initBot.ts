import { autoRetry } from "@grammyjs/auto-retry";
import { hydrateReply } from "@grammyjs/parse-mode";
import { Bot } from "grammy";
import { hydrate } from "@grammyjs/hydrate";
import { SubscriptionModule } from "./modules/SubscriptionModule";
import { image, start, voice } from "./commands";
import { checkUserExistsOrCreate } from "./utils/checkUserExistsOrCreate";
import { errorHandler } from "./errorHandler";
import { BotContext } from "./main";
import { GPTModule } from "./modules/GPTModule";

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

  bot.use(checkUserExistsOrCreate);

  // ignore forwarded messages
  bot.on("msg:forward_origin");

  const subscriptionModule = new SubscriptionModule<BotContext>(bot);
  const gptModule = new GPTModule<BotContext>(bot, { subscriptionModule });

  bot.command("start", start);
  bot.command(["image", "generate", "img", "gen", "dalle"], image(gptModule));
  bot.command(["speak", "voice", "tts"], voice(gptModule));

  bot.catch(errorHandler);

  bot.start({
    onStart(botInfo) {
      console.log(`Bot @${botInfo.username} is started!`);
    },
  });
}
