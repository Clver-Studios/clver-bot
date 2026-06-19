import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from 'discord.js';
import { Command } from '../types/framework.js';

const serverStatusCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('serverstatus')
        .setDescription('Shows the current Discord server member count.'),

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const guild = interaction.guild;
        if (!guild) {
            await interaction.reply({ content: '❌ This command only works inside a server.', flags: MessageFlags.Ephemeral });
            return;
        }

        // guild.memberCount is cached from the gateway — no extra fetch needed
        const embed = new EmbedBuilder()
            .setTitle(`${guild.name} — Server Status`)
            .addFields({ name: 'Total Members', value: `${guild.memberCount}`, inline: true })
            .setColor('#75ff83')
            .setTimestamp();

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    },
};

export default serverStatusCommand;