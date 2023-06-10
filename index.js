import bot from './bot.js';
import api from './api.js';

api.listen(process.env.API_PORT);

bot.launch();
