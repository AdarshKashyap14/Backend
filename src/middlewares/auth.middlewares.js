import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";

export const verfiyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.AccessToken || req.header("Authorization")?.split(" ")[1];
    
        if(!token){
            throw new apiError(401, "Please login to access this route");
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
        const user = await User.findById(decodedToken._id).select("-password -refreshToken");
    
        if(!user){
            throw new apiError(401, "Invalid access token");
    
        }
    
        req.user = user;
        next();
    } catch (error) {
        throw new apiError(401, error?.message ||"Invalid access token")
    }

});
