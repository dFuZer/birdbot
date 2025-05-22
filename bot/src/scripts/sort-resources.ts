import { readdirSync, writeFileSync } from "fs";
import path from "path";
import Utilitary from "../lib/class/Utilitary.class";
import { resourcesPath as rootResourcesFolderPath } from "../lib/paths";

async function sortResources() {
    const resourcePaths = [path.join(rootResourcesFolderPath, "lists"), path.join(rootResourcesFolderPath, "dictionaries")];
    for (const resourcePath of resourcePaths) {
        const resources = readdirSync(resourcePath);
        for (const resourceFileName of resources) {
            const filePath = path.join(resourcePath, resourceFileName);
            const fileContent = await Utilitary.readArrayFromFileAsync(filePath);
            fileContent.sort((a, b) => a.localeCompare(b));
            writeFileSync(filePath, fileContent.join("\n"));
        }
    }
}

sortResources();
