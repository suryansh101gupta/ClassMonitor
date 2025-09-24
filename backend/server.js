import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import cookieparser from 'cookie-parser';
import userRouter from './routes/userRoutes.js'

import connectDB from "./config/mongodb.js";
import userDataRouter from './routes/userDataRoutes.js';

const app = express();
const port = process.env.PORT || 4000;
connectDB();

const allowedOrigins = ['http://localhost:5173']

app.use(express.json());
app.use(cookieparser());
app.use(cors({origin:allowedOrigins, credentials:true}));
app.use(express.urlencoded({ extended: true }));

// API Endpoints
app.get("/", (req, res) => res.send("API working"));

app.use('/user', userRouter);

app.use('/user-data', userDataRouter);

app.listen(port, () => console.log(`Server started on PORT : ${port}`));