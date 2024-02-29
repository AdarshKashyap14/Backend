import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {Comment} from "../models/comment.model.js"
import { apiError } from "../utils/apiError.js"
import { apiResponse } from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const channel = req.user?._id;
    //sum all the views
    const videos = await Video.find({owner:channel});
    let viewCount=0;
    for(let i of videos){
        viewCount+=i.views;
    }
    
    //get number of followers
    const subscribers = await Subscription.countDocuments({channel});
    const likes = await Like.countDocuments({likedBy:{$in:[channel]}});
    const comments = await Comment.countDocuments({owner:channel});
    const views = videos.reduce((acc, video) => acc + video.views, 0);
    res.status(200).json(new apiResponse(200,  {viewCount, subscribers, likes, comments, views},"Channel stats"))
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const channel = req.user?._id;
    const videos = await Video.find({owner:channel});
    res.status(200).json(new apiResponse(200, videos, "Channel videos"))
})

export {
    getChannelStats, 
    getChannelVideos
    }