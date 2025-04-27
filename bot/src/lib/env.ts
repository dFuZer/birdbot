import dotenv from "dotenv";
dotenv.config();

const USERNAME = process.env.USERNAME as string;
const PASSWORD = process.env.PASSWORD as string;

if (!USERNAME || !PASSWORD) {
    throw new Error("Missing environment variables");
}

export { PASSWORD, USERNAME };
