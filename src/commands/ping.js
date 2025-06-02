const pingCommand = {
  name: "ping",
  aliases: ["p", "check"],
  description: "Check if the bot is alive and measure response time.",
  cooldown: 2000, // 2 seconds
  
  run: async ({ client, messages, reply, senderNumber, senderName, isGroup, groupName }) => {
    const start = Date.now();
    
    // Get the correct JID for sending message
    const jid = messages.key.remoteJid;
    
    // Send initial ping message
    const sentMsg = await client.sendMessage(
      jid,
      { text: "🏓 Pinging..." },
      { quoted: messages }
    );
    
    const end = Date.now();
    const latency = end - start;
    
    // Prepare response text
    const responseText = `🏓 *Pong!*
📶 *Latency:* ${latency}ms
👤 *User:* ${senderName}
📱 *Number:* ${senderNumber}
💬 *Chat:* ${isGroup ? `Group - ${groupName}` : 'Private Chat'}
⏰ *Time:* ${new Date().toLocaleString()}`;
    
    // Send final response
    await client.sendMessage(
      jid,
      {
        text: responseText,
      },
      { quoted: sentMsg }
    );
  },
};

export default pingCommand;