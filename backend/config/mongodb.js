import mongoose from 'mongoose';

const connectDB = async () => {

    mongoose.connection.on('connected', () => {
        console.log("database connected");
    });

    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/ClassMonitor`, {
            maxPoolSize: 10,      // max 10 simultaneous connections
            minPoolSize: 2,       // keep 2 warm connections always alive
            serverSelectionTimeoutMS: 5000,
        });
        console.log('MongoDB connection established with increased pool size');
    }catch(error){
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}

export default connectDB