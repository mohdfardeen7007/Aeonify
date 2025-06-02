import config from "./config.js";
import {
  makeWASocket,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
} from "baileys";
import pino from "pino";
import readline from "readline";
import chalk from "chalk";
import NodeCache from "node-cache";
import qrcode from "qrcode-terminal";
import { logger } from './logger.js';
import { handleMessage } from './handler.js';
import fs from "fs";
import path from "path";
import MongoStore from './utils/mongoStore.js';

const msgRetryCounterCache = new NodeCache();
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.closed ? resolve("") : rl.question(text, resolve));

let store = null;
let phoneNumber = null;
let countryCode = null;
const mongoStore = new MongoStore();

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

// Function to check if session exists and is valid
function checkSessionExists(sessionPath) {
  try {
    const credsPath = path.join(sessionPath, 'creds.json');
    return fs.existsSync(credsPath) && fs.existsSync(sessionPath);
  } catch (error) {
    return false;
  }
}

function isSessionValid(sessionPath) {
  try {
    const credsPath = path.join(sessionPath, 'creds.json');
    if (!fs.existsSync(credsPath)) return false;
    
    const credsData = fs.readFileSync(credsPath, 'utf8');
    const creds = JSON.parse(credsData);
    
    // Check if essential credentials exist
    return !!(creds.noiseKey && creds.signedIdentityKey && creds.signedPreKey && creds.registrationId);
  } catch (error) {
    console.log(chalk.red('Session validation error:', error.message));
    return false;
  }
}


function deleteSession(sessionPath) {
  try {
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true });
      console.log(chalk.yellow(`Deleted session folder: ${sessionPath}`));
    }
  } catch (error) {
    console.error(chalk.red('Error deleting session:', error));
  }
}

export async function startCoffee() {
  try {
    if (!config.auth || !config.sessionFile) {
      console.log(chalk.red("Invalid config in settings.js!"));
      process.exit(1);
    }

    // Initialize MongoDB connection
    await mongoStore.init();

    const usePairingCode = config.auth.toLowerCase() === "pair";
    const useQR = config.auth.toLowerCase() === "qr";
    
    // Check if session exists and is valid
    const sessionExists = checkSessionExists(config.sessionFile);
    const sessionValid = sessionExists && isSessionValid(config.sessionFile);
    
    console.log(chalk.blue(`Session Path: ${config.sessionFile}`));
    console.log(chalk.blue(`Session Exists: ${sessionExists}`));
    console.log(chalk.blue(`Session Valid: ${sessionValid}`));

    // Only ask for authentication if no valid session exists
    let needsAuth = !sessionValid;

    if (usePairingCode && needsAuth) {
      console.log(chalk.yellow("No valid session found. Setting up new authentication..."));
      
      // First check environment variable for pair number
      const pairNumber = process.env.PAIR_NUMBER || "";
      
      if (pairNumber && pairNumber.trim() && pairNumber.length > 6) {
        phoneNumber = pairNumber.startsWith('+') ? pairNumber : `+${pairNumber}`;
        console.log(chalk.green(`Using pair number from environment variable: ${phoneNumber}`));
      }
      // Then check if bot number is configured in config file
      else if (config.pairNumber && config.pairNumber.trim() && config.pairNumber.length > 6) {
        phoneNumber = config.pairNumber.startsWith('+') ? config.pairNumber : `+${config.pairNumber}`;
        console.log(chalk.green(`Using configured bot number from config: ${phoneNumber}`));
      }
      
      // If no valid phoneNumber found in environment or config, ask user for input
      if (!phoneNumber) {
        console.log(chalk.cyan("No bot number found in environment variable or config. Please enter your bot details:"));
        
        for (let i = 0; i < 3; i++) {
          let cc = await question(chalk.cyan("Enter your country code (e.g., 91 for India): "));
          cc = cc.trim().replace(/\D/g, "");
          if (!cc || cc.length < 1 || cc.length > 4) {
            console.log(chalk.redBright("Invalid country code! Try again."));
            continue;
          }
          countryCode = cc;

          let pn = await question(chalk.cyan("Enter your phone number (without country code): "));
          pn = pn.trim().replace(/\D/g, "");
          if (!pn || pn.length < 6 || pn.length > 15) {
            console.log(chalk.redBright("Invalid phone number! Try again."));
            continue;
          }

          phoneNumber = `+${cc}${pn}`;
          console.log(chalk.green(`Phone number set: ${phoneNumber}`));
          
          // Ask user if they want to save this number in config for future use
          const saveChoice = await question(chalk.yellow("Do you want to save this number in config for future use? (y/n): "));
          if (saveChoice.toLowerCase() === 'y' || saveChoice.toLowerCase() === 'yes') {
            console.log(chalk.blue(`Add this line to your config.js file:`));
            console.log(chalk.white(`pairNumber: "${phoneNumber}",`));
            console.log(chalk.blue(`Or set environment variable:`));
            console.log(chalk.white(`PAIR_NUMBER="${phoneNumber}"`));
          }
          break;
        }

        if (!phoneNumber) {
          console.log(chalk.redBright("Tried 3 times, exiting!"));
          process.exit(1);
        }
      }
    } else if (sessionValid) {
      console.log(chalk.green("Valid session found! Using existing session..."));
    }

    if (!rl.closed) rl.close();

    const { state, saveCreds } = await useMultiFileAuthState(config.sessionFile);
    store = makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" }));

    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`Using WhatsApp v${version.join(".")}, isLatest: ${isLatest}`);

    const coffee = makeWASocket({
      version,
      logger: pino({ level: "silent" }),
      auth: { creds: state.creds, keys: store },
      msgRetryCounterCache,
    });

    // Save credentials to both local file and MongoDB
    coffee.ev.on("creds.update", async (creds) => {
      await saveCreds();
      await mongoStore.saveSession({ creds });
    });

    // Only request pairing code if session is invalid and authentication is needed
    if (usePairingCode && needsAuth && !coffee.authState.creds.registered) {
      const cleanedNumber = phoneNumber.replace(/[^0-9]/g, "");
      setTimeout(async () => {
        try {
          const code = await coffee.requestPairingCode(cleanedNumber);
          const formattedCode = code.match(/.{1,4}/g)?.join("-") || code;
          console.log(chalk.greenBright("Your pairing code: "), formattedCode);
        } catch (error) {
          console.error(chalk.red("Error generating pairing code:", error));
        }
      }, 3000);
    }

    coffee.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
      // Show QR code only if session doesn't exist and QR mode is enabled
      if (qr && useQR && needsAuth) {
        console.log(chalk.green("Scan this QR code in WhatsApp:"));
        qrcode.generate(qr, { small: true });
      }

      if (connection === "close") {
        const reason = lastDisconnect?.error?.output?.statusCode || 0;
        const retryReasons = [
          DisconnectReason.connectionClosed,
          DisconnectReason.connectionLost,
          DisconnectReason.restartRequired,
          DisconnectReason.timedOut,
          515,
        ];

        if (reason === DisconnectReason.badSession) {
          console.log(chalk.red("Session corrupted, deleting session folder..."));
          deleteSession(config.sessionFile);
          await mongoStore.deleteSession();
          console.log(chalk.yellow("Please restart the bot to create a new session!"));
          process.exit(1);
        } else if (reason === DisconnectReason.connectionReplaced) {
          console.log(chalk.red("New session opened elsewhere. Close it first!"));
          process.exit(1);
        } else if (reason === DisconnectReason.loggedOut) {
          console.log(chalk.red("Device logged out. Deleting session..."));
          deleteSession(config.sessionFile);
          await mongoStore.deleteSession();
          phoneNumber = null;
          console.log(chalk.yellow("Please restart the bot to re-authenticate!"));
          process.exit(1);
        } else if (retryReasons.includes(reason)) {
          console.log(chalk.yellow(`Connection closed, retrying in 5 seconds...`));
          setTimeout(() => startCoffee(), 5000);
          return;
        } else {
          console.log(chalk.red(`Unknown disconnect reason: ${reason}`));
        }

        process.exit(1);
      } else if (connection === "open") {
        const userName = coffee.user?.name || config.botName;
        const ownNumber = coffee.user?.id?.split(":")[0] || "unknown";

        console.log("==========================");
        console.log(chalk.cyan("• User Info"));
        console.log(chalk.cyan(`- Name: ${userName}`));
        console.log(chalk.cyan(`- Number: ${ownNumber}`));
        console.log(chalk.cyan(`- Status: Connected`));
        console.log(chalk.green(`- Session: ${sessionValid ? 'Existing' : 'New'}`));
        console.log("==========================");

        const botInfo = {
          version: '1.0.0',
          commandCount: 25,
        }
        logger.logStartup(botInfo);

        coffee.ev.on("messages.upsert", async (m) => {
          const message = m.messages[0];
          if (!message.message || message.key.fromMe) return;

          try {
            await handleMessage(coffee, message);
          } catch (err) {
            console.error(chalk.red("Error in handler:"), err);
          }
        });
      }
    });
  } catch (err) {
    console.error(chalk.red("Something went wrong in startCoffee():"), err);
    if (!rl.closed) rl.close();
    process.exit(1);
  }
}

// Export the function as default as well for flexibility
export default startCoffee;