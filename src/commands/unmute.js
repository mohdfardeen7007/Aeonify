import { messages } from '../utils/messages.js';

const unmuteCommand = {
  name: "unmute",
  aliases: ["unlock", "open"],
  description: "Allow everyone to send messages",
  usage: "!unmute",
  cooldown: 5000,

  run: async ({ client, jid, message, isGroup, isAdmin, isBotAdmin, groupMetadata, sender }) => {
    try {

      const freshMetadata = isGroup ? await client.groupMetadata(jid) : null;
      const isUserAdmin = freshMetadata?.participants.find(p => p.id === sender)?.admin || false;
      
      const botId = client.user.id.split(':')[0] + '@s.whatsapp.net'; // Remove the :22 suffix
      console.log('Bot ID:', botId);
      console.log('All participants:', freshMetadata?.participants.map(p => ({ id: p.id, admin: p.admin })));
      
      const botParticipant = freshMetadata?.participants.find(p => p.id === botId);
      const isBotAdminNow = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin';

      console.log('Unmute command initiated:', {
        groupId: jid,
        sender,
        isGroup,
        isUserAdmin,
        botId,
        botParticipant,
        isBotAdminNow,
        originalIsAdmin: isAdmin,
        originalIsBotAdmin: isBotAdmin
      });

      if (!isGroup) {
        console.log('Failed: Not a group chat');
        return await client.sendMessage(jid, { 
          text: "*This command only works in groups!*" 
        });
      }

      if (!isUserAdmin) {
        console.log('Failed: User not admin');
        return await client.sendMessage(jid, { 
          text: "*Only admins can unmute the group!*" 
        });
      }

      if (!isBotAdminNow) {
        console.log('Failed: Bot not admin');
        return await client.sendMessage(jid, { 
          text: "*Make me admin first to unmute the group!*" 
        });
      }

      try {
        await client.groupSettingUpdate(jid, 'not_announcement');
        console.log('Group unmuted successfully');
        await client.sendMessage(jid, { 
          text: "🔓 *Group unmuted successfully!*\n💬 Everyone can send messages now." 
        });
      } catch (error) {
        console.error('Unmute operation error:', {
          error: error.message,
          code: error.code,
          stack: error.stack
        });
        
        if (error.message?.includes('not-authorized')) {
          console.log('Failed: Bot not authorized');
          await client.sendMessage(jid, { 
            text: "*Failed to unmute group!* I don't have sufficient permissions." 
          });
        } else {
          console.log('Failed: Unexpected error');
          await client.sendMessage(jid, { 
            text: "*Failed to unmute group!* An unexpected error occurred." 
          });
        }
      }
    } catch (error) {
      console.error('Unmute command error:', {
        error: error.message,
        code: error.code,
        stack: error.stack
      });
      await client.sendMessage(jid, { 
        text: "*An error occurred while processing the command!*" 
      });
    }
  }
};

export default unmuteCommand;
