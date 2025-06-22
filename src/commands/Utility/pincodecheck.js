import axios from 'axios';

const pincodeCheckCommand = {
  name: "pincodecheck",
  aliases: ["pincode", "postal"],
  description: "Check details of an Indian postal pincode",
  usage: "!pincodecheck [pincode]",
  cooldown: 1000,
  
  run: async (context) => {
    try {
      const { reply, args } = context;
      
      if (!args.length) {
        return await reply(
          `*Pincode Check Command* 📬\n\n` +
          `_Usage:_\n` +
          `• ${context.prefix}pincodecheck [pincode]\n\n` +
          `_Example:_\n` +
          `• ${context.prefix}pincodecheck 722148\n\n` +
          `_This will show all post offices and details for the given pincode_`
        );
      }
      
      const pincode = args[0].trim();
      
      if (!/^\d{6}$/.test(pincode)) {
        return await reply("*Error:* Invalid pincode format. Please provide a 6-digit pincode.");
      }
      
      const processingMsg = await reply("*Fetching pincode details...* 🔍");
      
      try {
        const { data } = await axios.get(`${process.env.API_BASE_URL}/pincode/${pincode}`);
        
        if (!data || !data.length) {
          return await reply("*No data found for this pincode.* Please check the pincode and try again.");
        }
        
        const locations = [...new Set(data.map(item => item.Block))];
        
        let responseText = `*Pincode Details* 📬\n\n` +
                      `*Pincode:* \`${pincode}\`\n` +
                      `*State:* ${data[0].State}\n` +
                      `*District:* ${data[0].District}\n` +
                      `*Region:* ${data[0].Region}\n` +
                      `*Circle:* ${data[0].Circle}\n` +
                      `*Division:* ${data[0].Division}\n` +
                      `*Delivery Status:* ${data[0].DeliveryStatus}\n\n` +
                      `*Post Offices:* 📍\n`;
        
        const subPostOffices = data.filter(office => office.BranchType === 'Sub Post Office');
        const branchPostOffices = data.filter(office => office.BranchType === 'Branch Post Office');
        
        if (subPostOffices.length) {
          responseText += `\n*Sub Post Offices:*\n`;
          subPostOffices.forEach(office => {
            responseText += `\n*${office.Name}*\n` +
                          `• Type: ${office.BranchType}\n` +
                          `• Block: ${office.Block}\n` +
                          `• Circle: ${office.Circle}\n` +
                          `• District: ${office.District}\n` +
                          `• Division: ${office.Division}\n` +
                          `• Region: ${office.Region}\n` +
                          `• State: ${office.State}\n` +
                          `• Country: ${office.Country}\n` +
                          `• Delivery Status: ${office.DeliveryStatus}\n` +
                          (office.Description ? `• Description: ${office.Description}\n` : '');
          });
        }
        
        if (branchPostOffices.length) {
          responseText += `\n*Branch Post Offices:*\n`;
          branchPostOffices.forEach(office => {
            responseText += `\n*${office.Name}*\n` +
                          `• Type: ${office.BranchType}\n` +
                          `• Block: ${office.Block}\n` +
                          `• Circle: ${office.Circle}\n` +
                          `• District: ${office.District}\n` +
                          `• Division: ${office.Division}\n` +
                          `• Region: ${office.Region}\n` +
                          `• State: ${office.State}\n` +
                          `• Country: ${office.Country}\n` +
                          `• Delivery Status: ${office.DeliveryStatus}\n` +
                          (office.Description ? `• Description: ${office.Description}\n` : '');
          });
        }
        
        responseText += `\n*Locations Covered:*\n`;
        locations.forEach(location => {
          responseText += `• ${location}\n`;
        });
        
        responseText += `\n*Total Post Offices:* ${data.length}`;
        
        await reply(responseText);
        
      } catch (error) {
        console.error('Pincode API error:', error);
        await reply("*Error:* Could not fetch pincode details. Please try again later.");
      }
      
    } catch (error) {
      console.error('Pincode check command error:', error);
      await context.reply("*An error occurred while checking the pincode!* Please try again later.");
    }
  }
};

export default pincodeCheckCommand; 