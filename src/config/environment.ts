import dotenv from "dotenv";

// Step 1: Initialize local environment key injection
dotenv.config();

export interface EnvironmentVariables {
  discordToken: string;
  clientId: string;
  guildId: string;
  databaseUrl: string;

  // Onboarding gateway configuration
  onboardingChannelId: string;
  unverifiedRoleId: string;

  // Discovery source roles (Step 1)
  roleDiscoveryYoutube: string;
  roleDiscoveryTwitter: string;
  roleDiscoveryTiktok: string;
  roleDiscoveryInstagram: string;
  roleDiscoveryFriend: string;
  roleDiscoveryDiscord: string;

  // Platform edition roles (Step 2)
  rolePlatformJava: string;
  rolePlatformBedrock: string;

  // Specialization roles (Step 3)
  roleSpecDev: string;
  roleSpecModeler: string;
  roleSpecTextureArtist: string;
  roleSpecKeyArtist: string;
  roleSpecBuilder: string;
}

// Step 2: Extract configurations, ensuring early escape checks
export function validateEnvironment(): EnvironmentVariables {
  const {
    DISCORD_BOT_TOKEN,
    DISCORD_CLIENT_ID,
    DISCORD_GUILD_ID,
    DATABASE_URL,
    ONBOARDING_CHANNEL_ID,
    UNVERIFIED_ROLE_ID,
    ROLE_DISCOVERY_YOUTUBE,
    ROLE_DISCOVERY_TWITTER,
    ROLE_DISCOVERY_TIKTOK,
    ROLE_DISCOVERY_INSTAGRAM,
    ROLE_DISCOVERY_FRIEND,
    ROLE_DISCOVERY_DISCORD,
    ROLE_PLATFORM_JAVA,
    ROLE_PLATFORM_BEDROCK,
    ROLE_SPEC_DEV,
    ROLE_SPEC_MODELER,
    ROLE_SPEC_TEXTURE_ARTIST,
    ROLE_SPEC_KEY_ARTIST,
    ROLE_SPEC_BUILDER
  } = process.env;

  // Step 3: Implement quick assertions to maintain high quality data safety
  const required: Record<string, string | undefined> = {
    DISCORD_BOT_TOKEN,
    DISCORD_CLIENT_ID,
    DISCORD_GUILD_ID,
    DATABASE_URL,
    ONBOARDING_CHANNEL_ID,
    UNVERIFIED_ROLE_ID,
    ROLE_DISCOVERY_YOUTUBE,
    ROLE_DISCOVERY_TWITTER,
    ROLE_DISCOVERY_TIKTOK,
    ROLE_DISCOVERY_INSTAGRAM,
    ROLE_DISCOVERY_FRIEND,
    ROLE_DISCOVERY_DISCORD,
    ROLE_PLATFORM_JAVA,
    ROLE_PLATFORM_BEDROCK,
    ROLE_SPEC_DEV,
    ROLE_SPEC_MODELER,
    ROLE_SPEC_TEXTURE_ARTIST,
    ROLE_SPEC_KEY_ARTIST,
    ROLE_SPEC_BUILDER
  };

  for (const [key, value] of Object.entries(required)) {
    if (!value) {
      throw new Error(
        `Critical Configuration Error: ${key} configuration is entirely missing.`,
      );
    }
  }

  return {
    discordToken: DISCORD_BOT_TOKEN!,
    clientId: DISCORD_CLIENT_ID!,
    guildId: DISCORD_GUILD_ID!,
    databaseUrl: DATABASE_URL!,
    onboardingChannelId: ONBOARDING_CHANNEL_ID!,
    unverifiedRoleId: UNVERIFIED_ROLE_ID!,
    roleDiscoveryYoutube: ROLE_DISCOVERY_YOUTUBE!,
    roleDiscoveryTwitter: ROLE_DISCOVERY_TWITTER!,
    roleDiscoveryTiktok: ROLE_DISCOVERY_TIKTOK!,
    roleDiscoveryInstagram: ROLE_DISCOVERY_INSTAGRAM!,
    roleDiscoveryFriend: ROLE_DISCOVERY_FRIEND!,
    roleDiscoveryDiscord: ROLE_DISCOVERY_DISCORD!,
    rolePlatformJava: ROLE_PLATFORM_JAVA!,
    rolePlatformBedrock: ROLE_PLATFORM_BEDROCK!,
    roleSpecDev: ROLE_SPEC_DEV!,
    roleSpecModeler: ROLE_SPEC_MODELER!,
    roleSpecTextureArtist: ROLE_SPEC_TEXTURE_ARTIST!,
    roleSpecKeyArtist: ROLE_SPEC_KEY_ARTIST!,
    roleSpecBuilder: ROLE_SPEC_BUILDER!,
  };
}
