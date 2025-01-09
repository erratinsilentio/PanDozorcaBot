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
      await bot.sendMessage(chatId, 'Zostałem zaprogramowany do pilnowania porządku w Wilkowyjach. To wymagająca ale satysfakcjonująca praca. Osobiście dopilnuję by zakaz handlu był przestrzegany przez każdego członka stada.', {
        message_thread_id: messageThreadId
      });
    }
  } catch (error) {
    console.error('Error handling message:', error);
  }
};

const checkInactiveUsers = async (chatId) => {
  try {
    const members = await bot.getChatAdministrators(chatId);
    const now = Date.now();

    for (const member of members) {
      const user = member.user;
      const lastActive = user.last_active_date ? new Date(user.last_active_date * 1000) : null;

      if (lastActive && (now - lastActive.getTime()) > 31 * 24 * 60 * 60 * 1000) {
        await bot.banChatMember(chatId, user.id);
        await bot.unbanChatMember(chatId, user.id);
        await bot.sendMessage(chatId, `User ${user.username || user.first_name} has been removed for being inactive for over 31 days.`);
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
        await checkInactiveUsers(message.chat.id);
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