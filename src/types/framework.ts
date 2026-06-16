import { ChatInputCommandInteraction, SlashCommandBuilder, Client, Collection, ButtonInteraction, AnySelectMenuInteraction } from 'discord.js';

export interface Command {
    data: SlashCommandBuilder | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>;
    execute(interaction: ChatInputCommandInteraction): Promise<void>;
}

export interface Event {
    name: string;
    once?: boolean;
    execute(...args: unknown[]): Promise<void> | void;
}

export interface ComponentHandler {
    customId: string;
    execute(interaction: ButtonInteraction | AnySelectMenuInteraction): Promise<void>;
}

export interface ExtendedClient extends Client {
    commands: Collection<string, Command>;
    components: Collection<string, ComponentHandler>;
}