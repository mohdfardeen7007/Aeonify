import UserBan from '../../models/userBan.model.js';
import config from '../../config.js';
import { extractTargetUserUniversal } from '../../utils/target.js';

async function handleUnbanUser({ Aeonify, message, args, reply, sender, sessionId, m }) {
  const { targetNumber, targetJid } = extractTargetUserUniversal({ m, args, message });

  if (!targetJid) {
    return reply(`*Invalid Usage*\nUse: \`${config.prefix}unban <@user/reply>\``);
  }

  try {
    const unbanned = await UserBan.unbanUser(sessionId, targetJid, sender, sender.split('@')[0]);
    if (!unbanned) {
        return reply('*User not found or not banned!*');
    }
    return reply(`✅ *User Unbanned Successfully!*\n\n` +
      `👤 *User:* ${targetNumber}\n` +
      `⏰ *Unbanned At:* ${new Date().toLocaleString()}\n` +
      `👮 *Unbanned By:* ${sender.split('@')[0]}`);
  } catch (error) {
    if (error.message === 'User is not banned') {
      return reply('*User not found or not banned!*');
    }
    console.error('Unban command error:', error);
    return reply('*An error occurred while unbanning the user.*');
  }
}

export default {
  name: 'unban',
  aliases: ['delban'],
  description: 'Unban a user',
  usage: `${config.prefix}unban <@user/reply>`,
  category: 'Owner',
  ownerOnly: true,
  cooldown: 5,
  
  run: async ({ Aeonify, message, args, reply, sender, isOwner, messages: m }) => {
    if (!isOwner) {
      return reply("*Owner Only!* This command is restricted to bot owners.");
    }
    const sessionId = Aeonify.user.id.split(':')[0];
    await handleUnbanUser({ Aeonify, message, args, reply, sender, sessionId, m });
  }
}; 