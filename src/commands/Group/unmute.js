import { requireGroupPermissions } from "../../utils/groupChecks.js";
import config from "../../config.js";

const unmuteCommand = {
  name: "unmute",
  aliases: ["unsilent"],
  description: "Change group settings back to allow all participants to send messages",
  usage: "!unmute",
  cooldown: 5000,

  run: async (ctx) => {
    const { Aeonify, jid, messages: m } = ctx;
    if (!(await requireGroupPermissions(ctx, { admin: true, botAdmin: true }))) return;

    await Aeonify.sendMessage(jid, { react: { text: "🔊", key: m.key }});

    await Aeonify.groupSettingUpdate(jid, "not_announcement")
      .then(async () => {
        await Aeonify.sendMessage(jid, { text: "🔊 *Group has been unmuted!*\nAll participants can send messages now." });
      })
      .catch(async (err) => {
        console.error('Unmute error:', err);
        await Aeonify.sendMessage(jid, { text: "*Failed to unmute group!* Please try again later." });
      });
  }
};

export default unmuteCommand;
