import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Collection } from 'discord.js';
import { Command, Event, ComponentHandler } from '../types/framework.js';

// Derive proper ESM directory definitions since __dirname is not available globally in pure Node16 ESM environments
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseModulesPath = path.resolve(__dirname, '..');

function scanDirectoryForFiles(targetDirectory: string): string[] {
    const collectedFiles: string[] = [];
    if (!fs.existsSync(targetDirectory)) return collectedFiles;

    const items = fs.readdirSync(targetDirectory, { withFileTypes: true });
    for (const item of items) {
        const fullPath = path.join(targetDirectory, item.name);
        if (item.isDirectory()) {
            collectedFiles.push(...scanDirectoryForFiles(fullPath));
            continue;
        }
        // Safely capture both source development modules and built distribution target artifacts
        if (item.name.endsWith('.js') || (item.name.endsWith('.ts') && !item.name.endsWith('.d.ts'))) {
            collectedFiles.push(fullPath);
        }
    }
    return collectedFiles;
}

export async function loadSlashCommands(baseCommandsPath: string): Promise<Collection<string, Command>> {
    const regularizedPath = path.join(baseModulesPath, baseCommandsPath);
    const discoveredFiles = scanDirectoryForFiles(regularizedPath);
    const loadedCommands = new Collection<string, Command>();

    for (const filePath of discoveredFiles) {
        const fileUrl = pathToFileURL(filePath).href;
        const moduleImport = await import(fileUrl);
        const commandModule = (moduleImport.default || moduleImport) as Partial<Command>;
        
        // Use type-safe property evaluations to prevent strict compiler complaints
        if (commandModule && typeof commandModule.execute === 'function' && commandModule.data) {
            loadedCommands.set(commandModule.data.name, commandModule as Command);
        }
    }
    return loadedCommands;
}

export async function loadGatewayEvents(baseEventsPath: string): Promise<Event[]> {
    const regularizedPath = path.join(baseModulesPath, baseEventsPath);
    const discoveredFiles = scanDirectoryForFiles(regularizedPath);
    const loadedEvents: Event[] = [];

    for (const filePath of discoveredFiles) {
        const fileUrl = pathToFileURL(filePath).href;
        const moduleImport = await import(fileUrl);
        const eventModule = (moduleImport.default || moduleImport) as Partial<Event>;
        
        if (eventModule && typeof eventModule.execute === 'function' && typeof eventModule.name === 'string') {
            loadedEvents.push(eventModule as Event);
        }
    }
    return loadedEvents;
}

// Scans your interactions directory and maps your interactive buttons and select menus safely
export async function loadComponentInteractions(baseInteractionsPath: string): Promise<Collection<string, ComponentHandler>> {
    const regularizedPath = path.join(baseModulesPath, baseInteractionsPath);
    const discoveredFiles = scanDirectoryForFiles(regularizedPath);
    const loadedComponents = new Collection<string, ComponentHandler>();

    for (const filePath of discoveredFiles) {
        const fileUrl = pathToFileURL(filePath).href;
        const moduleImport = await import(fileUrl);
        
        // Extract plain exported structures safely from our runtime evaluation targets
        const exportedValues = Object.values(moduleImport);
        
        for (const rawValue of exportedValues) {
            const handler = rawValue as Partial<ComponentHandler>;
            if (handler && typeof handler.customId === 'string' && typeof handler.execute === 'function') {
                loadedComponents.set(handler.customId, handler as ComponentHandler);
            }
        }
    }
    return loadedComponents;
}