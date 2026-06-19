import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
} from "discord.js";
import { Command } from "../types/framework.js";

// -------------------------------------------------------------
// Admin-editable content. Update this array directly to change
// what /info shows — no command or database needed for now.
// Each entry becomes one embed field. Keep `value` under 1024
// characters (Discord's field value limit).
// -------------------------------------------------------------
const INFO_SECTIONS: { name: string; value: string }[] = [
  {
    name: "What is Clver Studio?",
    value:
      "The server is a community space for Minecraft creators where they share ideas, work on projects, and collaborate. We welcome all creators, whether you are a developer, modeler, texture artist, builder or more.",
  },
  {
    name: "Server Rules",
    value:
      "1. Be respectful and treat everyone kindly.\n" +
      "2. No harassment, hate speech, or personal attacks.\n" +
      "3. Keep content appropriate and avoid suspicious links.\n" +
      "4. Stay on topic and use channels for their intended purpose.\n" +
      "5. No advertising or self-promotion without staff approval.",
  },
  {
    name: "Need to reach staff?",
    value:
      "Our staff monitors the <#1469171350995341588> channel to help you instantly.",
  },
];

const infoCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("info")
    .setDescription("Shows server info, rules, and useful links."),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const guild = interaction.guild;

    const embed = new EmbedBuilder()
      .setTitle(`ℹ️ ${guild?.name ?? "Server"} Info`)
      .setColor("#75ff83")
      .setTimestamp();

    for (const section of INFO_SECTIONS) {
      embed.addFields({ name: section.name, value: section.value });
    }

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};

export default infoCommand;
