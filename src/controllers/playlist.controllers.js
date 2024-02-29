import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { Playlist } from "../models/playlist.model.js";
import { User } from "../models/user.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  //TODO: create playlist
  const owner = await User.findById(req.user?._id);
  if (!owner) {
    throw new apiError(404, "User not found");
  }
  if (!title || !description) {
    throw new apiError(400, "Title and description are required");
  }
  //check that the playlist title is unique
  const playlistExists = await Playlist.findOne({ title });
  if (playlistExists) {
    throw new apiError(400, "Playlist with this title already exists");
  }
  const playlist = new Playlist({
    title,
    description,
    owner: owner?._id,
  });
  const playlistCreated = await playlist.save();
  console.log(playlistCreated);
  // owner.playlists.push(playlistCreated._id)
  // await owner.save()
  console.log(owner);

  res
    .status(200)
    .json(
      new apiResponse(200, "Playlist created", { playlist: playlistCreated })
    );
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get user playlists
  const user = await User.findById(userId);
  if (!user) {
    throw new apiError(404, "User not found");
  }
  //write using aggregate
  const playlists = await Playlist.aggregate([
    {
      $match: { owner: new mongoose.Types.ObjectId(userId) },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
      },
    },
    {
      $project: {
        title: 1,
        description: 1,
        videos: 1,
        owner: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ]);

  console.log(playlists);

  if (playlists.length === 0) {
    throw new apiError(404, "No playlists found");
  }

  res.status(200).json(new apiResponse(200, { playlists }, "Playlists found"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  //TODO: get playlist by id
  const playlist = await Playlist.findById(playlistId).populate("videos");
  if (!playlist) {
    throw new apiError(404, "Playlist not found");
  }
  try {
    res
      .status(200)
      .json(
        new apiResponse(
          200,
          { playlist },
          "Playlist found and populated with videos"
        )
      );
  } catch (error) {
    throw new apiError(500, "Error getting playlist");
  }
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new apiError(404, "Playlist not found");
  }
  if (playlist.owner.toString() !== req.user?._id.toString()) {
    throw new apiError(
      403,
      "You are not the owner of this playlist so you cannot add videos to it."
    );
  }
  const videoExists = playlist.videos.find((v) => v.toString() === videoId);
  if (videoExists) {
    throw new apiError(400, "Video already exists in playlist");
  }

  try {
    await playlist.videos.push(videoId);
    const updatedPlaylist = await playlist.save();
    res
      .status(200)
      .json(new apiResponse(200, updatedPlaylist, "Video added to playlist"));
  } catch (error) {
    throw new apiError(500, "Error adding video to playlist");
  }
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: remove video from playlist
  const playlist = await Playlist.findById(playlistId);
  if (!(playlist || videoId)) {
    throw new apiError(404, "Playlist or video not found. ");
  }
  if (playlist.owner.toString() !== req.user?._id.toString()) {
    throw new apiError(
      403,
      "You are not the owner of this playlist so you cannot remove videos"
    );
  }
  try {
    await playlist.videos.pull(videoId);
    const updatedPlaylist = await playlist.save();
    res
      .status(200)
      .json(
        new apiResponse(200, updatedPlaylist, "Video removed from playlist")
      );
  } catch (error) {
    throw new apiError(500, "Error removing video from playlist");
  }
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new apiError(404, "Playlist not found");
  }
  if (playlist.owner.toString() !== req.user?._id.toString()) {
    throw new apiError(
      403,
      "You are not the owner of this playlist so you cannot delete it"
    );
  }

  try {
    await Playlist.findByIdAndDelete(playlistId);
    const remainingPlaylists = await Playlist.find({ owner: req.user?._id });
    res
      .status(200)
      .json(new apiResponse(200, remainingPlaylists, "Playlist deleted"));
  } catch (error) {
    throw new apiError(500, "Error deleting playlist");
  }
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { title, description } = req.body;
  //TODO: update playlist
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new apiError(404, "Playlist not found");
  }
  if (playlist.owner.toString() !== req.user?._id.toString()) {
    throw new apiError(
      403,
      "You are not the owner of this playlist so you cannot update it"
    );
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    { title, description },
    { new: true }
  );

  res
    .status(200)
    .json(
      new apiResponse(200, updatedPlaylist, "Playlist updated successfully.")
    );
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
