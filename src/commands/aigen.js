import axios from 'axios';

const writecreamImageCommand = {
    name: "writecreamimg",
    aliases: ["wcimg", "aigen"],
    description: "Generate AI image(s) using you.",
    usage: "!aigen <prompt> [--ratio 16:9] [--2]",
    cooldown: 5000,
    minArgs: 1,
    requiredArgs: [{ name: "prompt", required: true }],

    run: async ({ args, reply, react, client, messages, jid }) => {
        const fullPrompt = args.join(" ");
        const ratioMatch = fullPrompt.match(/--ratio\s*([\d:]+)/i);
        const countMatch = fullPrompt.match(/--(\d+)/);

        const ratio = ratioMatch ? ratioMatch[1] : "1:1";
        const count = countMatch ? parseInt(countMatch[1]) : 1;

        const prompt = fullPrompt
            .replace(/--ratio\s*[\d:]+/i, "")
            .replace(/--\d+/g, "")
            .trim();

        if (!prompt) return reply("*Please provide a valid prompt.*");

        try {
            await react("🎨");

            const { data } = await axios.get(`${process.env.API_BASE_URL}/aigen`, {
                params: {
                    prompt,
                    ratio,
                    count,
                },
            });

            if (!data.images || !Array.isArray(data.images) || data.images.length === 0) {
                return reply("*No images returned from API.*");
            }

            for (const imageUrl of data.images) {
                await client.sendMessage(jid, {
                    image: { url: imageUrl }
                }, { quoted: messages });
            }
        } catch (err) {
            console.error("AI Gen API error:", err.message);
            reply("*Failed to generate image from API.* Try again later.");
        }
    }
};

export default writecreamImageCommand;
