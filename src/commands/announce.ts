import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  MessageFlags,
} from "discord.js";
import { Command } from "../types/framework.js";
import { prisma } from "../database/client.js";

const announceCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("announce")
    .setDescription(
      "Launches the interactive layout modal to draft a branded server update.",
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    // Step 1: Pull every registered category so the admin can pick visually
    const categories = await prisma.announcementConfig.findMany({
      orderBy: { category: "asc" },
    });

    if (categories.length === 0) {
      await interaction.reply({
        content:
          "❌ No categories registered yet. Run `/announce-config` first to create one.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Discord caps select menus at 25 options
    const menuOptions = categories.slice(0, 25).map((config) => ({
      label: config.category,
      value: config.category,
      description: `Brand color: ${config.hexColor}`,
    }));

    const categorySelect = new StringSelectMenuBuilder()
      .setCustomId("announce_category_select")
      .setPlaceholder("Select an announcement category...")
      .addOptions(menuOptions);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      categorySelect,
    );

    // Step 2: Hand off to the select menu — the modal opens once they pick one
    await interaction.reply({
      content: "Pick a category to continue drafting your announcement:",
      components: [row],
      flags: MessageFlags.Ephemeral,
    });
  },
};

export default announceCommand;
