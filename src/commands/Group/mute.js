import { requireGroupPermissions } from "../../utils/groupChecks.js";
import config from "../../config.js";

const muteCommand = {
  name: "mute",
  aliases: ["silent"],
  description: "Change group settings to admin-only messages",
  usage: "!mute",
  cooldown: 5000,

  run: async (ctx) => {
    const { Aeonify, jid, messages: m } = ctx;
    if (!(await requireGroupPermissions(ctx, { admin: true, botAdmin: true }))) return;

    await Aeonify.sendMessage(jid, { react: { text: "🔇", key: m.key }});

    await Aeonify.groupSettingUpdate(jid, "announcement")
      .then(async () => {
        await Aeonify.sendMessage(jid, { text: "🔇 *Group has been muted!*\nOnly admins can send messages now." });
      })
      .catch(async (err) => {
        console.error('Mute error:', err);
        await Aeonify.sendMessage(jid, { text: "*Failed to mute group!* Please try again later." });
      });
  }
};

export default muteCommand;