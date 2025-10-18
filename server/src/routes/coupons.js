const express = require('express');
const router = express.Router();
const couponsController = require('../controllers/coupons');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');

// Validation middleware for coupons
const validateCoupon = [
  body('code')
    .trim()
    .isLength({ min: 3, max: 20 })
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Coupon code must be 3-20 characters, uppercase letters and numbers only'),
    
  body('description')
    .trim()
    .isLength({ min: 10, max: 200 })
    .withMessage('Description must be between 10 and 200 characters'),
    
  body('discount_type')
    .isIn(['percentage', 'fixed'])
    .withMessage('Discount type must be either percentage or fixed'),
    
  body('discount_value')
    .isFloat({ min: 0.01 })
    .withMessage('Discount value must be greater than 0'),
    
  body('minimum_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum amount must be a positive number'),
    
  body('max_discount_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum discount amount must be a positive number'),
    
  body('valid_until')
    .isISO8601()
    .withMessage('Valid until must be a valid date'),
    
  body('usage_limit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Usage limit must be a positive integer'),
    
  body('is_single_use')
    .optional()
    .isBoolean()
    .withMessage('Is single use must be a boolean'),
    
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('Is active must be a boolean'),
    
  handleValidationErrors
];

// Public routes
router.get('/validate/:code', couponsController.validateCoupon);

// Admin routes (authentication and admin role required)
router.get('/', authenticateToken, requireAdmin, couponsController.getCoupons);
router.post('/', authenticateToken, requireAdmin, validateCoupon, couponsController.createCoupon);
router.put('/:id', authenticateToken, requireAdmin, couponsController.updateCoupon);
router.delete('/:id', authenticateToken, requireAdmin, couponsController.deleteCoupon);

module.exports = router;