import mongoose from 'mongoose';

const LogSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now
  },
  level: {
    type: String,
    enum: ['INFO', 'WARN', 'ERROR', 'DEBUG'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed, // Flexible payload: userId, commandName, args, etc.
    default: {}
  },
  pid: {
    type: Number,
    default: process.pid
  }
});

export default mongoose.model('Log', LogSchema);
