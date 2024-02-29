import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import {Tweet} from "../models/tweet.model.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video
  const userId = req.user?._id;
  const video = await Video.findById(videoId);
  if (!video) {
    throw new apiError(400, "videoId is required");
  }
  if (!userId) {
    throw new apiError(400, "userId is required");
  }

  const like = await Like.findOne({ video: videoId, likedBy: userId });

  let message = "";
  if (like) {
    await Like.findByIdAndDelete(like._id);
    message = "Like removed successfully";
  } else {
    await Like.create({ video: videoId, likedBy: userId });
    message = "Video liked successfully";
  }
  
  res.status(200)
    .json(new apiResponse(200, like, message));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
    const userId = req.user?._id;
    if (!userId) {
        throw new apiError(400, "userId is required");
    }
    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new apiError(400, "commentId is required");
    }
    const like = await Like.findOne({ comment: commentId, likedBy: userId });
    let message = "";

    if(like){
        await Like.findByIdAndDelete(like._id);
        message = "Like removed successfully";
    }else{
        await Like.create({comment : commentId, likedBy : userId});
        message = "Comment liked successfully";
    }
    
    res.status(200)
    .json(new apiResponse(200, like, message));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
    const userId = req.user?._id;
    if (!userId) {
        throw new apiError(400, "userId is required");
    }
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new apiError(400, "tweetId is required");
    }
 try {
       const like = await Like.findOne({ tweet: tweetId, likedBy: userId });
       let message = "";
   
       if(like){
           await Like.findByIdAndDelete(like._id);
           message = "Like removed successfully";
       } else {
           await Like.create({tweet : tweetId, likedBy : userId});
           message = "Tweet liked successfully";
       }
       tweet.likesCount += (like ? -1 : 1);
       await tweet.save();
       res.status(200)
         .json(new apiResponse(200, like, message));
 } catch (error) {
    throw new apiError(400, error?.message || "Something went wrong while liking tweet");
 }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  const userId = req.user?._id;
  if (!userId) {
    throw new apiError(400, "userId is required");
  }

  const videos = await Video.find({ likes: userId });
  res
    .status(200)
    .json(new apiResponse(200, videos, "Liked videos fetched successfully"));
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
