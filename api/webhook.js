const TelegramBot = require('node-telegram-bot-api');

// Bot configuration
const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token);

// Your bot logic
const handleMessage = async (msg) => {
  const chatId = msg.chat.id;
  if (msg.text) {
    await bot.sendMessage(chatId, `You said: ${msg.text}`);
  }
};

// Serverless function handler
module.exports = async (request, response) => {
  try {
    if (request.method === 'POST') {
      const update = request.body;
      if (update.message) {
        await handleMessage(update.message);
      }
      return response.status(200).send('OK');
    }
    
    return response.status(200).send('Webhook is running!');
  } catch (error) {
    console.error('Error in webhook handler:', error);
    return response.status(500).send('Error processing update');
  }
}; 