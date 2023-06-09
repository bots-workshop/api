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

bot.use( (ctx, next) => {
    const { id: userId } = ctx.from;
    let user = users[userId];

    if (!user) {
        user = {
            sneakers: {
                1: {
                    id: 1,
                    steps: 0,
                },
            },
            id: userId,
        };
        users[userId] = user;
    }

    ctx.user = user;
    return next();
});

const START_MESSAGE = 'Welcome to sneakers shop!\nPress "Open shop" button and buy a new pair of sneakers 😎️️️️️️';

bot.start(ctx => ctx.reply(
    START_MESSAGE,
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
        ({id, steps}) =>
            `<b>${sneakers[id].name}</b>\nШагов пройдено: ${steps}`).join("\n\n"),
        {parse_mode: 'HTML'},
    )
})

bot.command('start_walk', ctx => {
    const { user } = ctx;

    walks[user.id] = {
        lastLocation: null,
        steps: 0,
        sneakerId: null,
        counterMessageId: null,
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
            counterMessageId: null,
            locationMessageId: null,
        }
    }

    walks[userId].sneakerId = Number(id);

    ctx.answerCbQuery(`You chose ${sneakers[id].name}`)
    ctx.reply('Send me your live location and start walk');
}))

bot.command('finish_walk', ctx => {
    const { user } = ctx;

    const walk = walks[user.id];
    if (!walk || !user.sneakers[walk.sneakerId]) {
        return ctx.reply('You are not walking right now');
    }

    user.sneakers[walk.sneakerId].steps += walk.steps;
    delete walk[user.id];

    ctx.reply(`Walk is finished. You have completed ${walk.steps} steps`);
})

const STEP_SIZE_IN_METERS =  0.8

bot.on('location', async ctx => {
    const { user } = ctx;

    const walk = walks[user.id]

    if (!walk) {
        return;
    }

    walk.lastLocation =  ctx.message.location;

    const message = await ctx.reply('We started tracking your walk and counting steps!')

    walk.counterMessageId = message.message_id;
    walk.locationMessageId = ctx.message.message_id;

    bot.on('edited_message', async ctx => {
        if (ctx.editedMessage.message_id === walk.locationMessageId) {
            const { latitude, longitude } = ctx.editedMessage.location;
            const currentLocation = { latitude, longitude };
            const lastLocation = walk.lastLocation;

            const distance = geolib.getDistance(lastLocation, currentLocation);
            const steps = distance / STEP_SIZE_IN_METERS;

            walk.steps += steps;

            await ctx.telegram.editMessageText(ctx.chat.id, walk.counterMessageId, null, `Steps taken: ${walk.steps}`);

            user.lastLocation = currentLocation;
        }
    });
});

bot.on('pre_checkout_query', (ctx) => ctx.answerPreCheckoutQuery(true));

bot.on('successful_payment', (ctx) => {
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
