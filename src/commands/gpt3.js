import axios from 'axios';

const chatgpt3Command = {
    name: "gpt3",
    aliases: ["chatgpt3", "ai3"],
    description: "Ask GPT-3 a question",
    usage: "!gpt3 <your question>",
    category: "ai",
    cooldown: 5000,
    minArgs: 1,
    requiredArgs: [{ name: "prompt", required: true }],

    run: async ({ args, reply, react, utils, senderName }) => {
        const prompt = args.join(" ").trim();

        if (!prompt) {
            return reply("*Please provide a question or prompt.*\n\n*Usage:* !gpt3 What is artificial intelligence?");
        }

        if (prompt.length > 1000) {
            return reply("*Prompt too long! Please keep it under 1000 characters.*");
        }

        try {
            await react("🤖");

            const startTime = Date.now();

            const apiBaseUrl = `${process.env.API_BASE_URL}`;
            if (!apiBaseUrl) {
                console.error("API_BASE_URL environment variable is not set");
                return reply("*Configuration Error:* API endpoint not configured. Please contact the bot administrator.");
            }

            const apiUrl = `${apiBaseUrl.replace(/\/$/, '')}/gpt`;

            console.log(`Making request to: ${apiUrl}`);

            const { data } = await axios.get(apiUrl, {
                params: {
                    prompt,
                    model: "chatgpt3"
                },
                timeout: 35000,
                validateStatus: status => status < 500
            });

            console.log('API Response:', {
                status: data?.success,
                hasResponse: !!data?.response,
                responseLength: data?.response?.length || 0
            });

            await react("〄");

            if (!data) {
                return reply("*No response from server. Please try again.*");
            }

            if (data.error) {
                return reply(`*API Error:* ${data.error}`);
            }

            const response = data.response || data.message || data.text;
            if (!response) {
                console.log('Unexpected API response structure:', data);
                return reply("*No valid response from GPT-3. Please try again.*");
            }

            const truncatedResponse = utils.truncate(response, 2000);
            return reply(truncatedResponse);

        } catch (error) {
            await react("❌");

            console.error("GPT-3 command error:", {
                error: error.message,
                code: error.code,
                response: error.response?.data,
                url: error.config?.url,
                user: senderName,
                prompt: prompt.substring(0, 100)
            });

            let errorMsg = "*GPT-3 Error*\n\n";

            if (error.message === 'Invalid URL' || error.code === 'ERR_INVALID_URL') {
                errorMsg += "Configuration error: Invalid API endpoint URL.";
            } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                errorMsg += "Request timeout. GPT-3 is taking too long to respond.";
            } else if (error.response?.status === 429) {
                errorMsg += "Rate limit exceeded. Please wait a moment and try again.";
            } else if (error.response?.status >= 500) {
                errorMsg += "GPT-3 service is temporarily unavailable.";
            } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                errorMsg += "Cannot connect to AI service. Please try again later.";
            } else {
                errorMsg += `Failed to get response from GPT-3: ${error.message}`;
            }

            return reply(errorMsg);
        }
    }
};

export default chatgpt3Command;