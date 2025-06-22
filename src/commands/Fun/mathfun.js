import axios from "axios";

const mathFunCommand = {
  name: "mathfun",
  aliases: ["math", "fun"],
  description: "Various mathematical and fun operations",
  usage:
    "!mathfun [operation] [input]\nOperations: prime, factorial, palindrome, matchname",
  cooldown: 1000,

  run: async (context) => {
    try {
      const { reply, args } = context;

      if (args.length < 2) {
        return await reply(
          `*Math Fun Command* 🎲\n\n` +
            `_Available Operations:_\n` +
            `• ${context.prefix}mathfun prime [number]\n` +
            `• ${context.prefix}mathfun factorial [number]\n` +
            `• ${context.prefix}mathfun palindrome [word]\n` +
            `• ${context.prefix}mathfun matchname [name1] [name2]\n\n` +
            `_Examples:_\n` +
            `• ${context.prefix}mathfun prime 17\n` +
            `• ${context.prefix}mathfun factorial 5\n` +
            `• ${context.prefix}mathfun palindrome radar\n` +
            `• ${context.prefix}mathfun matchname John Jane`
        );
      }

      const operation = args[0].toLowerCase();
      const input = args.slice(1);

      const processingMsg = await reply("*Processing your request...* 🔄");

      try {
        let endpoint = "";

        switch (operation) {
          case "prime":
            if (!/^\d+$/.test(input[0])) {
              return await reply(
                "*Error:* Please provide a valid number for prime check."
              );
            }
            endpoint = `${process.env.API_BASE_URL}/prime/${input[0]}`;
            break;

          case "factorial":
            if (!/^\d+$/.test(input[0])) {
              return await reply(
                "*Error:* Please provide a valid number for factorial."
              );
            }
            endpoint = `${process.env.API_BASE_URL}/factorial/${input[0]}`;
            break;

          case "palindrome":
            if (!input[0]) {
              return await reply(
                "*Error:* Please provide a word to check for palindrome."
              );
            }
            endpoint = `${process.env.API_BASE_URL}/palindrome/${input[0]}`;
            break;

          case "matchname":
            if (input.length < 2) {
              return await reply("*Error:* Please provide two names to match.");
            }
            endpoint = `${process.env.API_BASE_URL}/matchname/${input[0]}/${input[1]}`;
            break;

          default:
            return await reply(
              "*Error:* Invalid operation.\n\n" +
                "_Available operations:_\n" +
                "• prime\n" +
                "• factorial\n" +
                "• palindrome\n" +
                "• matchname"
            );
        }

        const { data } = await axios.get(endpoint);

        let responseText = `*${operation.toUpperCase()} Result* 🎯\n\n`;

        switch (operation) {
          case "prime":
            if (data.message) {
              responseText += `*Error:* ${data.message}\n`;
            } else {
              responseText +=
                `Number: ${data.number}\n` +
                `Is Prime: ${data.prime ? "✅ Yes" : "❌ No"}\n`;
            }
            break;

          case "factorial":
            if (data.error) {
              responseText += `*Error:* ${data.error}\n`;
            } else {
              responseText +=
                `Number: ${data.number}\n` + `Factorial: ${data.factorial}\n`;
            }
            break;

          case "palindrome":
            responseText +=
              `Word: ${data.word}\n` +
              `Is Palindrome: ${data.isPalindrome ? "✅ Yes" : "❌ No"}\n`;
            break;

          case "matchname":
            responseText +=
              `Name 1: ${data.name1}\n` +
              `Name 2: ${data.name2}\n` +
              `Compatibility: ${data.compatibility}\n` +
              `Message: ${data.message}\n`;
            break;
        }

        await reply(responseText);
      } catch (error) {
        console.error("Math Fun API error:", error);
        await reply(
          "*Error:* Could not process your request. Please try again later."
        );
      }
    } catch (error) {
      console.error("Math Fun command error:", error);
      await context.reply("*An error occurred!* Please try again later.");
    }
  },
};

export default mathFunCommand;
