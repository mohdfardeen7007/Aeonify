import { messages } from './messages.js';

export async function validateGroupCommandPermissions({
  client,
  jid,
  message,
  isGroup,
  isAdmin,
  isBotAdmin,
  groupMetadata,
  targetUser,
  commandType,
  sender
}) {
  try {
    console.log('Validating permissions:', {
      commandType,
      isGroup,
      isAdmin,
      isBotAdmin,
      targetUser,
      sender,
      groupId: jid
    });

    // 1. Basic group checks
    if (!isGroup) {
      console.log('Failed: Not a group chat');
      await client.sendMessage(jid, { 
        text: "*This command can only be used in groups!*" 
      });
      return false;
    }

    // 2. Validate group metadata
    if (!groupMetadata || !groupMetadata.participants) {
      console.log('Failed: Invalid group metadata');
      await client.sendMessage(jid, { 
        text: "*Error: Could not fetch group information!*" 
      });
      return false;
    }

    // 3. Check if bot is admin
    const botId = client.user.id.split(':')[0] + '@s.whatsapp.net'; // Remove the :22 suffix
    console.log('Bot ID:', botId);
    
    const botParticipant = groupMetadata.participants.find(p => p.id === botId);
    console.log('All participants:', groupMetadata.participants.map(p => ({ id: p.id, admin: p.admin })));
    
    const isBotAdminNow = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin';
    
    console.log('Bot admin check:', {
      botId,
      botParticipant,
      isBotAdminNow,
      originalIsBotAdmin: isBotAdmin
    });

    if (!isBotAdminNow) {
      console.log('Failed: Bot is not admin');
      await client.sendMessage(jid, { 
        text: "*I need to be an admin to perform this action!*" 
      });
      return false;
    }

    // 4. Check if user is admin
    if (!isAdmin) {
      console.log('Failed: User is not admin');
      await client.sendMessage(jid, { 
        text: "*Only admins can use this command!*" 
      });
      return false;
    }

    // 5. If no target user needed, return true
    if (!targetUser) {
      console.log('No target user needed, proceeding');
      return true;
    }

    // 6. Validate target participant
    const targetParticipant = groupMetadata.participants.find(p => p.id === targetUser);
    if (!targetParticipant) {
      console.log('Failed: Target not in group');
      await client.sendMessage(jid, { 
        text: "*The target user is not in this group!*" 
      });
      return false;
    }

    // 7. Prevent self-actions
    if (targetUser === sender) {
      console.log('Failed: Self-action attempt');
      await client.sendMessage(jid, { 
        text: "*You cannot perform this action on yourself!*" 
      });
      return false;
    }

    // 8. Prevent actions on group owner
    if (targetParticipant.admin === 'superadmin') {
      console.log('Failed: Action on group owner');
      await client.sendMessage(jid, { 
        text: "*You cannot perform this action on the group owner!*" 
      });
      return false;
    }

    // 9. Command-specific validations
    switch (commandType) {
      case 'kick':
        // Can't kick admins
        if (targetParticipant.admin) {
          console.log('Failed: Attempt to kick admin');
          await client.sendMessage(jid, { 
            text: "*You cannot kick an admin!*" 
          });
          return false;
        }
        break;

      case 'promote':
        // Can't promote if already admin
        if (targetParticipant.admin) {
          console.log('Failed: User already admin');
          await client.sendMessage(jid, { 
            text: "*This user is already an admin!*" 
          });
          return false;
        }
        break;

      case 'demote':
        // Can't demote if not admin
        if (!targetParticipant.admin) {
          console.log('Failed: User not admin');
          await client.sendMessage(jid, { 
            text: "*This user is not an admin!*" 
          });
          return false;
        }
        break;
    }

    console.log('Permission validation successful');
    return true;
  } catch (error) {
    console.error('Permission validation error:', {
      error: error.message,
      code: error.code,
      stack: error.stack
    });
    await client.sendMessage(jid, { 
      text: "*An error occurred while validating permissions!*" 
    });
    return false;
  }
}
