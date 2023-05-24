import {Telegraf, Markup} from 'telegraf';
import 'dotenv/config';

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

export default bot;