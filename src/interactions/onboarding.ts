import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonInteraction,
  AnySelectMenuInteraction,
  EmbedBuilder,
} from "discord.js";
import { ComponentHandler } from "../types/framework.js";
import { prisma } from "../database/client.js";
import { validateEnvironment } from "../config/environment.js";

const environment = validateEnvironment();

const TOTAL_STEPS = 4;

// Sentinel value for the "no notifications" choice in the step 4 select
// menu. Kept out of the notificationMap on purpose so it never resolves
// to a role — selecting it should assign nothing.
const SKIP_NOTIFICATIONS = "skip";

function buildOnboardingEmbed(
  step: number,
  title: string,
  description: string,
) {
  const filledBar = "🟩".repeat(step) + "⬛".repeat(TOTAL_STEPS - step);

  return new EmbedBuilder()
    .setTitle(`✨ Profile Setup — ${title}`)
    .setDescription(
      `${description}\n\n**Progress:** [${filledBar}] (Step ${step}/${TOTAL_STEPS})`,
    )
    .setColor("#75ff83")
    .setFooter({ text: "Clver Studios Community Verification Gateway" });
}

// Maps a user's collected answers to real Discord role IDs.
// Anything not recognized (including the "skip" sentinel) is safely
// skipped rather than thrown.
function resolveRoleIds(answers: {
  discoverySource: string | null;
  clients: string[];
  specialties: string[];
  notifications: string[];
}): string[] {
  const discoveryMap: Record<string, string> = {
    youtube: environment.roleDiscoveryYoutube,
    twitter: environment.roleDiscoveryTwitter,
    tiktok: environment.roleDiscoveryTiktok,
    instagram: environment.roleDiscoveryInstagram,
    friend: environment.roleDiscoveryFriend,
    discord: environment.roleDiscoveryDiscord,
  };

  const platformMap: Record<string, string> = {
    java: environment.rolePlatformJava,
    bedrock: environment.rolePlatformBedrock,
  };

  const specialtyMap: Record<string, string> = {
    dev: environment.roleSpecDev,
    modeler: environment.roleSpecModeler,
    textureArtist: environment.roleSpecTextureArtist,
    keyArtist: environment.roleSpecKeyArtist,
    builder: environment.roleSpecBuilder,
  };

  const notificationMap: Record<string, string> = {
    updates: environment.roleNotiNetworkUpdates,
    announcements: environment.roleNotiGeneralAnnouncements,
  };

  const roleIds: string[] = [];

  if (answers.discoverySource && discoveryMap[answers.discoverySource]) {
    roleIds.push(discoveryMap[answers.discoverySource]);
  }

  for (const client of answers.clients) {
    if (platformMap[client]) roleIds.push(platformMap[client]);
  }

  for (const specialty of answers.specialties) {
    if (specialtyMap[specialty]) roleIds.push(specialtyMap[specialty]);
  }

  for (const notification of answers.notifications) {
    if (notification === SKIP_NOTIFICATIONS) continue;
    if (notificationMap[notification])
      roleIds.push(notificationMap[notification]);
  }

  // Filter out empty strings — happens if a notification role env var
  // was left unset (they're optional, unlike discovery/platform/spec).
  return roleIds.filter((id) => id.length > 0);
}

export const onboardingHandler: ComponentHandler = {
  customId: "onboard",

  async execute(
    interaction: ButtonInteraction | AnySelectMenuInteraction,
  ): Promise<void> {
    const userId = interaction.user.id;
    const customId = interaction.customId;
    const [, step] = customId.split("::");

    // -------------------------------------------------------------
    // ENTRY POINT: User clicked the persistent "Start Setup" button
    // in the channel. We spin up a fresh ephemeral reply that only
    // they can see — the anchor message in the channel never changes.
    // -------------------------------------------------------------
    if (step === "start") {
      await prisma.onboardingState.upsert({
        where: { userId },
        create: { userId, currentStep: 1 },
        update: { currentStep: 1 },
      });

      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("onboard::1")
          .setPlaceholder("How did you discover Clver Studios?")
          .setMinValues(1)
          .setMaxValues(1)
          .addOptions([
            {
              label: "YouTube",
              value: "youtube",
              description: "Found us through a content creator",
            },
            {
              label: "Twitter / X",
              value: "twitter",
              description: "Found us through social media feeds",
            },
            {
              label: "TikTok",
              value: "tiktok",
              description: "Found us through short-form video",
            },
            {
              label: "Instagram",
              value: "instagram",
              description: "Found us through Instagram",
            },
            {
              label: "Friend / Word of Mouth",
              value: "friend",
              description: "Someone invited you directly",
            },
            {
              label: "Discord Server",
              value: "discord",
              description: "Found us through another Discord community",
            },
          ]),
      );

      await interaction.reply({
        embeds: [
          buildOnboardingEmbed(
            1,
            "Discovery Source",
            "How did you find us? This helps us understand our community growth.",
          ),
        ],
        components: [row],
        ephemeral: true,
      });
      return;
    }

    // From here on, the user is mid-flow inside their own ephemeral
    // message thread, so we edit that same message for every step.
    if (!interaction.isStringSelectMenu()) return;
    await interaction.deferUpdate();

    // -------------------------------------------------------------
    // STEP 1 -> 2: Discovery source captured, ask platform edition
    // -------------------------------------------------------------
    if (step === "1") {
      await prisma.onboardingState.update({
        where: { userId },
        data: { discoverySource: interaction.values[0], currentStep: 2 },
      });

      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("onboard::2")
          .setPlaceholder("Choose your platform edition(s)...")
          .setMinValues(1)
          .setMaxValues(2)
          .addOptions([
            {
              label: "Java Edition",
              value: "java",
              description: "PC/Mac Mainline Client players",
            },
            {
              label: "Bedrock Edition",
              value: "bedrock",
              description: "Console, Mobile & Win10 Client players",
            },
          ]),
      );

      await interaction.editReply({
        embeds: [
          buildOnboardingEmbed(
            2,
            "Platform Edition",
            "Which client editions do you use to connect to the Minecraft Network? Select all that apply.",
          ),
        ],
        components: [row],
      });
      return;
    }

    // -------------------------------------------------------------
    // STEP 2 -> 3: Platform captured, ask specialization
    // -------------------------------------------------------------
    if (step === "2") {
      await prisma.onboardingState.update({
        where: { userId },
        data: { clients: interaction.values, currentStep: 3 },
      });

      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("onboard::3")
          .setPlaceholder("Select your community specialization profiles...")
          .setMinValues(1)
          .setMaxValues(3)
          .addOptions([
            {
              label: "Development",
              value: "dev",
              description:
                "Plugin coders, systems developers, and backend engineers",
            },
            {
              label: "Modeler",
              value: "modeler",
              description:
                "3D Asset Creation, Blockbench artists, item textures",
            },
            {
              label: "Texture Artist",
              value: "textureArtist",
              description: "2D Artwork, UI Design, Sprite Creation",
            },
            {
              label: "Key Artist",
              value: "keyArtist",
              description: "UI layouts, vector logos, media illustrations",
            },
            {
              label: "Builder / Level Designer",
              value: "builder",
              description:
                "In-game world builders, map makers, and level designers",
            },
          ]),
      );

      await interaction.editReply({
        embeds: [
          buildOnboardingEmbed(
            3,
            "Community Specialization",
            "What are your core skill sets and focus areas? Choose up to 3 options.",
          ),
        ],
        components: [row],
      });
      return;
    }

    // -------------------------------------------------------------
    // STEP 3 -> 4: Specialization captured, ask notification prefs.
    // "None" is offered as a real option — picking it skips
    // notification-role assignment entirely.
    // -------------------------------------------------------------
    if (step === "3") {
      await prisma.onboardingState.update({
        where: { userId },
        data: { specialties: interaction.values, currentStep: 4 },
      });

      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("onboard::4")
          .setPlaceholder("Choose notification frequencies...")
          .setMinValues(1)
          .setMaxValues(1)
          .addOptions([
            {
              label: "Network Updates",
              value: "updates",
              description: "Receive development logs and change summaries",
            },
            {
              label: "General Announcements",
              value: "announcements",
              description: "Alerts regarding server events and outages",
            },
            {
              label: "None",
              value: SKIP_NOTIFICATIONS,
              description: "Don't sign me up for any notification pings",
            },
          ]),
      );

      await interaction.editReply({
        embeds: [
          buildOnboardingEmbed(
            4,
            "Notification Preferences",
            "Configure your alert thresholds. Select what you want to be pinged on, or choose None.",
          ),
        ],
        components: [row],
      });
      return;
    }

    // -------------------------------------------------------------
    // STEP 4: Final selection captured. Resolve roles, assign them,
    // remove @unverified and grant @member so the user can see the
    // rest of the server.
    // -------------------------------------------------------------
    if (step === "4") {
      const finalState = await prisma.onboardingState.update({
        where: { userId },
        data: {
          notifications: interaction.values,
          completedAt: new Date(),
        },
      });

      const member = await interaction.guild?.members.fetch(userId);
      if (member) {
        const rolesToAssign = resolveRoleIds({
          discoverySource: finalState.discoverySource,
          clients: finalState.clients,
          specialties: finalState.specialties,
          notifications: finalState.notifications,
        });

        // The member role is unconditional — everyone who finishes
        // onboarding gets it, regardless of what else they picked.
        rolesToAssign.push(environment.memberRoleId);

        await member.roles.add(rolesToAssign).catch((error) => {
          console.error(`Role Assignment Failure for ${userId}:`, error);
        });

        await member.roles
          .remove(environment.unverifiedRoleId)
          .catch((error) => {
            console.error(
              `Unverified Role Removal Failure for ${userId}:`,
              error,
            );
          });
      }

      const successEmbed = new EmbedBuilder()
        .setTitle("🎉 Setup Complete!")
        .setDescription(
          "Your profile is set up and your roles have been assigned. Welcome to the rest of the server!\n\n" +
            "👉 Head over to <#1467822857152102534> to read the guidelines!",
        )
        .setColor("#2ECC71")
        .setThumbnail(interaction.user.displayAvatarURL());

      await interaction.editReply({
        embeds: [successEmbed],
        components: [],
      });
    }
  },
};
