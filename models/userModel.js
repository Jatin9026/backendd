import mongoose from "mongoose";
import validator from 'validator';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter your name"],
    maxLength: [25, "Invalid name. Please enter a name with fewer than 25 characters"],
    minLength: [3, "Name should contain more than 3 characters"]
  },
  email: {
    type: String,
    required: [true, "Please enter your email"],
    unique: true,
    validate: [validator.isEmail, "Please enter a valid email"]
  },
  password: {
    type: String,
    required: [true, "Please enter your password"],
    minLength: [8, "Password should be greater than 8 characters"],
    select: false
  },
  avatar: {
    public_id: {
      type: String,
      required: false
    },
    url: {
      type: String,
      required: false
    }
  },
  role: {
    type: String,
    default: "user"
  },
  walletBalance: {
    type: Number,
    default: 0
  },
  preferences: {
    type: Map,
    of: String,
    default: {}
  },
  language: {
    type: String,
    default: 'en'
  },
  location: {
    type: String,
    default: ''
  },
  cart: [{
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1
      }
    }],
  notificationsEnabled: {
    type: Boolean,
    default: true
  },
  bookmarks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product"
  }],
  addresses: [{
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    postalCode: { type: String, required: true },
    isDefault: { type: Boolean, default: false }
  }],
  resetPasswordToken: String,
  resetPasswordExpire: Date
}, { timestamps: true });

// Password hashing middleware
userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcryptjs.hash(this.password, 10);
  next();
});

// Generate JWT token method
userSchema.methods.getJWTToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Password comparison method
userSchema.methods.verifyPassword = async function(userEnteredPassword) {
  return await bcryptjs.compare(userEnteredPassword, this.password);
};

// Generate reset password token
userSchema.methods.generatePasswordResetToken = function() {
  const resetToken = crypto.randomBytes(20).toString('hex');
  this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  this.resetPasswordExpire = Date.now() + 30 * 60 * 1000; 
  return resetToken;
};

export default mongoose.model("User", userSchema);
