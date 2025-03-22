export enum PlayersPageSortModeEnum {
    Experience = "experience",
    Records = "records",
}

export type TSearchParams = Promise<{ [key: string]: string | string[] | undefined }>;
