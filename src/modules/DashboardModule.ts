import { Bot, CommandContext, Context } from "grammy";
import { Module } from "./Module";
import { BotCommand } from "grammy/types";
import { Role } from "../database/Role";
import DataSource from "../database/DataSource";
import User from "../database/entities/User";
import { Menu } from "@grammyjs/menu";

export class DashboardModule<T extends Context> extends Module<T> {
  constructor(bot: Bot<T>) {
    super(bot);

    this.bot.use(this.stopMenu);

    this.bot.command("stop", async (ctx) => this.stop(ctx));
  }

  private stopMenu: Menu = new Menu("dashboard_stop", { autoAnswer: false })
    .text("Да", async (ctx) => {
      if (!(await this.checkRole(ctx, Role.Developer))) return;

      ctx.menu.close();
      await ctx.answerCallbackQuery({ text: "Бот выключен", show_alert: true });

      setTimeout(async () => process.exit(0), 10);
    })
    .text("Отмена", async (ctx) => {
      if (!(await this.checkRole(ctx, Role.Developer))) return;
      ctx.menu.close();
    });

  private async stop(ctx: CommandContext<T>) {
    if (!(await this.checkRole(ctx, Role.Developer))) return;

    ctx.reply(
      "<b>🛑 Остановить бота? После этого придется запускать вручную</b>",
      {
        parse_mode: "HTML",
        reply_markup: this.stopMenu,
      }
    );
  }

  private async checkRole(ctx: Context, minRole: Role): Promise<boolean> {
    const userRepo = DataSource.getRepository(User);
    const user = await userRepo.findOneBy({ telegramId: ctx.from?.id });

    if (!user) return false;

    return user.role >= minRole;
  }
}
