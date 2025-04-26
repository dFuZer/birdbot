import { readFileSync } from "fs";

export type Resource<ResourceType extends any, ResourceMetadataType extends any> = {
    resource: ResourceType;
    metadata: ResourceMetadataType;
};

export type ResourceGetter = <T extends Resource<any, any>>(key: string) => T;

export default class ResourceManager {
    private resources: Record<string, Resource<any, any>>;

    constructor() {
        this.resources = {};
    }

    public get: ResourceGetter = <T extends Resource<any, any>>(key: string): T => {
        if (!this.resources[key]) {
            throw new Error(`Resource ${key} not found`);
        }
        return this.resources[key] as T;
    };

    public set<T extends Resource<any, any>>(key: string, value: T) {
        this.resources[key] = value;
    }

    public async loadArrayFromFile(path: string) {
        const startTime = performance.now();
        const fileText = readFileSync(path, "utf-8");
        const words = fileText.split(/\r?\n/);
        const endTime = performance.now();
        console.log(`Time taken to set resource array from file ${path}: ${endTime - startTime} milliseconds`);
        return words;
    }

    public delete(key: string) {
        if (!this.resources[key]) {
            throw new Error(`Resource ${key} not found`);
        }
        delete this.resources[key];
    }

    public edit(key: string, edit: (value: Resource<any, any>) => Resource<any, any>) {
        if (!this.resources[key]) {
            throw new Error(`Resource ${key} not found`);
        }
        this.resources[key] = edit(this.resources[key]);
    }
}
