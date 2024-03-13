import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: toggle subscription
  const subscriberId = req.user?._id;
  if (!subscriberId) {
    throw new apiError(400, "subscriberId is required to toggle subscription");
  }
  const channel = await User.findById(channelId);
  console.log(channel, channelId, subscriberId);

  if (!channel) {
    throw new apiError(404, "Channel not found for subscription toggle");
  }
  const subscription = await Subscription.findOne({
    subscriber: subscriberId,
    channel: channelId,
  });

  try {
    let message = "";
    if (subscription) {
      await Subscription.findByIdAndDelete(subscription._id);
      await User.findByIdAndUpdate(channelId, {
        $pull: { followers: subscriberId },
      });
      message = `Unfollowed `;
    } else {
      await Subscription.create({
        subscriber: subscriberId,
        channel: channelId,
      });
      await User.findByIdAndUpdate(channelId, {
        $push: { followers: subscriberId },
      });
      message = `Followed `;
    }
    res.status(200).json(new apiResponse(200, null, message));
  } catch (error) {
    throw new apiError(500, "Error in toggle subscription");
  }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  const userId = req.user?._id;
  if (!subscriberId) {
    throw new apiError(
      400,
      "subscriberId is required to get channel subscribers"
    );
  }
  const subscribers = await Subscription.find({
    channel: subscriberId,
  }).populate("subscriber", "avatar username fullname");
  //get the user info of the channel
  if (subscribers.length === 0) {
    const owner = await User.findById(subscriberId);
    if (!owner) {
      throw new apiError(404, "Owner not found");
    }
    res.status(200).json(
      new apiResponse(
        200,
        {
          subscribers: [],
          owner: {
            avatar: owner.avatar,
            username: owner.username,
            _id: owner._id,
          },
          isSubscribed: false,
        },
        "Channel subscribers fetched successfully"
      )
    );
  } else {
    try {
      const owner = await User.findById(subscribers[0].channel);

      if (!owner) {
        throw new apiError(404, "Owner not found");
      }

      const isSubscribed = await Subscription.findOne({
        subscriber: userId,
        channel: subscriberId,
      });
      let data = [];
      if (isSubscribed) {
        data = {
          subscribers: subscribers.map((subscriber) => ({
            avatar: subscriber.subscriber.avatar,
            username: subscriber.subscriber.username,
            fullname: subscriber.subscriber.fullname,
          })),
          owner: {
            avatar: owner.avatar,
            username: owner.username,
            _id: owner._id,
          },
          isSubscribed: true,
        };
      } else {
        data = {
          subscribers: subscribers.map((subscriber) => ({
            avatar: subscriber.subscriber.avatar,
            username: subscriber.subscriber.username,
            fullname: subscriber.subscriber.fullname,
          })),
          owner: {
            avatar: owner.avatar,
            username: owner.username,
            _id: owner._id,
          },
          isSubscribed: false,
        };
      }


      res
        .status(200)
        .json(
          new apiResponse(200, data, "Channel subscribers fetched successfully")
        );
    } catch (error) {
      throw new apiError(500, "Error in fetching channel subscribers");
    }
  }
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const subscriberId = req.user?._id;

  if (!subscriberId) {
    throw new apiError(
      400,
      "subscriberId is required to get subscribed channels"
    );
  }
  try {
    const channels = await Subscription.find({
      subscriber: subscriberId,
    }).populate("channel", "avatar username fullname");
    console.log(channels);

    const data = channels.map((channel) => ({
      avatar: channel.channel.avatar,
      username: channel.channel.username,
      fullname: channel.channel.fullname,
    }));
   
    res
      .status(200)
      .json(
        new apiResponse(
          200,
          data,
          "Subscribed channels fetched successfully !!"
        )
      );
  } catch (error) {
    throw new apiError(500, "Error in fetching subscribed channels");
  }
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
