import Utilitary from "./Utilitary.class";

type SessionResult = {
    account: any;
    session: TSession;
};

type SessionResultError = {
    errId: string;
};

type TSession = {
    accountName: string;
    secret: string;
    timestamp: number;
    type: "account";
};

export class Session {
    public account: any | null;
    public session: TSession | null;

    constructor() {
        this.account = null;
        this.session = null;
    }

    public async init() {
        const session = await this.getLoggedInSession();
        this.account = session.account;
        this.session = session.session;
    }

    private getSecret() {
        const secret = Utilitary.readFileInDataFolder("sessionSecret.txt");
        return secret;
    }

    private deleteSecret() {
        Utilitary.writeFileInDataFolder("sessionSecret.txt", "");
    }

    private async getSession(retry = false): Promise<SessionResult> {
        const secret = await this.getSecret();
        if (secret) {
            const res = await Utilitary.postJson<SessionResult | SessionResultError>("/api/central/restoreSession", {
                secret,
            });
            if ("errId" in res) {
                if (retry) {
                    throw new Error("Failed to restore session");
                }
                this.deleteSecret();
                return await this.getSession(true);
            }
            return res;
        }

        const res = await Utilitary.postJson<TSession>("/api/central/createSession", {});
        Utilitary.writeFileInDataFolder("sessionSecret.txt", res.secret);
        return { account: null, session: res };
    }

    private async logIn() {
        const res = await Utilitary.postJson<SessionResult>("/api/central/logIn", {
            secret: this.getSecret()!,
            name: process.env.USERNAME!,
            password: process.env.PASSWORD!,
        });
        return res;
    }

    private async getLoggedInSession() {
        const restoredSession = await this.getSession();
        if (restoredSession.account) {
            return restoredSession;
        }

        const loggedInSession = await this.logIn();
        return loggedInSession;
    }
}
