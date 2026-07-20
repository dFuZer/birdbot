import dotenv from "dotenv";
import { DEFAULT_BOT_PICTURE } from "./constants/defaultBotPicture";
dotenv.config();

const NAMESPACE_UUID = process.env.NAMESPACE_UUID as string;
const JKLM_NICKNAME = (process.env.JKLM_NICKNAME as string) || "BirdBot";
const JKLM_AUTH_TOKEN = process.env.JKLM_AUTH_TOKEN as string | undefined;
const JKLM_AUTH_USERNAME = process.env.JKLM_AUTH_USERNAME as string | undefined;
const JKLM_AUTH_EXPIRATION = process.env.JKLM_AUTH_EXPIRATION
    ? Number(process.env.JKLM_AUTH_EXPIRATION)
    : 2982251755416;
const JKLM_LANGUAGE = (process.env.JKLM_LANGUAGE as string) || "en-US";
const JKLM_PICTURE = (process.env.JKLM_PICTURE as string) || DEFAULT_BOT_PICTURE;

if (!NAMESPACE_UUID) {
    throw new Error("Missing NAMESPACE_UUID environment variable");
}

export {
    JKLM_AUTH_EXPIRATION,
    JKLM_AUTH_TOKEN,
    JKLM_AUTH_USERNAME,
    JKLM_LANGUAGE,
    JKLM_NICKNAME,
    JKLM_PICTURE,
    NAMESPACE_UUID,
};
