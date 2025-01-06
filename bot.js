require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

// Replace 'YOUR_BOT_TOKEN' with the token from BotFather
const token = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN';

// Create a bot instance
const bot = new TelegramBot(token, { polling: true });

// Forbidden words that will trigger user removal
const forbiddenWords = ['wts', '#wts', 'wtb', '#wtb'];

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

// Error handler
bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
});

// Startup message
console.log('Bot is running...');

// Handle graceful shutdown
process.on('SIGINT', () => {
    bot.stopPolling();
    process.exit(0);
});