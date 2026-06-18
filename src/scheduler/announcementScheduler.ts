import {
  Client,
  EmbedBuilder,
  ColorResolvable,
  GuildTextBasedChannel,
} from "discord.js";
import { prisma } from "../database/client.js";
import { RepeatInterval } from "@prisma/client";

const CHECK_INTERVAL_MS = 60_000; // poll once a minute

function computeNextSendAt(current: Date, interval: RepeatInterval): Date {
  const next = new Date(current);
  if (interval === RepeatInterval.DAILY) next.setDate(next.getDate() + 1);
  if (interval === RepeatInterval.WEEKLY) next.setDate(next.getDate() + 7);
  return next;
}

export function startAnnouncementScheduler(client: Client): void {
  setInterval(async () => {
    try {
      const due = await prisma.scheduledAnnouncement.findMany({
        where: { active: true, sendAt: { lte: new Date() } },
      });

      for (const item of due) {
        const colorConfig = await prisma.announcementConfig.findUnique({
          where: { category: item.category },
        });
        const resolvedHexColor = (colorConfig?.hexColor ||
          "#5865F2") as ColorResolvable;

        const embed = new EmbedBuilder()
          .setTitle(item.title)
          .setDescription(item.body)
          .setColor(resolvedHexColor)
          .setTimestamp()
          .setFooter({
            text: `Clevr Studios • ${item.category.toUpperCase()}`,
          });

        try {
          const channel = (await client.channels.fetch(
            item.channelId,
          )) as GuildTextBasedChannel | null;
          if (channel && typeof channel.send === "function") {
            await channel.send({ embeds: [embed] });
          } else {
            console.error(
              `Scheduled announcement ${item.id}: channel ${item.channelId} not sendable.`,
            );
          }
        } catch (err) {
          console.error(
            `Scheduled announcement ${item.id}: dispatch failed.`,
            err,
          );
        }

        if (item.repeatInterval === RepeatInterval.NONE) {
          await prisma.scheduledAnnouncement.update({
            where: { id: item.id },
            data: { active: false, lastSentAt: new Date() },
          });
        } else {
          await prisma.scheduledAnnouncement.update({
            where: { id: item.id },
            data: {
              sendAt: computeNextSendAt(item.sendAt, item.repeatInterval),
              lastSentAt: new Date(),
            },
          });
        }
      }
    } catch (err) {
      console.error("Announcement scheduler tick failed:", err);
    }
  }, CHECK_INTERVAL_MS);
}
