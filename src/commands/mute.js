import { messages } from '../utils/messages.js';

const muteCommand = {
  name: "mute",
  aliases: ["lock", "close"],
  description: "Restrict group to admins only",
  usage: "!mute",
  cooldown: 5000,

  run: async ({ client, jid, message, isGroup, isAdmin, isBotAdmin, groupMetadata, sender }) => {
    try {
      // Get fresh group metadata to ensure we have latest admin status
      const freshMetadata = isGroup ? await client.groupMetadata(jid) : null;
      const isUserAdmin = freshMetadata?.participants.find(p => p.id === sender)?.admin || false;
      
      const botId = client.user.id.split(':')[0] + '@s.whatsapp.net'; // Remove the :22 suffix
      console.log('Bot ID:', botId);
      console.log('All participants:', freshMetadata?.participants.map(p => ({ id: p.id, admin: p.admin })));
      
      const botParticipant = freshMetadata?.participants.find(p => p.id === botId);
      const isBotAdminNow = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin';

      console.log('Mute command initiated:', {
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
          text: "*Only admins can mute the group!*" 
        });
      }

      if (!isBotAdminNow) {
        console.log('Failed: Bot not admin');
        return await client.sendMessage(jid, { 
          text: "*Make me admin first to mute the group!*" 
        });
      }

      try {
        await client.groupSettingUpdate(jid, 'announcement');
        console.log('Group muted successfully');
        await client.sendMessage(jid, { 
          text: "🔒 *Group muted successfully!*\n📢 Only admins can send messages now." 
        });
      } catch (error) {
        console.error('Mute operation error:', {
          error: error.message,
          code: error.code,
          stack: error.stack
        });
        
        if (error.message?.includes('not-authorized')) {
          console.log('Failed: Bot not authorized');
          await client.sendMessage(jid, { 
            text: "*Failed to mute group!* I don't have sufficient permissions." 
          });
        } else {
          console.log('Failed: Unexpected error');
          await client.sendMessage(jid, { 
            text: "*Failed to mute group!* An unexpected error occurred." 
          });
        }
      }
    } catch (error) {
      console.error('Mute command error:', {
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

export default muteCommand;