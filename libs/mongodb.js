import mongoose from 'mongoose';
import dotenv from 'dotenv';

const connectMongoDB = async () => {
  dotenv.config();
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
  } catch (error) {
    console.log(error);
  }
};

export default connectMongoDB;
