import { EmbedBuilder, ColorResolvable, GuildTextBasedChannel, ModalSubmitInteraction } from 'discord.js';
import { ComponentHandler } from '../types/framework.js';
import { prisma } from '../database/client.js';

export const announcementModalHandler: ComponentHandler = {
    // Tell the loader engine to direct match keys starting with this base token structure
    customId: 'announce_modal_',

    async execute(interaction): Promise<void> {
        // Step 1: Strict type guard guarding to narrow the union parameter down to a modal submission
        if (!interaction.isModalSubmit()) {
            return;
        }

        // Step 2: Defer early so the application client does not hang while database reads process
        await interaction.deferReply({ ephemeral: true });

        // Step 3: Parse out the target category string straight from the unique ID layout
        const targetCategory = interaction.customId.replace('announce_modal_', '');
        
        const embeddedTitle = interaction.fields.getTextInputValue('announce_title');
        const embeddedBody = interaction.fields.getTextInputValue('announce_body');

        // Step 4: Query the database to retrieve the customized category color token mapping
        const colorConfig = await prisma.announcementConfig.findUnique({
            where: { category: targetCategory }
        });

        // Step 5: Fall back to a default color if the category wasn't seeded first
        const resolvedHexColor = (colorConfig?.hexColor || '#5865F2') as ColorResolvable;

        // Step 6: Construct the polished announcement display card
        const announcementEmbed = new EmbedBuilder()
            .setTitle(embeddedTitle)
            .setDescription(embeddedBody)
            .setColor(resolvedHexColor)
            .setTimestamp()
            .setFooter({ 
                text: `Clevr Network Hub • ${targetCategory.toUpperCase()}`, 
                iconURL: interaction.guild?.iconURL() || undefined 
            });

        const targetChannel = interaction.channel as GuildTextBasedChannel;

        // Step 7: Verify channel context capabilities before dispatching the payload
        if (targetChannel && typeof targetChannel.send === 'function') {
            // Dispatch the completed embed to the channel
            await targetChannel.send({ embeds: [announcementEmbed] });

            await interaction.editReply({
                content: `🚀 Successfully broadcasted the Branded \`${targetCategory.toUpperCase()}\` update panel.`
            });
        } else {
            await interaction.editReply({
                content: '❌ Failed to broadcast: Channel is invalid or does not support text outputs.'
            });
        }
    }
};