import mongoose from "mongoose";
import dotenv from 'dotenv';

dotenv.config({ 
    path:'./.env'
});

const connectdb=async()=>{
    try {
        // const conn = await mongoose.connect(process.env.MONGO_URI);
        // console.log(`MongoDB Connected`);
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URI}`)
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`); 
    } catch (error) {
        console.log("Error connecting to MongoDB:", error);
        process.exit(1);
    }
}

export default connectdb;
