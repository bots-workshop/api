export const PORT = 8001;

export const BASE_URL = process.env.NODE_ENV === 'production' ? `http://51.250.41.6:${8001}` : `http://localhost:${PORT}/`;
