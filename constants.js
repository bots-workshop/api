export const PORT = 8001;

export const BASE_URL = process.env.NODE_ENV === 'production' ? '' : `http://localhost:${PORT}/`;
