import { ChatInputCommandInteraction, SlashCommandBuilder, Client, Collection } from 'discord.js';

// Step 1: Define strict structures for all modular slash commands
export interface Command {
    data: SlashCommandBuilder | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>;
    execute(interaction: ChatInputCommandInteraction): Promise<void>;
}

// Step 2: Define rigid layouts for all gateway lifecycle events using type-safe unknown arrays
export interface Event {
    name: string;
    once?: boolean;
    execute(...args: unknown[]): Promise<void> | void;
}

// Step 3: Extend our local runtime Client abstraction layer using Discord's native Collection map structure
export interface ExtendedClient extends Client {
    commands: Collection<string, Command>;
}