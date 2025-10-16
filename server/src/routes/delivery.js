const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/delivery');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');

// Validation middleware for delivery locations
const validateDeliveryLocation = [
  body('city_name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('City name must be between 2 and 100 characters'),
    
  body('shopping_amount')
    .isFloat({ min: 0 })
    .withMessage('Shopping amount must be a positive number'),
    
  body('pickup_location')
    .trim()
    .isLength({ min: 5, max: 255 })
    .withMessage('Pickup location must be between 5 and 255 characters'),
    
  body('pickup_phone')
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
    
  body('pickup_status')
    .optional()
    .isIn(['active', 'inactive', 'maintenance'])
    .withMessage('Status must be active, inactive, or maintenance'),
    
  handleValidationErrors
];

const validateDeliveryLocationUpdate = [
  body('city_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('City name must be between 2 and 100 characters'),
    
  body('shopping_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Shopping amount must be a positive number'),
    
  body('pickup_location')
    .optional()
    .trim()
    .isLength({ min: 5, max: 255 })
    .withMessage('Pickup location must be between 5 and 255 characters'),
    
  body('pickup_phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
    
  body('pickup_status')
    .optional()
    .isIn(['active', 'inactive', 'maintenance'])
    .withMessage('Status must be active, inactive, or maintenance'),
    
  handleValidationErrors
];

// Public routes (no authentication required)
router.get('/', deliveryController.getDeliveryLocations);
router.get('/cost/:cityName', deliveryController.getDeliveryCost);
router.get('/:id', deliveryController.getDeliveryLocation);

// Admin routes (authentication and admin role required)
router.post('/', authenticateToken, requireAdmin, validateDeliveryLocation, deliveryController.createDeliveryLocation);
router.put('/:id', authenticateToken, requireAdmin, validateDeliveryLocationUpdate, deliveryController.updateDeliveryLocation);
router.delete('/:id', authenticateToken, requireAdmin, deliveryController.deleteDeliveryLocation);

module.exports = router;