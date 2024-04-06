import { Bot, CommandContext, Context } from "grammy";
import { Module } from "./Module";
import { Menu } from "@grammyjs/menu";
import DataSource from "../database/DataSource";
import User from "../database/entities/User";
import Month from "../utils/month";
import { daysDiff, declOfNum } from "../utils/strings";
import { BotCommand } from "grammy/types";
import { Role } from "../database/Role";

export class SubscriptionModule<T extends Context = Context> extends Module<T> {
  public readonly maxLimit: number = 5;

  public readonly subscribeMenu: Menu<T>;

  public readonly cost: number = 199.0;

  public readonly commands: BotCommand[] = [
    { command: "subscribe", description: "Подписка" },
  ];

  constructor(bot: Bot<T>) {
    super(bot);
    this.subscribeMenu = new Menu<T>("subscribe").text(
      "Оформить подписку",
      (ctx) => this.sendInvoice(ctx)
    );
    this.bot.use(this.subscribeMenu);

    this.bot.command("subscribe", (ctx) => this.subscribe(ctx));

    this.bot.on("pre_checkout_query", async (ctx) => {
      if (!(await this.isActive(ctx))) ctx.answerPreCheckoutQuery(true);
      else ctx.answerPreCheckoutQuery(false);
    });

    this.bot.on("message:successful_payment", async (ctx) => {
      const userRepo = DataSource.getRepository(User);

      const user = await userRepo.findOneBy({ telegramId: ctx.from?.id });

      if (!user) return;

      const expiresDate = new Date();
      expiresDate.setDate(expiresDate.getDate() + 30);

      user.subscribe.expires = expiresDate;
      user.subscribe.starts = new Date();

      await userRepo.save(user);

      await ctx.reply(
        `<b>✨ Вы успешно активировали подписку на 30 дней!</b>\n` +
          `Теперь вы можете пользоваться расширенными генерациями без ограничений.`,
        {
          parse_mode: "HTML",
          reply_parameters: {
            allow_sending_without_reply: false,
            message_id: ctx.message!.message_id,
          },
        }
      );
    });
  }

  async sendInvoice(ctx: Context) {
    if (!(await this.isActive(ctx)))
      await ctx.replyWithInvoice(
        "Подписка",
        "Доступ к расширенным генерациям на 30 дней",
        "subscription",
        process.env.PAY_TOKEN!,
        "RUB",
        [{ label: "Total", amount: this.cost * 100 }],
        {
          reply_parameters: {
            allow_sending_without_reply: false,
            message_id: ctx.message!.message_id,
          },
        }
      );
    else this.subscribe(ctx);
  }

  public async isActive(ctx: Context): Promise<boolean> {
    const userRepo = DataSource.getRepository(User);
    const user = await userRepo.findOneBy({
      telegramId: ctx.from?.id,
    });

    if (!user) return false;

    return (
      user.role > Role.Admin ||
      (user.subscribe.expires && user.subscribe.expires >= new Date()) ||
      false
    );
  }

  async subscribe(ctx: Context) {
    const userRepo = DataSource.getRepository(User);
    const user = await userRepo.findOneBy({
      telegramId: ctx.from?.id,
    });

    if (!user) return;

    if (!(await this.isActive(ctx))) {
      this.sendInvoice(ctx);
    } else {
      const daysLeft = daysDiff(new Date(), user.subscribe.expires!);

      const [day, month, year] = [
        user.subscribe.expires!.getDate(),
        Month[user.subscribe.expires!.getMonth()],
        user.subscribe.expires!.getFullYear(),
      ];

      const leftDecl = declOfNum(daysLeft, ["Остался", "Осталось", "Осталось"]);
      const daysDecl = declOfNum(daysLeft, ["день", "дня", "дней"]);

      await ctx.reply(
        "<b>⭐ Ваша подписка активна</b>\n" +
          `До ${day} ${month} ${year} (${leftDecl} ${daysLeft} ${daysDecl}) `,
        {
          parse_mode: "HTML",
          reply_parameters: {
            allow_sending_without_reply: false,
            message_id: ctx.message!.message_id,
          },
        }
      );
    }
  }

  public async generationsNotify(ctx: Context): Promise<string | undefined> {
    const userRepo = DataSource.getRepository(User);
    const user = await userRepo.findOneBy({ telegramId: ctx.from?.id });
    if (!user) return undefined;

    const limitLeft = this.maxLimit - user.generations;

    if (user.generations < this.maxLimit)
      return `💡 У вас осталось ${declOfNum(limitLeft, [
        `осталась ${limitLeft} генерация`,
        `остались ${limitLeft} генерации`,
        `осталось ${limitLeft} генераций`,
      ])}, по достижению лимита получите доступ к расширенным генерациям за ${
        this.cost
      } ₽/мес: /subscribe`;
    else
      return `Ваш лимит генераций исчерпан 🥺 \nПолучите доступ к расширенным генерациям за ${this.cost} ₽/мес: /subscribe`;
  }

  public async onLimitExceeded(ctx: Context) {
    await ctx.reply(
      `<b>Ох! Кажется, Ваш лимит исчерпан 🥺</b>\nПолучите доступ к расширенным генерациям за ${this.cost} ₽/мес.`,
      {
        parse_mode: "HTML",
        reply_markup: this.subscribeMenu,

        reply_parameters: {
          allow_sending_without_reply: false,
          message_id: ctx.message!.message_id,
        },
      }
    );
  }

  public async isLimitExceeded(ctx: Context): Promise<boolean> {
    if (await this.isActive(ctx)) return false;

    const userRepo = DataSource.getRepository(User);
    const user = await userRepo.findOneBy({
      telegramId: ctx.from?.id,
    });

    if (!user) return false;

    if (user.generations >= this.maxLimit) await this.onLimitExceeded(ctx);

    return user.generations >= this.maxLimit;
  }
}
