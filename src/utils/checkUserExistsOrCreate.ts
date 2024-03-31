import { Context, NextFunction } from "grammy";
import DataSource from "../database/DataSource";
import User from "../database/entities/User";

export async function checkUserExistsOrCreate(
  ctx: Context,
  next: NextFunction
): Promise<void> {
  const userRepo = DataSource.getRepository(User);

  userRepo.findOneByOrFail({ telegramId: ctx.from?.id }).catch(() => {
    const user = new User();
    user.telegramId = ctx.from?.id;
    userRepo.save(user);
  });

  await next();
}
