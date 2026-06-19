import { 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    EmbedBuilder, 
    ButtonInteraction, 
    AnySelectMenuInteraction 
} from 'discord.js';
import { ComponentHandler } from '../types/framework.js';
import { prisma } from '../database/client.js';

// Helper function to build uniform panel embeds with clean progress step feedback metrics
function buildOnboardingEmbed(step: number, title: string, description: string) {
    const totalSteps = 4;
    const filledBar = '🟩'.repeat(step) + '⬛'.repeat(totalSteps - step);
    
    return new EmbedBuilder()
        .setTitle(`✨ Profile Setup — ${title}`)
        .setDescription(`${description}\n\n**Progress:** [${filledBar}] (Step ${step}/${totalSteps})`)
        .setColor('#5865F2')
        .setFooter({ text: 'Clver Studios Community Verification Gateway' });
}

export const onboardingHandler: ComponentHandler = {
    customId: 'onboard_step',
    
    async execute(interaction: ButtonInteraction | AnySelectMenuInteraction): Promise<void> {
        const userId = interaction.user.id;
        const customId = interaction.customId;

        // Fetch or create the persistent onboarding tracking row state from PostgreSQL
        let state = await prisma.onboardingState.findUnique({ where: { userId } });
        if (!state) {
            state = await prisma.onboardingState.create({ data: { userId, currentStep: 1 } });
        }

        // Defer interaction feedback so Discord channels don't timeout during database writes
        await interaction.deferUpdate();

        // -------------------------------------------------------------
        // STEP 1: Process Platform Selection Interaction Response
        // -------------------------------------------------------------
        if (customId === 'onboard_step_1_select' && interaction.isStringSelectMenu()) {
            const platformValue = interaction.values[0];
            
            state = await prisma.onboardingState.update({
                where: { userId },
                data: { platform: platformValue, currentStep: 2 }
            });

            const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('onboard_step_2_select')
                    .setPlaceholder('Choose your platform edition(s)...')
                    .setMinValues(1)
                    .setMaxValues(2)
                    .addOptions([
                        { label: 'Java Edition', value: 'java', description: 'PC/Mac Mainline Client players' },
                        { label: 'Bedrock Edition', value: 'bedrock', description: 'Console, Mobile & Win10 Client players' }
                    ])
            );

            await interaction.editReply({
                embeds: [buildOnboardingEmbed(2, 'Platform Framework Edition', 'Which client editions do you use to connect onto the Minecraft Network? Select all that apply.')],
                components: [row]
            });
            return;
        }

        // -------------------------------------------------------------
        // STEP 2: Process Platform Edition Selection Interaction Response
        // -------------------------------------------------------------
        if (customId === 'onboard_step_2_select' && interaction.isStringSelectMenu()) {
            state = await prisma.onboardingState.update({
                where: { userId },
                data: { clients: interaction.values, currentStep: 3 }
            });

            const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('onboard_step_3_select')
                    .setPlaceholder('Select your community specialization profiles...')
                    .setMinValues(1)
                    .setMaxValues(3)
                    .addOptions([
                        { label: 'Development', value: 'dev', description: 'Plugin coders, systems developers, and backend engineers' },
                        { label: 'Modeler', value: 'modeler', description: '3D Asset Creation, Blockbench artists, item textures' },
                        { label: 'Key Artist', value: 'artist', description: 'UI layouts, vector logos, media illustrations' },
                        { label: 'Community Manager', value: 'staff', description: 'Moderators, server operations, support staff' }
                    ])
            );

            await interaction.editReply({
                embeds: [buildOnboardingEmbed(3, 'Community Specialization Roles', 'What are your core skill sets and focus targets inside our ecosystem? Choose up to 3 options.')],
                components: [row]
            });
            return;
        }

        // -------------------------------------------------------------
        // STEP 3: Process Specialization Selection Interaction Response
        // -------------------------------------------------------------
        if (customId === 'onboard_step_3_select' && interaction.isStringSelectMenu()) {
            state = await prisma.onboardingState.update({
                where: { userId },
                data: { specialties: interaction.values, currentStep: 4 }
            });

            const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('onboard_step_4_select')
                    .setPlaceholder('Choose notification frequencies...')
                    .setMinValues(1)
                    .setMaxValues(3)
                    .addOptions([
                        { label: 'Network Updates', value: 'updates', description: 'Receive development logs and change summaries' },
                        { label: 'General Announcements', value: 'announcements', description: 'Alerts regarding server events and outages' },
                        { label: 'Promotional Offers', value: 'promo', description: 'Receive notices regarding store alerts and marketplace updates' }
                    ])
            );

            await interaction.editReply({
                embeds: [buildOnboardingEmbed(4, 'Notification Preferences', 'Configure your alert thresholds. Select what metrics you wish to get pinged on.')],
                components: [row]
            });
            return;
        }

        // -------------------------------------------------------------
        // STEP 4: Process Notification Selection & Finalize Roles
        // -------------------------------------------------------------
        if (customId === 'onboard_step_4_select' && interaction.isStringSelectMenu()) {
            await prisma.onboardingState.update({
                where: { userId },
                data: { notifications: interaction.values, currentStep: 4 }
            });

            const member = await interaction.guild?.members.fetch(userId);
            if (member) {
                // EXPLICIT REQUIREMENT: Do not grant roles incrementally, evaluate entirely upon full setup resolution
                const rolesToAssign = ['ROLE_ID_VERIFIED_MEMBER', 'ROLE_ID_COMMUNITY_ACCESS']; 
                const temporaryOnboardingRoleId = 'ROLE_ID_TEMPORARY_ONBOARDING';

                // Safely update server member role mappings
                await member.roles.add(rolesToAssign).catch(console.error);
                await member.roles.remove(temporaryOnboardingRoleId).catch(console.error);
            }

            const successEmbed = new EmbedBuilder()
                .setTitle('🎉 Configuration Complete!')
                .setDescription('Your structural setup values have been synchronized safely. The temporary access role has been pruned, and your profile metadata is configured.')
                .setColor('#2ECC71')
                .setThumbnail(interaction.user.displayAvatarURL());

            await interaction.editReply({
                embeds: [successEmbed],
                components: [] // Erase buttons to freeze interaction loops on finished objects
            });
        }
    }
};