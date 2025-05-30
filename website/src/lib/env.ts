const API_URL = process.env.API_URL as string;
const API_KEY = process.env.API_KEY as string;
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI as string;
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID as string;
const EXPERIMENTAL_FEATURES_ENABLED = process.env.EXPERIMENTAL_FEATURES_ENABLED === "true";
const BOT_API_URL = process.env.BOT_API_URL as string;

export { API_KEY, API_URL, BOT_API_URL, DISCORD_CLIENT_ID, DISCORD_REDIRECT_URI, EXPERIMENTAL_FEATURES_ENABLED };
