const screenshotCommand = {
  name: "screenshot",
  aliases: ["ss"],
  description: "Takes a screenshot of a website",
  usage: "!screenshot <url>",
  cooldown: 5000,

  run: async ({ client, jid, reply, args }) => {
    if (!args.length) {
      return reply("❌ *Please provide a URL!*\nUsage: !screenshot <url>");
    }

    try {
      const url = args[0];
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return reply("❌ *Invalid URL!* Please provide a valid URL starting with http:// or https://");
      }

      // Send processing message
      await reply("⏳ *Taking screenshot...* Please wait.");

      // Use a screenshot service API
      const apiKey = process.env.SCREENSHOT_API_KEY;
      if (!apiKey) {
        return reply("❌ *Screenshot API key not configured!*");
      }

      const screenshotUrl = `https://api.screenshotmachine.com?key=${apiKey}&url=${encodeURIComponent(url)}&dimension=1024x768&device=desktop&format=jpg&cacheLimit=0`;

      // Send the screenshot
      await client.sendMessage(jid, {
        image: { url: screenshotUrl },
        caption: `📸 *Screenshot of:* ${url}\n⏰ *Taken at:* ${new Date().toLocaleString()}`
      });
    } catch (error) {
      console.error('Screenshot command error:', error);
      await reply("❌ *Failed to take screenshot!* Please check the URL and try again.");
    }
  }
};

export default screenshotCommand; 