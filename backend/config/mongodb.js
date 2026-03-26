import mongoose from 'mongoose';

const connectDB = async () => {

    mongoose.connection.on('connected', () => {
        console.log("database connected");
    });

<<<<<<< HEAD
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/ClassMonitor`, {
            maxPoolSize: 400
        });
        console.log('MongoDB connection established with increased pool size');
    }catch(error){
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
=======
    await mongoose.connect(`${process.env.MONGODB_URI}/ClassMonitor`);
>>>>>>> fae32d8 (Initial commit - teacher dashboard)
}

export default connectDB