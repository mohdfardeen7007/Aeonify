import axios from "axios";
import config from '../../config.js';

const reelCommand = {
  name: "reel",
  aliases: ["reels", "insta", "ig"],
  description: "Download Instagram reel video by URL.",
  usage: "!reel <instagram_reel_url>",
  cooldown: 5000,

  run: async ({ Aeonify, messages, args, jid, reply, isQuotedText, quoted, query, isSelf }) => {
    let url = args[0];
    
    if (isQuotedText && quoted?.text) {
      const quotedText = quoted.text;
      const urlMatch = quotedText.match(/https?:\/\/(www\.)?instagram\.com\/reel\/[a-zA-Z0-9_-]+/);
      if (urlMatch) url = urlMatch[0];
    }
    
    if (!url && query) {
      const urlMatch = query.match(/https?:\/\/(www\.)?instagram\.com\/reel\/[a-zA-Z0-9_-]+/);
      if (urlMatch) url = urlMatch[0];
    }

    if (!url) {
      return reply("Usage: !reel <Instagram reel URL> or reply to a message containing reel URL");
    }

    const isValidURL = /^https?:\/\/(www\.)?instagram\.com\/reel\/[a-zA-Z0-9_-]+/.test(url);

    if (!isValidURL) {
      return reply("Invalid reel URL. Please provide a valid Instagram reel link.");
    }

    const processingMsg = await reply("⏳ Processing reel... Please wait.");

    try {
      const apiBaseUrl = config.apiBaseUrl || process.env.API_BASE_URL;
      const apiUrl = `${apiBaseUrl.replace(/\/$/, '')}/dl/reels`;
      const { data } = await axios.get(apiUrl, { params: { url } });

      if (!data.downloadUrl) {
        await Aeonify.sendMessage(jid, { delete: processingMsg.key });
        return reply("Failed to fetch download link. The reel might be private or invalid.");
      }

      await Aeonify.sendMessage(jid, { delete: processingMsg.key });

      await Aeonify.sendMessage(jid, {
        video: { url: data.downloadUrl },
        caption: `🎬 *Instagram Reel*\n\n📥 Downloaded by: ${messages.pushName || 'User'}`
      }, { quoted: messages });

    } catch (err) {
      console.error("Reel Downloader Error:", err.message);
      
      await Aeonify.sendMessage(jid, { delete: processingMsg.key });
      
      await reply(`Error: ${err.message || "Something went wrong!"}`);
    }
  },
};

export default reelCommand;
