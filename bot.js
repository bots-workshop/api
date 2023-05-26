import {Telegraf, Markup} from 'telegraf';
import 'dotenv/config';
import {users, sneakers} from './database.js'

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => ctx.reply(
    'Welcome',
    Markup.inlineKeyboard([
        Markup.button.webApp('Open shop', process.env.WEB_APP_URL),
    ]),
));

bot.action('OPEN_MENU', (ctx) => ctx.answerCbQuery('open menu'))

bot.telegram.setChatMenuButton({
    menuButton: {
        type: 'web_app',
        text: 'Shop',
        web_app: {
            url: process.env.WEB_APP_URL,
        }
    }
})

bot.on('pre_checkout_query', (ctx) => ctx.answerPreCheckoutQuery(true));

bot.on('successful_payment', async (ctx) => {
    const { id: userId } = ctx.message.from;
    const { invoice_payload: sneakerId } = ctx.message.successful_payment;

    const user = users[userId];
    const userHasSneakers = user.sneakers[sneakerId];
    const sneaker = sneakers[sneakerId];

    if (!userHasSneakers && user && sneaker) {
        user.sneakers[sneakerId] = {
            id: sneakerId,
            steps: 0,
        };
    }
});

export default bot;