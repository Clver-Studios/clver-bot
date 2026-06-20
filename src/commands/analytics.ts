import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from 'discord.js';
import { Command } from '../types/framework.js';
import { prisma } from '../database/client.js';

const REFERRAL_LABELS: Record<string, string> = {
    youtube: 'YouTube',
    twitter: 'Twitter / X',
    tiktok: 'TikTok',
    instagram: 'Instagram',
    friend: 'Friend / Word of Mouth',
    discord: 'Discord Server',
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
};

function buildBar(percentage: number, length = 12): string {
    const filled = Math.round((percentage / 100) * length);
    return '█'.repeat(filled) + '░'.repeat(length - filled);
}

function formatRow(label: string, count: number, total: number): string {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return `\`${label.padEnd(22)}\` ${buildBar(pct)} **${pct}%** (${count})`;
}

// Tally helper for array fields (clients, specialties, notifications)
// where Prisma's groupBy can't be used directly since a user can have
// multiple values in the same row.
function tallyArrayField(
    rows: { [key: string]: string[] }[],
    field: string,
    knownValues: string[],
): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const value of knownValues) counts[value] = 0;

    for (const row of rows) {
        for (const value of row[field]) {
            counts[value] = (counts[value] ?? 0) + 1;
        }
    }
    return counts;
}

const analyticsCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('analytics')
        .setDescription('Shows onboarding analytics: referral sources, platforms, specialties, and notification opt-ins.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const totalMembers = await prisma.onboardingState.count();

        if (totalMembers === 0) {
            await interaction.editReply({ content: 'No onboarding data recorded yet.' });
            return;
        }

        // --- Referral source breakdown: single-select field, groupBy is safe ---
        // FIX: this was previously grouping by "platform" (a dead legacy
        // column that nothing writes to) instead of "discoverySource",
        // which is where discovery-source answers actually live. That
        // bug is why this section always reported empty.
        const referralGroups = await prisma.onboardingState.groupBy({
            by: ['discoverySource'],
            _count: { discoverySource: true },
        });

        const referralLines = referralGroups
            .filter(group => group.discoverySource !== null)
            .sort((a, b) => b._count.discoverySource - a._count.discoverySource)
            .map(group => formatRow(
                REFERRAL_LABELS[group.discoverySource as string] ?? group.discoverySource!,
                group._count.discoverySource,
                totalMembers,
            ));

        // --- Platform edition, specialty, and notification breakdowns: ---
        // all array fields, so groupBy can't be used (a user can have
        // multiple values per row) — tally manually in a single query.
        const allRows = await prisma.onboardingState.findMany({
            select: { clients: true, specialties: true, notifications: true },
        });

        const editionCounts = tallyArrayField(allRows, 'clients', ['java', 'bedrock']);
        const specialtyCounts = tallyArrayField(
            allRows,
            'specialties',
            Object.keys(SPECIALTY_LABELS),
        );
        const notificationCounts = tallyArrayField(
            allRows,
            'notifications',
            Object.keys(NOTIFICATION_LABELS),
        );

        const editionLines = [
            formatRow('Java', editionCounts.java, totalMembers),
            formatRow('Bedrock', editionCounts.bedrock, totalMembers),
        ];

        const specialtyLines = Object.entries(specialtyCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([key, count]) => formatRow(SPECIALTY_LABELS[key] ?? key, count, totalMembers));

        const notificationLines = Object.entries(notificationCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([key, count]) => formatRow(NOTIFICATION_LABELS[key] ?? key, count, totalMembers));

        const embed = new EmbedBuilder()
            .setTitle('📊 Clver Studios — Onboarding Analytics')
            .addFields(
                { name: '📣 Discovery Source', value: referralLines.join('\n') || 'No data', inline: false },
                { name: '🎮 Platform Edition', value: editionLines.join('\n') || 'No data', inline: false },
                { name: '🛠️ Specialization', value: specialtyLines.join('\n') || 'No data', inline: false },
                { name: '🔔 Notification Opt-ins', value: notificationLines.join('\n') || 'No data', inline: false },
            )
            .setFooter({ text: `Based on ${totalMembers} completed profile(s) • Edition/specialty/notification % can overlap (multi-select)` })
            .setColor('#75ff83')
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    },
};

export default analyticsCommand;