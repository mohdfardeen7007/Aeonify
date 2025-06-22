import config from "./config.js";
import {
  makeWASocket,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from "baileys";
import pino from "pino";
import readline from "readline";
import chalk from "chalk";
import NodeCache from "node-cache";
import qrcode from "qrcode-terminal";
import { logger } from "logyo";
import handleMessage from "./handler.js";
import { useMongoAuthState } from '../Auth/mongoAuthState.js';
import { startWebServer } from "./functions/webServer.js";
import { initializeStatusMode } from "./commands/Owner/botProfile.js";
import { formatUptime, startStatusUpdater, getCurrentStatus } from "./functions/status.js";
import { startBirthdayScheduler } from "./functions/birthdayScheduler.js";

const msgRetryCounterCache = new NodeCache();
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.closed ? resolve("") : rl.question(text, resolve));

let store = null;
let phoneNumber = null;
let countryCode = null;

const DISCONNECT_REASONS = {
  [DisconnectReason.connectionClosed]: "Connection closed",
  [DisconnectReason.connectionLost]: "Connection lost",
  [DisconnectReason.restartRequired]: "Restart required",
  [DisconnectReason.timedOut]: "Connection timed out",
  [DisconnectReason.badSession]: "Bad session",
  [DisconnectReason.connectionReplaced]: "Connection replaced",
  [DisconnectReason.loggedOut]: "Logged out",
  515: "Connection closed by server"
};

let qrCodeToSend = null;
let sessionVerified = false;
let webServerStarted = false;

export async function startAeonify() {
  try {
    console.log(chalk.cyan("=========================="));
    console.log(chalk.cyan("🤖 Bot Startup Initiated"));
    console.log(chalk.cyan(`📱 Bot Name: ${config.botName}`));
    console.log(chalk.cyan(`🔑 Auth Method: ${config.auth}`));
    console.log(chalk.cyan(`🆔 Session ID: ${config.sessionId}`));
    console.log(chalk.cyan("=========================="));

    if (!config.auth) {
      console.log(chalk.red("Invalid config in settings.js!"));
      process.exit(1);
    }

    const useQR = config.auth.toLowerCase() === "qr";
    if (!useQR) {
      console.log(chalk.red("Invalid auth method in config! Only 'qr' is supported now."));
      process.exit(1);
    }

    console.log(chalk.cyan("📡 Connecting to MongoDB..."));
    const { state, saveCreds } = await useMongoAuthState(config.sessionId);
    console.log(chalk.green("✅ MongoDB Connected Successfully"));

    await initializeStatusMode();

    const sessionExists = state.creds && Object.keys(state.creds).length > 0;
    const sessionValid = sessionExists && state.creds.me && state.creds.me.id;

    console.log(chalk.blue(`Session ID: ${config.sessionId}`));
    console.log(chalk.blue(`Session Exists: ${sessionExists}`));
    console.log(chalk.blue(`Session Valid: ${sessionValid}`));

    let needsAuth = !sessionValid;
    let webServer = null;
    let io = null;
    if (needsAuth) {
      webServer = startWebServer();
      while (!webServer.sessionVerified) {
        console.log("Waiting for session verification via web page...");
        await new Promise(r => setTimeout(r, 1000));
      }
    } else if (sessionValid) {
      console.log(chalk.green("Valid session found! Using existing session..."));
    }

    if (!rl.closed) rl.close();

    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`Using WhatsApp v${version.join(".")}, isLatest: ${isLatest}`);

    const Aeonify = makeWASocket({
      version,
      logger: pino({ level: "silent" }),
      auth: { creds: state.creds, keys: state.keys },
      msgRetryCounterCache,
    });

    Aeonify.ev.on("creds.update", async () => {
      await saveCreds();
    });

    Aeonify.ev.on("messages.upsert", async (m) => {
      const message = m.messages[0];
      if (!message || !message.message) return;

      const isSelf = message.key.fromMe === true;

      process.nextTick(async () => {
        try {
          await handleMessage(Aeonify, message, isSelf);
        } catch (err) {
          console.error(chalk.red("Error in handler:"), err);
        }
      });
    });

    let pairingCodeGenerated = false;

    Aeonify.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
      if (qr && useQR && needsAuth) {
        if (webServer) webServer.setQR(qr);
        console.log(chalk.green("Scan this QR code in WhatsApp (Terminal):"));
        qrcode.generate(qr, { small: true });
      }

      if (connection === "open") {
        const userName = Aeonify.user?.name || config.botName;
        const ownNumber = Aeonify.user?.id?.split(":")[0] || "unknown";

        console.log(chalk.green("=========================="));
        console.log(chalk.green("✅ Bot Connected Successfully"));
        console.log(chalk.cyan("• User Info"));
        console.log(chalk.cyan(`- Name: ${userName}`));
        console.log(chalk.cyan(`- Number: ${ownNumber}`));
        console.log(chalk.cyan(`- Status: Connected`));
        console.log(chalk.green(`- Session: ${sessionValid ? 'Existing' : 'New'}`));
        console.log(chalk.green("=========================="));

        if (webServer) webServer.close();
        if (io) io.close();

        try {
          if (!global.startTime) {
            global.startTime = Date.now();
          }
          const statusMode = global.statusMode || "uptime";
          const uptime = Date.now() - global.startTime;
          const uptimeStr = formatUptime(uptime);
          const currentStatus = getCurrentStatus();

          let ownerJids = [];
          if (Array.isArray(config.ownerNumber)) {
            ownerJids = config.ownerNumber.map(num => num.replace(/[^0-9]/g, "") + "@s.whatsapp.net");
          } else if (typeof config.ownerNumber === "string") {
            ownerJids = [config.ownerNumber.replace(/[^0-9]/g, "") + "@s.whatsapp.net"];
          }

          for (const ownerJid of ownerJids) {
            if (ownerJid) {
              await Aeonify.sendMessage(ownerJid, {
                text: `*Aeonify Bot Started!*\n*Current Status Mode:* ${statusMode}\n*Uptime:* ${uptimeStr}\n*Current Status:* ${currentStatus || 'No status set.'}`
              });
            }
          }
        } catch (err) {
          console.error("Failed to send about message to owner:", err);
        }
        startStatusUpdater(Aeonify);
        startBirthdayScheduler(Aeonify);
      } else if (connection === "close") {
        const reason = lastDisconnect?.error?.output?.statusCode || 0;
        const retryReasons = [
          DisconnectReason.connectionClosed,
          DisconnectReason.connectionLost,
          DisconnectReason.restartRequired,
          DisconnectReason.timedOut,
          515,
        ];

        if (reason === DisconnectReason.badSession) {
          console.log(chalk.red("Session corrupted, please restart the bot!"));
          process.exit(1);
        } else if (reason === DisconnectReason.connectionReplaced) {
          console.log(chalk.red("New session opened elsewhere. Close it first!"));
          process.exit(1);
        } else if (reason === DisconnectReason.loggedOut) {
          console.log(chalk.red("Device logged out. Please restart the bot to re-authenticate!"));
          process.exit(1);
        } else if (retryReasons.includes(reason)) {
          console.log(chalk.yellow(`Connection closed, retrying in 5 seconds...`));
          setTimeout(() => startAeonify(), 5000);
          return;
        } else {
          console.log(chalk.red(`Unknown disconnect reason: ${reason}`));
        }

        const disconnectReason = DISCONNECT_REASONS[reason] || 'Unknown reason';

        console.log(chalk.red("=========================="));
        console.log(chalk.red("Bot Disconnected"));
        console.log(chalk.red(`Reason: ${disconnectReason}`));
        console.log(chalk.red(`Status Code: ${reason}`));
        console.log(chalk.red("=========================="));

        process.exit(1);
      }
    });

    Aeonify.ev.on('groups.update', async (updates) => {
      try {
        if (!updates || !Array.isArray(updates) || updates.length === 0) {
          return;
        }

        const update = updates[0];
        if (!update.id) return;
        let groupPp;
        try {
          groupPp = await Aeonify.profilePictureUrl(update.id, 'image');
        } catch {
          groupPp = 'https://images2.alphacoders.com/882/882819.jpg';
        }

        const wm = { url: groupPp };
        if (update.announce !== undefined) {
          const message = update.announce
            ? 'Group has been *Closed!* Only *Admins* can send Messages!'
            : 'Group has been *Opened!* Now *Everyone* can send Messages!';

          await Aeonify.sendMessage(update.id, {
            image: wm,
            caption: message
          });
        }
        else if (update.restrict !== undefined) {
          const message = update.restrict
            ? 'Group Info modification has been *Restricted*, Now only *Admins* can edit Group Info!'
            : 'Group Info modification has been *Un-Restricted*, Now *Everyone* can edit Group Info!';

          await Aeonify.sendMessage(update.id, {
            image: wm,
            caption: message
          });
        }
        else if (update.subject) {
          const message = `Group Subject has been updated To:\n\n*${update.subject}*`;
          await Aeonify.sendMessage(update.id, {
            image: wm,
            caption: message
          });
        }
      } catch (error) {
        logger.logError(error, { context: 'Group Update Handler' });
        console.error(chalk.red("Error in group update:"), error);
      }
    });

  } catch (error) {
    console.log(chalk.red("=========================="));
    console.log(chalk.red("Error Starting Bot"));
    console.log(chalk.red(`Error: ${error.message}`));
    console.log(chalk.red("=========================="));
    process.exit(1);
  }
}

export default startAeonify;