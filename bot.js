require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const app = express();

// Parse JSON bodies
app.use(express.json());

// Bot configuration
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

// Handle webhook requests
app.post('/api/webhook', (req, res) => {
  bot.handleUpdate(req.body);
  res.sendStatus(200);
});

// Optional: Add a health check endpoint
app.get('/', (req, res) => {
  res.send('Bot is running!');
});

// Start Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});