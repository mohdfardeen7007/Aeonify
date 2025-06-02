import { messages } from '../utils/messages.js';
import { validateGroupCommandPermissions } from '../utils/validateGroupCommandPermissions.js';

const promoteCommand = {
  name: "promote",
  aliases: ["admin", "makeadmin"],
  description: "Promote member to admin",
  usage: "!promote @user or reply to a message",
  cooldown: 5000,

  run: async ({ client, jid, message, args, isGroup, isAdmin, isBotAdmin, groupMetadata, isQuotedText, quoted, senderName, sender }) => {
    try {
      // Get fresh group metadata to ensure we have latest admin status
      const freshMetadata = isGroup ? await client.groupMetadata(jid) : null;
      const isUserAdmin = freshMetadata?.participants.find(p => p.id === sender)?.admin || false;
      
      const botId = client.user.id.split(':')[0] + '@s.whatsapp.net'; // Remove the :22 suffix
      console.log('Bot ID:', botId);
      console.log('All participants:', freshMetadata?.participants.map(p => ({ id: p.id, admin: p.admin })));
      
      const botParticipant = freshMetadata?.participants.find(p => p.id === botId);
      const isBotAdminNow = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin';

      console.log('Promote command initiated:', {
        groupId: jid,
        sender,
        senderName,
        isGroup,
        isUserAdmin,
        botId,
        botParticipant,
        isBotAdminNow,
        originalIsAdmin: isAdmin,
        originalIsBotAdmin: isBotAdmin
      });

      // 1. Get target user
      let target = null;
      if (isQuotedText && quoted?.sender) {
        target = quoted.sender;
        console.log('Target from quoted message:', target);
      } else if (message.mentions && message.mentions.length > 0) {
        target = message.mentions[0];
        console.log('Target from mentions:', target);
      } else if (args[0]) {
        const number = args[0].replace(/[^0-9]/g, '');
        if (number.length >= 10) {
          target = number.includes('@') ? number : `${number}@s.whatsapp.net`;
          console.log('Target from args:', target);
        }
      }

      // 2. Validate target user
      if (!target) {
        console.log('No valid target found');
        return await client.sendMessage(jid, { 
          text: "❌ *Usage:* !promote @user or reply to their message" 
        });
      }

      // 3. Validate permissions
      console.log('Validating permissions for promote command');
      const hasPermission = await validateGroupCommandPermissions({
        client,
        jid,
        message,
        isGroup,
        isAdmin: isUserAdmin,
        isBotAdmin: isBotAdminNow,
        groupMetadata: freshMetadata,
        targetUser: target,
        commandType: 'promote',
        sender
      });

      if (!hasPermission) {
        console.log('Permission validation failed');
        return;
      }

      // 4. Perform promotion
      try {
        // Get target info before promoting
        const targetParticipant = freshMetadata.participants.find(p => p.id === target);
        const targetName = targetParticipant?.name || target.split('@')[0];
        
        console.log('Attempting to promote user:', {
          target,
          targetName,
          currentRole: targetParticipant?.admin
        });

        // Attempt to promote
        await client.groupParticipantsUpdate(jid, [target], "promote");
        console.log('Promote operation successful');

        // 5. Send success message
        await client.sendMessage(jid, { 
          text: `📈 *Admin privileges granted!*\n👤 ${targetName}\n🎉 Welcome to the admin team!` 
        });

        // 6. Log the action
        console.log(`User ${targetName} (${target}) was promoted to admin in group ${jid} by ${senderName} (${sender})`);
      } catch (error) {
        console.error('Promote operation error:', {
          error: error.message,
          code: error.code,
          stack: error.stack
        });
        
        // Check for specific error types
        if (error.message?.includes('not-authorized')) {
          console.log('Failed: Bot not authorized');
          await client.sendMessage(jid, { 
            text: "❌ *Failed to promote user!* I don't have sufficient permissions to modify admin status." 
          });
        } else if (error.message?.includes('not-a-participant')) {
          console.log('Failed: User not in group');
          await client.sendMessage(jid, { 
            text: "❌ *Failed to promote user!* The user is no longer in the group." 
          });
        } else {
          console.log('Failed: Unexpected error');
          await client.sendMessage(jid, { 
            text: "❌ *Failed to promote user!* An unexpected error occurred." 
          });
        }
      }
    } catch (error) {
      console.error('Promote command error:', {
        error: error.message,
        code: error.code,
        stack: error.stack
      });
      await client.sendMessage(jid, { 
        text: "❌ *An error occurred while processing the command!*" 
      });
    }
  }
};

export default promoteCommand;