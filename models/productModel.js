import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  brand: { type: String, required: true, trim: true },
  category: { type: String, required: true },
  price: { type: Number, required: true, maxLength: 7 },
  salePrice: { type: Number, default: null },
  discount: { type: Number, default: 0 },
  isOnSale: { type: Boolean, default: false },
  isPopular: { type: Boolean, default: false },
  isBestSeller: { type: Boolean, default: false },
  isFlashSale: { type: Boolean, default: false },
  flashSaleEnd: { type: Date, default: null },
  images: [
    {
      public_id: { type: String, required: true },
      url: { type: String, required: true }
    }
  ],
  stock: { type: Number, required: true, default: 1, maxLength: 5 },
  maxOrderQuantity: { type: Number, required: true, default: 10, maxLength: 5 },
  isOutOfStock: { type: Boolean, default: false },
  tags: [{ type: String, trim: true }],
  ratings: { type: Number, default: 0 },
  numOfReviews: { type: Number, default: 0 },
  reviews: [
    {
      user: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
      name: { type: String, required: true },
      rating: { type: Number, required: true },
      comment: { type: String, required: true },
    }
  ],
  user: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
  variants: [
    {
      size: { type: String },
      color: { type: String },
      colorCode: { type: String },
      colorImage: {
        public_id: { type: String },
        url: { type: String },
      },
      stock: { type: Number, required: true, default: 0 },
      available: { type: Boolean, default: true },
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Product", productSchema);