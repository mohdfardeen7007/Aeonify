const setCooldownCommand = {
  name: "cooldown",
  aliases: ["cooldown", "cd"],
  description: "Dynamically update cooldown for a specific command. Owner only.",
  usage: "!setcooldown <command> <milliseconds>",
  run: async ({ client, message, args, senderNumber, config }) => {
    const isOwner = config.owner?.number?.includes(senderNumber);
    if (!isOwner) {
      await client.sendMessage(
        message.key.remoteJid,
        { text: "Only the bot owner can update cooldowns." },
        { quoted: message }
      );
      return;
    }

    const [cmdName, cdValue] = args;
    if (!cmdName || isNaN(cdValue)) {
      await client.sendMessage(
        message.key.remoteJid,
        {
          text: `❗ Usage: *${config.prefix}setcooldown <command> <milliseconds>*\nExample: *${config.prefix}setcooldown ping 5000*`,
        },
        { quoted: message }
      );
      return;
    }

    const targetCommand =
      global.commands.get(cmdName.toLowerCase()) ||
      [...global.commands.values()].find((cmd) =>
        cmd.aliases?.includes(cmdName.toLowerCase())
      );

    if (!targetCommand) {
      await client.sendMessage(
        message.key.remoteJid,
        {
          text: `Command not found: *${cmdName}*`,
        },
        { quoted: message }
      );
      return;
    }

    targetCommand.cooldown = parseInt(cdValue);
    await client.sendMessage(
      message.key.remoteJid,
      {
        text: `✅ Cooldown for *${targetCommand.name}* updated to *${cdValue}ms*!`,
      },
      { quoted: message }
    );
  },
};

export default setCooldownCommand;