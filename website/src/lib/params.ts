export type TSearchParams = Promise<{ [key: string]: TSearchParamOption }>;

export type TSearchParamOption = string | string[] | undefined;
