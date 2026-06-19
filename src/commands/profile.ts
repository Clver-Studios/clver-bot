import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../types/framework.js';
import { prisma } from '../database/client.js';

const PLATFORM_LABELS: Record<string, string> = {
    java: 'Java Edition',
    bedrock: 'Bedrock Edition',
};

const SPECIALTY_LABELS: Record<string, string> = {
    dev: 'Development',
    modeler: 'Modeler',
    textureArtist: 'Texture Artist',
    keyArtist: 'Key Artist',
    builder: 'Builder / Level Designer',
};

function formatList(values: string[], labels: Record<string, string>): string {
    if (values.length === 0) return '—';
    return values.map((v) => labels[v] ?? v).join(', ');
}

const profileCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription("View another member's public profile.")
        .addUserOption((option) =>
            option.setName('user').setDescription('The member to look up').setRequired(true),
        ),

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const targetUser = interaction.options.getUser('user', true);
        const guild = interaction.guild;

        const state = await prisma.onboardingState.findUnique({
            where: { userId: targetUser.id },
        });

        if (!state || !state.completedAt) {
            await interaction.reply({
                content: `${targetUser.username} hasn't completed onboarding yet.`,
            });
            return;
        }

        // Only specialization + platform are shown publicly. Discovery
        // source and notification preferences are private and only
        // surfaced via /myprofile for the user themselves.
        const member = guild ? await guild.members.fetch(targetUser.id).catch(() => null) : null;

        const embed = new EmbedBuilder()
            .setTitle(`🪪 ${targetUser.username}'s Profile`)
            .setThumbnail(targetUser.displayAvatarURL())
            .setColor('#5865F2')
            .addFields(
                { name: 'Platform', value: formatList(state.clients, PLATFORM_LABELS), inline: true },
                { name: 'Specialization', value: formatList(state.specialties, SPECIALTY_LABELS), inline: true },
            );

        if (member?.joinedAt) {
            embed.addFields({
                name: 'Joined Server',
                value: `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>`,
                inline: true,
            });
        }

        embed.addFields({
            name: 'Account Created',
            value: `<t:${Math.floor(targetUser.createdAt.getTime() / 1000)}:R>`,
            inline: true,
        });

        await interaction.reply({ embeds: [embed] });
    },
};

export default profileCommand;