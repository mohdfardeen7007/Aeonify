import mongoose from 'mongoose';
import config from '../config.js';
import Session from '../models/Session.js';

class MongoStore {
  constructor() {
    this.session = null;
    this.isConnected = false;
  }

  async init() {
    try {
      if (this.isConnected) {
        console.log('Already connected to MongoDB');
        return;
      }

      await mongoose.connect(config.mongodb.uri, config.mongodb.options);
      this.isConnected = true;
      console.log('Connected to MongoDB');

      // Handle connection errors
      mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err);
        this.isConnected = false;
      });

      // Handle disconnection
      mongoose.connection.on('disconnected', () => {
        console.log('MongoDB disconnected');
        this.isConnected = false;
      });

    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  async loadSession() {
    try {
      if (!this.isConnected) {
        throw new Error('Not connected to MongoDB');
      }

      const session = await Session.findOne({});
      
      if (session) {
        this.session = session;
        return {
          creds: session.creds,
          preKeys: session.preKeys
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error loading session:', error);
      throw error;
    }
  }

  async saveSession(sessionData) {
    try {
      if (!this.isConnected) {
        throw new Error('Not connected to MongoDB');
      }

      const Session = mongoose.model('Session');
      const session = await Session.findOne({}) || new Session();

      if (sessionData.creds) {
        // Ensure signalIdentities is properly formatted
        if (sessionData.creds.signalIdentities) {
          sessionData.creds.signalIdentities = sessionData.creds.signalIdentities.map(identity => ({
            identifier: {
              name: identity.identifier.name || identity.identifier,
              deviceId: identity.identifier.deviceId || 0
            },
            identifierKey: identity.identifierKey
          }));
        }

        // Handle processedHistoryMessages
        if (sessionData.creds.processedHistoryMessages) {
          sessionData.creds.processedHistoryMessages = sessionData.creds.processedHistoryMessages.map(msg => {
            if (typeof msg === 'string') {
              try {
                return JSON.parse(msg);
              } catch (e) {
                return {
                  key: {
                    remoteJid: msg,
                    fromMe: false,
                    id: '',
                    participant: undefined
                  },
                  messageTimestamp: Date.now()
                };
              }
            }
            return msg;
          });
        }

        session.creds = sessionData.creds;
      }
      if (sessionData.preKeys) {
        session.preKeys = sessionData.preKeys;
      }

      await session.save();
      this.session = session;
      console.log('Session saved to MongoDB');
    } catch (error) {
      console.error('Error saving session:', error);
      throw error;
    }
  }

  async deleteSession() {
    try {
      if (!this.isConnected) {
        throw new Error('Not connected to MongoDB');
      }

      await Session.deleteMany({});
      this.session = null;
      console.log('Session deleted from MongoDB');
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }

  // Helper methods for converting between Buffer and string
  bufferToBase64(buffer) {
    return buffer.toString('base64');
  }

  base64ToBuffer(base64) {
    return Buffer.from(base64, 'base64');
  }
}

export default MongoStore; 