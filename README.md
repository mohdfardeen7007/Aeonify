# <p align="center">Aeonify</p>

<p align="center"> 
  <strong>Aeonify</strong> is a modern and powerful WhatsApp bot created by <strong>Aeon</strong> with advanced features, role management, and AI integration. Built with the latest technologies for optimal performance and security.
</p>

---

## Features

- 🤖 **WhatsApp Integration** - Built with Baileys
- 👥 **Role Management** - Add/remove moderators and admins
- 🚫 **Ban System** - Comprehensive user banning with expiration
- 🔧 **Access Control** - Public/private/restricted modes
- 📊 **Statistics** - Command usage and performance tracking
- 🎨 **Media Commands** - Image generation, video processing
- 🤖 **AI Commands** - GPT integration and AI features
- 🎮 **Fun Commands** - Games and entertainment
- 📱 **Group Management** - Admin tools and utilities
- **etc**

## 🚧 **Working on it**

Working on it

## ⚙️ **Requirements**

<details>
<summary><strong>⚙️ Click to expand System Requirements</strong></summary>

### **System Requirements**
- **Node.js 20+** - JavaScript runtime environment
  - Download from [nodejs.org](https://nodejs.org)
  - LTS version recommended for stability
  - Includes npm (Node Package Manager)
- **npm** - Package manager (comes with Node.js)
  - Used to install dependencies
  - Manages project packages
- **Git** - Version control system
  - Download from [git-scm.com](https://git-scm.com)
  - Required for cloning the repository
- **MongoDB Database** - NoSQL database
  - Cloud database (MongoDB Atlas) or local installation
  - Stores bot sessions and data
- **WhatsApp Account** - For bot authentication
  - Active WhatsApp number
  - Used for QR code scanning

### **Recommended Specifications**
- **RAM**: 512MB minimum, 2GB+ recommended
- **Storage**: 1GB+ free space
- **Network**: Stable internet connection
- **OS**: Windows 10+, Ubuntu 18.04+, macOS 10.14+

</details>

## 📥 **Setup**

### 🔧 **Install Node.js, npm, and Git**

<details>
  <summary><strong>🪟 Install for Windows</strong></summary>

#### 1. Install Node.js
- Visit: [https://nodejs.org](https://nodejs.org)
- Download the LTS version (Recommended)
- Run the installer and follow the setup wizard

#### 2. Install Git (Optional, if you don't have Git installed)
- Visit: [https://git-scm.com/downloads](https://git-scm.com/downloads)
- Download Git for Windows
- Run the installer and follow the setup wizard

#### 3. Verify Installation
```bash
node -v
npm -v
git --version
```

#### 4. Clone the Repository
```bash
git clone https://github.com/Aeon-San/Aeonify.git
cd Aeonify
```

</details>

<details>
  <summary><strong>🐧 Install for Ubuntu</strong></summary>

#### 1. Update System
```bash
sudo apt update && sudo apt upgrade -y
```

#### 2. Install Node.js
- Visit: [https://nodejs.org](https://nodejs.org)
- Download the LTS version for Linux
- Or use the command line method:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### 3. Install Git
- Visit: [https://git-scm.com/downloads](https://git-scm.com/downloads)
- Download Git for Linux
- Or use the command line method:
```bash
sudo apt install git -y
```

#### 4. Verify Installation
```bash
node -v
npm -v
git --version
```

#### 5. Clone the Repository
```bash
git clone https://github.com/Aeon-San/Aeonify.git
cd Aeonify
```

</details>

## Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Install PM2 globally**
   ```bash
   npm install -g pm2
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

## Configuration

### Environment Variables (.env)

Create a `.env` file in the root directory:

```env
# MongoDB Configuration
MONGODB_URI=your_mongodb_connection_string
SESSION_ID=your_session_id

# Bot Configuration
BOT_NAME=Aeonify
AUTH_TYPE=qr
PREFIX=!
DEBUG=false
PORT=3000

# Owner Configuration
OWNER_NUMBERS=your_phone_number
OWNER_NAME=YourName

# Command Settings
DEFAULT_COOLDOWN=2000
ALLOW_SELF_COMMAND=true
COOLDOWN_BYPASS_FOR_OWNER=true

# API Keys
OPEN_WEATHER_API_KEY=your_weather_api_key
API_BASE_URL=your_api_base_url
```

### Session ID Setup

The `SESSION_ID` is crucial for bot authentication:

1. **Set a unique session ID** in your `.env` file:
   ```env
   SESSION_ID=your_unique_session_name
   ```

2. **First-time setup**: When you start the bot for the first time:
   - The bot will generate a QR code
   - Scan the QR code with your WhatsApp
   - The session will be saved to MongoDB automatically

3. **Subsequent runs**: The bot will use the saved session from MongoDB

### Bot Startup Process

<details>
<summary><strong>📋 Click to expand Bot Startup Process</strong></summary>

1. **Start the bot**:
   ```bash
   npm start
   # or
   node src/start.js
   ```

2. **Authentication flow**:
   - Bot connects to MongoDB using your `SESSION_ID`
   - If no session exists: QR code is generated for first-time setup
   - If session exists: Bot connects directly using saved credentials

3. **Connection status**:
   - ✅ **Connected**: Bot is ready to receive commands
   - 🔄 **Retrying**: Connection issues, bot will retry automatically
   - ❌ **Failed**: Check your configuration and restart

</details>

### 🌐 **Web-Based Authentication**

<details>
<summary><strong>🌐 Click to expand Web-Based Authentication</strong></summary>

Aeonify includes a modern web interface for QR code authentication:

1. **Web Server Startup**:
   - When no valid session exists, the bot starts a web server
   - Server runs on `http://localhost:3000` (default port, configurable via `PORT`)
   - Modern, responsive web interface for authentication

2. **Authentication Steps**:
   - **Step 1**: Open `http://localhost:3000` in your browser
   - **Step 2**: Enter your `SESSION_ID` in the web form
   - **Step 3**: Click "Verify Session" to authenticate
   - **Step 4**: Wait for QR code to appear
   - **Step 5**: Scan QR code with WhatsApp mobile app

3. **Web Interface Features**:
   - **Modern UI**: Beautiful, responsive design
   - **Real-time QR**: Live QR code generation via Socket.IO
   - **Session Verification**: Secure session ID validation
   - **Mobile Friendly**: Works on all devices
   - **Auto-reload**: Automatically refreshes after authentication

4. **Security Features**:
   - **Session ID Validation**: Only accepts configured SESSION_ID
   - **Local Access**: Web server runs only on localhost
   - **Auto-close**: Server closes after successful authentication

</details>

### Important Notes

<details>
<summary><strong>⚠️ Click to expand Important Notes</strong></summary>

- **Keep your SESSION_ID private** - It's used to identify your bot session
- **Don't share session files** - They contain sensitive authentication data
- **One session per bot** - Each bot instance should have a unique SESSION_ID
- **MongoDB required** - Sessions are stored in MongoDB for persistence

</details>

## PM2 Deployment

<details>
<summary><strong>🚀 Click to expand PM2 Deployment</strong></summary>

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run prod
```

### Manual PM2 Commands

```bash
# Start with ecosystem config
pm2 start ecosystem.config.js

# Start in production mode
pm2 start ecosystem.config.js --env production

# Monitor processes
pm2 monit

# View logs
pm2 logs aeonify-bot

# Restart application
pm2 restart aeonify-bot

# Stop application
pm2 stop aeonify-bot

# Delete application
pm2 delete aeonify-bot

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
```

</details>

## File Structure

<details>
<summary><strong>📁 Click to expand File Structure</strong></summary>

```
Aeonify/
├── src/
│   ├── commands/
│   │   ├── AI/          # AI commands
│   │   ├── Fun/         # Fun commands
│   │   ├── Group/       # Group management
│   │   ├── Media/       # Media processing
│   │   ├── Owner/       # Owner commands
│   │   └── Utility/     # Utility commands
│   ├── models/          # Database models
│   ├── utils/           # Utility functions
│   ├── functions/       # Core functions
│   ├── config.js        # Configuration
│   ├── handler.js       # Command handler
│   ├── index.js         # Main bot logic
│   └── start.js         # Entry point
├── Auth/                # Authentication
├── logs/                # Log files
├── ecosystem.config.js  # PM2 configuration
└── package.json
```

</details>

## Logs

<details>
<summary><strong>📋 Click to expand Logs Information</strong></summary>

Logs are stored in the `logs/` directory:
- `combined.log` - All logs
- `out.log` - Standard output
- `error.log` - Error logs

</details>

## 🤝 **Contributing**

We welcome contributions from the community! If you found a bug or want to give us an idea, feel free to create an issue or pull request on the GitHub page! It would be really appreciated!

### How to Contribute

1. **Fork the repository**
   ```bash
   git clone https://github.com/Aeon-San/Aeonify.git
   cd Aeonify
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or for bug fixes
   git checkout -b fix/your-bug-fix
   ```

3. **Make your changes**
   - Follow the existing code style
   - Add comments for complex logic
   - Test your changes thoroughly

4. **Test your changes**
   ```bash
   npm install
   npm run dev
   ```

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   # or for bug fixes
   git commit -m "fix: fix bug description"
   ```

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Submit a Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your branch
   - Provide a clear description of your changes

### Reporting Issues

When reporting bugs, please include:
- **Description**: What happened?
- **Steps to reproduce**: How can we reproduce this?
- **Expected behavior**: What should happen?
- **Actual behavior**: What actually happened?
- **Environment**: OS, Node.js version, etc.
- **Screenshots**: If applicable

### Feature Requests

When suggesting new features:
- **Description**: What would you like to see?
- **Use case**: How would this feature be useful?
- **Implementation ideas**: Any thoughts on how to implement it?

### Code Style Guidelines

- Use consistent indentation (2 spaces)
- Follow existing naming conventions
- Add JSDoc comments for functions
- Keep functions small and focused
- Write meaningful commit messages

### Getting Help

If you need help contributing:
- Check existing issues and pull requests
- Join our community discussions
- Ask questions in issues

Thank you for contributing to Aeonify! 🚀

## <h2 align="center"> Reminder </h2>

<details>
<summary><strong>⚠️ Click to expand Important Reminders</strong></summary>

- This bot is not affiliated with `WhatsApp Inc.` Misusing the bot could result in a potential `ban` of your `WhatsApp account` (Please note that a WhatsApp account might be unbanned only once).
- I am not responsible for any account bans.
- Use the bot at your own risk, keeping this warning in mind.

</details>
<br>

## ☕ **Support**
**Developed by [Aeon San](https://github.com/Aeon-San)**
If you found this Aeonify Bot useful and want to support further development, you can buy me a coffee! ❤️

[![Buy Me A Coffee](https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20Coffee&emoji=☕&slug=aeonsan&button_colour=BD5FFF&font_colour=ffffff&font_family=Comic&outline_colour=000000&coffee_colour=FFDD00)](https://www.buymeacoffee.com/aeonsan)

## 🛠️ **Thanks To**

- [Baileys](https://github.com/WhiskeySockets/Baileys) — WhatsApp Web Reverse-Engineering Library.

## 📝 **License**

MIT License - see LICENSE file for details

## 💬 **Support & Help**

For support and questions:
- Create an issue on GitHub
- Contact the bot owner
- Check the documentation
- Join our community discussions

---

**Made with ❤️ by Aeon**