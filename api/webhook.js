const TelegramBot = require('node-telegram-bot-api');

if (!process.env.BOT_TOKEN) {
  throw new Error('BOT_TOKEN is not set in environment variables');
}

const bot = new TelegramBot(process.env.BOT_TOKEN);

// Forbidden words list
const FORBIDDEN_WORDS = ['wts', 'wtb', '#wts', '#wtb', 'Wts', 'Wtb', '#Wts', '#Wtb'];

// In-memory storage for user activity (use a database in production)
const userActivity = {};

const handleMessage = async (message) => {
  try {
    const chatId = message.chat.id;
    const userId = message.from.id;
    const text = message.text?.toLowerCase() || '';
    const messageThreadId = message.message_thread_id;

    // Update user activity
    userActivity[userId] = Date.now();

    // Check for forbidden words
    if (FORBIDDEN_WORDS.some(word => text.includes(word))) {
      await bot.banChatMember(chatId, userId);
      await bot.unbanChatMember(chatId, userId);
      await bot.deleteMessage(chatId, message.message_id);
      await bot.sendMessage(chatId, `User ${message.from.username || message.from.first_name} has been removed for using prohibited words.`, {
        message_thread_id: messageThreadId
      });
      return;
    }

    // Handle /halo command
    if (text === '/halo') {
      await bot.sendMessage(chatId, 'Zostałem zaprogramowany do pilnowania porządku w Wilkowyjach. To wymagająca ale satysfakcjonująca praca. Osobiście dopilnuję by zakaz handlu był przestrzegany przez każdego członka stada.', {
        message_thread_id: messageThreadId
      });
    }

    // Handle /clean command
    if (text === '/clean') {
      await checkInactiveUsers(chatId);
      await bot.sendMessage(chatId, 'Inactive users have been checked and removed if necessary.', {
        message_thread_id: messageThreadId
      });
    }
  } catch (error) {
    console.error('Error handling message:', error);
  }
};

const checkInactiveUsers = async (chatId) => {
  try {
    const now = Date.now();
    const inactiveThreshold = 31 * 24 * 60 * 60 * 1000; // 31 days in milliseconds

    for (const userId in userActivity) {
      if (now - userActivity[userId] > inactiveThreshold) {
        await bot.banChatMember(chatId, userId);
        await bot.unbanChatMember(chatId, userId);
        await bot.sendMessage(chatId, `User with ID ${userId} has been removed for being inactive for over 31 days.`);
        delete userActivity[userId]; // Remove user from tracking
      }
    }
  } catch (error) {
    console.error('Error checking inactive users:', error);
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