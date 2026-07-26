import CommandUtils, {
    type Command,
    type CommandRegistry,
} from "../../../lib/class/CommandUtils.class";

export type BirdBotCommandDomain = Readonly<{
    name: string;
    commands: readonly Command[];
}>;

export function createBirdBotCommandRegistry(domains: readonly BirdBotCommandDomain[]): CommandRegistry {
    const domainNames = new Set<string>();
    const commands: Command[] = [];

    for (const domain of domains) {
        if (domainNames.has(domain.name)) {
            throw new Error(`Duplicate BirdBot command domain "${domain.name}"`);
        }
        domainNames.add(domain.name);
        commands.push(...domain.commands);
    }

    return CommandUtils.createRegistry(commands);
}
