import { Bot, Context } from "grammy";
import { Module } from "./Module";
import { Menu } from "@grammyjs/menu";
import DataSource from "../database/DataSource";
import User from "../database/entities/User";

export class SubscriptionModule<T extends Context = Context> extends Module<T> {
  public readonly maxLimit: number = 5;

  public readonly subscribeMenu: Menu<T>;

  constructor(bot: Bot<T>) {
    super(bot);
    this.subscribeMenu = new Menu<T>("subscribe").text(
      "Оформить подписку",
      async (ctx) => {
        await ctx.replyWithInvoice(
          "Подписка",
          "Доступ к расширенным генерациям на 30 дней",
          "subscription",
          process.env.PAY_TOKEN!,
          "RUB",
          [{ label: "Total", amount: 199 * 100 }]
        );
      }
    );
    this.bot.use(this.subscribeMenu);
  }

  initModule() {
    this.bot.on("pre_checkout_query", (ctx) => {
      ctx.answerPreCheckoutQuery(true);
    });

    this.bot.on("message:successful_payment", async (ctx) => {
      const userRepo = DataSource.getRepository(User);

      const user = await userRepo.findOneBy({ telegramId: ctx.from?.id });

      if (!user) return;

      const date = new Date();
      date.setDate(date.getDate() + 1);

      user.subscribe.expires = date;
      user.subscribe.starts = new Date();

      await userRepo.save(user);

      await ctx.reply(`Вы успешно активировали подписку на 30 дней!`);
    });
  }
}
