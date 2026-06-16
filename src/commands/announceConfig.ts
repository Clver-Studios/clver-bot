import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../types/framework.js';
import { prisma } from '../database/client.js';

const announceConfigCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('announce-config')
        .setDescription('Registers custom brand hex colors to specific announcement categories.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('category')
                .setDescription('The name of the category (e.g., Updates, Network, Events)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('color')
                .setDescription('The branding hex color code (e.g., #5865F2, #2ECC71)')
                .setRequired(true)
        ),

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const rawCategory = interaction.options.getString('category', true).toLowerCase().trim();
        let rawColor = interaction.options.getString('color', true).trim();

        // Step 1: Ensure the hex string contains a standard hashtag literal anchor
        if (!rawColor.startsWith('#')) {
            rawColor = `#${rawColor}`;
        }

        // Step 2: Validate the format of the hex code using a standard regex pattern
        const hexRegex = /^#[0-9A-Fa-f]{6}$/;
        if (!hexRegex.test(rawColor)) {
            await interaction.reply({
                content: '❌ **Invalid Color:** Please specify a valid 6-character hex value (e.g., `#FF0000`).',
                ephemeral: true
            });
            return;
        }

        // Step 3: Insert or update the configuration row block inside PostgreSQL
        await prisma.announcementConfig.upsert({
            where: { category: rawCategory },
            update: { hexColor: rawColor },
            create: { category: rawCategory, hexColor: rawColor }
        });

        await interaction.reply({
            content: `✅ Successfully registered category \`${rawCategory}\` using brand hex color indicator **${rawColor}**.`,
            ephemeral: true
        });
    }
};

export default announceConfigCommand;