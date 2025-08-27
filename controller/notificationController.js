import Notification from "../models/notificationModel.js";
import handleAsyncError from "../middleware/handleAsyncError.js";
import HandleError from "../utils/handleError.js";

//create notification
export const createNotification = handleAsyncError(async (req, res, next) => {
  const { type, title, message } = req.body;

  const notification = await Notification.create({
    userId: req.user._id,
    type,
    title,
    message,
    createdAt: new Date(),
    read: false,
  });

  res.status(201).json({
    success: true,
    notification,
  });
});

// user notification
export const getMyNotifications = handleAsyncError(async (req, res, next) => {
  const notifications = await Notification.find({ userId: req.user._id }).sort({
    createdAt: -1,
  });

  res.status(200).json({
    success: true,
    notifications,
  });
});

// mark read
export const markAsRead = handleAsyncError(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return next(new HandleError("Notification not found", 404));
  }

  if (notification.userId.toString() !== req.user._id.toString()) {
    return next(new HandleError("Not authorized to update this notification", 403));
  }

  notification.read = true;
  await notification.save();

  res.status(200).json({
    success: true,
    notification,
  });
});
