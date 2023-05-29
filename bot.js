import {Telegraf, Markup} from 'telegraf';
import geolib from 'geolib';
import 'dotenv/config';
import {users, sneakers, walks} from './database.js'

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.telegram.setMyCommands([
    {command: 'start', description: 'Start conversation'},
    {command: 'stats', description: 'Show statistics'},
    {command: 'start_walk', description: 'Start counting steps'},
    {command: 'finish_walk', description: 'Stop counting steps'},
])

bot.use(async (ctx, next) => {
    const { id: userId } = ctx.from;
    let user = users[userId];

    if (!user) {
        user = {
            sneakers: {},
            id: userId,
        };
        users[userId] = user;
    }

    ctx.user = user;
    return next();
});

bot.start((ctx) => ctx.reply(
    'Welcome',
    Markup.inlineKeyboard([
        Markup.button.webApp('Open shop', process.env.WEB_APP_URL),
    ]),
));

bot.telegram.setChatMenuButton({
    menuButton: {
        type: 'web_app',
        text: 'Shop',
        web_app: {
            url: process.env.WEB_APP_URL,
        }
    }
})

bot.command('stats', ctx => {
    const { user } = ctx;

    if (!Object.keys(user.sneakers).length) {
        return ctx.reply("You don't have any sneakers");
    }

    ctx.reply(Object.values(user.sneakers).map(
        ({id, steps}) => `<b>${sneakers[id].name}</b>\nШагов пройдено: ${steps}`).join("\n\n"),
        {parse_mode: 'HTML'},
    )
})

bot.command('start_walk', ctx => {
    const { user } = ctx;

    walks[user.id] = {
        lastLocation: null,
        steps: 0,
        sneakerId: null,
    }

    ctx.reply(
        'Choose sneakers to go for a walk',
        Markup.inlineKeyboard(Object.values(user.sneakers).map(({id}) => Markup.button.callback(sneakers[id].name, String(id)))),
    )
})

Object.keys(sneakers).forEach(id => bot.action(id, ctx => {
    const { id: userId } = ctx.user;

    if (!walks[userId]) {
        walks[userId] = {
            lastLocation: null,
            steps: 0,
            sneakerId: null,
        }
    }

    walks[userId].sneakerId = Number(id);

    ctx.answerCbQuery(`You chose ${sneakers[id].name}`)
    ctx.reply('Send me your live location and start walk');
}))

bot.command('finish_walk', ctx => {
    const { user } = ctx;

    const walk = walks[user.id];
    if (!walk) {
        ctx.reply('You are not walking right now');
    }

    user.sneakers[walk.sneakerId].steps += walk.steps;

    ctx.reply(`Walk is finished. You have completed ${walk.steps} steps`);
})

bot.on('location', (ctx) => {
    const STEP_SIZE_IN_METERS =  0.8
    const { user } = ctx;

    const walk = walks[user.id]

    if (!walk) {
        return;
    }

    const lastLocation = walk.lastLocation;
    const { latitude, longitude } = ctx.message.location;
    const currentLocation = {
        latitude,
        longitude,
    };

    if (lastLocation === null) {
        ctx.reply('We started tracking your walk and counting steps!')
    } else {
        const distance = geolib.getDistance(
            { latitude: lastLocation.latitude, longitude: lastLocation.longitude },
            { latitude: currentLocation.latitude, longitude: currentLocation.longitude }
        );
        const steps = distance / STEP_SIZE_IN_METERS;

        walk.steps += steps;

        ctx.reply('Steps taken: ', walk.steps)
    }

    user.lastLocation = currentLocation;
});

bot.on('pre_checkout_query', (ctx) => ctx.answerPreCheckoutQuery(true));

bot.on('successful_payment', async (ctx) => {
    const { user } = ctx;
    const { invoice_payload: sneakerId } = ctx.message.successful_payment;

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