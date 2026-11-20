import mongoose from "mongoose";

const connectDB = async () => {
  // 🔍 Debug: Check if the URI is actually being read
  if (!process.env.MONGO_URI) {
    console.error("❌ Error: MONGO_URI is not defined in .env file!");
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000, 
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    
    // Optional: Retry after 5 seconds
    console.log("🔄 Retrying connection in 5 seconds...");
    setTimeout(connectDB, 5000);
  }
};

export default connectDB;