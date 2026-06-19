import {
  EmbedBuilder,
  ColorResolvable,
  GuildTextBasedChannel,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  RoleSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} from "discord.js";
import { ComponentHandler } from "../types/framework.js";
import { prisma } from "../database/client.js";

function isValidImageUrl(url: string): boolean {
  return /^https?:\/\/\S+$/i.test(url.trim());
}

function buildAnnouncementModal(
  categoryKey: string,
  roleIds: string[],
): ModalBuilder {
  // Role IDs ride along in the customId so the modal submission handler
  // knows who to tag without needing separate in-memory state.
  const roleIdsCsv = roleIds.join(",");

  const modal = new ModalBuilder()
    .setCustomId(`announce_modal::${categoryKey}::${roleIdsCsv}`)
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

  const imageInput = new TextInputBuilder()
    .setCustomId("announce_image_url")
    .setLabel("IMAGE URL (OPTIONAL — BIG IMAGE)")
    .setPlaceholder("https://i.imgur.com/example.png")
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setMaxLength(1000);

  const thumbnailInput = new TextInputBuilder()
    .setCustomId("announce_thumbnail_url")
    .setLabel("THUMBNAIL URL (OPTIONAL — SMALL ICON)")
    .setPlaceholder("https://i.imgur.com/example-icon.png")
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setMaxLength(1000);

  const postedByInput = new TextInputBuilder()
    .setCustomId("announce_posted_by")
    .setLabel("POSTED BY (OPTIONAL SIGNATURE)")
    .setPlaceholder("e.g. The Clver Team")
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setMaxLength(100);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(bodyInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(imageInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(thumbnailInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(postedByInput),
  );

  return modal;
}

// Step 1: category picked from /announce's select menu → show role-tagging step
export const announcementCategorySelectHandler: ComponentHandler = {
  customId: "announce_category_select",

  async execute(interaction): Promise<void> {
    if (!interaction.isStringSelectMenu()) return;

    const categoryKey = interaction.values[0];

    const roleSelect = new RoleSelectMenuBuilder()
      .setCustomId(`announce_role_select::${categoryKey}`)
      .setPlaceholder("Select role(s) to tag (optional, pick multiple)")
      .setMinValues(1)
      .setMaxValues(10);

    const skipButton = new ButtonBuilder()
      .setCustomId(`announce_role_skip::${categoryKey}`)
      .setLabel("No Tag — Skip")
      .setStyle(ButtonStyle.Secondary);

    await interaction.update({
      content: `Category: \`${categoryKey}\`. Tag role(s) to ping with this announcement, or skip:`,
      components: [
        new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(roleSelect),
        new ActionRowBuilder<ButtonBuilder>().addComponents(skipButton),
      ],
    });
  },
};

// Step 2a: role(s) picked → open the modal carrying those role IDs
export const announcementRoleSelectHandler: ComponentHandler = {
  customId: "announce_role_select::",

  async execute(interaction): Promise<void> {
    if (!interaction.isRoleSelectMenu()) return;

    const categoryKey = interaction.customId.replace(
      "announce_role_select::",
      "",
    );
    const roleIds = interaction.values;

    await interaction.showModal(buildAnnouncementModal(categoryKey, roleIds));
  },
};

// Step 2b: skipped tagging → open the modal with no roles attached
export const announcementRoleSkipHandler: ComponentHandler = {
  customId: "announce_role_skip::",

  async execute(interaction): Promise<void> {
    if (!interaction.isButton()) return;

    const categoryKey = interaction.customId.replace(
      "announce_role_skip::",
      "",
    );

    await interaction.showModal(buildAnnouncementModal(categoryKey, []));
  },
};

// Step 3: modal submitted → build the embed and dispatch
export const announcementModalHandler: ComponentHandler = {
  customId: "announce_modal::",

  async execute(interaction): Promise<void> {
    if (!interaction.isModalSubmit()) return;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const remainder = interaction.customId.replace("announce_modal::", "");
    const [targetCategory, roleIdsCsv] = remainder.split("::");
    const roleIds = roleIdsCsv ? roleIdsCsv.split(",").filter(Boolean) : [];

    const embeddedTitle =
      interaction.fields.getTextInputValue("announce_title");
    const embeddedBody = interaction.fields.getTextInputValue("announce_body");
    const imageUrlRaw = interaction.fields
      .getTextInputValue("announce_image_url")
      .trim();
    const thumbnailUrlRaw = interaction.fields
      .getTextInputValue("announce_thumbnail_url")
      .trim();
    const postedBy = interaction.fields
      .getTextInputValue("announce_posted_by")
      .trim();

    const colorConfig = await prisma.announcementConfig.findUnique({
      where: { category: targetCategory },
    });
    const resolvedHexColor = (colorConfig?.hexColor ||
      "#75ff83") as ColorResolvable;

    const announcementEmbed = new EmbedBuilder()
      .setTitle(embeddedTitle)
      .setDescription(embeddedBody)
      .setColor(resolvedHexColor)
      .setTimestamp()
      .setFooter({
        text: postedBy
          ? `${postedBy} • Clver Team • ${targetCategory.toUpperCase()}`
          : `Clver Team • ${targetCategory.toUpperCase()}`,
        iconURL: interaction.guild?.iconURL() || undefined,
      });

    const skippedFields: string[] = [];

    if (imageUrlRaw) {
      if (isValidImageUrl(imageUrlRaw)) {
        announcementEmbed.setImage(imageUrlRaw);
      } else {
        skippedFields.push("image URL");
      }
    }

    if (thumbnailUrlRaw) {
      if (isValidImageUrl(thumbnailUrlRaw)) {
        announcementEmbed.setThumbnail(thumbnailUrlRaw);
      } else {
        skippedFields.push("thumbnail URL");
      }
    }

    const targetChannel = interaction.channel as GuildTextBasedChannel;

    if (targetChannel && typeof targetChannel.send === "function") {
      const mentionContent =
        roleIds.length > 0
          ? roleIds.map((id) => `<@&${id}>`).join(" ")
          : undefined;

      await targetChannel.send({
        content: mentionContent,
        embeds: [announcementEmbed],
        allowedMentions: roleIds.length > 0 ? { roles: roleIds } : undefined,
      });

      const warningNote =
        skippedFields.length > 0
          ? ` (Note: ${skippedFields.join(" and ")} looked invalid and was skipped.)`
          : "";

      await interaction.editReply({
        content: `🚀 Successfully broadcasted the Branded \`${targetCategory.toUpperCase()}\` update panel.${warningNote}`,
      });
    } else {
      await interaction.editReply({
        content:
          "❌ Failed to broadcast: Channel is invalid or does not support text outputs.",
      });
    }
  },
};
