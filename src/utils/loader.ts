import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Collection } from 'discord.js';
import { Command, Event } from '../types/framework.js';

// Step 1: Rely on native runtime identifiers since the output compiles down to a Node16 execution path
const baseModulesPath = path.resolve(__dirname, '..');

// Step 2: Recursively scan directories for nested command structures smoothly without nested ifs
function scanDirectoryForFiles(targetDirectory: string): string[] {
    const collectedFiles: string[] = [];
    
    if (!fs.existsSync(targetDirectory)) {
        return collectedFiles;
    }

    const items = fs.readdirSync(targetDirectory, { withFileTypes: true });

    for (const item of items) {
        const fullPath = path.join(targetDirectory, item.name);
        
        if (item.isDirectory()) {
            collectedFiles.push(...scanDirectoryForFiles(fullPath));
            continue;
        }

        const isValidFile = item.name.endsWith('.js') || (item.name.endsWith('.ts') && !item.name.endsWith('.d.ts'));
        if (isValidFile) {
            collectedFiles.push(fullPath);
        }
    }

    return collectedFiles;
}

// Step 3: Construct the explicit load strategy handler for Slash Commands using Collections
export async function loadSlashCommands(baseCommandsPath: string): Promise<Collection<string, Command>> {
    const regularizedPath = path.join(baseModulesPath, baseCommandsPath);
    const discoveredFiles = scanDirectoryForFiles(regularizedPath);
    const loadedCommands = new Collection<string, Command>();

    for (const filePath of discoveredFiles) {
        const fileUrl = pathToFileURL(filePath).href;
        const moduleImport = await import(fileUrl);
        const commandModule: Command = moduleImport.default || moduleImport;

        if (!commandModule.data || !commandModule.execute) {
            console.warn(`Loader Engine Alert: File skipping triggered due to missing parameters at ${filePath}`);
            continue;
        }

        loadedCommands.set(commandModule.data.name, commandModule);
    }

    return loadedCommands;
}

// Step 4: Construct the explicit load strategy handler for Gateway Events
export async function loadGatewayEvents(baseEventsPath: string): Promise<Event[]> {
    const regularizedPath = path.join(baseModulesPath, baseEventsPath);
    const discoveredFiles = scanDirectoryForFiles(regularizedPath);
    const loadedEvents: Event[] = [];

    for (const filePath of discoveredFiles) {
        const fileUrl = pathToFileURL(filePath).href;
        const moduleImport = await import(fileUrl);
        const eventModule: Event = moduleImport.default || moduleImport;

        if (!eventModule.name || !eventModule.execute) {
            continue;
        }

        loadedEvents.push(eventModule);
    }

    return loadedEvents;
}