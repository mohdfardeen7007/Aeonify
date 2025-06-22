import { requireGroupPermissions } from "../../utils/groupChecks.js";
import { extractTargetUserUniversal } from "../../utils/target.js";
import config from "../../config.js";

const hidetagCommand = {
  name: "hidetag",
  aliases: ["htag", "ping"],
  description: "Tag all group members with hidden notification",
  usage: "!hidetag <message>",
  cooldown: 5000,

  run: async (ctx) => {
    const { Aeonify, jid, messages: m, groupMetadata } = ctx;
    let { text } = ctx;
    if (!(await requireGroupPermissions(ctx, { admin: true }))) return;
    if (!text) {
      text = "Attention everyone!";
    }
    await Aeonify.sendMessage(jid, { react: { text: "📢", key: m.key }});
    const mentions = groupMetadata.participants.map(p => p.id);
    await Aeonify.sendMessage(jid, {
      text: `📢 *Group Announcement*\n\n${text}`,
      mentions
    })
    .catch(async (err) => {
      console.error('Hidetag error:', err);
      await Aeonify.sendMessage(jid, { text: "*Failed to send announcement!* Please try again later." });
    });
  }
};

export default hidetagCommand;
