import { Bot, InlineKeyboard } from "grammy";

const bot = new Bot(process.env.BOT_TOKEN);

bot.command("start", async (ctx) => {
  const keyboard = new InlineKeyboard()
    .text("Button 1", "button1")
    .text("Button 2", "button2")
    .row()
    .text("Button 3", "button3")
    .text("Button 4", "button4");

  await ctx.reply("Welcome! Choose an option:", {
    reply_markup: keyboard,
  });
});

bot.callbackQuery("button1", async (ctx) => {
  await ctx.answerCallbackQuery("You clicked Button 1!");
});

bot.callbackQuery("button2", async (ctx) => {
  await ctx.answerCallbackQuery("You clicked Button 2!");
});

bot.callbackQuery("button3", async (ctx) => {
  await ctx.answerCallbackQuery("You clicked Button 3!");
});

bot.callbackQuery("button4", async (ctx) => {
  await ctx.answerCallbackQuery("You clicked Button 4!");
});

export default async (req, res) => {
  try {
    if (req.method === "POST") {
      await bot.handleUpdate(req.body);
      res.status(200).send("OK");
    } else {
      res.status(200).send("Bot is running!");
    }
  } catch (error) {
    console.error("Error handling update:", error);
    res.status(500).send("Internal Server Error");
  }
}; 