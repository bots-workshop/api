import express from 'express';
import cors from 'cors';
import path, {dirname} from 'path';
import {users, sneakers} from './database.js'
import { fileURLToPath } from 'url';
import bot from './bot.js';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());
app.use(cors({
    origin: '*',
}))

bot.launch();

app.post('/invoiceLink', async (req, res) => {
    const {prices} = req.body;

    try {
        const link = await bot.telegram.createInvoiceLink({
            title: 'Buy sneakers',
            description: 'Sneakers are virtual',
            payload: 'payload',
            provider_token: process.env.YO_KASSA_TOKEN,
            currency: 'RUB',
            need_phone_number: true,
            prices,
        });

        res.status(200).send({link});
    } catch (err) {
        console.error(err);
        res.status(500).send(err);
    }

})

const createUser = (id) => {
    const user = {
        id,
        sneakers: {},
    }
    users[id] = user;

    return user;
}

app.get('/users/:id', (req, res) => {
    const id = req.params.id;
    const user = users[id];
    if (user) {
        res.send(user);
    } else {
        res.status(404).send('User not found')
    }
});

app.post('/users/create', (req, res) => {
    const id = req.body;
    if (!id) {
        res.status(400).send('userId is incorrect')
    }

    const user = {
        id,
        sneakers: {},
    }
    users[id] = user;

    res.status(200).send(user);
});

app.get('/users', (req, res) => {
    res.send(users);
});

app.get('/users/:userId/sneakers', (req, res) => {
    const userId = req.params.userId;
    let user = users[userId];

    if (!user) {
        user = createUser(userId);
    }

    res.send(user.sneakers);
});

app.post('/users/:userId/sneakers/:sneakerId', (req, res) => {
    const {userId, sneakerId} = req.params;
    const user = users[userId];
    const sneaker = sneakers[sneakerId];
    if (user && sneaker) {
        user.sneakers[sneakerId] = {
            id: sneakerId,
            steps: 0,
        }
        res.status(200).send(user.sneakers);
    } else {
        res.status(404).send('User or sneakers not found')
    }
});

app.post('/users/:userId/sneakers/:sneakerId/addSteps', (req, res) => {
    const {steps} = req.body;
    const {userId, sneakerId} = req.params;
    if (!userId) {
        res.status(404).send('Bad userId')
    }
    let user = users[userId];
    if (!user) {
        user = createUser(userId);
    }
    const sneaker = user.sneakers[sneakerId];
    if (sneaker) {
        sneaker.steps += steps;
        res.status(200).send(user);
    } else {
        res.status(404).send('Sneakers not found')
    }
});

app.get('/images/:imageName', (req, res) => {
    res.sendFile(path.join(__dirname, 'images/', req.params.imageName));
});

app.get('/sneakers', (req, res) => {
    res.send(sneakers);
});

app.listen(process.env.API_PORT, async () => {
    // await bot.telegram.setWebhook(`http://localhost:${process.env.API_PORT}/update`);
});
