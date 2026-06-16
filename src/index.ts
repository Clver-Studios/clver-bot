import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { validateEnvironment } from './config/environment.js';
import { connectDatabase } from './database/client.js';
import { ExtendedClient } from './types/framework.js';
import { loadSlashCommands, loadGatewayEvents } from './utils/loader.js';

// Step 1: Perform immediate configuration system diagnostics checks
const environment = validateEnvironment();

// Step 2: Setup memory space targets with optimized client structures
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
}) as ExtendedClient;

// Step 3: Allocate clean Collection structure to store command maps seamlessly
client.commands = new Collection();

// Step 4: Group modular execution phases safely to optimize cluster connections
async function initializeClevrBotEngine(): Promise<void> {
    // Authenticate database persistence connections
    await connectDatabase();

    // Step 5: Perform dynamic internal scans across commands and routing structures
    console.log('Loader Engine: Starting structural workspace mapping process...');
    client.commands = await loadSlashCommands('commands');
    const dynamicEvents = await loadGatewayEvents('events');

    // Step 6: Bind event routines directly onto standard gateway listener targets safely
    for (const targetEvent of dynamicEvents) {
        if (targetEvent.once) {
            client.once(targetEvent.name, (...args: unknown[]) => targetEvent.execute(...args, client));
            continue;
        }
        client.on(targetEvent.name, (...args: unknown[]) => targetEvent.execute(...args, client));
    }

    console.log(`Loader Engine: ${client.commands.size} commands and ${dynamicEvents.length} platform events mapped.`);

    // Step 7: Authenticate connection channels safely into the Discord Gateway API
    await client.login(environment.discordToken);
}

// Global scope tracker exception catcher to preserve clean execution states
initializeClevrBotEngine().catch((criticalFailure) => {
    console.error('Critical Framework Panic: Primary boot pipeline context destroyed.', criticalFailure);
    process.exit(1);
});