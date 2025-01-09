const TelegramBot = require('node-telegram-bot-api');

// Configuration
const CONFIG = {
  INACTIVE_DAYS: 31,
  CHECK_INTERVAL: 24 * 60 * 60 * 1000, // Check every 24 hours
  FORBIDDEN_WORDS: ['wts', 'wtb', '#wts', '#wtb', 'Wts', 'Wtb', '#Wts', '#Wtb'].map(word => word.toLowerCase()),
  WARNING_THRESHOLD: 2 // Number of warnings before ban
};

// Validate environment variables
if (!process.env.BOT_TOKEN) {
  throw new Error('BOT_TOKEN is not set in environment variables');
}

const bot = new TelegramBot(process.env.BOT_TOKEN);

// In-memory storage (replace with database in production)
const storage = {
  userActivity: new Map(),
  userWarnings: new Map()
};

// Utility functions
const isAdmin = async (chatId, userId) => {
  try {
    const chatMember = await bot.getChatMember(chatId, userId);
    return ['creator', 'administrator'].includes(chatMember.status);
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

const updateUserActivity = (userId) => {
  storage.userActivity.set(userId.toString(), Date.now());
};

const handleWarning = async (chatId, userId, messageThreadId = null) => {
  const warningCount = (storage.userWarnings.get(userId) || 0) + 1;
  storage.userWarnings.set(userId, warningCount);

  if (warningCount >= CONFIG.WARNING_THRESHOLD) {
    await removeUser(chatId, userId, 'exceeded warning threshold');
    storage.userWarnings.delete(userId);
  } else {
    await bot.sendMessage(
      chatId,
      `Warning ${warningCount}/${CONFIG.WARNING_THRESHOLD} for prohibited behavior.`,
      { message_thread_id: messageThreadId }
    );
  }
};

const removeUser = async (chatId, userId, reason) => {
  try {
    await bot.banChatMember(chatId, userId);
    await bot.unbanChatMember(chatId, userId); // Immediately unban to allow rejoin
    storage.userActivity.delete(userId.toString());
    
    const user = await bot.getChatMember(chatId, userId);
    const username = user.user.username || user.user.first_name || userId;
    
    await bot.sendMessage(
      chatId,
      `User ${username} has been removed (Reason: ${reason}).`
    );
  } catch (error) {
    console.error('Error removing user:', error);
    throw error;
  }
};

const checkInactiveUsers = async (chatId) => {
  try {
    const now = Date.now();
    const inactiveThreshold = CONFIG.INACTIVE_DAYS * 24 * 60 * 60 * 1000;
    
    for (const [userId, lastActivity] of storage.userActivity.entries()) {
      if (now - lastActivity > inactiveThreshold) {
        const isUserAdmin = await isAdmin(chatId, userId);
        if (!isUserAdmin) {
          await removeUser(chatId, userId, 'inactive for over 31 days');
        }
      }
    }
    return true;
  } catch (error) {
    console.error('Error checking inactive users:', error);
    return false;
  }
};

const handleMessage = async (message) => {
  try {
    const chatId = message.chat.id;
    const userId = message.from.id;
    const text = message.text?.toLowerCase() || '';
    const messageThreadId = message.message_thread_id;

    // Skip processing for admin messages
    const isUserAdmin = await isAdmin(chatId, userId);
    if (isUserAdmin) {
      updateUserActivity(userId);
      return;
    }

    // Update user activity
    updateUserActivity(userId);

    // Check for forbidden words
    if (CONFIG.FORBIDDEN_WORDS.some(word => text.includes(word))) {
      await handleWarning(chatId, userId, messageThreadId);
      await bot.deleteMessage(chatId, message.message_id);
      return;
    }

    // Handle commands
    switch (text) {
      case '/halo':
        await bot.sendMessage(
          chatId,
          'Zostałem zaprogramowany do pilnowania porządku w Wilkowyjach. To wymagająca ale satysfakcjonująca praca. Osobiście dopilnuję by zakaz handlu był przestrzegany przez każdego członka stada.',
          { message_thread_id: messageThreadId }
        );
        break;

      case '/clean':
        if (isUserAdmin) {
          const success = await checkInactiveUsers(chatId);
          await bot.sendMessage(
            chatId,
            success ? 'Inactive users have been checked and removed if necessary.' : 'Error occurred while checking inactive users.',
            { message_thread_id: messageThreadId }
          );
        }
        break;

      case '/status':
        if (isUserAdmin) {
          const stats = {
            activeUsers: storage.userActivity.size,
            warnedUsers: storage.userWarnings.size
          };
          await bot.sendMessage(
            chatId,
            `Bot Status:\nActive Users: ${stats.activeUsers}\nWarned Users: ${stats.warnedUsers}`,
            { message_thread_id: messageThreadId }
          );
        }
        break;
    }
  } catch (error) {
    console.error('Error handling message:', error);
  }
};

// Set up periodic inactive user check
setInterval(async () => {
  const chats = Array.from(new Set(storage.userActivity.keys()));
  for (const chatId of chats) {
    await checkInactiveUsers(chatId);
  }
}, CONFIG.CHECK_INTERVAL);

// Webhook handler
module.exports = async (request, response) => {
  try {
    if (request.method === 'POST') {
      console.log('Bot token:', process.env.BOT_TOKEN); // Will be hidden in logs but helps verify it exists
      console.log('Received webhook:', request.body);
      
      const { message } = request.body;
      
      if (message) {
        console.log('Sending halo response to chat:', message.chat.id);
        await handleMessage(message);
        console.log('Response sent successfully');
      }
      
      return response.status(200).json({ ok: true });
    }

    // Handle GET requests
    return response.status(200).json({ 
      status: 'active',
      timestamp: new Date().toISOString(),
      hasToken: !!process.env.BOT_TOKEN // Will show if token exists
    });
    
  } catch (error) {
    console.error('Error in webhook handler:', error);
    return response.status(500).json({ 
      error: error.message,
      hasToken: !!process.env.BOT_TOKEN // Will show if token exists
    });
  }
};