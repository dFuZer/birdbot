import { spawn } from "child_process";
import path from "path";
import Logger from "../../lib/class/Logger.class";
import Utilitary from "../../lib/class/Utilitary.class";
import { BirdBotLanguage, CacheableDictionaryMetadata, DictionaryResource } from "./BirdBotTypes";

export async function loadDictionaryMetadata(dictionaryId: BirdBotLanguage, dictionaryFileName: string): Promise<CacheableDictionaryMetadata> {
    return new Promise((resolve, reject) => {
        const pwd = process.env.PWD as string;
        const timestamp1 = performance.now();
        const powerHousePath = path.join(pwd, "dist", "bots", "birdbot", "powerhouse", "release", "powerhouse");
        const dictionaryFilePath = path.join(pwd, "resources", dictionaryFileName);
        const dataPath = path.join(pwd, ".data");

        const powerhouseProcess = spawn(powerHousePath, [dictionaryId, dictionaryFilePath, dataPath]);

        powerhouseProcess.on("exit", async (code) => {
            if (code === 0) {
                const dictionaryMetadataFilePath = path.join(pwd, ".data", `${dictionaryId}.bbdm`);

                const dictionaryMetadataFileContent = await Utilitary.readArrayFromFileAsync(dictionaryMetadataFilePath);
                const [metadataHash, dictionaryMetadataString] = dictionaryMetadataFileContent;
                if (!dictionaryMetadataString) {
                    reject(`Could not generate dictionary metadata for ${dictionaryId}`);
                }
                const dictionaryMetadata = JSON.parse(dictionaryMetadataString) as CacheableDictionaryMetadata;

                const timestamp2 = performance.now();
                Logger.log({
                    message: `${dictionaryId} dictionary: time to generate metadata: ${(timestamp2 - timestamp1).toFixed(2)} milliseconds`,
                    path: "index.unstable.ts",
                });
                resolve(dictionaryMetadata);
            } else {
                reject(`Could not generate dictionary metadata for ${dictionaryId}`);
            }
        });
    });
}

export async function loadDictionaryResource(dictionaryId: BirdBotLanguage, dictionaryFileName: string): Promise<DictionaryResource> {
    return new Promise((resolve, reject) => {
        const pwd = process.env.PWD as string;
        const timestamp1 = performance.now();
        const powerHousePath = path.join(pwd, "dist", "bots", "birdbot", "powerhouse", "release", "powerhouse");
        const dictionaryFilePath = path.join(pwd, "resources", dictionaryFileName);
        const dataPath = path.join(pwd, ".data");

        const powerhouseProcess = spawn(powerHousePath, [dictionaryId, dictionaryFilePath, dataPath]);

        powerhouseProcess.on("exit", async (code) => {
            if (code === 0) {
                const timestamp2 = performance.now();

                const dictionaryMetadataFilePath = path.join(pwd, ".data", `${dictionaryId}.bbdm`);

                const [dictionaryResourceArray, dictionaryMetadataFileContent] = await Promise.all([
                    Utilitary.readArrayFromFileAsync(dictionaryFilePath),
                    Utilitary.readArrayFromFileAsync(dictionaryMetadataFilePath),
                ]);
                const [metadataHash, dictionaryMetadataString] = dictionaryMetadataFileContent;
                if (!dictionaryMetadataString) {
                    reject(`Could not generate dictionary metadata for ${dictionaryId}`);
                }
                const dictionaryMetadata = JSON.parse(dictionaryMetadataString) as CacheableDictionaryMetadata;

                const dictionaryResource: DictionaryResource = {
                    resource: dictionaryResourceArray,
                    metadata: { ...dictionaryMetadata, testWords: [], language: dictionaryId, fileName: dictionaryFileName },
                };
                const timestamp3 = performance.now();
                Logger.log({
                    message: `${dictionaryId} dictionary: time to generate metadata: ${(timestamp2 - timestamp1).toFixed(2)} milliseconds, time to generate dictionary resource: ${(
                        timestamp3 - timestamp2
                    ).toFixed(2)} milliseconds`,
                    path: "index.unstable.ts",
                });
                resolve(dictionaryResource);
            } else {
                reject(`Could not generate dictionary metadata for ${dictionaryId}`);
            }
        });
    });
}
