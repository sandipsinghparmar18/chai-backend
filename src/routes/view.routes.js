import { Router } from "express";
import { addVideoView, getVideoViews, removeView } from "../controllers/view.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router=Router();
router.use(verifyJWT);

router.route("/:videoId")
            .get(getVideoViews)
            .post(addVideoView)
            .delete(removeView)

export default router;