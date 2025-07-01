# <p align="center">Aeonify</p>

<p align="center"> 
  <strong>Aeonify</strong> is a modern, powerful, and easy-to-deploy WhatsApp bot packed with AI features, automation, and advanced group management. Get your own WhatsApp bot running in minutes!
</p>

---

## 📑 Table of Contents
- [🚀 Quick Start Checklist](#-quick-start-checklist)
- [🧰 What You Need to Deploy Your Own Bot](#-what-you-need-to-deploy-your-own-bot)
- [✨ Features](#-features)
- [⚙️ Requirements](#️-requirements)
- [📥 Setup Guide](#-setup-guide)
- [🌐 Web-Based Authentication (Hosted Flow)](#-web-based-authentication-hosted-flow)
- [⚠️ Security Reminder](#️-security-reminder)
- [🏁 Starting the Bot](#-starting-the-bot)
- [🚀 Deploying on Your Favorite Platform](#-deploying-on-your-favorite-platform)
- [📁 File Structure](#-file-structure)
- [📝 Configuration Example (.env)](#-configuration-example-env)
- [🗂️ Logs](#️-logs)
- [🤝 Contributing](#-contributing)
- [⚠️ Reminders](#️-reminders)
- [☕ Support & Help](#-support--help)

---

## 🚀 Quick Start Checklist

1. **MongoDB Database** (local or [MongoDB Atlas](https://www.mongodb.com/atlas/database))
2. **Node.js 20+** ([Download here](https://nodejs.org))
3. **WhatsApp Account** (for QR authentication)
4. **Your Unique Session ID** (any name you like)
5. **Owner Phone Number** (your WhatsApp number, with country code)
6. **[aeonify.xyz](https://aeonify.xyz) for QR authentication**

---

## 🧰 What You Need to Deploy Your Own Bot

- **MongoDB Connection String:**
  - Get it from your MongoDB Atlas dashboard or your local MongoDB instance.
- **Session ID:**
  - Any unique name (e.g., `mybot123`). Used to identify your session in the database.
- **WhatsApp Account:**
  - You will scan a QR code to link your bot to your WhatsApp.
- **Node.js 20+ and npm:**
  - Install from [nodejs.org](https://nodejs.org).
- **Git:**
  - For cloning the repository ([Download here](https://git-scm.com)).
- **A server or computer to run the bot:**
  - Can be your PC, a VPS, or a cloud platform (Heroku, Railway, etc.).
- **Your WhatsApp number:**
  - For owner/admin features.

---

## ✨ Features

- 👥 **Role Management** (Admins, Moderators)
- 🚫 **Ban System** (with expiration)
- 🔧 **Access Control** (public/private/restricted)
- 📊 **Statistics** (usage tracking)
- 🎨 **Media Commands** (image/video)
- 🤖 **AI Commands** (GPT integration)
- 🎮 **Fun Commands** (games, entertainment)
- 📱 **Group Management** (admin tools)
- ✨ **Many more features coming soon!**

---

## ⚙️ Requirements

- **Node.js 20+**
- **npm** (comes with Node.js)
- **Git**
- **MongoDB Database**
- **WhatsApp Account**
- **RAM:** 512MB+ (2GB+ recommended)
- **Storage:** 1GB+ free
- **OS:** Windows 10+, Ubuntu 18.04+, macOS 10.14+

---

## 📥 Setup Guide

### 1. Install Node.js, npm, and Git
- Download and install [Node.js](https://nodejs.org) (LTS recommended)
- Download and install [Git](https://git-scm.com)

### 2. Clone the Repository
```bash
git clone https://github.com/Aeon-San/Aeonify.git
cd Aeonify
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Install PM2 (optional, for background running)
```bash
npm install -g pm2
```

### 5. Configure Environment
- Copy the example env file:
```bash
cp .env.example .env
```
- Edit `.env` with your MongoDB URI, session ID, owner number, etc.

---

## 🌐 Web-Based Authentication (Hosted Flow)

1. **Go to [https://aeonify.xyz](https://aeonify.xyz)**
2. **Enter your MongoDB URL and Session ID**
3. **Click Start Authentication**
4. **Scan the QR code with WhatsApp**
5. **Session is saved in your MongoDB**
6. **Deploy the bot anywhere** (PC, VPS, cloud) using the same MongoDB URL and Session ID in your `.env` file
7. **Start the bot** – it will connect automatically, no need to scan QR again!

---

## ⚠️ Security Reminder

> **Keep your MongoDB URL and Session ID safe!**
>
> - Do **NOT** share your MongoDB connection string or Session ID with anyone.
> - These credentials allow access to your bot's data and session.
> - Treat them like passwords—keep them private and secure.

---

## 🏁 Starting the Bot

```bash
npm start
# or
node src/start.js
```

- The bot will connect to MongoDB and WhatsApp using your session.
- If everything is correct, your bot is now online!

---

## 🚀 Deploying on Your Favorite Platform
- You can run the bot on your PC, a VPS, or any cloud service that supports Node.js.
- Just make sure your `.env` file has the correct MongoDB URL, Session ID, and owner number.
- For background running, use PM2:
```bash
pm run dev   # Development
pm run prod  # Production
pm start     # Standard
```

---

## 📁 File Structure

```
Aeonify/
├── src/
│   ├── commands/   # All bot commands
│   ├── models/     # Database models
│   ├── utils/      # Utility functions
│   ├── functions/  # Core functions
│   ├── config.js   # Configuration
│   ├── handler.js  # Command handler
│   ├── index.js    # Main bot logic
│   └── start.js    # Entry point
├── Auth/           # Authentication
├── logs/           # Log files
├── ecosystem.config.js  # PM2 config
└── package.json
```

---

## 📝 Configuration Example (.env)

```env
# MongoDB Configuration
MONGODB_URI=your_mongodb_connection_string
SESSION_ID=your_session_id

# Bot Configuration
BOT_NAME=Aeonify
PREFIX=!
PORT=3000

# Owner Configuration
OWNER_NUMBERS=your_phone_number
OWNER_NAME=YourName

# API Keys
OPEN_WEATHER_API_KEY=your_weather_api_key
API_BASE_URL=https://aeonsan.xyz/api
```

---

## 🗂️ Logs
- Logs are stored in the `logs/` directory:
  - `combined.log` – All logs
  - `out.log` – Standard output
  - `error.log` – Error logs

---

## 🤝 Contributing
- Fork the repo, create a branch, make your changes, and submit a pull request!
- Please follow the code style and add comments for complex logic.
- See the full contributing guide in the README for more details.

---

## ⚠️ Reminders
- This bot is **not affiliated with WhatsApp Inc.**
- Misuse may result in your WhatsApp account being banned.
- Use at your own risk.
- You can automate tasks with this bot, but **do not spam** with the bot or the Baileys library. Responsible use is strongly recommended.

---

## ☕ Support & Help
**Developed by [Aeon San](https://github.com/Aeon-San)**
If you found this Aeonify Bot useful and want to support further development, you can buy me a coffee! ❤️

<p align="center">
  <a href="https://www.buymeacoffee.com/aeonsan">
    <img src="https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20Coffee&emoji=☕&slug=aeonsan&button_colour=BD5FFF&font_colour=ffffff&font_family=Comic&outline_colour=000000&coffee_colour=FFDD00" alt="Buy Me A Coffee" />
  </a>
</p>

If you like this project, please consider giving it a ⭐ on GitHub!

**Need help or want to connect?**
- Create an issue on GitHub
- Contact the bot owner
- Check the documentation
- Join our community discussions and tech-related discussions
- **Join our WhatsApp support group:** [https://tinyurl.com/aeonify](https://tinyurl.com/aeonify)

---

<p align="center"><b>Made with ❤️ by Aeon</b></p>