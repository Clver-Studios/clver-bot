import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, ActionRowBuilder, StringSelectMenuBuilder, GuildTextBasedChannel } from 'discord.js';
import { Command } from '../types/framework.js';

const setupOnboardingCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('setup-onboarding')
        .setDescription('Deploys the verification welcoming anchor embed within the targeted onboarding channel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const selectMenuRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('onboard_step_1_select')
                .setPlaceholder('Select your primary platform media channel focus...')
                .setMinValues(1)
                .setMaxValues(1)
                .addOptions([
                    { label: 'YouTube Community Channel', value: 'youtube', description: 'Connect via active content creator ecosystems' },
                    { label: 'Twitter / X Media Streams', value: 'twitter', description: 'Connect via real-time social feed timelines' }
                ])
        );

        await interaction.reply({
            content: 'Onboarding deployment sequence initialized successfully.',
            ephemeral: true
        });

        // Step 1: Narrow the channel type down to a Guild Text Channel to safely access .send()
        const targetChannel = interaction.channel as GuildTextBasedChannel;

        // Step 2: Ensure the channel is valid and supports the send method
        if (targetChannel && typeof targetChannel.send === 'function') {
            // Drop the primary persistent message into the active verification channel layout
            await targetChannel.send({
                content: '## 👋 Welcome to Clver Studios!\nBefore gaining complete entry parameters to our server infrastructure, please answer these brief onboarding inquiries to build your community profile card metrics.',
                components: [selectMenuRow]
            });
        } else {
            console.error('Onboarding Deployment Failure: Target channel does not accept guild text messages.');
        }
    }
};

export default setupOnboardingCommand;