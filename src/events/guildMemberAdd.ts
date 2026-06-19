import { Events, GuildMember } from 'discord.js';
import { Event, ExtendedClient } from '../types/framework.js';
import { validateEnvironment } from '../config/environment.js';

const environment = validateEnvironment();

const guildMemberAddEvent: Event = {
    name: Events.GuildMemberAdd,
    once: false,

    async execute(rawMember: unknown, _client: unknown): Promise<void> {
        const member = rawMember as GuildMember;

        try {
            await member.roles.add(environment.unverifiedRoleId);
            console.log(`Onboarding Gateway: Assigned unverified role to ${member.user.tag} (${member.id}).`);
        } catch (error) {
            console.error(`Onboarding Gateway Failure: Could not assign unverified role to ${member.id}.`, error);
        }
    }
};

export default guildMemberAddEvent;