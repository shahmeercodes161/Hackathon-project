import mongoose from 'mongoose';
import dns from 'dns';

// Fix for Windows / ISP DNS refusing SRV queries (_mongodb._tcp)
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore
}

let isConnecting = false;

const attemptConnection = async () => {
  if (mongoose.connection.readyState === 1 || isConnecting) return;
  isConnecting = true;

  let uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hackathon_db';

  if (uri.startsWith('mongodb+srv://') && uri.endsWith('/')) {
    uri = `${uri}hcm_lite?retryWrites=true&w=majority`;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`\n⚠️  MongoDB Connection Pending: ${error.message}`);
    console.warn(`👉 To enable MongoDB Atlas: Go to cloud.mongodb.com -> Network Access -> Add IP Address -> Choose 'Allow Access from Anywhere' (0.0.0.0/0) -> Confirm.`);
    console.warn(`🔄 Reconnecting automatically in background every 10 seconds...\n`);
  } finally {
    isConnecting = false;
  }
};

const connectDB = async () => {
  await attemptConnection();

  // Keep attempting reconnect in background if initially disconnected
  setInterval(() => {
    if (mongoose.connection.readyState !== 1) {
      attemptConnection();
    }
  }, 10000);
};

export default connectDB;
