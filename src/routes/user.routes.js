import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  refreshAccessToken,
  changeUserPassword,
  getCurrentUser,
  updateUserAccount,
  updateUserAvatar,
  updateUSerCoverImage,
  forgetPassword,
  getUserChannelProfile,
  getWatchHistory
} from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multers.middlewares.js";
import { verfiyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

//secure route
router.route("/logout").post(verfiyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verfiyJWT, changeUserPassword);
router.route("/current-user").get(verfiyJWT, getCurrentUser);
router.route("/update-user-account").patch(verfiyJWT, updateUserAccount);
router
  .route("/update-user-avatar")
  .patch(verfiyJWT, upload.single("avatar"), updateUserAvatar);
router
  .route("/update-user-cover-image")
  .patch(verfiyJWT, upload.single("coverImage"), updateUSerCoverImage);
router.route("/forget-password").patch(verfiyJWT, forgetPassword);
router.route("/channel/:username").get(verfiyJWT,  getUserChannelProfile);
router.route("/watch-history").get(verfiyJWT, getWatchHistory);

export default router;
