import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
  extractPublicId,
} from "../utils/cloudinary.js";


//TODO: to get all videos and details to show on home page
const allVideos = asyncHandler(async (req, res) => {
  //TODO: get all videos in videos
  const videos = await Video.find({}).populate("owner", "username avatar");
  res.status(200).json(new apiResponse(200, videos, "Videos fetched successfully"));
});



const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
  const user = await User.findById(userId);
  if (!isValidObjectId(user)) {
    throw new apiError(400, "userId is invalid");
  }

  try {
    const videos = await Video.aggregate([
      {
        $match: {
          owner: new mongoose.Types.ObjectId(userId),
        },
      },
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
        },
      },
    ]);

    res
      .status(200)
      .json(new apiResponse(200, videos, "Videos fetched successfully"));
  } catch (error) {
    throw new apiError(
      400,
      error?.message || "Something went wrong will getting vedios"
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
    throw new apiError(404, "Video not found");
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
    throw new apiError(404, "Video not found");
  }

  const videoFile = req.file?.path;
  const thumbnail = req.file?.path;

  if (!thumbnail.url) {
    throw new apiError(400, "thumbnail is required");
  }

  try {
    const videoDetails = await Video.findByIdAndUpdate(
      videoId,
      {
        title: req.body.title || video.title,
        description: req.body.description || video.description,
        videoFile: videoFile.url || video.videoFile,
        thumbnail: thumbnail.url,
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
  console.log(video);
  if (!video) {
    throw new apiError(404, "Video not found");
  }

  const ownerOfVideo = video.owner.toString();
  const userId =  req.user?._id.toString();
 console.log(ownerOfVideo, req.user);

  if (ownerOfVideo !== userId) {
    throw new apiError(403, "You are not authorized to delete this video");
  }


  const videoPublicId = extractPublicId(video.videoFile);
  const thumbnailPublicId = extractPublicId(video.thumbnail);
  console.log(videoPublicId, thumbnailPublicId);
  // delete from cloudinary
  await deleteFromCloudinary(videoPublicId);
  await deleteFromCloudinary(thumbnailPublicId);
  await Video.findByIdAndDelete(videoId);

  res
    .status(200)
    .json(new apiResponse(200, null, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const video = await Video.findById(videoId);
  if (!video) {
    throw new apiError(404, "Video not found");
  }
  video.isPublished = !video.isPublished;
  const updatedVideo = await video.save();

  res.status(200).json(new apiResponse(200, updatedVideo, "Status updated"));

});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  allVideos
};
