import mongoose from 'mongoose';
import dotenv from 'dotenv';

const connectMongoDB = async () => {
  dotenv.config();
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Add more connection options as needed
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    // Optionally, rethrow the error to propagate it to calling code
    // throw error;
  }
};

export default connectMongoDB;
