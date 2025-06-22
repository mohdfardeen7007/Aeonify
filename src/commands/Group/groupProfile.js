import { requireGroupPermissions } from "../../utils/groupChecks.js";
import { extractTargetUserUniversal } from "../../utils/target.js";
import config from "../../config.js";

const groupProfileCommand = {
  name: "groupprofile",
  aliases: ["gprofile", "gp"],
  description: "View or change group profile picture",
  usage: "!groupprofile [image]",
  cooldown: 5000,

  run: async (ctx) => {
    const { Aeonify, messages: m, jid } = ctx;
    if (!(await requireGroupPermissions(ctx, { admin: true, botAdmin: true }))) return;
    try {
      await Aeonify.sendMessage(jid, { react: { text: "🖼️", key: m.key }});

      const quoted = m.quoted;
      if (!quoted || !quoted.message?.imageMessage) {
        return await Aeonify.sendMessage(jid, { text: "*Please reply to an image to set as group profile!*" });
      }

      const media = await Aeonify.downloadAndSaveMediaMessage(quoted);

      await Aeonify.updateProfilePicture(jid, { url: media })
        .then(async () => {
          await Aeonify.sendMessage(jid, { text: "🖼️ *Group profile picture updated successfully!*" });
        })
        .catch(async (err) => {
          console.error('Group profile update error:', err);
          await Aeonify.sendMessage(jid, { text: "*Failed to update group profile!* Please try again later." });
        });

    } catch (error) {
      console.error('Group profile command error:', error);
      await Aeonify.sendMessage(jid, { text: "*An error occurred!* Please try again later." });
    }
  }
};

export default groupProfileCommand; 