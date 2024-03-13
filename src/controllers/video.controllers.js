import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
  extractPublicId,
} from "../utils/cloudinary.js";

//TODO: to get all videos and details to show on home page
const allVideos = asyncHandler(async (req, res) => {
  //TODO: get all videos in videos that are published

  const videos = await Video.find({
    isPublished : true
  }).populate("owner", "username avatar");

  res
    .status(200)
    .json(new apiResponse(200, videos, "Videos fetched successfully"));
});

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 2, query, sortBy, sortType } = req.query;

  try {
    const videos = await Video.aggregate([
      {
        $match: {
          $or: [
            { title: { $regex: query, $options: "i" } }, // Case-insensitive search in title
            { description: { $regex: query, $options: "i" } }, // Case-insensitive search in description
          ],
        },
      },
      {
        $sort: {
          [sortBy]: sortType === "asc" ? 1 : -1,
        },
      },
      {
        $skip: (page - 1) * limit,
      },
      {
        $limit: limit,
      },
      {
        $lookup: {
          from: "users", // Assuming your user collection is named "users"
          localField: "owner", // Field in the videos collection
          foreignField: "_id", // Field in the users collection
          as: "ownerInfo", // Alias for the retrieved user information
        },
      },
      {
        $project: {
          title: 1,
          description: 1,
          thumbnail: 1,
          videoFile: 1,
          duration: 1,
          views: 1,
          isPublished: 1,
          createdAt: 1,
          updatedAt: 1,
          ownerInfo: {
            _id: 1,
            avatar: 1,
            username: 1,
            subscribers: 1,
          },
        },
      },
    ]);

    res
      .status(200)
      .json(new apiResponse(200, videos, "Videos fetched successfully"));
  } catch (error) {
    throw new apiError(
      400,
      error?.message || "Something went wrong while getting videos"
    );
  }
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video
  const videoFile = req.files.videoFile[0].path;
  const thumbnail = req.files.thumbnail[0].path;

  if (!videoFile && !thumbnail) {
    throw new apiError(400, "videoFile and thumbnail are required");
  }

  const videoLink = await uploadToCloudinary(videoFile);
  const thumbnailLink = await uploadToCloudinary(thumbnail);

  if (!videoLink.url && !thumbnailLink.url) {
    throw new apiError(500, "Failed to upload video and thumbnail");
  }

  const video = new Video({
    videoFile: videoLink.url,
    thumbnail: thumbnailLink.url,
    title,
    description,
    duration: videoLink.duration,
    owner: req.user?._id,
  });
  const savedVideo = await video.save();

  res
    .status(201)
    .json(new apiResponse(201, savedVideo, "Video published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
  const video = await Video.findById(videoId);
  if (!video) {
    throw new apiError(404, "Video not found with this id");
  }
  res
    .status(200)
    .json(new apiResponse(200, video, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
  const video = await Video.findById(videoId);
  if (!video) {
    throw new apiError(404, "Video not found to update");
  }

  const videoFile = req.file?.path;
  const thumbnail = req.file?.path;
  const thumbnailPublicId = extractPublicId(video.thumbnail);
 

  try {
    await deleteFromCloudinary(thumbnailPublicId);
    const thumbnailLink = await uploadToCloudinary(thumbnail);
    
  if (!thumbnailLink.url) {
    throw new apiError(400, "thumbnail is required");
  }

    const videoDetails = await Video.findByIdAndUpdate(
      videoId,
      {
        title: req.body.title || video.title,
        description: req.body.description || video.description,
        videoFile: videoFile.url || video.videoFile,
        thumbnail: thumbnailLink.url,
      },
      { new: true }
    );
   

    res
      .status(200)
      .json(new apiResponse(200, videoDetails, "Video updated successfully"));
  } catch (error) {
    throw new apiError(
      400,
      error?.message || "Something went wrong will updating vedio"
    );
  }
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  //TODO: delete video

  const video = await Video.findById(videoId);

  if (!video) {
    throw new apiError(404, "Video not found to delete");
  }

  const ownerOfVideo = video.owner.toString();
  const userId = req.user?._id.toString();

  if (ownerOfVideo !== userId) {
    throw new apiError(403, "You are not authorized to delete this video");
  }

  try {
    const videoPublicId = extractPublicId(video.videoFile);
    const thumbnailPublicId = extractPublicId(video.thumbnail);

    // delete from cloudinary
    await deleteFromCloudinary(videoPublicId);
    await deleteFromCloudinary(thumbnailPublicId);

    // use the mongoose aggregation pipeline to delete the video and delete all the likes and comments on the video
    await Comment.deleteMany({ video: videoId });

    // Delete all likes related to the video
    await Like.deleteMany({ video: videoId });

    // Use aggregation pipeline to delete related comments and likes
    // await Comment.aggregate([
    //   { $match: { video: mongoose.Types.ObjectId(videoId) } },
    //   { $project: { _id: 1 } },
    // ]).then(async (comments) => {
    //   const commentIds = comments.map((comment) => comment._id);
    //   await Comment.deleteMany({ _id: { $in: commentIds } });
    // });

    // await Like.aggregate([
    //   { $match: { video: mongoose.Types.ObjectId(videoId) } },
    //   { $project: { _id: 1 } },
    // ]).then(async (likes) => {
    //   const likeIds = likes.map((like) => like._id);
    //   await Like.deleteMany({ _id: { $in: likeIds } });
    // });

    await Video.findByIdAndDelete(videoId);
  

    res
      .status(200)
      .json(new apiResponse(200, null, "Video deleted successfully"));
  } catch (error) {
    throw new apiError(400, "Error in deleting video");
  }
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const video = await Video.findById(videoId);
  if (!video) {
    throw new apiError(404, "Video not found");
  }
  try {
    video.isPublished = !video.isPublished;
    const updatedVideo = await video.save();

    res.status(200).json(new apiResponse(200, updatedVideo, "Status updated"));
  } catch (error) {
    throw new apiError(400, "Error in toggle publish status");
  }
});

// I want to create a controller to get all videos of the user

const getVideosByUser = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new apiError(400, "userId is required to get videos");
  }

  try {
    const videos = await Video.find({ owner: userId });
    res
      .status(200)
      .json(new apiResponse(200, videos, "Videos fetched successfully"));
  } catch (error) {
    throw new apiError(
      400,
      error?.message || "Something went wrong while getting videos"
    );
  }
});

export {
  getVideosByUser,
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  allVideos,
};
