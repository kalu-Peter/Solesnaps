const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart');
const { authenticateToken } = require('../middleware/auth');
const { 
  validateAddToCart, 
  validateUpdateCartItem
} = require('../middleware/validation');

// All cart routes require authentication
router.use(authenticateToken);

router.get('/', cartController.getCart);
router.get('/count', cartController.getCartCount);
router.post('/add', validateAddToCart, cartController.addToCart);
router.put('/item/:id', validateUpdateCartItem, cartController.updateCartItem);
router.delete('/item/:id', cartController.removeFromCart);
router.delete('/clear', cartController.clearCart);

module.exports = router;