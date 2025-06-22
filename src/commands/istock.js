import axios from 'axios';
import config from '../config.js';

const istockCommand = {
  name: "istock",
  aliases: ["stock", "imgstock"],
  description: "Search iStock images via API.",
  usage: "!istock <search query>",
  cooldown: 3000,
  minArgs: 1,
  requiredArgs: [{ name: "query", required: true }],

  run: async ({ args, reply, react, client, messages, jid }) => {
    const query = args.join(" ");

    try {
      await react("🔎");

      const { data } = await axios.get(`${config.apiBaseUrl}/istock`, {
        params: { query }
      });

      if (!Array.isArray(data.images) || data.images.length === 0) {
        return reply("*No images found for your query.*");
      }

      for (const image of data.images) {
        await client.sendMessage(jid, {
          image: { url: image.thumbnailUrl },
          caption:
            `🖼️ *${image.caption}*\n` +
            `👨‍🎨 *Artist:* ${image.artist || 'Unknown'}\n` +
            `🔗 ${image.url}`
        }, { quoted: messages });
      }

    } catch (err) {
      console.error("istock command error:", err.message);
      return reply("⚠️ *Failed to fetch images. Try again later.*");
    }
  }
};

export default istockCommand;
