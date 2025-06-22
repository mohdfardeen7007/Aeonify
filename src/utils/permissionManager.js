import config from '../config.js';

class PermissionManager {
  static async validatePermissions({
    Aeonify,
    jid,
    message,
    isGroup,
    isAdmin,
    isBotAdmin,
    groupMetadata,
    targetUser,
    commandType,
    sender,
    command
  }) {
    try {
      console.log('Validating permissions:', {
        commandType,
        isGroup,
        isAdmin,
        isBotAdmin,
        targetUser,
        sender,
        groupId: jid,
        command: command?.name
      });

      // 1. Basic command permission checks
      if (command) {
        // Owner only check
        if (command.ownerOnly && !this.isOwner(sender)) {
          await Aeonify.sendMessage(jid, { 
            text: "*Owner Only!* This command is restricted to bot owners." 
          });
          return false;
        }

        // Group only check
        if (command.groupOnly && !isGroup) {
          await Aeonify.sendMessage(jid, { 
            text: "*Group Only!* This command can only be used in groups." 
          });
          return false;
        }

        // Private only check
        if (command.privateOnly && isGroup) {
          await Aeonify.sendMessage(jid, { 
            text: "*Private Only!* This command can only be used in private chats." 
          });
          return false;
        }

        // Admin only check
        if (command.adminOnly && !isAdmin && !this.isOwner(sender)) {
          await Aeonify.sendMessage(jid, { 
            text: "*Admin Only!* This command requires group admin privileges." 
          });
          return false;
        }

        // Bot admin required check
        if (command.botAdminRequired && !isBotAdmin) {
          await Aeonify.sendMessage(jid, { 
            text: "*Bot Admin Required!* Please make me an admin to use this command." 
          });
          return false;
        }
      }

      // 2. Group command specific checks
      if (isGroup) {
        // Validate group metadata
        if (!groupMetadata || !groupMetadata.participants) {
          await Aeonify.sendMessage(jid, { 
            text: "*Error: Could not fetch group information!*" 
          });
          return false;
        }

        // Check if bot is admin for admin commands
        if (['promote', 'demote', 'kick', 'tagall', 'hidetag'].includes(commandType) && !isBotAdmin) {
          await Aeonify.sendMessage(jid, { 
            text: "*I need to be an admin to perform this action!*" 
          });
          return false;
        }

        // Check if user is admin or owner for admin commands
        if (['promote', 'demote', 'kick', 'tagall', 'hidetag'].includes(commandType)) {
          const senderParticipant = groupMetadata.participants.find(p => p.id === sender);
          const isUserAdmin = senderParticipant?.admin === 'admin' || senderParticipant?.admin === 'superadmin';
          
          if (!isUserAdmin && !this.isOwner(sender)) {
            await Aeonify.sendMessage(jid, { 
              text: "*Only admins and bot owners can use this command!*" 
            });
            return false;
          }
        }

        // 3. Target user validations (if applicable)
        if (targetUser) {
          const targetParticipant = groupMetadata.participants.find(p => p.id === targetUser);
          
          // Check if target exists in group
          if (!targetParticipant) {
            await Aeonify.sendMessage(jid, { 
              text: "*The target user is not in this group!*" 
            });
            return false;
          }

          // Prevent self-actions
          if (targetUser === sender) {
            await Aeonify.sendMessage(jid, { 
              text: "*You cannot perform this action on yourself!*" 
            });
            return false;
          }

          // Prevent actions on group owner
          if (targetParticipant.admin === 'superadmin') {
            await Aeonify.sendMessage(jid, { 
              text: "*You cannot perform this action on the group owner!*" 
            });
            return false;
          }

          // Command-specific target validations
          switch (commandType) {
            case 'kick':
              if (targetParticipant.admin) {
                await Aeonify.sendMessage(jid, { 
                  text: "*You cannot kick an admin!*" 
                });
                return false;
              }
              break;

            case 'promote':
              if (targetParticipant.admin) {
                await Aeonify.sendMessage(jid, { 
                  text: "*This user is already an admin!*" 
                });
                return false;
              }
              break;

            case 'demote':
              if (!targetParticipant.admin) {
                await Aeonify.sendMessage(jid, { 
                  text: "*This user is not an admin!*" 
                });
                return false;
              }
              break;

            case 'tagall':
            case 'hidetag':
              if (groupMetadata.participants.length === 0) {
                await Aeonify.sendMessage(jid, { 
                  text: "*No members found in this group!*" 
                });
                return false;
              }
              break;
          }
        }
      }

      console.log('Permission validation successful');
      return true;
    } catch (error) {
      console.error('Permission validation error:', {
        error: error.message,
        code: error.code,
        stack: error.stack
      });
      await Aeonify.sendMessage(jid, { 
        text: "*An error occurred while validating permissions!*" 
      });
      return false;
    }
  }

  static isOwner(sender) {
    try {
      const senderNumber = sender.split('@')[0];
      const ownerNumbers = Array.isArray(config.ownerNumber) 
        ? config.ownerNumber 
        : [config.ownerNumber].filter(Boolean);
      
      return ownerNumbers.some(ownerNum => 
        ownerNum === senderNumber || 
        ownerNum === sender.split('@')[0]
      );
    } catch (error) {
      console.error('Owner check error:', error);
      return false;
    }
  }
}

export default PermissionManager; 