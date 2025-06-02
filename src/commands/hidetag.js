const hidetagCommand = {
  name: "hidetag",
  aliases: ["htag", "stealth"],
  description: "Tag everyone without notification",
  usage: "!hidetag <message>",
  cooldown: 5000,

  run: async ({ client, jid, reply, args, isGroup, isAdmin, groupMetadata, senderName }) => {
    if (!isGroup) return reply("❌ *This command only works in groups!*");
    if (!isAdmin) return reply("❌ *Only admins can use hidetag!*");

    try {
      const participants = groupMetadata.participants || [];
      if (participants.length === 0) {
        return reply("❌ *No members found in this group!*");
      }

      const message = args.join(' ') || 'Silent notification 📢';
      const mentions = participants.map(p => p.id);

      let tagMessage = `📢 *${senderName} sent a silent notification*\n\n`;
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
        mentions: mentions,
        ephemeralExpiration: 86400 // 24 hours
      });
    } catch (error) {
      console.error('Hidetag error:', error);
      await reply("❌ *Failed to send hidetag!*");
    }
  }
};

export default hidetagCommand;
