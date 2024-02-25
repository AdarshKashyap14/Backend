import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors"


const app = express();

app.use(cors({

    origin : process.env.CORS_ORIGIN,  // change this to your own domain if you want to allow
    credentials : true 
})) //use is basically used for middlewares

app.use(express.json({limit : "20kb"}))
app.use(express.urlencoded({extended: true , limit : "20kb"})); // we use extended  as false by default in express but here we are 
app.use(express.static("public")) // here its used for storing  the frontend files like images and parameter is passed public is the folder name 
app.use(cookieParser())


export { app };