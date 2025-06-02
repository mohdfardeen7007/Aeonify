const everyoneCommand = {
  name: "everyone",
  aliases: ["all", "tagall", "mention"],
  description: "Tag all group members",
  usage: "!tagall <message>",
  cooldown: 5000,

  run: async ({ client, jid, reply, args, isGroup, isAdmin, groupMetadata, senderName }) => {
    if (!isGroup) return reply("*This command only works in groups!*");
    if (!isAdmin) return reply("*Only admins can tag everyone!*");

    try {
      const participants = groupMetadata.participants || [];
      if (participants.length === 0) {
        return reply("*No members found in this group!*");
      }

      const message = args.join(' ') || 'Attention everyone! 📢';
      const mentions = participants.map(p => p.id);

      let tagMessage = `📢 *${senderName} is calling everyone!*\n\n`;
      tagMessage += `💬 *Message:* ${message}\n\n`;
      tagMessage += `👥 *Tagged Members:*\n`;

      // Add all participants to message with their names
      participants.forEach((participant, index) => {
        const number = participant.id.split('@')[0];
        const name = participant.name || number;
        const role = participant.admin ? (participant.admin === 'superadmin' ? '👑 Owner' : '👑 Admin') : '👤 Member';
        tagMessage += `${index + 1}. ${role} ${name}\n`;
      });

      tagMessage += `\n📊 *Total: ${participants.length} members*`;

      await client.sendMessage(jid, {
        text: tagMessage,
        mentions: mentions
      });
    } catch (error) {
      console.error('Everyone tag error:', error);
      await reply("*Failed to tag everyone!*");
    }
  }
};

export default everyoneCommand;
