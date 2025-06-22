import config from '../../config.js';

const help = async ({ Aeonify, args, reply, commands, prefix, chat }) => {
  const helpImageUrl = "https://res.cloudinary.com/dw7zhkgjy/image/upload/v1750342851/Aeonify_ip2z37.jpg";

  if (!args.length) {
    const commandList = Array.from(commands.entries())
      .filter(([name, cmd]) => !cmd.aliases?.includes(name))
      .sort(([a], [b]) => a.localeCompare(b));

    let helpText = `*Aeonify Bot Commands*\n\n`;
    helpText += `*Prefix:* \`${prefix}\`\n\n`;
    helpText += `*Commands:*\n`;
    
    for (const [name, command] of commandList) {
      const aliases = command.aliases?.length ? 
        ` (aliases: ${command.aliases.map(a => `${prefix}${a}`).join(", ")})` : "";
      helpText += `• *${prefix}${name}*${aliases}\n  ${command.description || "No description"}\n\n`;
    }
    
    helpText += `*Usage:*\n`;
    helpText += `• \`${prefix}help\` - Show this menu\n`;
    helpText += `• \`${prefix}help <command>\` - Show detailed command info\n`;
    helpText += `• \`${prefix}help search <query>\` - Search for commands\n\n`;
    helpText += `_Type ${prefix}help <command> for detailed info_`;

    await Aeonify.sendMessage(chat, {
      image: { url: helpImageUrl },
      caption: helpText.trim()
    });
    return;
  }

  if (args[0].toLowerCase() === 'search' && args.length > 1) {
    const query = args.slice(1).join(' ').toLowerCase();
    const matches = Array.from(commands.entries())
      .filter(([name, cmd]) => {
        const searchStr = `${name} ${cmd.aliases?.join(' ')} ${cmd.description}`.toLowerCase();
        return searchStr.includes(query);
      });

    if (!matches.length) {
      await reply(`No commands found matching "*${query}*"`);
      return;
    }

    let searchText = `*Search Results for "${query}"*\n\n`;
    for (const [name, cmd] of matches) {
      const aliases = cmd.aliases?.length ? 
        ` (aliases: ${cmd.aliases.map(a => `${prefix}${a}`).join(", ")})` : "";
      searchText += `• *${prefix}${name}*${aliases}\n  ${cmd.description || "No description"}\n\n`;
    }
    searchText += `_Use ${prefix}help <command> for detailed info_`;

    await reply(searchText.trim());
    return;
  }

  const name = args[0].toLowerCase();
  const command = commands.get(name);

  if (!command) {
    await reply(`Command not found: *${name}*\n\nTry:\n• \`${prefix}help\` to see all commands\n• \`${prefix}help search <query>\` to search commands`);
    return;
  }

  let detail = `*Command Details*\n\n`;
  detail += `*Name:* ${prefix}${command.name}\n`;
  if (command.aliases?.length) detail += `*Aliases:* ${command.aliases.map(a => `${prefix}${a}`).join(", ")}\n`;
  if (command.description) detail += `*Description:* ${command.description}\n`;
  if (command.usage) detail += `*Usage:* \`${command.usage.replace(/!/g, prefix)}\`\n`;
  if (command.cooldown) detail += `*Cooldown:* ${command.cooldown}ms\n`;
  if (command.ownerOnly) detail += `*Access:* Owner Only\n`;
  if (command.adminOnly) detail += `*Access:* Admin Only\n`;
  if (command.minArgs !== undefined) detail += `*Min Args:* ${command.minArgs}\n`;
  if (command.maxArgs !== undefined) detail += `*Max Args:* ${command.maxArgs}\n`;

  await reply(detail.trim());
};

export default {
  name: "help",
  aliases: ["h", "menu", "?"],
  description: "Lists all available commands with descriptions. Use `help <command>` for detailed info.",
  cooldown: 1000,
  usage: "help [command]",
  run: help,
};
