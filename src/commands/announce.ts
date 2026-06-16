import { 
    SlashCommandBuilder, 
    PermissionFlagsBits, 
    ChatInputCommandInteraction, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ActionRowBuilder 
} from 'discord.js';
import { Command } from '../types/framework.js';

const announceCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('announce')
        .setDescription('Launches the interactive layout modal to draft a branded server update.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('category')
                .setDescription('The category key registered via /announce-config (e.g., updates)')
                .setRequired(true)
        ),

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const categoryKey = interaction.options.getString('category', true).toLowerCase().trim();

        // Step 1: Build out the master modal container block
        const modal = new ModalBuilder()
            .setCustomId(`announce_modal_${categoryKey}`)
            .setTitle(`Draft Announcement — [${categoryKey.toUpperCase()}]`);

        // Step 2: Build out the title input component
        const titleInput = new TextInputBuilder()
            .setCustomId('announce_title')
            .setLabel('EMBED HEADER TITLE')
            .setPlaceholder('Enter a bold headline for this announcement...')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(100);

        // Step 3: Build out the primary text message editor box supporting standard markdown
        const bodyInput = new TextInputBuilder()
            .setCustomId('announce_body')
            .setLabel('MESSAGE BODY (SUPPORTS MARKDOWN)')
            .setPlaceholder('## 📢 Update Details\n- Added new profile cards\n- Resolved database connection leaks...')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(3000);

        // Step 4: Map inputs onto dedicated Action Rows
        const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput);
        const secondActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(bodyInput);

        modal.addComponents(firstActionRow, secondActionRow);

        // Step 5: Render and display the popup view directly onto the admin client user interface
        await interaction.showModal(modal);
    }
};

export default announceCommand;