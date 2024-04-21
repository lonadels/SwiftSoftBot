import { Context, NextFunction } from "grammy";
import DataSource from "../database/DataSource";
import User from "../database/entities/User";
import Chat from "../database/entities/Chat";

export async function checkUserExistsOrCreate(
  ctx: Context,
  next: NextFunction
): Promise<void> {
  const userRepo = DataSource.getRepository(User);

  await userRepo
    .findOneByOrFail({ telegramId: ctx.from?.id })
    .catch(async () => {
      const user = new User();
      user.telegramId = ctx.from!.id;
      user.name = ctx.from!.first_name.trim();
      await userRepo.save(user);
    })
    .then(async (user) => {
      if (!user) return;
      user.name = ctx.from!.first_name.trim();
      await userRepo.save(user);
    });

  await next();
}

export async function checkChatExistsOrCreate(
  ctx: Context,
  next: NextFunction
): Promise<void> {
  const chatRepo = DataSource.getRepository(Chat);

  await chatRepo
    .findOneByOrFail({ telegramId: ctx.chat?.id })
    .catch(async () => {
      const chat = new Chat();
      chat.telegramId = ctx.chat?.id;
      await chatRepo.save(chat);
    });

  await next();
}
