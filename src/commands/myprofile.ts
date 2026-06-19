import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from 'discord.js';
import { Command } from '../types/framework.js';
import { prisma } from '../database/client.js';

const DISCOVERY_LABELS: Record<string, string> = {
    youtube: 'YouTube',
    twitter: 'Twitter / X',
    tiktok: 'TikTok',
    instagram: 'Instagram',
    friend: 'Friend / Word of Mouth',
    discord: 'Discord Server',
};

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

const NOTIFICATION_LABELS: Record<string, string> = {
    updates: 'Network Updates',
    announcements: 'General Announcements',
    skip: 'None',
};

function formatList(values: string[], labels: Record<string, string>): string {
    if (values.length === 0) return '—';
    return values.map((v) => labels[v] ?? v).join(', ');
}

const myProfileCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('myprofile')
        .setDescription('Shows your own onboarding profile. Only visible to you.'),

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const state = await prisma.onboardingState.findUnique({
            where: { userId: interaction.user.id },
        });

        if (!state || !state.completedAt) {
            await interaction.reply({
                content: "You haven't completed onboarding yet, so there's no profile to show.",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle('🪪 Your Profile')
            .setThumbnail(interaction.user.displayAvatarURL())
            .setColor('#75ff83')
            .addFields(
                {
                    name: 'Discovery Source',
                    value: state.discoverySource ? DISCOVERY_LABELS[state.discoverySource] ?? state.discoverySource : '—',
                    inline: true,
                },
                { name: 'Platform', value: formatList(state.clients, PLATFORM_LABELS), inline: true },
                { name: 'Specialization', value: formatList(state.specialties, SPECIALTY_LABELS) },
                { name: 'Notifications', value: formatList(state.notifications, NOTIFICATION_LABELS) },
            )
            .setFooter({ text: `Completed onboarding ${state.completedAt.toLocaleDateString()}` });

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    },
};

export default myProfileCommand;