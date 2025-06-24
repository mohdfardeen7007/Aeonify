import axios from "axios";

const headersCommand = {
  name: "headers",
  aliases: ["header", "hdr"],
  description: "Fetch and display HTTP headers of a URL",
  usage: "!headers <url>",
  category: "tools",
  cooldown: 5000,
  minArgs: 1,
  requiredArgs: [{ name: "url", required: true }],

  run: async ({ Aeonify, jid, args, message, react, utils, senderName }) => {
    let processingMsg = null;
    try {
      let url = args[0];
      if (!/^https?:\/\//i.test(url)) {
        url = "https://" + url;
      }

      // Validate URL
      try {
        new URL(url);
      } catch (e) {
        await react("❌");
        return Aeonify.sendMessage(jid, {
          text: "❗ Invalid URL format. Please provide a valid URL.",
        }, { quoted: message });
      }

      await react("🔍");

      processingMsg = await Aeonify.sendMessage(jid, {
        text: `*Fetching headers for:*\n${url}\n*This may take a moment...*`
      }, { quoted: message });

      let response;
      try {
        response = await axios.head(url, { 
          timeout: 10000,
          maxRedirects: 5,
          validateStatus: (status) => status < 500
        });
      } catch (error) {
        // If HEAD fails, try GET (some servers don't support HEAD)
        if (error.response && error.response.status === 405) {
          response = await axios.get(url, { 
            timeout: 10000,
            maxRedirects: 5,
            validateStatus: (status) => status < 500
          });
        } else {
          throw error;
        }
      }

      const headers = response.headers;
      const formattedHeaders = Object.entries(headers || {})
        .map(([key, val]) => `• *${key}*: ${val}`)
        .join("\n") || "_No headers found._";

      const replyText = `📡 *HTTP Headers for:*\n${url}\n\n*Status:* ${response.status} ${response.statusText}\n\n${formattedHeaders}`;

      if (processingMsg) {
        await Aeonify.sendMessage(jid, { delete: processingMsg.key });
      }

      await react("✨");
      return Aeonify.sendMessage(jid, { text: replyText }, { quoted: message });

    } catch (error) {
      await react("❌");
      if (processingMsg) {
        await Aeonify.sendMessage(jid, { delete: processingMsg.key });
      }

      console.error("Headers command error:", {
        error: error.message,
        code: error.code,
        response: error.response?.data,
        url: error.config?.url,
        user: senderName
      });

      let errorMsg = "*Headers Command Error*\n\n";

      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        errorMsg += "Request timeout. The server might be slow or unresponsive.";
      } else if (error.response?.status === 429) {
        errorMsg += "Rate limit exceeded. Please wait a moment and try again.";
      } else if (error.response?.status >= 500) {
        errorMsg += "Server error. The target website might be having issues.";
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        errorMsg += "Cannot connect to the server. Please check the URL and try again.";
      } else if (error.code === 'ERR_TLS_CERT_ALTNAME_INVALID') {
        errorMsg += "SSL/TLS certificate error. The website's security certificate is invalid.";
      } else if (error.response?.status === 405) {
        errorMsg += "The server does not support HEAD requests. Try another URL.";
      } else {
        errorMsg += `Failed to fetch headers: ${error.message}`;
      }

      return Aeonify.sendMessage(jid, { text: errorMsg }, { quoted: message });
    }
  },
};

export default headersCommand;
