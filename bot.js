require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.BOT_TOKEN;
const url = process.env.VERCEL_URL; // Your Vercel deployment URL

async function setWebhook() {
  const bot = new TelegramBot(token);
  try {
    const webhookUrl = `https://${url}/api/webhook`;
    await bot.setWebHook(webhookUrl);
    console.log('Webhook set successfully to:', webhookUrl);
  } catch (error) {
    console.error('Failed to set webhook:', error);
  }
}

setWebhook();