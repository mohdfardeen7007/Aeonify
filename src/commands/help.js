const help = async ({ client, jid, messages, args, commands }) => {
  if (!args.length) {
    // Show all commands summary
    let helpText = "*🤖 Aeonify Bot Commands*\n\n";
    
    // Convert Map to Array and sort by command name
    const commandList = Array.from(commands.entries())
      .filter(([name, cmd]) => !cmd.aliases?.includes(name)) // Filter out aliases
      .sort(([a], [b]) => a.localeCompare(b)); // Sort alphabetically
    
    for (const [name, command] of commandList) {
      const aliases = command.aliases?.length ? ` (aliases: ${command.aliases.join(", ")})` : "";
      helpText += `• *${name}*${aliases}\n  ${command.description || "No description"}\n\n`;
    }
    
    await client.sendMessage(jid, { text: helpText.trim() }, { quoted: messages });
    return;
  }

  // Show detailed info for a specific command
  const name = args[0].toLowerCase();
  const command = commands.get(name);

  if (!command) {
    await client.sendMessage(jid, { text: `❌ Command not found: *${name}*` }, { quoted: messages });
    return;
  }

  let detail = `📖 *Command:* ${command.name}\n`;
  if (command.aliases?.length) detail += `*Aliases:* ${command.aliases.join(", ")}\n`;
  if (command.description) detail += `*Description:* ${command.description}\n`;
  if (command.usage) detail += `*Usage:* \`${command.usage}\`\n`;
  if (command.cooldown) detail += `*Cooldown:* ${command.cooldown} ms\n`;

  await client.sendMessage(jid, { text: detail.trim() }, { quoted: messages });
};

export default {
  name: "help",
  aliases: ["h", "menu", "?"],
  description: "📖 Lists all available commands with descriptions. Use `help <command>` for detailed info.",
  cooldown: 1000,
  usage: "help [command]",
  run: help,
};
