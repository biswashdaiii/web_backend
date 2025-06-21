import mongoose from 'mongoose';

const CONNECTION_STRING = process.env.MONGODB_URI;

export const connectDB = async () => {
    try {
        await mongoose.connect(CONNECTION_STRING, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("MongoDB connected");
    } catch (err) {
        console.log("DB error", err);
    }
};
