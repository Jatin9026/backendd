import Order from '../models/orderModel.js';
import Product from '../models/productModel.js';
import HandleError from "../utils/handleError.js";
import handleAsyncError from '../middleware/handleAsyncError.js';

// Create New Order
export const createNewOrder = handleAsyncError(async (req, res, next) => {
  const { shippingInfo, orderItems, paymentInfo, itemPrice, taxPrice, shippingPrice, totalPrice } = req.body;
  for (const item of orderItems) {
    const product = await Product.findById(item.product);
    if (!product) {
      return next(new HandleError(`Product not found: ${item.name}`, 404));
    }
    if (product.isOutOfStock) {
      return next(new HandleError(`Product is out of stock: ${product.name}`, 400));
    }
    if (item.quantity > product.maxOrderQuantity) {
      return next(new HandleError(`Order quantity for ${product.name} exceeds maximum allowed: ${product.maxOrderQuantity}`, 400));
    }
    if (item.quantity > product.stock) {
      return next(new HandleError(`Insufficient stock for product: ${product.name}`, 400));
    }
  }

  const order = await Order.create({
    shippingInfo,
    orderItems,
    paymentInfo,
    itemPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    paidAt: Date.now(),
    user: req.user._id
  });

  // Update stock and out-of-stock status
  for (const item of orderItems) {
    const product = await Product.findById(item.product);
    product.stock -= item.quantity;
    product.isOutOfStock = product.stock === 0;
    await product.save({ validateBeforeSave: false });
  }

  res.status(201).json({
    success: true,
    order
  });
});

// Getting single Order
export const getSingleOrder = handleAsyncError(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate("user", "name email");
  if (!order) {
    return next(new HandleError("No order found", 404));
  }
  res.status(200).json({
    success: true,
    order
  });
});

// All my orders
export const allMyOrders = handleAsyncError(async (req, res, next) => {
  const orders = await Order.find({ user: req.user._id });
  if (!orders) {
    return next(new HandleError("No order found", 404));
  }
  res.status(200).json({
    success: true,
    orders
  });
});

// Getting all orders
export const getAllOrders = handleAsyncError(async (req, res, next) => {
  const orders = await Order.find();
  let totalAmount = 0;
  orders.forEach(order => {
    totalAmount += order.totalPrice;
  });
  res.status(200).json({
    success: true,
    orders,
    totalAmount
  });
});

// Update order status
export const updateOrderStatus = handleAsyncError(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) return next(new HandleError("No order found", 404));

  if (order.orderStatus === 'Delivered') {
    return next(new HandleError("This order is already been delivered", 400));
  }

  if (req.body.status === 'Delivered') {
    try {
      await Promise.all(order.orderItems.map(item => updateQuantity(item.product, item.quantity)));
      order.deliveredAt = Date.now();
    } catch (error) {
      return next(error);
    }
  }

  order.orderStatus = req.body.status;
  await order.save({ validateBeforeSave: false });
  res.status(200).json({ success: true, order });
});

async function updateQuantity(id, quantity) {
  const product = await Product.findById(id);
  if (!product) {
    throw new HandleError("Product not found", 404);
  }
  if (product.stock < quantity) {
    throw new HandleError(`Insufficient stock for product: ${product.name}`, 400);
  }
  product.stock -= quantity;
  product.isOutOfStock = product.stock === 0;
  await product.save({ validateBeforeSave: false });
}

// Delete Order
export const deleteOrder = handleAsyncError(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    return next(new HandleError("No order found", 404));
  }
  if (order.orderStatus !== 'Delivered') {
    return next(new HandleError("This order is under processing and cannot be deleted", 404));
  }
  await Order.deleteOne({ _id: req.params.id });
  res.status(200).json({
    success: true,
    message: "Order Deleted successfully"
  });
});