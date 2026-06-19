import {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChatInputCommandInteraction,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    GuildTextBasedChannel,
    ChannelType,
} from 'discord.js';
import { Command } from '../types/framework.js';
import { validateEnvironment } from '../config/environment.js';

const environment = validateEnvironment();

const setupOnboardingCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('setup-onboarding')
        .setDescription('Locks down the server to the onboarding channel and deploys the persistent start anchor.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply({ ephemeral: true });

        const guild = interaction.guild;
        if (!guild) {
            await interaction.editReply('This command can only be run inside a server.');
            return;
        }

        const onboardingChannel = await guild.channels.fetch(environment.onboardingChannelId).catch(() => null);
        if (!onboardingChannel || !onboardingChannel.isTextBased()) {
            await interaction.editReply(
                `Could not find a valid text channel for ONBOARDING_CHANNEL_ID (${environment.onboardingChannelId}). Check the env var.`
            );
            return;
        }

        // -------------------------------------------------------------
        // Lock down every other channel for the @unverified role.
        // The onboarding channel itself gets an explicit allow-view
        // overwrite so unverified members can always reach it.
        // -------------------------------------------------------------
        let lockedCount = 0;
        let failedCount = 0;

        const allChannels = await guild.channels.fetch();
        for (const [, channel] of allChannels) {
            if (!channel) continue;

            // Categories and channels both get overwrites; channels usually
            // sync from their category, but we set explicit overwrites on
            // both so behavior is deterministic regardless of sync settings.
            const isOnboardingChannel = channel.id === onboardingChannel.id;

            try {
                if (isOnboardingChannel) {
                    await channel.permissionOverwrites.edit(environment.unverifiedRoleId, {
                        ViewChannel: true,
                        SendMessages: channel.type === ChannelType.GuildText,
                    });
                } else {
                    await channel.permissionOverwrites.edit(environment.unverifiedRoleId, {
                        ViewChannel: false,
                    });
                }
                lockedCount++;
            } catch (error) {
                failedCount++;
                console.error(`Lockdown Failure: Could not set overwrite on channel ${channel.id} (${channel.name}).`, error);
            }
        }

        // -------------------------------------------------------------
        // Post the persistent anchor. This message is NOT per-user state —
        // every new member clicks the same button, and a fresh ephemeral
        // stepper spins up for each of them independently.
        // -------------------------------------------------------------
        const anchorEmbed = new EmbedBuilder()
            .setTitle('👋 Welcome to Clver Studios!')
            .setDescription(
                'Before you get full access to the server, click below to complete a short setup. ' +
                'It only takes a minute and helps us route you to the right channels and roles.'
            )
            .setColor('#5865F2')
            .setFooter({ text: 'Clver Studios Community Verification Gateway' });

        const startRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId('onboard::start')
                .setLabel('Start Setup')
                .setStyle(ButtonStyle.Success)
                .setEmoji('🚀')
        );

        const targetChannel = onboardingChannel as GuildTextBasedChannel;
        await targetChannel.send({
            embeds: [anchorEmbed],
            components: [startRow],
        });

        await interaction.editReply(
            `Onboarding gateway deployed. Locked ${lockedCount} channel(s) for <@&${environment.unverifiedRoleId}>` +
            (failedCount > 0 ? ` (${failedCount} failed — check bot role position/permissions and console logs).` : '.')
        );
    }
};

export default setupOnboardingCommand;