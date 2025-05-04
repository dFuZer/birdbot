import Utilitary from "./Utilitary.class";
export type Resource<ResourceType extends any, ResourceMetadataType extends any> = {
    resource: ResourceType;
    metadata: ResourceMetadataType;
    hash: string;
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

    public loadArrayResourceFromFile(path: string) {
        const stringArray = Utilitary.readArrayFromFile(path);
        return stringArray;
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
