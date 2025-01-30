import { Router } from "express";
import {
    getAllVideos,
    publishVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    toglePublishStatus
} from "../controllers/video.controller.js";
import {verifyJWT} from '../middlewares/auth.middleware.js'
import {upload} from '../middlewares/multer.middleware.js'
const router=Router();
router.use(verifyJWT);

router
    .route("/")
    .get(getAllVideos)
    .post(
        upload.fields([
            {
                name:"thumbnail",
                maxCount:1
            },
            {
                name:"videoFile",
                maxCount:1
            }
        ]),
        publishVideo
    );

router
    .route("/:videoId")
    .get(getVideoById)
    .delete(deleteVideo)
    .patch(upload.single("thumbnail"),updateVideo);

router.route("/toggle/publish/:videoId").patch(toglePublishStatus);

export default router;
