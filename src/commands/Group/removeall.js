import { requireGroupPermissions } from "../../utils/groupChecks.js";
import config from "../../config.js";

const removeAllCommand = {
  name: "removeall",
  aliases: ["kickall"],
  description: "Remove all non-admin members from the group (admins/owner/bot are safe)",
  usage: "!removeall confirm",
  cooldown: 10000,

  run: async (ctx) => {
    const { Aeonify, jid, groupMetadata, messages: m, isAdmin, isBotAdmin, sender, botNumber, args } = ctx;
    if (!(await requireGroupPermissions(ctx, { admin: true, botAdmin: true }))) return;

    if (!args[0] || args[0].toLowerCase() !== "confirm") {
      return Aeonify.sendMessage(jid, { text: "⚠️ *This will remove all non-admin members!*\nType `!removeall confirm` to proceed." });
    }

    const botJid = botNumber || Aeonify.user.id;
    const nonAdmins = groupMetadata.participants.filter(
      p => !p.admin && p.id !== botJid
    ).map(p => p.id);

    if (!nonAdmins.length) {
      return Aeonify.sendMessage(jid, { text: "✅ No non-admin members to remove!" });
    }

    await Aeonify.sendMessage(jid, { react: { text: "⚡", key: m.key } });

    for (let i = 0; i < nonAdmins.length; i += 5) {
      const batch = nonAdmins.slice(i, i + 5);
      await Aeonify.groupParticipantsUpdate(jid, batch, "remove");
      await new Promise(res => setTimeout(res, 1000));
    }

    await Aeonify.sendMessage(jid, { text: `✅ *Removed ${nonAdmins.length} non-admin members!*` });
  }
};

export default removeAllCommand; 