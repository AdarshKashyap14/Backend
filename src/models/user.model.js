import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
  {
    username: {
      type: String,
      lowercase: true,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      lowercase: true,
      required: true,
      trim: true,
      unique: true,
    },
    fullname: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String, //cloudnariry url
      required: true,
    },
    coverImage: {
      type: String, // cloudinary url
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        refs: "Video",
      },
    ],
    password: {
      type: String,
      required: [true, "Why you no passord?"],
    },
    refershToken: {
      type: String,
    },
  },

  {
    timestamps: true, // we get createdAT and UpdatedAt
  }
);

//hooks custom
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 8);
  next();
});

//custom method for password validation

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullname: this.fullname,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};


export const User = mongoose.model("User", userSchema);
