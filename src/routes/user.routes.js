import { Router } from "express";
import { loginUser, logoutUser, registerUser , refreshAccessToken } from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multers.middlewares.js";
import { verfiyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

router.route("/register").post(
    upload.fields(
       [ {
            name: "avatar",
            maxCount: 1,
        },
        {
            name: "coverImage",
            maxCount: 1,
        }]
    ),
    registerUser
    )

router.route("/login").post(loginUser)

//secure route
router.route("/logout").post(verfiyJWT,logoutUser);
router.route("/refresh-token").post(refreshAccessToken)

export default router;