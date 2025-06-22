import { requireGroupPermissions } from "../../utils/groupChecks.js";
import { extractTargetUserUniversal } from "../../utils/target.js";
import config from "../../config.js";

const kickCommand = {
  name: "kick",
  aliases: ["remove"],
  description: "Remove a user from the group",
  usage: "!kick @user/reply/number",
  cooldown: 5000,

  // Target extraction (mention, reply/quoted, number) is handled via universal utility
  run: async (ctx) => {
    const { Aeonify, jid, messages: m, groupMetadata, checkPermissions, args, message } = ctx;
    const { targetJid } = extractTargetUserUniversal({ m, args, message });
    const targetParticipant = targetJid && groupMetadata?.participants?.find(p => p.id === targetJid);
    if (!(await requireGroupPermissions({ ...ctx, targetUser: targetJid, targetParticipant }, { admin: true, botAdmin: true, target: true }))) return;

    // Validate permissions using the context's checkPermissions function
    const hasPermission = await checkPermissions(targetJid);
    if (!hasPermission) return;

    // React to command
    await Aeonify.sendMessage(jid, { react: { text: "👢", key: m.key }});

    // Kick user
    await Aeonify.groupParticipantsUpdate(jid, [targetJid], "remove")
      .then(async () => {
        await Aeonify.sendMessage(jid, { 
          text: `👢 *Kicked Successfully!*\n👤 @${targetJid.split('@')[0]}\n👋 Goodbye!`,
          mentions: [targetJid]
        });
      })
      .catch(async (err) => {
        console.error('Kick error:', err);
        await Aeonify.sendMessage(jid, { text: "*Failed to kick user!* Please try again later." });
      });
  }
};

export default kickCommand;