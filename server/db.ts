import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const rawUri =
  process.env.MONGODB_URI ||
  'mongodb://127.0.0.1:27017/jdpay';
const MONGODB_URI = rawUri.replace(/^["']|["']$/g, '').trim();

let isConnected = false;

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose;
  }

  try {
    mongoose.set('strictQuery', false);
    const conn = await mongoose.connect(MONGODB_URI, {
      dbName: 'jdpay',
      serverSelectionTimeoutMS: 8000,
    });
    isConnected = true;
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error('[MongoDB] Connection error:', error);
    throw error;
  }
}

export function getDatabaseStatus() {
  const states: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return {
    state: states[mongoose.connection.readyState] || 'unknown',
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host || 'MongoDB Atlas',
    dbName: mongoose.connection.name || 'jdpay',
  };
}
