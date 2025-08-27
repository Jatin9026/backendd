import express from "express";
import {
  createNotification,
  getMyNotifications,
  markAsRead,
} from "../controller/notificationController.js";
import { verifyUserAuth, roleBasedAccess } from "../middleware/userAuth.js";

const router = express.Router();

router.route("/notifications").get(verifyUserAuth, getMyNotifications);

router.route("/notifications/:id/read").put(verifyUserAuth, markAsRead);
router
  .route("/admin/notification")
  .post(verifyUserAuth, roleBasedAccess("admin"), createNotification);

export default router;
