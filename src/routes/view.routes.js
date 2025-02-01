import { Router } from "express";
import { addVideoView, getVideoViews, removeView } from "../controllers/view.controller.js"
import {verifyJwt} from "../middlewares/auth.middleware.js"

const router=Router();
router.use(verifyJwt);

router.route("/:videoId")
            .get(getVideoViews)
            .post(addVideoView)
            .delete(removeView)

export default router;