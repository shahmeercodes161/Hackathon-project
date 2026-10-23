import mongoose from 'mongoose';
import dns from 'dns';

// Fix for Windows / ISP DNS refusing SRV queries (_mongodb._tcp)
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore if not supported in environment
}

const connectDB = async () => {
  try {
    let uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hackathon_db';
    
    // Ensure database name is present in mongodb+srv connection strings
    if (uri.startsWith('mongodb+srv://') && uri.endsWith('/')) {
      uri = `${uri}hackathon?retryWrites=true&w=majority`;
    }

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.log('⚠️ Tip: Update MONGO_URI in .env with your MongoDB Atlas or local MongoDB connection string.');
  }
};

export default connectDB;
