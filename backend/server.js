import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import cookieparser from 'cookie-parser';
import userRouter from './routes/userRoutes.js'

import connectDB from "./config/mongodb.js";

const app = express();
const port = process.env.PORT || 4000;
connectDB();

app.use(express.json());
app.use(cookieparser());
app.use(cors({credentials:true}));
app.use(express.urlencoded({ extended: true }));

// API Endpoints
app.get("/", (req, res) => res.send("API working"));

app.use('/user', userRouter);

app.listen(port, () => console.log(`Server started on PORT : ${port}`));