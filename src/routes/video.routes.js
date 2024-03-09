import { Router } from 'express';
import {
   getAllVideos,
   publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    allVideos
} from "../controllers/video.controllers.js"
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {upload} from "../middlewares/multers.middlewares.js"

const router = Router();
// router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file
router.route("/allvideos").get(allVideos);
router
    .route("/")
    .get(verifyJWT,getAllVideos)
    .post(verifyJWT,
        upload.fields([
            {
                name: "videoFile",
                maxCount: 1,
            },
            {
                name: "thumbnail",
                maxCount: 1,
            },
            
        ]),
        publishAVideo
    );

router
    .route("/:videoId")
    .get(getVideoById)
    .delete(verifyJWT,deleteVideo)
    .patch(verifyJWT,upload.single("thumbnail"), updateVideo);

router.route("/toggle/publish/:videoId").patch(verifyJWT,togglePublishStatus);

export default router;