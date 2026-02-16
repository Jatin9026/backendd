import express from "express";
import {
  createProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  getAdminProducts,
  createReviewForProduct,
  getProductReviews,
  deleteReview,
  toggleSaleStatus,
  getProductsByCategory,
  getProductsByTag,
  getProductsByBrand,
  getPopularProducts,
  getBestSellers,
  getFlashSaleProducts,
} from "../controller/productController.js";
import { verifyUserAuth, roleBasedAccess } from "../middleware/userAuth.js";
import { upload } from "../middleware/multer.js";

const router = express.Router();

// Get all products
router.route("/products").get(getAllProducts);

// Get products by category
router.route("/products/category/:category").get(getProductsByCategory);

// Get products by tag
router.route("/products/tag/:tag").get(getProductsByTag);

// Get products by brand
router.route("/products/brand/:brand").get(getProductsByBrand);

// Get a single product by ID
router.route("/product/:id").get(getSingleProduct);

// Add or update a review
router.route("/product/review").put(verifyUserAuth, createReviewForProduct);

// Get all reviews for a product
router.route("/product/:id/reviews").get(getProductReviews);

router
  .route("/product/:productId/review/:reviewId")
  .delete(verifyUserAuth, deleteReview);

// Get all products (admin panel view)
router
  .route("/admin/products")
  .get(verifyUserAuth, roleBasedAccess("admin"), getAdminProducts);

// Create new product
router
  .route("/admin/product")
  .post(verifyUserAuth, roleBasedAccess("admin"),  upload.array("images",10) , createProduct);
// Update or delete product
router
  .route("/admin/product/:id")
  .put(verifyUserAuth, roleBasedAccess("admin"), updateProduct)
  .delete(verifyUserAuth, roleBasedAccess("admin"), deleteProduct);
router
  .route("/admin/product/:id/sale")
  .put(verifyUserAuth, roleBasedAccess("admin"), toggleSaleStatus);
// Popular products
router.route("/products/popular").get(getPopularProducts);

// Best sellers
router.route("/products/best-sellers").get(getBestSellers);

// Flash sale
router.route("/products/flash-sale").get(getFlashSaleProducts);

export default router;
