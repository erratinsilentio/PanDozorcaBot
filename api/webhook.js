const TelegramBot = require('node-telegram-bot-api');

// Bot configuration
const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token);

// Your bot logic
const handleMessage = async (msg) => {
  try {
    console.log('Processing message:', msg); // Debug log
    const chatId = msg.chat.id;
    
    // Handle /halo command - make sure to trim the message text
    if (msg.text && msg.text.trim() === '/halo') {
      console.log('Sending halo response to chat:', chatId); // Debug log
      return await bot.sendMessage(chatId, 'halo?', {
        parse_mode: 'HTML'
      });
    }

    // Optional: Handle other messages
    if (msg.text) {
      console.log('Sending echo response to chat:', chatId); // Debug log
      return await bot.sendMessage(chatId, `You said: ${msg.text}`, {
        parse_mode: 'HTML'
      });
    }
  } catch (error) {
    console.error('Error in handleMessage:', error);
    throw error; // Re-throw to be caught by the main handler
  }
};

// Serverless function handler
module.exports = async (request, response) => {
  try {
    if (request.method === 'POST') {
      console.log('Received webhook POST request');
      const update = request.body;
      console.log('Update body:', update);

      if (update.message) {
        await handleMessage(update.message);
        console.log('Message handled successfully');
      }

      return response.status(200).json({ ok: true });
    }
    
    // Handle GET requests
    return response.status(200).json({ 
      status: 'active',
      message: 'Webhook is running!'
    });
  } catch (error) {
    console.error('Error in webhook handler:', error);
    // Send error response but don't expose error details
    return response.status(500).json({ 
      ok: false,
      message: 'Internal server error'
    });
  }
}; 