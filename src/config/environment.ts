import dotenv from 'dotenv';

// Step 1: Initialize local environment key injection
dotenv.config();

export interface EnvironmentVariables {
    discordToken: string;
    clientId: string;
    guildId: string;
    databaseUrl: string;
}

// Step 2: Extract configurations, ensuring early escape checks 
export function validateEnvironment(): EnvironmentVariables {
    const { DISCORD_BOT_TOKEN, DISCORD_CLIENT_ID, DISCORD_GUILD_ID, DATABASE_URL } = process.env;

    // Step 3: Implement quick assertions to maintain high quality data safety
    if (!DISCORD_BOT_TOKEN) {
        throw new Error('Critical Configuration Error: DISCORD_BOT_TOKEN configuration is entirely missing.');
    }
    if (!DISCORD_CLIENT_ID) {
        throw new Error('Critical Configuration Error: DISCORD_CLIENT_ID configuration is entirely missing.');
    }
    if (!DISCORD_GUILD_ID) {
        throw new Error('Critical Configuration Error: DISCORD_GUILD_ID configuration is entirely missing.');
    }
    if (!DATABASE_URL) {
        throw new Error('Critical Configuration Error: DATABASE_URL configuration value is entirely missing.');
    }

    return {
        discordToken: DISCORD_BOT_TOKEN,
        clientId: DISCORD_CLIENT_ID,
        guildId: DISCORD_GUILD_ID,
        databaseUrl: DATABASE_URL,
    };
}