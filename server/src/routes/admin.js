const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users');
const ordersController = require('../controllers/orders');
const productsController = require('../controllers/products');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { 
  validateCreateUser, 
  validateUpdateUser,
  validateToggleUserStatus,
  validateGetUsers,
  validateGetOrders,
  validateCreateProduct,
  validateUpdateProduct
} = require('../middleware/validation');

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// Admin Users Management
router.get('/users', validateGetUsers, usersController.getAllUsers);
router.get('/users/stats', usersController.getUserStats);
router.get('/users/:id', usersController.getUser);
router.post('/users', validateCreateUser, usersController.createUser);
router.put('/users/:id', validateUpdateUser, usersController.updateUser);
router.patch('/users/:id/status', validateToggleUserStatus, usersController.toggleUserStatus);
router.delete('/users/:id', usersController.deleteUser);

// Admin Orders Management
router.get('/orders', validateGetOrders, ordersController.getAllOrders);
router.get('/orders/:id', ordersController.getOrder);
router.put('/orders/:id/status', ordersController.updateOrderStatus);

// Admin Products Management  
router.get('/products', productsController.getProducts);
router.get('/products/:id', productsController.getProduct);
router.post('/products', validateCreateProduct, productsController.createProduct);
router.put('/products/:id', validateUpdateProduct, productsController.updateProduct);
router.delete('/products/:id', productsController.deleteProduct);

// Admin Dashboard Stats (simplified for now)
router.get('/dashboard', async (req, res) => {
  try {
    res.json({
      message: 'Admin dashboard stats',
      data: {
        users: { total: 0, active: 0, new: 0 },
        orders: { total: 0, pending: 0, completed: 0 },
        products: { total: 0, active: 0, outOfStock: 0 },
        revenue: { total: 0, thisMonth: 0, lastMonth: 0 }
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      error: 'Failed to get dashboard stats',
      message: 'An error occurred while retrieving dashboard statistics'
    });
  }
});

module.exports = router;