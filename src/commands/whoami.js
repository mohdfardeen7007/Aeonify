export default {
  name: "whoami",
  aliases: ["myinfo", "profile"],
  description: "Get your profile information",
  usage: "!whoami",
  cooldown: 5000,
  minArgs: 0,
  maxArgs: 0,
  run: async ({ client, jid, sender, senderName, isGroup, groupMetadata, reply }) => {
    try {
      let profilePicture = null;
      try {
        profilePicture = await client.profilePictureUrl(sender, 'image');
      } catch (error) {
        console.log('Could not fetch profile picture:', error.message);
      }

      let status = 'Not set';
      try {
        const statusObj = await client.fetchStatus(sender);
        if (statusObj?.status) {
          status = statusObj.status;
        }
      } catch (error) {
        console.log('Could not fetch status:', error.message);
      }

      const deviceInfo = {
        platform: 'Unknown',
        version: 'Unknown'
      };
      try {
        const info = await client.fetchUser(sender);
        if (info?.platform) deviceInfo.platform = info.platform;
        if (info?.version) deviceInfo.version = info.version;
      } catch (error) {
        console.log('Could not fetch device info:', error.message);
      }

      let profileMessage = `👤 *User Profile*\n\n`;
      profileMessage += `📝 *Name:* ${senderName}\n`;
      profileMessage += `🆔 *ID:* ${sender.split('@')[0]}\n`;
      profileMessage += `📸 *Profile Picture:* ${profilePicture ? 'Set' : 'Not set'}\n`;
      profileMessage += `📝 *Status:* ${status}\n`;
      profileMessage += `📱 *Device:* ${deviceInfo.platform}\n`;
      profileMessage += `📲 *Version:* ${deviceInfo.version}\n`;

      if (isGroup && groupMetadata) {
        const participant = groupMetadata.participants.find(p => p.id === sender);
        if (participant) {
          profileMessage += `\n👥 *Group Role:* ${participant.admin || 'Member'}\n`;
          profileMessage += `📢 *Group:* ${groupMetadata.subject}\n`;
        }
      }

      if (profilePicture) {
        await client.sendMessage(jid, {
          image: { url: profilePicture },
          caption: profileMessage
        }, { quoted: { key: { remoteJid: jid, fromMe: false, id: '' }, message: {} } });
      } else {
        await reply(profileMessage);
      }
    } catch (error) {
      console.error('Error in whoami command:', error);
      await reply('*Error fetching profile information*\nPlease try again later.');
    }
  }
};
