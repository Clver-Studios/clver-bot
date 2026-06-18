import {
  EmbedBuilder,
  ColorResolvable,
  GuildTextBasedChannel,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  MessageFlags,
} from "discord.js";
import { ComponentHandler } from "../types/framework.js";
import { prisma } from "../database/client.js";

// Shared so both this select-menu flow and any future direct-modal path
// (e.g. a power-user shortcut later) build an identical modal.
function buildAnnouncementModal(categoryKey: string): ModalBuilder {
  const modal = new ModalBuilder()
    .setCustomId(`announce_modal_${categoryKey}`)
    .setTitle(`Draft Announcement — [${categoryKey.toUpperCase()}]`);

  const titleInput = new TextInputBuilder()
    .setCustomId("announce_title")
    .setLabel("EMBED HEADER TITLE")
    .setPlaceholder("Enter a bold headline for this announcement...")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(100);

  const bodyInput = new TextInputBuilder()
    .setCustomId("announce_body")
    .setLabel("MESSAGE BODY (SUPPORTS MARKDOWN)")
    .setPlaceholder(
      "## 📢 Update Details\n- Added new profile cards\n- Resolved database connection leaks...",
    )
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMaxLength(3000);

  const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
    titleInput,
  );
  const secondActionRow =
    new ActionRowBuilder<TextInputBuilder>().addComponents(bodyInput);

  modal.addComponents(firstActionRow, secondActionRow);
  return modal;
}

// Step 1 of the flow: category picked from the select menu → open the modal
export const announcementCategorySelectHandler: ComponentHandler = {
  customId: "announce_category_select",

  async execute(interaction): Promise<void> {
    if (!interaction.isStringSelectMenu()) {
      return;
    }

    const categoryKey = interaction.values[0];
    const modal = buildAnnouncementModal(categoryKey);

    // Must be the initial response — no defer/reply before this
    await interaction.showModal(modal);
  },
};

// Step 2 of the flow: modal submitted → build and dispatch the embed
export const announcementModalHandler: ComponentHandler = {
  customId: "announce_modal_",

  async execute(interaction): Promise<void> {
    if (!interaction.isModalSubmit()) {
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const targetCategory = interaction.customId.replace("announce_modal_", "");

    const embeddedTitle =
      interaction.fields.getTextInputValue("announce_title");
    const embeddedBody = interaction.fields.getTextInputValue("announce_body");

    const colorConfig = await prisma.announcementConfig.findUnique({
      where: { category: targetCategory },
    });

    const resolvedHexColor = (colorConfig?.hexColor ||
      "#5865F2") as ColorResolvable;

    const announcementEmbed = new EmbedBuilder()
      .setTitle(embeddedTitle)
      .setDescription(embeddedBody)
      .setColor(resolvedHexColor)
      .setTimestamp()
      .setFooter({
        text: `Clevr Network Hub • ${targetCategory.toUpperCase()}`,
        iconURL: interaction.guild?.iconURL() || undefined,
      });

    const targetChannel = interaction.channel as GuildTextBasedChannel;

    if (targetChannel && typeof targetChannel.send === "function") {
      await targetChannel.send({ embeds: [announcementEmbed] });

      await interaction.editReply({
        content: `🚀 Successfully broadcasted the Branded \`${targetCategory.toUpperCase()}\` update panel.`,
      });
    } else {
      await interaction.editReply({
        content:
          "❌ Failed to broadcast: Channel is invalid or does not support text outputs.",
      });
    }
  },
};
