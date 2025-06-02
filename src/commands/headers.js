import axios from "axios";

const headersCommand = {
  name: "headers",
  aliases: ["header", "hdr"],
  description: "Fetch and display HTTP headers of a URL",
  usage: "!headers <url>",

  run: async ({ client, from, args, message }) => {
    if (!args.length) {
      return await client.sendMessage(from, {
        text: "❗ Usage: !headers <url>",
      }, { quoted: message });
    }

    let url = args[0];
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "http://" + url; // add default protocol if missing
    }

    try {
      // Use HEAD request to just fetch headers (lighter)
      const response = await axios.head(url, { timeout: 5000 });

      const headers = response.headers;
      const formattedHeaders = Object.entries(headers)
        .map(([key, val]) => `• *${key}*: ${val}`)
        .join("\n");

      const replyText = `📡 HTTP Headers for:\n${url}\n\n${formattedHeaders}`;

      await client.sendMessage(from, { text: replyText }, { quoted: message });
    } catch (error) {
      await client.sendMessage(from, {
        text: `Failed to fetch headers.\nError: ${error.message}`,
      }, { quoted: message });
    }
  },
};

export default headersCommand;
