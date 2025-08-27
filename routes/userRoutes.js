import express from 'express';
import {
  registerUser,
  loginUser,
  logout,
  requestPasswordReset,
  resetPassword,
  getUserDetails,
  updatePassword,
  updateProfile,
  getCart, addToCart, updateCartItem, removeFromCart,
  getBookmarks, addBookmark, removeBookmark,
  getWalletBalance,
  getAddresses, addAddress, updateAddress, removeAddress,
  updatePreferences,
  toggleNotifications,
  updateLanguage,
  updateLocation,
  getUsersList, getSingleUser, updateUserRole, deleteUser
} from '../controller/userController.js';
import { roleBasedAccess, verifyUserAuth } from '../middleware/userAuth.js';
const router = express.Router();

// Public
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logout);
router.post("/password/forgot", requestPasswordReset);
router.post("/reset/:token", resetPassword);
// Profile
router.get("/profile", verifyUserAuth, getUserDetails);
router.put("/profile/update", verifyUserAuth, updateProfile);
router.put("/password/update", verifyUserAuth, updatePassword);
// Account Section
router.get("/account/wishlist", verifyUserAuth, getBookmarks);
router.post("/account/wishlist", verifyUserAuth, addBookmark);
router.delete("/account/wishlist/:productId", verifyUserAuth, removeBookmark);

router.get("/account/wallet", verifyUserAuth, getWalletBalance);
router.get("/account/addresses", verifyUserAuth, getAddresses);
router.post("/account/addresses", verifyUserAuth, addAddress);
router.put("/account/addresses/:id", verifyUserAuth, updateAddress);
router.delete("/account/addresses/:id", verifyUserAuth, removeAddress);
//cart 
router.get("/cart", verifyUserAuth, getCart);
router.post("/cart", verifyUserAuth, addToCart);
router.put("cart/:productId", verifyUserAuth, updateCartItem);
router.delete("/cart/:productId", verifyUserAuth, removeFromCart);
// Personalization Section
router.put("/personalization/preferences", verifyUserAuth, updatePreferences);
router.put("/personalization/notifications", verifyUserAuth, toggleNotifications);


// Settings Section
router.put("/settings/language", verifyUserAuth, updateLanguage);
router.put("/settings/location", verifyUserAuth, updateLocation);


// Admin Routes

router.get("/admin/users", verifyUserAuth, roleBasedAccess('admin'), getUsersList);
router.route("/admin/user/:id")
  .get(verifyUserAuth, roleBasedAccess('admin'), getSingleUser)
  .put(verifyUserAuth, roleBasedAccess('admin'), updateUserRole)
  .delete(verifyUserAuth, roleBasedAccess('admin'), deleteUser);

export default router;

