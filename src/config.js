import dotenv from "dotenv";
dotenv.config();

const config = {
  botName: process.env.BOT_NAME || "Aeonify",

  owner: {
    number: process.env.OWNER_NUMBERS ? process.env.OWNER_NUMBERS.split(",") : ['916297175943'],
    name: process.env.OWNER_NAME || "Aeon",
  },

  auth: "qr", // QR code authentication too
  pairNumber: process.env.PAIR_NUMBER || "",
  
  // MongoDB
  mongodb: {
    uri: process.env.MONGODB_URI || "mongodb+srv://aeon:aeonlove@aeonify.bebl6rt.mongodb.net/?retryWrites=true&w=majority&appName=aeonify",  // MongoDB URI
    options: {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }
  },

  sessionFile: process.env.SESSION_FILE || "./Session",
  prefix: process.env.PREFIX || "!",                         // Prefix
  debug: process.env.DEBUG === "true",

  defaultCooldown: parseInt(process.env.DEFAULT_COOLDOWN || "2000", 10),

  allowSelfCommand:
    typeof process.env.ALLOW_SELF_COMMAND !== "undefined"
      ? process.env.ALLOW_SELF_COMMAND === "true"
      : true,

  enableCooldownBypassForOwner:
    typeof process.env.COOLDOWN_BYPASS_FOR_OWNER !== "undefined"
      ? process.env.COOLDOWN_BYPASS_FOR_OWNER === "true"
      : true,

  openWeatherApiKey: process.env.OPEN_WEATHER_API_KEY || "8bc2f9d5ae85d87a5daa6cbdfb60092f",
  apiBaseUrl: process.env.API_BASE_URL || "", 
};

export default config;
