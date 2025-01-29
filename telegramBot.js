const { Bot, InlineKeyboard } = require("grammy")
require("dotenv").config();

//Create a new bot
const bot = new Bot(process.env.TELEGRAM_BOT_API_KEY);

//Start the Bot
bot.start();

function sendMessage(ticket) {
    const visitTicketPageButton = new InlineKeyboard().url("Get tickets", ticket.link);
    const message = `<b>${ticket.homeTeam} vs ${ticket.awayTeam}</b>
🏟️ Venue: <i>${ticket.venue}</i>
📅 Date: <i>${ticket.date}</i>`
    bot.api.sendMessage(process.env.TELEGRAM_GROUP_ID, message, {
        parse_mode: "HTML",
        reply_markup: visitTicketPageButton
    })
}

// Export the bot and sendMessage
module.exports = {
    bot,
    sendMessage,
};