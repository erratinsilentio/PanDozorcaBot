const TelegramBot = require('node-telegram-bot-api');

if (!process.env.BOT_TOKEN) {
  throw new Error('BOT_TOKEN is not set in environment variables');
}

const bot = new TelegramBot(process.env.BOT_TOKEN);

// Forbidden words list
const FORBIDDEN_WORDS = ['wts', 'wtb', '#wts', '#wtb', 'Wts', 'Wtb', '#Wts', '#Wtb'];

const handleMessage = async (message) => {
  try {
    const chatId = message.chat.id;
    const userId = message.from.id;
    const text = message.text?.toLowerCase() || '';
    const messageThreadId = message.message_thread_id;
    
    // Check for forbidden words
    if (FORBIDDEN_WORDS.some(word => text.includes(word))) {
      // Ban the user
      await bot.banChatMember(chatId, userId);
      // Unban immediately to allow them to rejoin if desired
      await bot.unbanChatMember(chatId, userId);
      // Delete the message
      await bot.deleteMessage(chatId, message.message_id);
      // Notify about the ban
      await bot.sendMessage(chatId, `User ${message.from.username || message.from.first_name} has been removed for using prohibited words.`, {
        message_thread_id: messageThreadId
      });
      return;
    }

    // Handle /halo command
    if (text === '/halo') {
      await bot.sendMessage(chatId, 'halo?', {
        message_thread_id: messageThreadId
      });
    }
  } catch (error) {
    console.error('Error handling message:', error);
  }
};

module.exports = async (request, response) => {
  try {
    if (request.method === 'POST') {
      const { message } = request.body;
      
      if (message) {
        await handleMessage(message);
      }
      
      return response.status(200).json({ ok: true });
    }

    return response.status(200).json({ 
      status: 'active',
      timestamp: new Date().toISOString(),
      hasToken: !!process.env.BOT_TOKEN
    });
    
  } catch (error) {
    console.error('Error in webhook handler:', error);
    return response.status(500).json({ error: error.message });
  }
}; 