import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const video = await Video.findById(videoId);
  if (!video) {
    throw new apiError(400, "videoId is required");
  }
  try {
    const comments = await Comment.aggregate([
      {
        $match: {
          video: new mongoose.Types.ObjectId(videoId),
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
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
        },
      },
      {
        $unwind: "$owner",
      },
      {
        $project: {
          "owner.password": 0,
          "owner.email": 0,
          "owner.createdAt": 0,
          "owner.updatedAt": 0,
        },
      },
    ]);

    if (!comments) {
      throw new apiError(404, "No comments found");
    }
    // console.log(comments);

    res
      .status(200)
      .json(new apiResponse(200, comments, "Comments fetched successfully"));
  } catch (error) {
    throw new apiError(500, error?.message || "An error occurred in comment");
  }
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId } = req.params;
  const { content } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new apiError(400, "User not found");
  }

  if (!videoId) {
    throw new apiError(400, "videoId is required");
  }
  if (!content) {
    throw new apiError(400, "content is required");
  }

  try {
    const comment = new Comment({
      content,
      owner: req.user._id,
      video: videoId,
    });
    const newComment = await comment.save();

    res
      .status(200)
      .json(new apiResponse(200, newComment, "Comment added successfully"));
  } catch (error) {
    throw new apiError(500, error?.message || "An error occurred in comment");
  }
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  const { content } = req.body;

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new apiError(404, "Comment not found");
  }

  if(!content){
    throw new apiError(400, "content is required");
  }

  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new apiError(400, "User not found");
  }
  try {
    if (String(comment.owner) !== String(req.user._id)) {
      throw new apiError(403, "You are not allowed to update this comment");
    }

    comment.content = content;
    const updatedComment = await comment.save();
    res
      .status(200)
      .json(
        new apiResponse(200, updatedComment, "Comment updated successfully")
      );
  } catch (error) {
    throw new apiError(
      500,
      error?.message || "An error occurred in comment update"
    );
  }
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
    const { commentId } = req.params;
    const comment = await Comment.findById(commentId);

    if(!comment){
        throw new apiError(404, "Comment not found");
    }

    const user = await User.findById(req.user._id);
    if(!user){
        throw new apiError(400, "User not found");
    }
    try {
        if(String(comment.owner) !== String(req.user?._id)){
            throw new apiError(403, "You are not allowed to delete this comment");
        }
        await Comment.findByIdAndDelete(commentId);
        res.status(200).json(new apiResponse(200, null, "Comment deleted successfully"));
    } catch (error) {
        throw new apiError(500, error?.message || "An error occurred in comment delete");
    }
});

export { getVideoComments, addComment, updateComment, deleteComment };
