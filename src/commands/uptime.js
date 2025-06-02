const uptimeCommand = {
  name: "uptime",
  aliases: ["runtime", "alive"],
  description: "Show bot's uptime",
  usage: "!uptime",
  cooldown: 3000,

  run: async ({ client, jid, messages }) => {
    try {
      const uptime = process.uptime();
      const days = Math.floor(uptime / 86400);
      const hours = Math.floor((uptime % 86400) / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = Math.floor(uptime % 60);

      const message = `🤖 *Bot Uptime*\n\n` +
        `⏱️ *Runtime:*\n` +
        `📅 ${days} days\n` +
        `⏰ ${hours} hours\n` +
        `⏳ ${minutes} minutes\n` +
        `⌛ ${seconds} seconds\n\n` +
        `🔄 *Total seconds:* ${Math.floor(uptime)}`;

      await client.sendMessage(jid, { text: message }, { quoted: messages });
    } catch (error) {
      console.error('Uptime command error:', error);
      await client.sendMessage(jid, { text: "*Failed to get uptime!*" }, { quoted: messages });
    }
  }
};

export default uptimeCommand;
