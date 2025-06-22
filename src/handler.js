import fs from 'fs';
import path from 'path';
import { logger } from "logyo";
import config from './config.js';

const cooldowns = new Map();

const commandUsage = new Map();

// Performance monitoring
const performanceStats = {
  commandsExecuted: 0,
  averageResponseTime: 0,
  totalResponseTime: 0,
  errors: 0,
  startTime: Date.now()
};

// Command cache for better performance
let commandCache = null;
let lastCommandLoad = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Load commands dynamically with caching
const loadCommands = async (forceReload = false) => {
  const now = Date.now();
  
  // Return cached commands if still valid
  if (!forceReload && commandCache && (now - lastCommandLoad) < CACHE_DURATION) {
    return commandCache;
  }

  const commands = new Map();
  const aliases = new Map();
  const commandsPath = path.join(process.cwd(), 'src', 'commands');
  
  try {
    if (!fs.existsSync(commandsPath)) {
      logger.logSystem(`Commands directory not found: ${commandsPath}`, 'warning');
      return { commands, aliases };
    }

    const files = fs.readdirSync(commandsPath);
    let loadedCount = 0;
    let errorCount = 0;
    
    // Loading animation
    const loadingInterval = logger.loading('Loading commands...');
    
    for (const file of files) {
      if (file.endsWith('.js')) {
        try {
          
          const commandModule = await import(`file://${path.join(commandsPath, file)}?update=${now}`);
          const command = commandModule.default;
          
          if (command?.name) {
            // Validate command structure
            if (!command.run || typeof command.run !== 'function') {
              logger.logSystem(`Invalid command structure in ${file}: missing run function`, 'error');
              errorCount++;
              continue;
            }

            // Set default values with validation
            command.cooldown = Math.max(0, command.cooldown || 0);
            command.aliases = Array.isArray(command.aliases) ? command.aliases : [];
            command.description = command.description || 'No description available';
            command.usage = command.usage || `${config.prefix || '!'}${command.name}`;
            command.category = command.category || 'general';
            command.hidden = command.hidden || false;
            
            // Validation flags
            command.ownerOnly = Boolean(command.ownerOnly);
            command.adminOnly = Boolean(command.adminOnly);
            command.groupOnly = Boolean(command.groupOnly);
            command.privateOnly = Boolean(command.privateOnly);
            command.botAdminRequired = Boolean(command.botAdminRequired);
            
            commands.set(command.name.toLowerCase(), command);
            loadedCount++;
            
            // Register aliases
            command.aliases.forEach(alias => {
              const lowerAlias = alias.toLowerCase();
              if (aliases.has(lowerAlias)) {
                logger.logSystem(`Alias "${alias}" is already used by another command`, 'warning');
              } else {
                aliases.set(lowerAlias, command.name.toLowerCase());
              }
            });
          } else {
            logger.logSystem(`Command file ${file} doesn't export a valid command object`, 'warning');
            errorCount++;
          }
        } catch (error) {
          logger.logError(error, { command: file, context: 'Command Loading' });
          errorCount++;
        }
      }
    }
    
    // Clear loading animation
    clearInterval(loadingInterval);
    process.stdout.write('\r\x1b[K');
    
    if (loadedCount > 0) {
      logger.logSystem(`Loaded ${loadedCount} commands successfully`, 'success');
    }
    if (errorCount > 0) {
      logger.logSystem(`Failed to load ${errorCount} commands`, 'error');
    }
    
  } catch (error) {
    logger.logError(error, { context: 'Commands Directory Loading' });
  }
  
  // Update cache hehe
  commandCache = { commands, aliases };
  lastCommandLoad = now;
  
  return commandCache;
};

const getGroupAdmins = (participants) => {
  return participants
    .filter(participant => ['admin', 'superadmin'].includes(participant.admin))
    .map(participant => participant.id);
};

// message parsing with better type detection
const parseMessage = (message) => {
  if (!message) return { type: 'unknown', content: '', raw: null };
  
  const types = {
    conversation: 'text',
    extendedTextMessage: 'text',
    imageMessage: 'image',
    videoMessage: 'video',
    documentMessage: 'document',
    audioMessage: 'audio',
    stickerMessage: 'sticker',
    locationMessage: 'location',
    contactMessage: 'contact',
    contactsArrayMessage: 'contacts',
    buttonsResponseMessage: 'button',
    listResponseMessage: 'list',
    templateButtonReplyMessage: 'template',
    pollCreationMessage: 'poll',
    pollUpdateMessage: 'poll_update',
    reactionMessage: 'reaction'
  };

  const type = Object.keys(message).find(key => types[key]);
  
  let content = '';
  if (type === 'conversation') {
    content = message[type];
  } else if (type === 'extendedTextMessage') {
    content = message[type].text;
  } else if (message[type]?.caption) {
    content = message[type].caption;
  }

  return {
    type: types[type] || 'unknown',
    content: content || '',
    raw: message[type] || message,
    hasMedia: ['image', 'video', 'document', 'audio', 'sticker'].includes(types[type]),
    isQuoted: Boolean(message[type]?.contextInfo?.quotedMessage)
  };
};

// Advanced cooldown system with different levels
const checkCooldown = (command, sender, isOwner = false, isAdmin = false) => {
  if (!command.cooldown) return false;
  
  // Owners and admins get reduced cooldown
  let cooldownAmount = command.cooldown;
  if (isOwner) cooldownAmount = Math.floor(cooldownAmount * 0.1); // 90% reduction for owners
  else if (isAdmin) cooldownAmount = Math.floor(cooldownAmount * 0.5); // 50% reduction for admins
  
  const now = Date.now();
  const timestamps = cooldowns.get(command.name) || new Map();
  
  if (timestamps.has(sender)) {
    const expirationTime = timestamps.get(sender) + cooldownAmount;
    
    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      return timeLeft;
    }
  }
  
  timestamps.set(sender, now);
  cooldowns.set(command.name, timestamps);
  return false;
};

// argument validation
const validateCommandArgs = (command, args) => {
  const errors = [];
  
  if (command.minArgs && args.length < command.minArgs) {
    errors.push(`Minimum ${command.minArgs} argument(s) required`);
  }
  
  if (command.maxArgs && args.length > command.maxArgs) {
    errors.push(`Maximum ${command.maxArgs} argument(s) allowed`);
  }
  
  if (command.requiredArgs && Array.isArray(command.requiredArgs)) {
    command.requiredArgs.forEach((argInfo, index) => {
      if (!args[index] && argInfo.required) {
        errors.push(`Argument "${argInfo.name}" is required`);
      }
    });
  }
  
  if (errors.length > 0) {
    return `*Invalid arguments!*\n${errors.join('\n')}\n\n*Usage:* ${command.usage}`;
  }
  
  return null;
};

// Track command usage with analytics
const trackCommandUsage = (commandName, executionTime = 0) => {
  const usage = commandUsage.get(commandName) || { count: 0, totalTime: 0, errors: 0 };
  usage.count++;
  usage.totalTime += executionTime;
  commandUsage.set(commandName, usage);
  
  // Update global stats
  performanceStats.commandsExecuted++;
  performanceStats.totalResponseTime += executionTime;
  performanceStats.averageResponseTime = performanceStats.totalResponseTime / performanceStats.commandsExecuted;
};

// Rate limiting system
const rateLimits = new Map();
const checkRateLimit = (sender, isOwner = false) => {
  if (isOwner) return false; // No rate limit for owners
  
  const now = Date.now();
  const userLimits = rateLimits.get(sender) || { count: 0, lastReset: now };
  
  // Reset every minute
  if (now - userLimits.lastReset > 60000) {
    userLimits.count = 0;
    userLimits.lastReset = now;
  }
  
  const maxCommands = config.rateLimit?.maxCommands || 10;
  if (userLimits.count >= maxCommands) {
    return true; // Rate limited
  }
  
  userLimits.count++;
  rateLimits.set(sender, userLimits);
  return false;
};

export const handleMessage = async (client, messageObj) => {
  const startTime = Date.now();
  
  try {
    const { commands, aliases } = await loadCommands();

    const { message, key, pushName } = messageObj;
    const jid = key.remoteJid;
    const sender = key.participant || key.remoteJid;
    const isGroup = jid.endsWith('@g.us');

    // Parse message content with detection
    const { type: messageType, content: body, raw: messageContent, hasMedia, isQuoted } = parseMessage(message);
    
    const prefix = config.prefix || '!';
    const isCommand = body.startsWith(prefix);
    const [command, ...args] = isCommand 
      ? body.slice(prefix.length).trim().split(/\s+/) 
      : ['', []];
    const query = args.join(' ');

    // User information with detection
    const senderNumber = (sender || '').replace(/\D/g, '');
    const senderName = pushName || message?.conversation || 'Unknown';
    const ownerNumbers = Array.isArray(config.owner?.number) 
      ? config.owner.number 
      : [config.owner?.number].filter(Boolean);
    const isOwner = ownerNumbers.includes(senderNumber);

    // Bot information
    const botNumber = client.user?.id?.split('@')[0] || '';
    const botName = client.user?.name || config.botName || 'Bot';
    
    // Group information with metadata
    let groupMetadata = null;
    let groupAdmins = [];
    let isAdmins = false;
    let isBotAdmin = false;
    let groupName = '';
    let groupDescription = '';
    let groupSize = 0;
    
    if (isGroup) {
      try {
        groupMetadata = await client.groupMetadata(jid);
        const participants = groupMetadata.participants || [];
        groupAdmins = getGroupAdmins(participants);
        groupName = groupMetadata.subject || 'Unknown Group';
        groupDescription = groupMetadata.desc || '';
        groupSize = participants.length;
        isAdmins = groupAdmins.includes(sender);
        const botJid = client.user.id;
        isBotAdmin = participants.some(p => p.id === botJid && ['admin', 'superadmin'].includes(p.admin));
      } catch (error) {
        logger.logSystem('Failed to get group metadata: ' + error.message, 'warning');
      }
    }

    // messaging functions with error handling
    const createSendFunction = (defaultOptions = {}) => async (content, options = {}) => {
      try {
        const mergedOptions = {
          quoted: messageObj,
          ephemeralExpiration: config.ephemeralExpiration || 86400,
          ...defaultOptions,
          ...options
        };
        return await client.sendMessage(jid, content, mergedOptions);
      } catch (error) {
        logger.logError(error, { context: 'Send Message' });
        throw error;
      }
    };

    const reply = async (text, options = {}) => {
      if (typeof text !== 'string') text = String(text);
      return createSendFunction()({ text }, options);
    };

    const send = createSendFunction();

    const react = async (emoji) => {
      try {
        return await client.sendMessage(jid, {
          react: { text: emoji, key: key }
        });
      } catch (error) {
        logger.logError(error, { context: 'React' });
      }
    };

    const edit = async (text, messageKey) => {
      try {
        return await client.sendMessage(jid, {
          text: String(text),
          edit: messageKey
        });
      } catch (error) {
        logger.logError(error, { context: 'Edit Message' });
      }
    };

    const deleteMsg = async (messageKey = key) => {
      try {
        return await client.sendMessage(jid, { delete: messageKey });
      } catch (error) {
        logger.logError(error, { context: 'Delete Message' });
      }
    };

    // Advanced utility functions
    const utils = {
      formatTime: (seconds) => {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        return `${days}d ${hours}h ${minutes}m ${secs}s`;
      },
      
      formatBytes: (bytes, decimals = 2) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
      },
      
      sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
      
      isUrl: (text) => {
        try {
          new URL(text);
          return true;
        } catch {
          return false;
        }
      },
      
      extractUrls: (text) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.match(urlRegex) || [];
      },
      
      randomChoice: (array) => array[Math.floor(Math.random() * array.length)],
      
      formatNumber: (num) => new Intl.NumberFormat().format(num),
      
      capitalize: (str) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase(),
      
      truncate: (str, length = 100) => str.length > length ? str.substring(0, length) + '...' : str,
      
      getUptime: () => {
        const uptime = Date.now() - performanceStats.startTime;
        return utils.formatTime(uptime / 1000);
      }
    };
    
    // Privacy and security checks
    const isPublicMode = config.public_mode !== false;
    if (!isPublicMode && !key.fromMe && !isOwner) {
      return;
    }

    // Rate limiting
    if (isCommand && checkRateLimit(sender, isOwner)) {
      return reply("⏳ *Rate limit exceeded!* Please slow down and try again later.");
    }
    
    // Auto features with better presence management
    if (isCommand && message) {
      try {
        await client.readMessages([key]);
        await client.sendPresenceUpdate('composing', jid);
        
        // Auto-clear presence after 10 seconds
        setTimeout(async () => {
          try {
            await client.sendPresenceUpdate('paused', jid);
          } catch (error) {
            // Ignore presence errors
          }
        }, 10000);
      } catch (error) {
        // Ignore read/presence errors
      }
    }
    
    // console logging with better formatting
    if (message) {
      setImmediate(() => {
        const chatType = isGroup ? 'group' : 'private';
        
        logger.logMessage({
          messageType,
          body: body || `[${messageType}]`,
          senderName,
          senderNumber,
          chatType,
          groupName,
          groupSize,
          isOwner,
          isAdmin: isAdmins,
          isCommand,
          hasMedia,
          isQuoted,
          executionTime: isCommand ? Date.now() - startTime : null
        });
      });
    }
    
    // Execute command with performance monitoring
    if (isCommand) {
      const cmdName = command.toLowerCase();
      const cmdHandler = commands.get(cmdName) || (aliases.has(cmdName) ? commands.get(aliases.get(cmdName)) : null);
      
      if (cmdHandler) {
        const commandStartTime = Date.now();
        
        try {
          // Check cooldown with role-based reduction
          const cooldownTime = checkCooldown(cmdHandler, sender, isOwner, isAdmins);
          if (cooldownTime) {
            return reply(`⏳ *Command on cooldown!* Please wait ${cooldownTime.toFixed(1)} seconds.`);
          }

          // Permission checks with better messages
          if (cmdHandler.ownerOnly && !isOwner) {
            return reply("*Owner Only!* This command is restricted to bot owners.");
          }

          if (cmdHandler.groupOnly && !isGroup) {
            return reply("*Group Only!* This command can only be used in groups.");
          }

          if (cmdHandler.privateOnly && isGroup) {
            return reply("*Private Only!* This command can only be used in private chats.");
          }

          if (cmdHandler.adminOnly && !isAdmins && !isOwner) {
            return reply("*Admin Only!* This command requires group admin privileges.");
          }

          if (cmdHandler.botAdminRequired && !isBotAdmin) {
            return reply("*Bot Admin Required!* Please make me an admin to use this command.");
          }

          // argument validation
          const argError = validateCommandArgs(cmdHandler, args);
          if (argError) {
            return reply(argError);
          }

          const context = {
            // Core objects
            client,
            config,
            
            // Message references (multiple for flexibility)
            messages: messageObj,
            message: message,
            messageObj: messageObj,
            msg: messageObj,
            
            messageType,
            messageContent,
            body,
            args,
            command: cmdName,
            query,
            hasMedia,
            isQuoted,
            
            // User permissions
            isOwner,
            isAdmins,
            isBotAdmin,
            isGroup,
            senderNumber,
            senderName,
            pushName,
            
            // Group information
            groupMetadata,
            groupAdmins,
            groupName,
            groupDescription,
            groupSize,
            
            // Chat identifiers
            jid,
            sender,
            key, // This is the important one for quoting
            from: jid,
            chatId: jid,
            
            // Bot information
            botNumber,
            botName,
            prefix,
            
            // utility functions - these already handle quoting correctly
            reply,
            send,
            react,
            edit,
            delete: deleteMsg,
            
            // Direct client access with safety wrapper hehe
            sendMessage: createSendFunction(),
            
            // Additional utilities
            utils,
            
            // System information
            performance: {
              startTime: commandStartTime,
              getExecutionTime: () => Date.now() - commandStartTime
            },
            
            // Commands and help
            commands: new Map(commands),
            getCommand: (name) => commands.get(name.toLowerCase()) || 
                                  (aliases.has(name.toLowerCase()) ? commands.get(aliases.get(name.toLowerCase())) : null),
            
            // Advanced features
            cooldowns,
            commandUsage,
            performanceStats: { ...performanceStats }
          };
          
          logger.logCommand(cmdName, 'executing');

          // Execute command meow
          await cmdHandler.run(context);
          
          // Track successful execution
          const executionTime = Date.now() - commandStartTime;
          trackCommandUsage(cmdHandler.name, executionTime);
          
          logger.logCommand(cmdName, 'success', executionTime);
          
        } catch (error) {
          const executionTime = Date.now() - commandStartTime;
          
          logger.logCommand(cmdName, 'error', executionTime);
          logger.logError(error, {
            command: cmdName,
            user: senderName,
            stack: error.stack
          });
          
          // error track
          performanceStats.errors++;
          const usage = commandUsage.get(cmdHandler.name) || { count: 0, totalTime: 0, errors: 0 };
          usage.errors++;
          commandUsage.set(cmdHandler.name, usage);
          
          // error message with debugging info
          const isDev = config.development === true;
          let errorMessage = `*Command Error*\n\n` +
            `**Command:** ${cmdName}\n` +
            `**Error:** ${error.message || 'Unknown error occurred'}\n`;
          
          if (isDev) {
            errorMessage += `**Execution Time:** ${executionTime}ms\n` +
                          `**Stack:** \`\`\`${error.stack?.split('\n').slice(0, 3).join('\n') || 'No stack trace'}\`\`\`\n`;
          }
          
          errorMessage += `\nPlease try again later or contact the bot owner if the issue persists.`;
          
          await reply(errorMessage);
        }
      } else {
        // Unknown command - suggest similar commands
        const availableCommands = Array.from(commands.keys()).filter(cmd => !commands.get(cmd).hidden);
        const suggestions = availableCommands.filter(cmd => 
          cmd.includes(cmdName) || cmdName.includes(cmd)
        ).slice(0, 3);
        
        let unknownMsg = `*Unknown command:* \`${cmdName}\``;
        if (suggestions.length > 0) {
          unknownMsg += `\n\n*Did you mean:*\n${suggestions.map(s => `• ${prefix}${s}`).join('\n')}`;
        }
        unknownMsg += `\n\nUse \`${prefix}help\` to see all available commands.`;
        
        await reply(unknownMsg);
      }
    }
    
  } catch (error) {
    logger.logError(error, { context: 'Critical Handler Error' });
    
    // Try to send error message
    try {
      await client.sendMessage(messageObj.key.remoteJid, {
        text: "*System Error*\nA critical error occurred. Please try again later."
      });
    } catch (sendError) {
      logger.logError(sendError, { context: 'Failed to send error message' });
    }
  } finally {
    // Always update performance stats
    const totalTime = Date.now() - startTime;
    if (totalTime > 3000) {
      logger.logSystem(`Slow handler execution: ${totalTime}ms`, 'warning');
    }
  }
};

// Utility function to get handler statistics
export const getHandlerStats = () => ({
  ...performanceStats,
  uptime: Date.now() - performanceStats.startTime,
  commandUsage: Object.fromEntries(commandUsage),
  cacheInfo: {
    cached: !!commandCache,
    lastLoad: new Date(lastCommandLoad).toLocaleString(),
    cacheAge: Date.now() - lastCommandLoad
  }
});

// Function to reload commands manually
export const reloadCommands = () => loadCommands(true);

// Function to get performance summary
export const getPerformanceSummary = () => {
  const stats = getHandlerStats();
  const uptime = stats.uptime / 1000;
  
  return {
    commandsExecuted: stats.commandsExecuted,
    averageResponseTime: Math.round(stats.averageResponseTime * 100) / 100,
    errors: stats.errors,
    uptime: Math.round(uptime),
    commandsPerMinute: Math.round((stats.commandsExecuted / (uptime / 60)) * 100) / 100,
    errorRate: Math.round((stats.errors / stats.commandsExecuted) * 10000) / 100
  };
};

export default handleMessage;