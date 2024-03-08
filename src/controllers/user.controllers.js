import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const AccessToken = user.generateAccessToken();
    const RefreshToken = user.generateRefreshToken();

    user.refreshToken = RefreshToken;
    await user.save({ validateBeforeSave: false });

    return { AccessToken, RefreshToken };
  } catch (error) {
    throw new apiError(500, "Error generating tokens");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  //Get user details from frontend
  //validation
  //check it user already exists
  //files hai ki nhi
  //upload them to cloudinary
  //create user object and store in db
  //remove password and refersh token from the response
  //check for user creation
  //send response back

  const { username, email, fullname, password } = req.body;

  if (
    [username, email, fullname, password].some(
      (fields) => fields?.trim() === ""
    )
  ) {
    throw new apiError(400, "Please provide all the details");
  }

  const userExist = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (userExist) {
    throw new apiError(409, "User already exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new apiError(400, "Please provide avatar image");
  }

  const avatarUrl = await uploadToCloudinary(avatarLocalPath);
  const coverImageUrl = await uploadToCloudinary(coverImageLocalPath);

  if (!avatarUrl.url) {
    throw new apiError(500, "Error uploading avatar image");
  }

  const user = await User.create({
    username: username.toLowerCase(),
    email,
    fullname,
    password,
    avatar: avatarUrl.url,
    coverImage: coverImageUrl?.url || "",
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new apiError(500, "Error creating user");
  }

  return res
    .status(201)
    .json(new apiResponse(201, createdUser, "User created successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  //req body se username and password nikalo -data
  //username or email
  //password check
  //access and refresh token generate
  //send cookies
  //send response back

  const { username, email, password } = req.body;

  if (!(username || email)) {
    throw new apiError(400, "Please provide username or email");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new apiError(400, "User not exists");
  }

  const isPasswordMatch = await user.isPasswordCorrect(password);
  if (!isPasswordMatch) {
    throw new apiError(401, "Invalid credentials");
  }

  const { AccessToken, RefreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  //by this cookies will modifies only server they are visible in the browser
  const option = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("AccessToken", AccessToken, option)
    .cookie("RefreshToken", RefreshToken, option)
    .json(
      new apiResponse(
        200,
        {
          user: loggedInUser,
          AccessToken,
          RefreshToken,
        },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  //cookies se access token nikalo
  //access token se user id nikalo
  //user id se user find karo
  //user ka refresh token ko empty karo
  //cookies ko empty karo
  //send response back

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: { refreshToken: 1 },
    },
    {
      new: true,
    }
  );

  const option = {
    httpOnly: true,
    secure: true,
  };
  console.log("logout");

  return res
    .status(200)
    .clearCookie("AccessToken", option)
    .clearCookie("RefreshToken", option)
    .json(new apiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingAccessToken =
    req.cookies?.refreshToken || req.body.refreshToken;
  if (!incomingAccessToken) {
    throw new apiError(400, "Please provide refresh token");
  }

  try {
    const decodedToken = jwt.verify(
      incomingAccessToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new apiError(401, "Invalid refresh token");
    }

    if (user?.refreshToken !== incomingAccessToken) {
      throw new apiError(401, "RefreshToken is expired or used");
    }

    const option = {
      httpOnly: true,
      secure: true,
    };
    //Generate a new access token with
    const { accessToken, newrefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("AccessToken", accessToken, option)
      .cookie("RefreshToken", newrefreshToken, option)
      .json(
        new apiResponse(
          200,
          { accessToken, refreshToken: newrefreshToken },
          "New access token generated successfully"
        )
      );
  } catch (error) {
    throw new apiError(401, error?.message || "Invalid refresh token");
  }
});

const changeUserPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!(oldPassword || newPassword)) {
    throw new apiError(400, "Please provide old and new password");
  }
  const user = await User.findById(req.user?._id);
  const passwordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!passwordCorrect) {
    throw new apiError(401, "Invalid old password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  res
    .status(200)
    .json(new apiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  res
    .status(200)
    .json(new apiResponse(200, req.user, "User details fetched successfully"));
});

const updateUserAccount = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;
  if (!(fullname || email)) {
    throw new apiError(400, "Please provide fullname and email");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      fullname,
      email,
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  res
    .status(200)
    .json(new apiResponse(200, {user:user}, "User details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new apiError(400, "Please provide avatar image");
  }

  const avatar = await uploadToCloudinary(avatarLocalPath);
  if (!avatar.url) {
    throw new apiError(500, "Error uploading avatar image");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");
  console.log(user);
  res
    .status(200)
    .json(new apiResponse(200, { user: user }, "Avatar updated successfully"));
});

const updateUSerCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new apiError(400, "Please provide cover image");
  }

  const coverImage = await uploadToCloudinary(avatarLocalPath);
  if (!coverImage.url) {
    throw new apiError(500, "Error uploading avatar image");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: coverImage.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  res
    .status(200)
    .json(new apiResponse(200, {user : user}, "Cover Image updated successfully"));
});

const forgetPassword = asyncHandler(async (req, res) => {
  const { username, email, newPassword } = req.body;
  if (!(username || email)) {
    throw new apiError(400, "Please provide username or email");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new apiError(
      400,
      "User not exists Please provide valid username or email"
    );
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  res
    .status(200)
    .json(new apiResponse(200, {}, "Password changed successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) {
    throw new apiError(400, "Please provide username");
  }
  const channel = await User.aggregate([
    {
      $match: { username: username?.toLowerCase() },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscriptions",
      },
    },
    {
      $addFields: {
        subscriberCount: { $size: "$subscribers" }, //return number of subscribers
        subscriptionCount: { $size: "$subscriptions" }, //return number of subscribers
        isSubscribed: {
          $cond: {
            if: {
              $in: [req.user?._id, "$subscribers.subscriber"],
            },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        avatar: 1,
        coverImage: 1,
        subscriberCount: 1,
        subscriptionCount: 1,
        isSubscribed: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new apiError(404, "Channel not found");
  }

  return res
    .status(200)
    .json(
      new apiResponse(200, channel[0], "Channel details fetched successfully")
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id), //convert string to object id
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    fullname: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        user[0]?.watchHistory,
        "Watch history fetched successfully"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeUserPassword,
  getCurrentUser,
  updateUserAccount,
  updateUserAvatar,
  updateUSerCoverImage,
  forgetPassword,
  getUserChannelProfile,
  getWatchHistory,
};
