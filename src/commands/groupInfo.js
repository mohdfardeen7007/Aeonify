const groupinfoCommand = {
  name: "groupinfo",
  aliases: ["ginfo", "about", "info"],
  description: "Get detailed group information",
  
  run: async ({ client, jid, reply, isGroup, groupMetadata, groupName }) => {
    if (!isGroup) return reply("*This command only works in groups!*");
    
    try {
      const participants = groupMetadata.participants || [];
      const admins = participants.filter(p => ['admin', 'superadmin'].includes(p.admin));
      const members = participants.filter(p => !['admin', 'superadmin'].includes(p.admin));
      
      // Get group creation date
      const creationTime = groupMetadata.creation ? new Date(groupMetadata.creation * 1000) : null;
      
      let info = `📋 *GROUP INFORMATION*\n\n`;
      info += `📱 *Name:* ${groupName}\n`;
      info += `🆔 *ID:* ${jid.split('@')[0]}\n`;
      info += `📝 *Description:* ${groupMetadata.desc || 'No description'}\n`;
      
      if (creationTime) {
        info += `📅 *Created:* ${creationTime.toLocaleDateString()}\n`;
      }
      
      info += `👥 *Total Members:* ${participants.length}\n`;
      info += `👑 *Admins:* ${admins.length}\n`;
      info += `👤 *Members:* ${members.length}\n\n`;
      
      // Settings
      const settings = groupMetadata.announce ? "🔒 Only admins can send messages" : "💬 Everyone can send messages";
      const restrict = groupMetadata.restrict ? "🔒 Only admins can edit group info" : "📝 Everyone can edit group info";
      
      info += `⚙️ *SETTINGS:*\n`;
      info += `├ ${settings}\n`;
      info += `└ ${restrict}\n\n`;
      
      // Admin list
      if (admins.length > 0) {
        info += `👑 *ADMIN LIST:*\n`;
        admins.slice(0, 5).forEach((admin, index) => {
          const number = admin.id.split('@')[0];
          const role = admin.admin === 'superadmin' ? '👨‍💼 Owner' : '👑 Admin';
          info += `${index + 1}. ${role} +${number}\n`;
        });
        
        if (admins.length > 5) {
          info += `_...and ${admins.length - 5} more admins_\n`;
        }
      }
      
      info += `\n✨ _Information by Aeon Bot_`;
      
      await reply(info);
      
    } catch (error) {
      console.error('Group info error:', error);
      await reply("*Failed to get group information!*");
    }
  }
};

export default groupinfoCommand;
