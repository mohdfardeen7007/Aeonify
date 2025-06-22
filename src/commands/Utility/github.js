import githubstalk from "../../library/githubstalk.js"

const githubCommand = {
  name: "github",
  aliases: ["gitstalk", "ghstalk"],
  description: "Get GitHub user information",
  usage: "!github <username>",
  cooldown: 5000,
  minArgs: 1,
  maxArgs: 1,

  run: async ({ Aeonify, jid, message, args, reply, react }) => {
    try {
      const username = args[0];
      if (!username) {
        return reply(`Please provide a GitHub username.\nExample: *!github Aeon-San*`);
      }

      await react("🔍");

      const gitdata = await githubstalk(username);

      const response = `*ㅤㅤㅤ|ㅤㅤㅤGithub Info ㅤㅤㅤ|*\n\n` +
        `🚩 *Id:* ${gitdata.id}\n` +
        `🔖 *Nickname:* ${gitdata.nickname}\n` +
        `🔖 *Username:* ${gitdata.username}\n` +
        `✨ *Bio:* ${gitdata.bio}\n` +
        `🏢 *Company:* ${gitdata.company}\n` +
        `📍 *Location:* ${gitdata.location}\n` +
        `📧 *Email:* ${gitdata.email}\n` +
        `🔓 *Public Repo:* ${gitdata.public_repo}\n` +
        `🔐 *Public Gists:* ${gitdata.public_gists}\n` +
        `💕 *Followers:* ${gitdata.followers}\n` +
        `👉 *Following:* ${gitdata.following}`;

      await Aeonify.sendMessage(jid, {
        image: { url: gitdata.profile_pic },
        caption: response
      });

    } catch (error) {
      console.error('Error in github command:', error);
      await reply('*Error fetching GitHub information*\nPlease check if the username is valid and try again.');
    }
  }
};

export default githubCommand;