import { Client, GatewayIntentBits, Collection, REST, Routes, ActivityType } from 'discord.js';
import { validateEnvironment } from './config/environment.js';
import { connectDatabase } from './database/client.js';
import { ExtendedClient } from './types/framework.js';
import { loadSlashCommands, loadGatewayEvents, loadComponentInteractions } from './utils/loader.js';

// Step 1: Secure our clean, validated environment configuration keys
const environment = validateEnvironment();

// Step 2: Initialize the Discord Client instance with explicit intent gateways
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
}) as ExtendedClient;

// Step 3: Instantiate runtime collection stores for modular interaction mapping
client.commands = new Collection();
client.components = new Collection();

// Step 4: Define the core application bootstrap orchestration loop
async function initializeClevrBotEngine(): Promise<void> {
    // A. Verify and lock in backend database connectivity boundaries
    await connectDatabase();

    console.log('Loader Engine: Starting structural workspace mapping process...');
    
    // B. Scan, load, and cache runtime modular architecture blocks
    client.commands = await loadSlashCommands('commands');
    client.components = await loadComponentInteractions('interactions');
    const dynamicEvents = await loadGatewayEvents('events');

    // C. Bind gateway event hooks to their respective listeners inside the client core
    for (const targetEvent of dynamicEvents) {
        if (targetEvent.once) {
            client.once(targetEvent.name, (...args: unknown[]) => targetEvent.execute(...args, client));
            continue;
        }
        client.on(targetEvent.name, (...args: unknown[]) => targetEvent.execute(...args, client));
    }

    console.log(`Loader Engine: ${client.commands.size} commands, ${client.components.size} modules, and ${dynamicEvents.length} events loaded.`);
    
    // REGISTRATION HOOK: Catch the ready state to synchronize guild-scoped slash commands
    client.once('ready', async (readyClient) => {
        console.log(`Gateway Sync: Connection established safely. Logged in as ${readyClient.user.tag}`);

        readyClient.user.setPresence({
            activities: [{ name: 'Clevr Studios Onboarding', type: ActivityType.Watching }],
            status: 'online',
        });

        if (!client.commands || client.commands.size === 0) {
            console.warn('API Registry Warning: No commands found in local memory collection. Skipping REST deployment.');
            return;
        }

        try {
            const cleanCommandsPayload = client.commands.map(command => command.data.toJSON());
            const restEngine = new REST({ version: '10' }).setToken(environment.discordToken);

            // FIXED: Pulling cleanly from environment mapping configuration parameters
            console.log(`API Registry: Initializing instant push of ${cleanCommandsPayload.length} slash commands to Guild: ${environment.guildId}...`);

            await restEngine.put(
                Routes.applicationGuildCommands(readyClient.user.id, environment.guildId),
                { body: cleanCommandsPayload }
            );

            console.log('API Registry: Guild slash commands synchronized successfully with Discord endpoints!');
        } catch (error) {
            console.error('API Registry Failure: Could not synchronize slash commands over REST pipeline.', error);
        }
    });

    // D. Authenticate and connect the bot framework session with Discord
    await client.login(environment.discordToken);
}

// Step 5: Execute initialization sequence and intercept unhandled bootstrap panics
initializeClevrBotEngine().catch((criticalFailure) => {
    console.error('Critical Framework Panic: Primary boot pipeline context destroyed.', criticalFailure);
    process.exit(1);
});