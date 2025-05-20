import dotenv from "dotenv";
dotenv.config();

const DB_URL = process.env.DB_URL as string;
const API_KEY = process.env.API_KEY as string;
const ENVIRONMENT = process.env.ENVIRONMENT as string;
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI as string;
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID as string;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET as string;

if (!DB_URL || !API_KEY || !ENVIRONMENT || !DISCORD_REDIRECT_URI || !DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
    throw new Error("Missing environment variables");
}

export { API_KEY, DB_URL, DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_REDIRECT_URI, ENVIRONMENT };
