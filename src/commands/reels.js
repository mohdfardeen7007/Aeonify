import axios from "axios";
import qs from "qs";

const reelCommand = {
  name: "reel",
  aliases: ["reels", "insta", "ig"],
  description: "Download Instagram reel video by URL.",
  usage: "!reel <instagram_reel_url>",
  cooldown: 5000,

  run: async ({ client, messages, args, jid, reply, isQuotedText, quoted, query }) => {
    let url = args[0];
    
    // Check if URL is in quoted message
    if (isQuotedText && quoted?.text) {
      const quotedText = quoted.text;
      const urlMatch = quotedText.match(/https?:\/\/(www\.)?instagram\.com\/reel\/[a-zA-Z0-9_-]+/);
      if (urlMatch) url = urlMatch[0];
    }
    
    // Check if URL is in query
    if (!url && query) {
      const urlMatch = query.match(/https?:\/\/(www\.)?instagram\.com\/reel\/[a-zA-Z0-9_-]+/);
      if (urlMatch) url = urlMatch[0];
    }

    if (!url) {
      return reply("❗ Usage: !reel <Instagram reel URL> or reply to a message containing reel URL");
    }

    const isValidURL = /^https?:\/\/(www\.)?instagram\.com\/reel\/[a-zA-Z0-9_-]+/.test(url);

    if (!isValidURL) {
      return reply("⚠️ Invalid reel URL. Please provide a valid Instagram reel link.");
    }

    const processingMsg = await reply("⏳ Processing reel... Please wait.");

    const uri = "https://snapins.ai/action.php";
    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "*/*",
      "Origin": "https://snapins.ai",
      "Referer": "https://snapins.ai/",
      "User-Agent": "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N)",
    };

    const payload = qs.stringify({ url });

    try {
      const response = await axios.post(uri, payload, { headers });
      const data = response.data?.data?.[0];

      if (!data?.downloadUrl) {
        await client.sendMessage(jid, { 
          delete: processingMsg.key 
        });
        return reply("Failed to fetch download link. The reel might be private or invalid.");
      }

      const videoUrl = data.downloadUrl;
      
      await client.sendMessage(jid, { 
        delete: processingMsg.key 
      });

      await client.sendMessage(jid, {
        video: { url: videoUrl },
        caption: `🎥 *Instagram Reel*\n\n📥 Downloaded by: ${messages.pushName || 'User'}`
      }, { quoted: messages });

    } catch (err) {
      console.error("Reel Downloader Error:", err.message);
      
      // Delete processing message
      await client.sendMessage(jid, { 
        delete: processingMsg.key 
      });
      
      await reply(`Error: ${err.message || "Something went wrong!"}`);
    }
  },
};

export default reelCommand;
