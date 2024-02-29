import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { Tweet } from "../models/tweet.model.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  const { content } = req.body;
  const userId = req.user?._id;
  if (!userId) {
    throw new apiError(400, "userId is required to create a tweet");
  }
  if (!content) {
    throw new apiError(400, "content is required to create a tweet");
  }
  const tweet = await Tweet.create({ content, owner: userId });
  res.status(200).json(new apiResponse(200, tweet, "Tweeted successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const userId = req.user?._id;
  if (!userId) {
    throw new apiError(400, "userId is required to fetch tweets");
  }
  try {
    const tweets = await Tweet.find({ owner: userId });

    res
      .status(200)
      .json(new apiResponse(200, tweets, "Tweets fetched successfully"));
  } catch (error) {
    throw new apiError(500, "Error fetching tweets");
  }
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const { tweetId } = req.params;
  const { content } = req.body;
  const userId = req.user?._id;
  if (!userId) {
    throw new apiError(400, "userId is required to update a tweet");
  }
  if (!content) {
    throw new apiError(400, "content is required to update a tweet");
  }

  let tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new apiError(404, "Tweet not found");
  }
  if (tweet.owner.toString() !== userId.toString()) {
    throw new apiError(400, "You are not authorized to update this tweet");
  }

  try {
    const updateTweet = await Tweet.findOneAndUpdate(
      { _id: tweetId, owner: userId },
      { content },
      { new: true }
    );

    res
      .status(200)
      .json(new apiResponse(200, updateTweet, "Tweet updated successfully"));
  } catch (error) {
    throw new apiError(500, "Error updating tweet");
  }
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const { tweetId } = req.params;
  const userId = req.user?._id;
  if (!userId) {
    throw new apiError(400, "userId is required to delete a tweet");
  }
  const tweet = await Tweet.findById(tweetId);

  const deleteTweet = await Tweet.findOneAndDelete({
    _id: tweetId,
    owner: userId,
  });
  if (!deleteTweet) {
    throw new apiError(400, "You are not authorized to delete this tweet");
  }
  res
    .status(200)
    .json(new apiResponse(200, deleteTweet, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
