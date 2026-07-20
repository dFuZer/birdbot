import { JKLM_AUTH_EXPIRATION, JKLM_AUTH_TOKEN, JKLM_AUTH_USERNAME, JKLM_LANGUAGE, JKLM_NICKNAME, JKLM_PICTURE } from "../env";
import type { JklmAuth } from "../types/gameTypes";

/**
 * jklm identity used when joining rooms.
 * Guest mode (auth null) works for hosting via creatorUserToken.
 * Optional account auth enables logged-in features and stable auth.id.
 */
export class Session {
    public nickname: string;
    public language: string;
    public picture: string | null;
    public auth: JklmAuth;

    constructor() {
        this.nickname = JKLM_NICKNAME;
        this.language = JKLM_LANGUAGE;
        this.picture = JKLM_PICTURE;
        this.auth =
            JKLM_AUTH_TOKEN && JKLM_AUTH_USERNAME
                ? {
                      expiration: JKLM_AUTH_EXPIRATION,
                      service: "jklm",
                      token: JKLM_AUTH_TOKEN,
                      username: JKLM_AUTH_USERNAME,
                  }
                : null;
    }

    public async init() {
        // No HTTP session restore on jklm; identity is env-driven.
    }

    public getJoinAuth(): JklmAuth {
        return this.auth;
    }
}
