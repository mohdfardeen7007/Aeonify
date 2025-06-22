const editCommand = {
  name: "edit",
  aliases: ["editmsg", "editmessage"],
  description: "Demonstrate message editing and deletion",
  usage: "!edit",
  cooldown: 5000,
  minArgs: 0,
  maxArgs: 0,

  run: async ({ Aeonify, jid, message, reply, deleteMessage, editMessage }) => {
    try {
      // First send a message
      const sentMsg = await reply("This message will be edited in 3 seconds...");
      
      // Wait 3 seconds
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Edit the message
      await editMessage(sentMsg.key, { text: "This message was edited!" });
      
      // Wait 3 more seconds
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Delete the message
      await deleteMessage(sentMsg.key);
      
    } catch (error) {
      console.error('Error in edit command:', error);
      await reply('*Error demonstrating message features*');
    }
  }
};

export default editCommand; 