import Product from "../models/productModel.js";
import HandleError from "../utils/handleError.js";
import handleAsyncError from "../middleware/handleAsyncError.js";
import APIFunctionality from "../utils/apiFunctionality.js";
import { v2 as cloudinary } from "cloudinary";

//create product

export const createProduct = handleAsyncError(async (req, res, next) => {
  console.log("FILES RECEIVED:", req.files);

  let imageLinks = [];

  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      try {
        if (!file.mimetype.startsWith("image")) {
          return res.status(400).json({
            success: false,
            message: "Only image files are allowed",
          });
        }

        const fileStr = `data:${file.mimetype};base64,${file.buffer.toString(
          "base64"
        )}`;

        const result = await cloudinary.uploader.upload(fileStr, {
          folder: "products",
        });

        imageLinks.push({
          public_id: result.public_id,
          url: result.secure_url,
        });
      } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        return res.status(500).json({
          success: false,
          message: "Image upload failed",
        });
      }
    }
  } else {
    console.log("❌ No files received from frontend/Postman");
  }

  req.body.images = imageLinks;

  if (req.user && req.user.id) {
    req.body.user = req.user.id;
  }

  const product = await Product.create(req.body);

  res.status(201).json({
    success: true,
    product,
    imagesUploaded: imageLinks.length,
  });
});


  

// get all product
export const getAllProducts = handleAsyncError(async (req, res, next) => {
  const resultsPerPage = 8;
  const apiFeatures = new APIFunctionality(Product.find(), req.query)
    .search()
    .filter();

  const filteredQuery = apiFeatures.query.clone();
  const productCount = await filteredQuery.countDocuments();

  const totalPages = Math.ceil(productCount / resultsPerPage);
  const page = Number(req.query.page) || 1;

  if (page > totalPages && productCount > 0) {
    return next(new HandleError("This page doesn't exist", 404));
  }

  apiFeatures.pagination(resultsPerPage);
  const products = await apiFeatures.query;

  res.status(200).json({
    success: true,
    products,
    productCount,
    resultsPerPage,
    totalPages,
    currentPage: page,
  });
});

//update product
export const updateProduct = handleAsyncError(async (req, res, next) => {
  let product = await Product.findById(req.params.id);
  if (!product) return next(new HandleError("Product Not Found", 404));

  let images = [];
  if (typeof req.body.images === "string") {
    images.push(req.body.images);
  } else if (Array.isArray(req.body.images)) {
    images = req.body.images;
  }

  if (images.length > 0) {
    // delete old
    for (let i = 0; i < product.images.length; i++) {
      await cloudinary.uploader.destroy(product.images[i].public_id);
    }
    // upload new
    const imageLinks = [];
    for (let i = 0; i < images.length; i++) {
      const result = await cloudinary.uploader.upload(images[i], {
        folder: "products",
      });
      imageLinks.push({ public_id: result.public_id, url: result.secure_url });
    }
    req.body.images = imageLinks;
  }

  // auto-update discount
  if (req.body.salePrice && req.body.price) {
    req.body.discount = Math.round(
      ((req.body.price - req.body.salePrice) / req.body.price) * 100
    );
    req.body.isOnSale = req.body.salePrice < req.body.price;
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, product });
});

//delete product
export const deleteProduct = handleAsyncError(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new HandleError("Product Not Found", 404));

  for (let i = 0; i < product.images.length; i++) {
    await cloudinary.uploader.destroy(product.images[i].public_id);
  }
  await product.deleteOne();

  res.status(200).json({
    success: true,
    message: "Product Deleted successfully",
  });
});

//get single product
export const getSingleProduct = handleAsyncError(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new HandleError("Product Not Found", 404));

  res.status(200).json({ success: true, product });
});

//create review
export const createReviewForProduct = handleAsyncError(
  async (req, res, next) => {
    const { rating, comment, productId } = req.body;

    const review = {
      user: req.user._id,
      name: req.user.name,
      rating: Number(rating),
      comment,
    };

    const product = await Product.findById(productId);
    if (!product) return next(new HandleError("Product not found", 400));

    const reviewExists = product.reviews.find(
      (r) => r.user.toString() === req.user.id.toString()
    );

    if (reviewExists) {
      product.reviews.forEach((r) => {
        if (r.user.toString() === req.user.id.toString()) {
          r.rating = rating;
          r.comment = comment;
        }
      });
    } else {
      product.reviews.push(review);
    }

    product.numOfReviews = product.reviews.length;
    product.ratings =
      product.reviews.reduce((acc, r) => acc + r.rating, 0) /
      product.reviews.length;

    await product.save({ validateBeforeSave: false });

    res.status(200).json({ success: true, product });
  }
);

//get product review
export const getProductReviews = handleAsyncError(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new HandleError("Product not found", 400));

  res.status(200).json({ success: true, reviews: product.reviews });
});
//delete review
export const deleteReview = handleAsyncError(async (req, res, next) => {
  const { productId, reviewId } = req.params;
  const product = await Product.findById(productId);
  if (!product) return next(new HandleError("Product not found", 400));

  product.reviews = product.reviews.filter(
    (r) => r._id.toString() !== reviewId.toString()
  );

  product.numOfReviews = product.reviews.length;
  product.ratings =
    product.reviews.length > 0
      ? product.reviews.reduce((acc, r) => acc + r.rating, 0) /
        product.reviews.length
      : 0;

  await product.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, message: "Review Deleted Successfully" });
});

//get all product
export const getAdminProducts = handleAsyncError(async (req, res, next) => {
  const products = await Product.find();
  res.status(200).json({ success: true, products });
});

//toggle sales
export const toggleSaleStatus = handleAsyncError(async (req, res, next) => {
  const { salePrice } = req.body;
  let product = await Product.findById(req.params.id);

  if (!product) return next(new HandleError("Product not found", 404));

  if (salePrice && salePrice < product.price) {
    product.salePrice = salePrice;
    product.discount = Math.round(
      ((product.price - salePrice) / product.price) * 100
    );
    product.isOnSale = true;
  } else {
    product.salePrice = null;
    product.discount = 0;
    product.isOnSale = false;
  }

  await product.save();
  res.status(200).json({ success: true, product });
});

//filter
export const getProductsByCategory = handleAsyncError(async (req, res, next) => {
  const products = await Product.find({ category: req.params.category });
  res.status(200).json({ success: true, products });
});

export const getProductsByTag = handleAsyncError(async (req, res, next) => {
  const products = await Product.find({ tags: req.params.tag });
  res.status(200).json({ success: true, products });
});

export const getProductsByBrand = handleAsyncError(async (req, res, next) => {
  const products = await Product.find({ brand: req.params.brand });
  res.status(200).json({ success: true, products });
});

//get popular product
export const getPopularProducts = handleAsyncError(async (req, res, next) => {
  const products = await Product.find({ isPopular: true }).limit(10);
  res.status(200).json({ success: true, products });
});

//best sellers
export const getBestSellers = handleAsyncError(async (req, res, next) => {
  const products = await Product.find({ isBestSeller: true }).limit(10);
  res.status(200).json({ success: true, products });
});

//sales
export const getFlashSaleProducts = handleAsyncError(async (req, res, next) => {
  const now = new Date();
  const products = await Product.find({
    isFlashSale: true,
    flashSaleEnd: { $gte: now },
  });
  res.status(200).json({ success: true, products });
});
