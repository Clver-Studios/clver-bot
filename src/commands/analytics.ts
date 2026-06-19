import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from 'discord.js';
import { Command } from '../types/framework.js';
import { prisma } from '../database/client.js';

const REFERRAL_LABELS: Record<string, string> = {
    youtube: 'YouTube',
    twitter: 'Twitter / X',
    tiktok: 'TikTok',
    instagram: 'Instagram',
    friend: 'Friend / Word of Mouth',
};

function buildBar(percentage: number, length = 12): string {
    const filled = Math.round((percentage / 100) * length);
    return '█'.repeat(filled) + '░'.repeat(length - filled);
}

function formatRow(label: string, count: number, total: number): string {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return `\`${label.padEnd(22)}\` ${buildBar(pct)} **${pct}%** (${count})`;
}

const analyticsCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('analytics')
        .setDescription('Shows onboarding analytics: referral sources and platform editions.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const totalMembers = await prisma.onboardingState.count();

        if (totalMembers === 0) {
            await interaction.editReply({ content: 'No onboarding data recorded yet.' });
            return;
        }

        // --- Referral source breakdown: single-select field, groupBy is safe ---
        const referralGroups = await prisma.onboardingState.groupBy({
            by: ['platform'],
            _count: { platform: true },
        });

        const referralLines = referralGroups
            .filter(group => group.platform !== null)
            .sort((a, b) => b._count.platform - a._count.platform)
            .map(group => formatRow(
                REFERRAL_LABELS[group.platform as string] ?? group.platform!,
                group._count.platform,
                totalMembers,
            ));

        // --- Platform edition breakdown: array field, tally manually ---
        const allClients = await prisma.onboardingState.findMany({ select: { clients: true } });

        const editionCounts: Record<string, number> = { java: 0, bedrock: 0 };
        for (const row of allClients) {
            for (const value of row.clients) {
                if (value in editionCounts) editionCounts[value]++;
            }
        }

        const editionLines = [
            formatRow('Java', editionCounts.java, totalMembers),
            formatRow('Bedrock', editionCounts.bedrock, totalMembers),
        ];

        const embed = new EmbedBuilder()
            .setTitle('📊 Clver Studios — Onboarding Analytics')
            .addFields(
                { name: '📣 Discovery Source', value: referralLines.join('\n') || 'No data', inline: false },
                { name: '🎮 Platform Edition', value: editionLines.join('\n') || 'No data', inline: false },
            )
            .setFooter({ text: `Based on ${totalMembers} completed profile(s) • Edition % can overlap (users may pick both)` })
            .setColor('#5865F2')
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    },
};

export default analyticsCommand;