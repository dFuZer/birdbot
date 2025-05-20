import { spawn } from "child_process";
import path from "path";
import Logger from "../../lib/class/Logger.class";
import Utilitary from "../../lib/class/Utilitary.class";
import { dataPath, distPath, resourcesPath } from "../../lib/paths";
import { BirdBotLanguage, CacheableDictionaryMetadata, DictionaryResource } from "./BirdBotTypes";
import BirdBotUtils from "./BirdBotUtils.class";

export async function loadDictionaryMetadata(
    dictionaryId: BirdBotLanguage,
    dictionaryFileName: string,
): Promise<CacheableDictionaryMetadata> {
    return new Promise((resolve, reject) => {
        const timestamp1 = performance.now();
        const powerHousePath = path.join(distPath, "bots", "birdbot", "powerhouse", "release", "powerhouse");
        const dictionaryFilePath = path.join(resourcesPath, dictionaryFileName);

        const powerhouseProcess = spawn(powerHousePath, [dictionaryId, dictionaryFilePath, dataPath]);

        powerhouseProcess.on("exit", async (code) => {
            if (code === 0) {
                const dictionaryMetadataFilePath = path.join(dataPath, `${dictionaryId}.bbdm`);

                const dictionaryMetadataFileContent = await Utilitary.readArrayFromFileAsync(dictionaryMetadataFilePath);
                const [metadataHash, dictionaryMetadataString] = dictionaryMetadataFileContent;
                if (!dictionaryMetadataString) {
                    reject(`Could not generate dictionary metadata for ${dictionaryId}`);
                }
                const dictionaryMetadata = JSON.parse(dictionaryMetadataString) as CacheableDictionaryMetadata;

                const timestamp2 = performance.now();
                Logger.log({
                    message: `${dictionaryId} dictionary: time to generate metadata: ${(timestamp2 - timestamp1).toFixed(
                        2,
                    )} milliseconds`,
                    path: "index.unstable.ts",
                });
                resolve(dictionaryMetadata);
            } else {
                reject(`Could not generate dictionary metadata for ${dictionaryId}`);
            }
        });
    });
}

export async function loadDictionaryResource(
    dictionaryId: BirdBotLanguage,
    dictionaryFileName: string,
): Promise<DictionaryResource> {
    return new Promise((resolve, reject) => {
        const timestamp1 = performance.now();
        const powerHousePath = path.join(distPath, "bots", "birdbot", "powerhouse", "release", "powerhouse");
        const dictionaryFilePath = path.join(resourcesPath, dictionaryFileName);

        const powerhouseProcess = spawn(powerHousePath, [dictionaryId, dictionaryFilePath, dataPath]);

        powerhouseProcess.stderr.on("data", (data) => {
            Logger.error({
                message: `Powerhouse process for ${dictionaryId} stderr: ${data}`,
                path: "BirdBotPowerHouse.ts",
            });
        });

        powerhouseProcess.on("exit", async (code) => {
            if (code === 0) {
                const timestamp2 = performance.now();

                const dictionaryMetadataFilePath = path.join(dataPath, `${dictionaryId}.bbdm`);

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
                    metadata: {
                        ...dictionaryMetadata,
                        testWords: [],
                        language: dictionaryId,
                        resourceFilePath: dictionaryFilePath,
                        metadataFilePath: dictionaryMetadataFilePath,
                        changed: false,
                    },
                };
                const dictionaryHash = BirdBotUtils.getDictionaryHash(dictionaryResource);
                Logger.log({
                    message: `I tried to get the hash of the dictionary resource myself for ${dictionaryId} and got ${dictionaryHash}`,
                    path: "BirdBotPowerHouse.ts",
                });
                const timestamp3 = performance.now();
                Logger.log({
                    message: `${dictionaryId} dictionary: time to generate metadata: ${(timestamp2 - timestamp1).toFixed(
                        2,
                    )} milliseconds, time to generate dictionary resource: ${(timestamp3 - timestamp2).toFixed(2)} milliseconds`,
                    path: "index.unstable.ts",
                });
                resolve(dictionaryResource);
            } else {
                reject(`Could not generate dictionary metadata for ${dictionaryId}`);
            }
        });
    });
}
