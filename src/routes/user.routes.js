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
import { verifyJWT } from "../middlewares/auth.middlewares.js";

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
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT, changeUserPassword);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/update-user-account").patch(verifyJWT, updateUserAccount);
router
  .route("/update-user-avatar")
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router
  .route("/update-user-cover-image")
  .patch(verifyJWT, upload.single("coverImage"), updateUSerCoverImage);
router.route("/forget-password").patch( forgetPassword);
router.route("/channel/:username").get(verifyJWT,  getUserChannelProfile);
router.route("/watch-history").get(verifyJWT, getWatchHistory);

export default router;
