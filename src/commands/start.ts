import { Context } from "grammy";

export default function start(ctx: Context): void {
  ctx.reply(
    "Привет! Меня зовут Свифи. Для разговора в беседах Вы можете обращаться ко мне по имени, в личных диалогах это необязательно."
  );
}
