import dotenv from "dotenv";
dotenv.config();

const API_URL = process.env.API_URL as string;
const API_KEY = process.env.API_KEY as string;
const IS_UNSTABLE_DEV_MODE =
    process.env.BIRDBOT_DEBUG === "1" || (process.argv[1]?.includes("index.unstable") ?? false);

if (!API_URL || !API_KEY) {
    throw new Error("Missing environment variables");
}

export { API_KEY, API_URL, IS_UNSTABLE_DEV_MODE };
