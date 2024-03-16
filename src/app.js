import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors"


const app = express();

app.use(cors({

    origin : process.env.CORS_ORIGIN,  // change this to your own domain if you want to allow
    credentials : true 
}))
 //use is basically used for middlewares

app.use(express.json({limit : "20kb"}))
app.use(express.urlencoded({extended: true , limit : "20kb"})); // we use extended  as false by default in express but here we are 
app.use(express.static("public")) // here its used for storing  the frontend files like images and parameter is passed public is the folder name 
app.use(cookieParser())


//routes import
import userRoutes from "./routes/user.routes.js";
import videoRoutes from "./routes/video.routes.js";
import commentRoutes from "./routes/comment.routes.js";
import likeRoutes from "./routes/like.routes.js";
import tweetRoutes from "./routes/tweet.routes.js";
import subscriptionRoutes from "./routes/subscription.routes.js";
import playlistRoutes from "./routes/playlist.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js"

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/videos", videoRoutes);
app.use("/api/v1/comments", commentRoutes);
app.use("/api/v1/likes", likeRoutes);
app.use("/api/v1/tweets", tweetRoutes);
app.use("/api/v1/subscriptions", subscriptionRoutes);
app.use("/api/v1/playlists", playlistRoutes);
app.use("/api/v1/dashboard", dashboardRouter);



export { app };