import { spawn } from "child_process";
import path from "path";
import Logger from "../../lib/class/Logger.class";
import Utilitary from "../../lib/class/Utilitary.class";
import { dataPath, distPath, resourcesPath } from "../../lib/paths";
import { BirdBotLanguage, CacheableDictionaryMetadata, DictionaryResource } from "./BirdBotTypes";

function runPowerhouse(dictionaryId: BirdBotLanguage, dictionaryFileName: string): Promise<{ code: number | null; output: string }> {
    const powerHousePath = path.join(distPath, "bots", "birdbot", "powerhouse", "release", "powerhouse");
    const dictionaryFilePath = path.join(resourcesPath, "dictionaries", dictionaryFileName);

    return new Promise((resolve, reject) => {
        const powerhouseProcess = spawn(powerHousePath, [dictionaryId, dictionaryFilePath, dataPath]);
        const chunks: Buffer[] = [];

        powerhouseProcess.stdout.on("data", (data) => {
            chunks.push(Buffer.isBuffer(data) ? data : Buffer.from(data));
        });
        powerhouseProcess.stderr.on("data", (data) => {
            Logger.error({
                message: `Powerhouse process for ${dictionaryId} stderr: ${data}`,
                path: "BirdBotPowerHouse.ts",
            });
        });
        powerhouseProcess.on("error", reject);
        powerhouseProcess.on("exit", (code) => {
            resolve({ code, output: Buffer.concat(chunks).toString("utf8") });
        });
    });
}

function logPowerhouseCache(dictionaryId: BirdBotLanguage, output: string): void {
    const cacheLine = output
        .split("\n")
        .map((line) => line.trim())
        .find((line) => line.startsWith("Cache hit") || line.startsWith("Cache miss"));
    Logger.log({
        message: cacheLine
            ? `Powerhouse ${dictionaryId}: ${cacheLine}`
            : `Powerhouse ${dictionaryId}: wrote metadata cache (no previous .bbdm)`,
        path: "BirdBotPowerHouse.ts",
    });
}

export async function loadDictionaryMetadata(
    dictionaryId: BirdBotLanguage,
    dictionaryFileName: string
): Promise<CacheableDictionaryMetadata> {
    const timestamp1 = performance.now();
    const { code, output } = await runPowerhouse(dictionaryId, dictionaryFileName);
    if (code !== 0) {
        throw new Error(`Could not generate dictionary metadata for ${dictionaryId}`);
    }
    logPowerhouseCache(dictionaryId, output);

    const dictionaryMetadataFilePath = path.join(dataPath, `${dictionaryId}.bbdm`);
    const dictionaryMetadataFileContent = await Utilitary.readArrayFromFileAsync(dictionaryMetadataFilePath);
    const [, dictionaryMetadataString] = dictionaryMetadataFileContent;
    if (!dictionaryMetadataString) {
        throw new Error(`Could not generate dictionary metadata for ${dictionaryId}`);
    }
    const dictionaryMetadata = JSON.parse(dictionaryMetadataString) as CacheableDictionaryMetadata;
    Logger.log({
        message: `${dictionaryId} dictionary: time to load metadata: ${(performance.now() - timestamp1).toFixed(2)} milliseconds`,
        path: "BirdBotPowerHouse.ts",
    });
    return dictionaryMetadata;
}

export async function loadDictionaryResource(
    dictionaryId: BirdBotLanguage,
    dictionaryFileName: string
): Promise<DictionaryResource> {
    const timestamp1 = performance.now();
    const { code, output } = await runPowerhouse(dictionaryId, dictionaryFileName);
    if (code !== 0) {
        throw new Error(`Could not generate dictionary metadata for ${dictionaryId}`);
    }
    logPowerhouseCache(dictionaryId, output);

    const timestamp2 = performance.now();
    const dictionaryFilePath = path.join(resourcesPath, "dictionaries", dictionaryFileName);
    const dictionaryMetadataFilePath = path.join(dataPath, `${dictionaryId}.bbdm`);
    const [dictionaryResourceArray, dictionaryMetadataFileContent] = await Promise.all([
        Utilitary.readArrayFromFileAsync(dictionaryFilePath),
        Utilitary.readArrayFromFileAsync(dictionaryMetadataFilePath),
    ]);
    const [, dictionaryMetadataString] = dictionaryMetadataFileContent;
    if (!dictionaryMetadataString) {
        throw new Error(`Could not generate dictionary metadata for ${dictionaryId}`);
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
    Logger.log({
        message: `${dictionaryId} dictionary: powerhouse ${(timestamp2 - timestamp1).toFixed(2)} milliseconds, resource load ${(performance.now() - timestamp2).toFixed(2)} milliseconds`,
        path: "BirdBotPowerHouse.ts",
    });
    return dictionaryResource;
}
