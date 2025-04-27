import dotenv from "dotenv";
dotenv.config();

const API_URL = process.env.API_URL as string;
const API_KEY = process.env.API_KEY as string;

if (!API_URL || !API_KEY) {
    throw new Error("Missing environment variables");
}

export { API_KEY, API_URL };
