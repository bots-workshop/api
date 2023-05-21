export const PORT = 8001;

export const BASE_URL = process.env.NODE_ENV === 'production' ? `https://sneakers-api-132b.onrender.com` : `http://localhost:${PORT}`;
