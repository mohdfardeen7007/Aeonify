import axios from 'axios';

const iqcCommand = {
  name: 'iqc',
  aliases: ["iquoted"],
  description: 'Generate an iPhone Quoted Chat image from text',
  usage: '!iqc <text>',
  cooldown: 5000,
  run: async ({ Aeonify, jid, args, quoted }) => {
    const text = args.join(' ').trim();
    if (!text) {
      return Aeonify.sendMessage(jid, { text: 'Please provide text to generate the image.\nUsage: !iqc <text>' }, { quoted });
    }
    try {
      const apiUrl = `https://flowfalcon.dpdns.org/imagecreator/iqc?text=${encodeURIComponent(text)}`;
      const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });
      const imageBuffer = Buffer.from(response.data);
      await Aeonify.sendMessage(jid, {
        image: imageBuffer,
        caption: `🖼 *iPhone Quoted Chat*\n\n📝 *Text:* ${text}`
      }, { quoted });
    } catch (err) {
      console.error('IQC Error:', err);
      const errorMessage = `Failed to create image.\n📄 *Error:* ${err.message}`;
      await Aeonify.sendMessage(jid, { text: errorMessage }, { quoted });
    }
  }
};

export default iqcCommand; 