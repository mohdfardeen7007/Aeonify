import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  // Store the entire creds object
  creds: {
    noiseKey: {
      private: String,
      public: String
    },
    pairingEphemeralKeyPair: {
      private: String,
      public: String
    },
    signedIdentityKey: {
      private: String,
      public: String
    },
    signedPreKey: {
      keyPair: {
        private: String,
        public: String
      },
      signature: String,
      keyId: Number
    },
    registrationId: Number,
    advSecretKey: String,
    processedHistoryMessages: [{
      key: {
        remoteJid: String,
        fromMe: Boolean,
        id: String,
        participant: String
      },
      messageTimestamp: Number
    }],
    nextPreKeyId: Number,
    firstUnuploadedPreKeyId: Number,
    accountSyncCounter: Number,
    accountSettings: {
      unarchiveChats: Boolean
    },
    registered: Boolean,
    account: {
      details: String,
      accountSignatureKey: String,
      accountSignature: String,
      deviceSignature: String,
      deviceSignatureKey: String
    },
    me: {
      id: String,
      lid: String,
      name: String
    },
    signalIdentities: [{
      identifier: {
        name: String,
        deviceId: Number
      },
      identifierKey: String
    }],
    platform: String,
    routingInfo: String,
    lastAccountSyncTimestamp: Number,
    myAppStateKeyId: String,
    lastPropHash: String
  },
  // Store pre-keys
  preKeys: {
    type: Map,
    of: {
      keyPair: {
        private: String,
        public: String
      },
      keyId: Number,
      signature: String
    }
  },
  // Store app state sync keys
  appStateSyncKeys: [{
    keyId: String,
    keyData: String
  }],
  // Store sender keys
  senderKeys: [{
    keyId: String,
    keyData: String
  }],
  // Store session keys
  sessionKeys: [{
    keyId: String,
    keyData: String
  }],
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Update the updatedAt timestamp before saving
sessionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create indexes for better query performance
sessionSchema.index({ 'creds.me.id': 1 });
sessionSchema.index({ createdAt: -1 });

const Session = mongoose.models.Session || mongoose.model('Session', sessionSchema);

export default Session; 