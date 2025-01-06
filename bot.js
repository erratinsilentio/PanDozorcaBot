require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const app = express();

// Parse JSON bodies
app.use(express.json());

// Bot configuration
const token = process.env.TELEGRAM_BOT_TOKEN;
const url = process.env.APP_URL; // Your Render deployment URL
const bot = new TelegramBot(token, { webHook: { port: process.env.PORT || 3000 } });

// Set webhook path
const path = `/webhook/${token}`;

// Set up webhook
bot.setWebHook(`${url}${path}`).then(() => {
  console.log('Webhook set successfully');
}).catch((err) => {
  console.error('Failed to set webhook:', err);
});

// Handle webhook requests
app.post(path, (req, res) => {
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