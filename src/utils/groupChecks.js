export async function requireGroupPermissions(ctx, { admin = false, botAdmin = false, target = false } = {}) {
  const { isGroup, isAdmin, isBotAdmin, targetUser, targetParticipant, jid, Aeonify } = ctx;
  if (!isGroup) {
    await Aeonify.sendMessage(jid, { text: "*This command can only be used in groups!*" });
    return false;
  }
  if (admin && !isAdmin) {
    await Aeonify.sendMessage(jid, { text: "*You need to be an admin to use this!*" });
    return false;
  }
  if (botAdmin && !isBotAdmin) {
    await Aeonify.sendMessage(jid, { text: "*I need to be an admin to do this!*" });
    return false;
  }
  if (target && !targetUser) {
    await Aeonify.sendMessage(jid, { text: "*Tag someone, reply to their message, or enter their number!*" });
    return false;
  }
  if (target && !targetParticipant) {
    await Aeonify.sendMessage(jid, { text: "*That user is not in this group!*" });
    return false;
  }
  return true;
} 