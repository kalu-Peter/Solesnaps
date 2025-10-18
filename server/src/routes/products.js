const express = require('express');
const router = express.Router();
const productsController = require('../controllers/products');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { 
  validateCreateProduct, 
  validateUpdateProduct,
  validateGetProducts
} = require('../middleware/validation');

// Public routes
router.get('/', validateGetProducts, productsController.getProducts);
router.get('/featured', productsController.getFeaturedProducts);
router.get('/new-arrivals', productsController.getNewArrivals);
router.get('/categories', productsController.getCategories);

// Debug route (not for production): validate product payload without auth
router.post('/_debug/validate-product', validateCreateProduct, (req, res) => {
  res.json({ message: 'Validation passed', data: req.body });
});
router.get('/:id', productsController.getProduct);
router.get('/:id/reviews', productsController.getProductReviews);

// Admin routes
router.post('/', authenticateToken, requireAdmin, validateCreateProduct, productsController.createProduct);
router.put('/:id', authenticateToken, requireAdmin, validateUpdateProduct, productsController.updateProduct);
router.delete('/:id', authenticateToken, requireAdmin, productsController.deleteProduct);

module.exports = router;