const TelegramBot = require('node-telegram-bot-api');

// Bot configuration
const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token);

// Forbidden words that will trigger user removal
const forbiddenWords = ['wts', '#wts', 'wtb', '#wtb'];

// Sending a message with a reply keyboard
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  const options = {
    reply_markup: {
      keyboard: [
        ['Button 1', 'Button 2'],
        ['Button 3', 'Button 4']
      ],
      resize_keyboard: true,  // Adjust the size of the buttons to fit screen
      one_time_keyboard: true  // Hide the keyboard after pressing a button
    }
  };

  bot.sendMessage(chatId, 'Choose an option:', options);
});

// Handling text message when a button is pressed
bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  if (msg.text === 'Button 1') {
    bot.sendMessage(chatId, 'You pressed Button 1');
  } else if (msg.text === 'Button 2') {
    bot.sendMessage(chatId, 'You pressed Button 2');
  }
});

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

// Helper function to check if user is an admin
async function isAdmin(chatId, userId) {
    try {
        const chatMember = await bot.getChatMember(chatId, userId);
        return ['creator', 'administrator'].includes(chatMember.status);
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

// Helper function to kick user
async function kickUser(chatId, userId, reason) {
    try {
        await bot.banChatMember(chatId, userId);
        // Unban immediately to allow them to rejoin if desired
        await bot.unbanChatMember(chatId, userId);
        await bot.sendMessage(
            chatId,
            `User has been removed for posting forbidden content (${reason}).`
        );
    } catch (error) {
        console.error('Error kicking user:', error);
        await bot.sendMessage(
            chatId,
            'Failed to remove user. Please ensure the bot has admin privileges.'
        );
    }
}

// Main message handler
bot.on('message', async (msg) => {
    try {
        // Ignore messages that aren't from groups
        if (!msg.chat.type.includes('group')) return;

        const chatId = msg.chat.id;
        const userId = msg.from.id;
        const messageText = msg.text?.toLowerCase() || '';

        // Skip processing for admin messages
        const userIsAdmin = await isAdmin(chatId, userId);
        if (userIsAdmin) return;

        // Check for forbidden words
        const foundWord = forbiddenWords.find(word => 
            messageText.includes(word)
        );

        if (foundWord) {
            await kickUser(chatId, userId, foundWord);
        }
    } catch (error) {
        console.error('Error processing message:', error);
    }
});

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