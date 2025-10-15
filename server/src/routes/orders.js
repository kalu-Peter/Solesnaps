const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/orders');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { 
  validateCreateOrder, 
  validateUpdateOrderStatus,
  validateGetOrders
} = require('../middleware/validation');

// User routes
router.post('/', authenticateToken, validateCreateOrder, ordersController.createOrder);
router.get('/my-orders', authenticateToken, ordersController.getUserOrders);
router.get('/:id', authenticateToken, ordersController.getOrder);
router.post('/:id/cancel', authenticateToken, ordersController.cancelOrder);

// Admin routes
router.get('/', authenticateToken, requireAdmin, validateGetOrders, ordersController.getAllOrders);
router.put('/:id/status', authenticateToken, requireAdmin, validateUpdateOrderStatus, ordersController.updateOrderStatus);

module.exports = router;