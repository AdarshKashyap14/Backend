import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";

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
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new apiError(400, "Please provide avatar image");
    }

    const avatarUrl = await uploadToCloudinary(avatarLocalPath);
    const coverImageUrl = await uploadToCloudinary(coverImageLocalPath);

    if(!avatarUrl){
        throw new apiError(500, "Error uploading avatar image");
    }

    const user = await User.create({
        username : username.toLowerCase(),
        email,
        fullname,
        password,
        avatar: avatarUrl.url,
        coverImage: coverImageUrl?.url||""
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if(!createdUser){
        throw new apiError(500, "Error creating user");
    }

    return res.status(201).json(
        new apiResponse(201, createdUser, "User created successfully")
    )

});

export { registerUser };
