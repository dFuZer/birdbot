import path from "path";

const pwd = process.env.PWD as string;

const distPath = path.join(pwd, "dist");
const resourcesPath = path.join(pwd, "resources");
const dataPath = path.join(pwd, ".data");

export { dataPath, distPath, resourcesPath };
