import {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChatInputCommandInteraction,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    MessageFlags,
} from 'discord.js';
import { Command } from '../types/framework.js';
import { prisma } from '../database/client.js';

const announceScheduleCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('announce-schedule')
        .setDescription('Schedule a branded announcement to send later, optionally on a repeat.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const categories = await prisma.announcementConfig.findMany({ orderBy: { category: 'asc' } });

        if (categories.length === 0) {
            await interaction.reply({
                content: '❌ No categories registered yet. Run `/announce-config` first to create one.',
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const menuOptions = categories.slice(0, 25).map(config => ({
            label: config.category,
            value: config.category,
            description: `Brand color: ${config.hexColor}`,
        }));

        const categorySelect = new StringSelectMenuBuilder()
            .setCustomId('announce_schedule_category_select')
            .setPlaceholder('Select a category for the scheduled announcement...')
            .addOptions(menuOptions);

        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(categorySelect);

        await interaction.reply({
            content: 'Pick a category, then fill in the timing on the next screen:',
            components: [row],
            flags: MessageFlags.Ephemeral,
        });
    },
};

export default announceScheduleCommand;