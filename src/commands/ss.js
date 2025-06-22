import puppeteer from 'puppeteer';
import { messages } from '../utils/messages.js';

const ssCommand = {
  name: "ss",
  aliases: ["screenshot", "capture"],
  description: "Take a screenshot of a website",
  usage: "!ss <url>",
  cooldown: 10000,

  run: async ({ client, jid, message, args }) => {
    try {
      console.log('Screenshot command initiated:', {
        args,
        jid
      });

      // 1. Validate URL
      if (!args.length) {
        console.log('No URL provided');
        return await client.sendMessage(jid, { 
          text: "*Please provide a URL!*\nUsage: !ss <url>\nExample: !ss https://google.com" 
        }, { quoted: message });
      }

      const url = args[0];
      if (!url.match(/^https?:\/\//i)) {
        console.log('Invalid URL format:', url);
        return await client.sendMessage(jid, { 
          text: "*Invalid URL format!*\nPlease provide a valid URL starting with http:// or https://" 
        }, { quoted: message });
      }

      // 2. Send processing message
      console.log('Starting screenshot process for:', url);
      const processingMsg = await client.sendMessage(jid, { 
        text: "⏳ *Taking screenshot...*\nPlease wait while I capture the webpage." 
      }, { quoted: message });

      // 3. Take screenshot
      try {
        const browser = await puppeteer.launch({
          headless: 'new',
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        console.log('Browser launched, opening page');
        const page = await browser.newPage();
        
        // Set viewport size
        await page.setViewport({
          width: 1280,
          height: 800,
          deviceScaleFactor: 1
        });

        // Set timeout
        await page.setDefaultNavigationTimeout(30000);

        console.log('Navigating to URL');
        await page.goto(url, { waitUntil: 'networkidle0' });

        // Take screenshot
        console.log('Taking screenshot');
        const screenshot = await page.screenshot({
          type: 'jpeg',
          quality: 80,
          fullPage: false
        });

        // Close browser
        await browser.close();
        console.log('Browser closed');

        // Delete processing message
        await client.sendMessage(jid, { 
          delete: processingMsg.key 
        });

        // Send screenshot
        console.log('Sending screenshot');
        await client.sendMessage(jid, {
          image: screenshot,
          caption: `📸 *Website Screenshot*\n\n🌐 *URL:* ${url}\n⏰ *Time:* ${new Date().toLocaleString()}`
        }, { quoted: message });

      } catch (error) {
        console.error('Screenshot error:', {
          error: error.message,
          code: error.code,
          stack: error.stack
        });

        // Delete processing message
        await client.sendMessage(jid, { 
          delete: processingMsg.key 
        });

        // Handle specific errors
        if (error.message?.includes('net::ERR_CONNECTION_REFUSED')) {
          await client.sendMessage(jid, { 
            text: "*Connection refused!* The website might be down or blocking access." 
          }, { quoted: message });
        } else if (error.message?.includes('net::ERR_NAME_NOT_RESOLVED')) {
          await client.sendMessage(jid, { 
            text: "*Invalid domain!* Could not resolve the website address." 
          }, { quoted: message });
        } else if (error.message?.includes('net::ERR_CONNECTION_TIMED_OUT')) {
          await client.sendMessage(jid, { 
            text: "*Connection timed out!* The website took too long to respond." 
          }, { quoted: message });
        } else {
          await client.sendMessage(jid, { 
            text: "*Failed to take screenshot!* The website might be blocking screenshots or is not accessible." 
          }, { quoted: message });
        }
      }
    } catch (error) {
      console.error('SS command error:', {
        error: error.message,
        code: error.code,
        stack: error.stack
      });
      await client.sendMessage(jid, { 
        text: "*An error occurred while processing the command!*" 
      }, { quoted: message });
    }
  }
};

export default ssCommand;
