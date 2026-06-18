import {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  MessageFlags,
} from "discord.js";
import { ComponentHandler } from "../types/framework.js";
import { prisma } from "../database/client.js";
import { RepeatInterval } from "@prisma/client";

function parseScheduleInput(raw: string): Date | null {
  const trimmed = raw.trim();

  // Relative shorthand: 30m, 2h, 1d
  const relativeMatch = trimmed.match(/^(\d+)(m|h|d)$/i);
  if (relativeMatch) {
    const amount = parseInt(relativeMatch[1], 10);
    const unit = relativeMatch[2].toLowerCase();
    const multiplier =
      unit === "m" ? 60_000 : unit === "h" ? 3_600_000 : 86_400_000;
    return new Date(Date.now() + amount * multiplier);
  }

  // Absolute: "2026-06-20 18:00" (server-local time)
  const absolute = new Date(trimmed.replace(" ", "T"));
  return isNaN(absolute.getTime()) ? null : absolute;
}

function parseRepeatInput(raw: string): RepeatInterval {
  const normalized = raw.trim().toLowerCase();
  if (normalized === "daily") return RepeatInterval.DAILY;
  if (normalized === "weekly") return RepeatInterval.WEEKLY;
  return RepeatInterval.NONE;
}

export const announcementScheduleCategorySelectHandler: ComponentHandler = {
  customId: "announce_schedule_category_select",

  async execute(interaction): Promise<void> {
    if (!interaction.isStringSelectMenu()) return;

    const categoryKey = interaction.values[0];

    const modal = new ModalBuilder()
      .setCustomId(`announce_schedule_modal_${categoryKey}`)
      .setTitle(`Schedule Announcement — [${categoryKey.toUpperCase()}]`);

    const titleInput = new TextInputBuilder()
      .setCustomId("schedule_title")
      .setLabel("EMBED HEADER TITLE")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(100);

    const bodyInput = new TextInputBuilder()
      .setCustomId("schedule_body")
      .setLabel("MESSAGE BODY (SUPPORTS MARKDOWN)")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMaxLength(3000);

    const sendAtInput = new TextInputBuilder()
      .setCustomId("schedule_send_at")
      .setLabel("SEND AT")
      .setPlaceholder('e.g. "30m", "2h", "1d", or "2026-06-20 18:00"')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(30);

    const repeatInput = new TextInputBuilder()
      .setCustomId("schedule_repeat")
      .setLabel("REPEAT (none / daily / weekly)")
      .setPlaceholder("none")
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setMaxLength(10);

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(bodyInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(sendAtInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(repeatInput),
    );

    await interaction.showModal(modal);
  },
};

export const announcementScheduleModalHandler: ComponentHandler = {
  customId: "announce_schedule_modal_",

  async execute(interaction): Promise<void> {
    if (!interaction.isModalSubmit()) return;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const targetCategory = interaction.customId.replace(
      "announce_schedule_modal_",
      "",
    );
    const title = interaction.fields.getTextInputValue("schedule_title");
    const body = interaction.fields.getTextInputValue("schedule_body");
    const rawSendAt = interaction.fields.getTextInputValue("schedule_send_at");
    const rawRepeat =
      interaction.fields.getTextInputValue("schedule_repeat") || "none";

    const sendAt = parseScheduleInput(rawSendAt);
    if (!sendAt) {
      await interaction.editReply({
        content:
          "❌ Couldn't parse that time. Use shorthand like `2h`, or absolute like `2026-06-20 18:00`.",
      });
      return;
    }

    if (sendAt.getTime() <= Date.now()) {
      await interaction.editReply({
        content: "❌ That time is in the past. Pick a future time.",
      });
      return;
    }

    if (!interaction.channelId) {
      await interaction.editReply({
        content: "❌ Could not resolve the channel to post to.",
      });
      return;
    }

    await prisma.scheduledAnnouncement.create({
      data: {
        category: targetCategory,
        title,
        body,
        channelId: interaction.channelId,
        sendAt,
        repeatInterval: parseRepeatInput(rawRepeat),
        createdBy: interaction.user.id,
      },
    });

    await interaction.editReply({
      content: `✅ Scheduled \`${targetCategory.toUpperCase()}\` for <t:${Math.floor(sendAt.getTime() / 1000)}:F> (repeat: ${parseRepeatInput(rawRepeat).toLowerCase()}).`,
    });
  },
};
