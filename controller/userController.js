import handleAsyncError from '../middleware/handleAsyncError.js';
import crypto from 'crypto';
import HandleError from '../utils/handleError.js'
import User from '../models/userModel.js';
import { sendToken } from '../utils/jwtToken.js';
import { sendEmail } from '../utils/sendEmail.js';
import {v2 as cloudinary} from 'cloudinary';

//register
export const registerUser = handleAsyncError(async (req, res, next) => {
    const { name, email, password, avatar } = req.body;
    let existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({
            success: false,
            message: "User already exists with this email."
        });
    }
    let myCloud;
    if (avatar) {
        try {
            myCloud = await cloudinary.uploader.upload(avatar, {
                folder: "avatars",
                width: 150,
                crop: "scale"
            });
        } catch (error) {
            return next(new HandleError(`Image upload failed: ${error.message}`, 500));
        }
    }
    const user = await User.create({
        name,
        email,
        password,
        avatar: myCloud
            ? {
                  public_id: myCloud.public_id,
                  url: myCloud.secure_url
              }
            : undefined
    });
    sendToken(user, 201, res);
});

// Login
export const loginUser=handleAsyncError(async(req , res, next)=>{
    const {email,password}=req.body;
    if(!email || !password){
        return next(new HandleError("Email or password cannot be empty",400))
    }
    const user=await User.findOne({email}).select("+password");
    if(!user){
        return next(new HandleError("Invalid Email or password",401))
    }
    const isPasswordValid=await user.verifyPassword(password);
    if(!isPasswordValid){
        return next(new HandleError("Invalid Email or password",401))
    }
    sendToken(user,200,res)
})

// /Logout
export const logout=handleAsyncError(async(req , res , next)=>{
    res.cookie('token',null,{
        expires:new Date(Date.now()),
        httpOnly:true
    })
    res.status(200).json({
        success: true,
        message:"Successfully Logged out"
    })
})

// Forgot Password 
export const requestPasswordReset=handleAsyncError(async(req,res,next)=>{
    const {email}=req.body
    const user=await User.findOne({email});
    if(!user){
        return next(new HandleError("User doesn't exist",400))
    }
    let resetToken;
    try{
        resetToken=user.generatePasswordResetToken()
        await user.save({validateBeforeSave:false})

    }catch(error){
        return next(new HandleError("Could not save reset token, please try again later",500))
    }
    const resetPasswordURL=`${req.protocol}://${req.get('host')}/reset/${resetToken}`;
    const message = `Use the following link to reset your password: ${resetPasswordURL}. \n\n This link will expire in 30 minutes.\n\n If you didn’t request a password reset, please ignore this message.`;
    try{
// Send Email
        await sendEmail({
            email:user.email,
            subject:'Password Reset Request',
            message
        })
        res.status(200).json({
            success:true,
            message:`Email is sent to ${user.email} successfully`
        })
    }catch(error){
        user.resetPasswordToken=undefined;
        user.resetPasswordExpire=undefined;
        await user.save({validateBeforeSave:false})
        return next(new HandleError("Email couldn't be sent , please try again later",500))
    }
    
})

//Reset Password
export const resetPassword=handleAsyncError(async(req ,res,next)=>{
const resetPasswordToken=crypto.createHash("sha256").update(req.params.token).digest("hex");
const user=await User.findOne({
    resetPasswordToken,
    resetPasswordExpire:{$gt:Date.now()}
})
if(!user){
    return next(new HandleError("Reset Password token is invalid or has been expired",400))
}
const {password,confirmPassword}=req.body;
if(password!==confirmPassword){
    return next(new HandleError("Password doesn't match",400))
}
user.password=password;
user.resetPasswordToken=undefined;
user.resetPasswordExpire=undefined;
await user.save();
sendToken(user,200,res)
})

// Get user details
export const getUserDetails=handleAsyncError(async(req , res , next)=>{
    const user=await User.findById(req.user.id);
    res.status(200).json({
        success:true,
        user
    })  
})

//update password
export const updatePassword=handleAsyncError(async(req,res,next)=>{
    const {oldPassword,newPassword,confirmPassword}=req.body;
    const user=await User.findById(req.user.id).select('+password');
    const checkPasswordMatch=await user.verifyPassword(oldPassword);
    if(!checkPasswordMatch){
        return next(new HandleError('Old password is incorrect',400))
    }
    if(newPassword!==confirmPassword){
        return next(new HandleError("Password doesn't match",400))
    }
    user.password=newPassword;
    await user.save();
    sendToken(user,200,res);
})

//Updating user profile
export const updateProfile=handleAsyncError(async(req,res,next)=>{
    const {name,email,avatar}=req.body;
    const updateUserDetails={
        name,
        email
    }
    if(avatar!==""){
        try {
            const foundUser=await User.findById(req.user.id); 
            if(foundUser.avatar && foundUser.avatar.public_id) {
                await cloudinary.uploader.destroy(foundUser.avatar.public_id);
            }
            const myCloud=await cloudinary.uploader.upload(avatar,{
                folder:'avatars',
                width:150,
                crop:'scale'
            })
            updateUserDetails.avatar={
                public_id:myCloud.public_id,
                url:myCloud.secure_url,
            }
        } catch (error) {
            return next(new HandleError(`Image upload failed: ${error.message}`, 500));
        }
    }
    const user=await User.findByIdAndUpdate(req.user.id,updateUserDetails,{
        new:true,
        runValidators:true
    })
    res.status(200).json({
        success:true,
        message:"Profile Updated Successfully",
        user
    })
})

// Admin- Getting user information
export const getUsersList=handleAsyncError(async(req,res,next)=>{
    const users=await User.find();
    res.status(200).json({
        success:true,
        users
    })
})

//Admin- Getting single user information
export const getSingleUser=handleAsyncError(async(req,res,next)=>{
    const user=await User.findById(req.params.id);
    if(!user){
        return next(new HandleError(`User doesn't exist with this id: ${req.params.id}`,400))
    }
    res.status(200).json({
        success: true,
        user
    })
})

//Admin- Changing user role
export const updateUserRole=handleAsyncError(async(req,res,next)=>{
    const {role}=req.body;
    if (req.user.id.toString() === req.params.id.toString()) {
      return next(new HandleError("You cannot change your own role.", 403));
  }
    const newUserData={
        role
    }
    const user=await User.findByIdAndUpdate(req.params.id,newUserData,{
        new:true,
        runValidators:true
    })
    if(!user){
        return next(new HandleError("User doesn't exist",400))
    }
    res.status(200).json({
        success: true,
        user
    })
})
// Admin - Delete User Profile
export const deleteUser=handleAsyncError(async(req,res,next)=>{
   const user =await User.findById(req.params.id);
   if(!user){
    return next(new HandleError("User doesn't exist",400))
   }
   try {
       if(user.avatar && user.avatar.public_id) {
           await cloudinary.uploader.destroy(user.avatar.public_id);
       }
   } catch (error) {
       console.error("Failed to delete avatar from cloudinary:", error.message);
   }
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({
        success:true,
        message: "User Deleted Successfully"
    })
})
// Add Bookmark
export const addBookmark = handleAsyncError(async (req, res, next) => {
    const { productId } = req.body;
    const user = await User.findById(req.user.id);
    if (user.bookmarks.includes(productId)) {
      return next(new HandleError("Product already bookmarked", 400));
    }
    user.bookmarks.push(productId);
    await user.save();
    res.status(200).json({
      success: true,
      bookmarks: user.bookmarks
    });
  });
  
// Remove Bookmark
export const removeBookmark = handleAsyncError(async (req, res, next) => {
    const { productId } = req.params;
    const user = await User.findById(req.user.id);
    user.bookmarks = user.bookmarks.filter(id => id.toString() !== productId);
    await user.save();
    res.status(200).json({
      success: true,
      bookmarks: user.bookmarks
    });
  });
// Get Bookmarks
export const getBookmarks = handleAsyncError(async (req, res, next) => {
    const user = await User.findById(req.user.id).populate("bookmarks");
    res.status(200).json({
      success: true,
      bookmarks: user.bookmarks
    });
  });

//  ACCOUNT SECTION

// Wallet Balance
export const getWalletBalance = handleAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({
    success: true,
    walletBalance: user.walletBalance
  });
});
// Get all addresses
export const getAddresses = handleAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({
    success: true,
    addresses: user.addresses
  });
});

// Add new address
export const addAddress = handleAsyncError(async (req, res, next) => {
  const { street, city, state, country, postalCode, isDefault } = req.body;
  const user = await User.findById(req.user.id);
  if (isDefault) {
    user.addresses.forEach(addr => (addr.isDefault = false));
  }
  user.addresses.push({ street, city, state, country, postalCode, isDefault });
  await user.save();
  res.status(201).json({
    success: true,
    addresses: user.addresses
  });
});
// Update address
export const updateAddress = handleAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { street, city, state, country, postalCode, isDefault } = req.body;
  const user = await User.findById(req.user.id);

  const address = user.addresses.id(id);
  if (!address) {
    return next(new HandleError("Address not found", 404));
  }

  if (isDefault) {
    user.addresses.forEach(addr => (addr.isDefault = false));
  }

  Object.assign(address, { street, city, state, country, postalCode, isDefault });
  await user.save();

  res.status(200).json({
    success: true,
    addresses: user.addresses
  });
});
// Delete address
export const removeAddress = handleAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findById(req.user.id);

  const address = user.addresses.id(id);
  if (!address) {
    return next(new HandleError("Address not found", 404));
  }

  address.remove();
  await user.save();

  res.status(200).json({
    success: true,
    addresses: user.addresses
  });
});

// Update preferences
export const updatePreferences = handleAsyncError(async (req, res, next) => {
  const { preferences } = req.body; 
  const user = await User.findById(req.user.id);
  if (preferences && typeof preferences === "object") {
    Object.keys(preferences).forEach(key => {
      user.preferences.set(key, preferences[key]);
    });
  }
  await user.save();
  res.status(200).json({
    success: true,
    preferences: user.preferences
  });
});
// Toggle notifications
export const toggleNotifications = handleAsyncError(async (req, res, next) => {
  const { enabled } = req.body; // expects { enabled: true/false }
  const user = await User.findById(req.user.id);

  user.notificationsEnabled = enabled;
  await user.save();

  res.status(200).json({
    success: true,
    notificationsEnabled: user.notificationsEnabled
  });
});

//  SETTINGS SECTION
// Update language
export const updateLanguage = handleAsyncError(async (req, res, next) => {
  const { language } = req.body;
  const user = await User.findById(req.user.id);

  user.language = language || user.language;
  await user.save();

  res.status(200).json({
    success: true,
    language: user.language
  });
});
// Update location
export const updateLocation = handleAsyncError(async (req, res, next) => {
  const { location } = req.body;
  const user = await User.findById(req.user.id);

  user.location = location || user.location;
  await user.save();

  res.status(200).json({
    success: true,
    location: user.location
  });
});
 // Add To Cart
 export const addToCart = handleAsyncError(async (req, res, next) => {
  const { productId, quantity } = req.body;
  const user = await User.findById(req.user.id);

  const itemIndex = user.cart.findIndex(item => item.productId.toString() === productId);
  if (itemIndex > -1) {
    user.cart[itemIndex].quantity += quantity || 1;
  } else {
    user.cart.push({ productId, quantity: quantity || 1 });
  }

  await user.save();

  res.status(200).json({
    success: true,
    cart: user.cart
  });
});

// Update Cart Item
export const updateCartItem = handleAsyncError(async (req, res, next) => {
  const { productId } = req.params;
  const { quantity } = req.body;
  const user = await User.findById(req.user.id);

  const itemIndex = user.cart.findIndex(item => item.productId.toString() === productId);
  if (itemIndex === -1) {
    return next(new HandleError("Product not found in cart", 404));
  }

  user.cart[itemIndex].quantity = quantity;
  await user.save();

  res.status(200).json({
    success: true,
    cart: user.cart
  });
});

// Remove Cart Item
export const removeFromCart = handleAsyncError(async (req, res, next) => {
  const { productId } = req.params;
  const user = await User.findById(req.user.id);

  user.cart = user.cart.filter(item => item.productId.toString() !== productId);
  await user.save();

  res.status(200).json({
    success: true,
    cart: user.cart
  });
});
// Get Cart
export const getCart = handleAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user.id).populate("cart.productId");
  res.status(200).json({ success: true, cart: user.cart });
});