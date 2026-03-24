import mongoose from 'mongoose';

const connectDB = async () => {

    mongoose.connection.on('connected', () => {
        console.log("database connected");
    });

    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/ClassMonitor`, {
            maxPoolSize: 400
        });
        console.log('MongoDB connection established with increased pool size');
    }catch(error){
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}

export default connectDB