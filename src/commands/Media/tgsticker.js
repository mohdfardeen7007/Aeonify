import axios from 'axios';
import config from '../../config.js';

const tgstickerCommand = {
  name: "tgsticker",
  aliases: ["telegramsticker", "tgs", "stickerpack"],
  description: "Download all stickers from a Telegram sticker pack",
  usage: "!tgsticker <telegram_sticker_url>",
  cooldown: 10000,
  minArgs: 1,
  maxArgs: 1,

  run: async ({ args, reply, react, Aeonify, jid, messages, senderName, isGroup, sender }) => {
    const url = args[0];
    
    if (!url.match(/^https:\/\/t\.me\/addstickers\/[a-zA-Z0-9_]+$/)) {
      return reply("*Invalid Telegram sticker URL!*\n\n" +
        "*Usage:* `!tgsticker <telegram_sticker_url>`\n" +
        "*Example:* `!tgsticker https://t.me/addstickers/funnyMemesPack`");
    }

    try {
      await react("⏳");
      
      if (isGroup) {
        await reply("*📦 Sticker Download Started!*\n\n" +
          `👤 *User:* ${senderName}\n` +
          `📦 *URL:* ${url}\n\n` +
          "*📱 Check your DM for the stickers!*");
      }

      const processingMsg = await Aeonify.sendMessage(sender, {
        text: "*🔄 Fetching sticker pack...*\n\n" +
          `📦 *URL:* ${url}\n` +
          "*⏱️ Please wait...*"
      });

      const apiUrl = `${config.apiBaseUrl}/dl/tgstickers`;
      console.log(`Making request to: ${apiUrl} with URL: ${url}`);

      const { data } = await axios.get(apiUrl, {
        params: { url },
        timeout: 30000
      });

      if (!data || !data.stickers || !Array.isArray(data.stickers)) {
        throw new Error('Invalid response from API');
      }

      if (data.stickers.length === 0) {
        await Aeonify.sendMessage(sender, { delete: processingMsg.key });
        await Aeonify.sendMessage(sender, { text: "*No stickers found in this pack!*" });
        return;
      }

      await react("✨");

      await Aeonify.sendMessage(sender, { delete: processingMsg.key });

      await Aeonify.sendMessage(sender, {
        text: `📦 *Sticker Pack Found!*\n\n` +
          `📛 *Name:* ${data.name || 'Unknown'}\n` +
          `📝 *Title:* ${data.title || 'Unknown'}\n` +
          `🎯 *Stickers:* ${data.stickers.length}\n` +
          `👤 *By:* ${senderName}\n\n` +
          `*⏳ Sending all stickers...*`
      });

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < data.stickers.length; i++) {
        const sticker = data.stickers[i];
        
        try {
          await Aeonify.sendMessage(sender, {
            sticker: { url: sticker.image_url }
          });
          successCount++;
          
          if (i < data.stickers.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }

        } catch (error) {
          console.error(`Error sending sticker ${i + 1}:`, error);
          errorCount++;
        }
      }

      await Aeonify.sendMessage(sender, {
        text: `✅ *Download Complete!*\n\n` +
          `✅ *Sent:* ${successCount} stickers\n` +
          `*Failed:* ${errorCount} stickers\n` +
          `📦 *Pack:* ${data.name || 'Unknown'}`
      });

      if (isGroup) {
        await reply(`✅ *Sticker download completed!*\n\n` +
          `👤 *User:* ${senderName}\n` +
          `✅ *Sent:* ${successCount} stickers\n` +
          `📱 *Check your DM for the stickers!*`);
      }

    } catch (error) {
      await react("❌");
      
      console.error('Telegram sticker error:', error);
      
      let errorMsg = "*Failed to download stickers!*\n\n";
      
      if (error.message.includes('timeout')) {
        errorMsg += "⏱️ Request timeout. Try again.";
      } else if (error.response?.status === 404) {
        errorMsg += "🔍 Sticker pack not found. Check the URL.";
      } else if (error.response?.status === 403) {
        errorMsg += "🚫 Access denied. Pack might be private.";
      } else {
        errorMsg += `Error: ${error.message}`;
      }

      await Aeonify.sendMessage(sender, { text: errorMsg });
      
      if (isGroup) {
        await reply(`*Sticker download failed!*\n\n` +
          `👤 *User:* ${senderName}\n` +
          `📱 *Check your DM for error details*`);
      }
    }
  }
};

export default tgstickerCommand; 