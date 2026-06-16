import { Interaction, Events } from 'discord.js';
import { Event, ExtendedClient } from '../types/framework.js';

const interactionCreateEvent: Event = {
    name: Events.InteractionCreate,
    once: false,
    
    async execute(rawInteraction: unknown, clientInstance: unknown): Promise<void> {
        const interaction = rawInteraction as Interaction;
        const client = clientInstance as ExtendedClient;

        // 1. Handle Slash Commands
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(`Command execution failed: /${interaction.commandName}`, error);
                const payload = { content: 'There was an error executing this command.', ephemeral: true };
                interaction.replied || interaction.deferred ? await interaction.followUp(payload) : await interaction.reply(payload);
            }
            return;
        }

        // 2. Handle Custom Buttons and Select Menus (Onboarding System)
        if (interaction.isButton() || interaction.isAnySelectMenu()) {
            // Check for exact match or dynamic step keys (e.g., "onboard_step_1")
            const handler = client.components.get(interaction.customId) || 
                            Array.from(client.components.values()).find(h => interaction.customId.startsWith(h.customId));
            
            if (!handler) return;

            try {
                await handler.execute(interaction);
            } catch (error) {
                console.error(`Component interaction failed for ID: ${interaction.customId}`, error);
                const payload = { content: 'Failed to process your menu interaction state.', ephemeral: true };
                interaction.replied || interaction.deferred ? await interaction.followUp(payload) : await interaction.reply(payload);
            }
        }

        // 3. Handle Modal Interactive Form Submissions
        if (interaction.isModalSubmit()) {
            const handler = client.components.get(interaction.customId) || 
                            Array.from(client.components.values()).find(h => interaction.customId.startsWith(h.customId));
            
            if (!handler) return;

            try {
                await handler.execute(interaction);
            } catch (error) {
                console.error(`Modal processing failure for ID: ${interaction.customId}`, error);
                const payload = { content: 'Failed to process your modal form layout metrics.', ephemeral: true };
                interaction.replied || interaction.deferred ? await interaction.followUp(payload) : await interaction.reply(payload);
            }
            return;
        }
    }
};

export default interactionCreateEvent;