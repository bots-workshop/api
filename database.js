import 'dotenv/config';

export const users = {};

export const walks = {};

export const sneakers = {
    1: {
        id: 1,
        name: 'Nike Dragon\'s Fire',
        price: 23999,
        image: `${process.env.BASE_API_URL}/images/fire-sneaker.png`,
    },
    2: {
        id: 2,
        name: 'Adidas Blue Ocean',
        price: 15999,
        image: `${process.env.BASE_API_URL}/images/blue-sneaker.png`,
    },
    3: {
        id: 3,
        name: 'Puma Grass God',
        price: 18699,
        image: `${process.env.BASE_API_URL}/images/green-sneaker.png`,
    },
    4: {
        id: 4,
        name: 'Reebok City Walker',
        price: 19999,
        image: `${process.env.BASE_API_URL}/images/city-sneaker.png`,
    },
};
