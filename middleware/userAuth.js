import handleAsyncError from './handleAsyncError.js';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import HandleError from '../utils/handleError.js';

export const verifyUserAuth = handleAsyncError(async (req, res, next) => {
  let token;
  
  // Check for token in cookies
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  
  // Check for token in Authorization header
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new HandleError('Authentication is missing! Please login to access resource', 401));
  }

  try {
    const decodedData = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = await User.findById(decodedData.id);
    if (!req.user) {
      return next(new HandleError('User not found', 401));
    }
    next();
  } catch (error) {
    return next(new HandleError('Invalid token', 401));
  }
});

export const roleBasedAccess = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new HandleError(`Role - ${req.user.role} is not allowed to access the resource`, 403));
    }
    next();
  };
};