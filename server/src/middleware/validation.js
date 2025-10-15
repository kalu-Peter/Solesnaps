const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};

// Auth validation rules
const validateRegister = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
    
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
    
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    
  handleValidationErrors
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
    
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
    
  handleValidationErrors
];

const validateUpdateProfile = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
    
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
    
  body('date_of_birth')
    .optional()
    .isDate()
    .withMessage('Please provide a valid date of birth'),
    
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),
    
  handleValidationErrors
];

const validateChangePassword = [
  body('current_password')
    .notEmpty()
    .withMessage('Current password is required'),
    
  body('new_password')
    .isLength({ min: 8, max: 128 })
    .withMessage('New password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),
    
  handleValidationErrors
];

const validateRefreshToken = [
  body('refresh_token')
    .notEmpty()
    .withMessage('Refresh token is required'),
    
  handleValidationErrors
];

// Product validation rules
const validateCreateProduct = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Product name must be between 2 and 255 characters'),
    
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
    
  body('price')
    .isFloat({ min: 0.01 })
    .withMessage('Price must be a positive number'),
    
  body('stock_quantity')
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a non-negative integer'),
    
  body('category_id')
    .isInt({ min: 1 })
    .withMessage('Please provide a valid category ID'),
    
  body('brand')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Brand must be between 1 and 100 characters'),
    
  body('colors')
    .isArray()
    .withMessage('Colors must be an array'),
    
  body('sizes')
    .isArray()
    .withMessage('Sizes must be an array'),
    
  body('images')
    .isArray()
    .withMessage('Images must be an array'),
    
  body('is_featured')
    .optional()
    .isBoolean()
    .withMessage('is_featured must be true or false'),
    
  handleValidationErrors
];

const validateUpdateProduct = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Product name must be between 2 and 255 characters'),
    
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
    
  body('price')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Price must be a positive number'),
    
  body('stock_quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a non-negative integer'),
    
  body('category_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Please provide a valid category ID'),
    
  body('brand')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Brand must be between 1 and 100 characters'),
    
  body('colors')
    .optional()
    .isArray()
    .withMessage('Colors must be an array'),
    
  body('sizes')
    .optional()
    .isArray()
    .withMessage('Sizes must be an array'),
    
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),
    
  body('is_featured')
    .optional()
    .isBoolean()
    .withMessage('is_featured must be true or false'),
    
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be true or false'),
    
  handleValidationErrors
];

const validateGetProducts = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
    
  query('category')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Category filter must be between 1 and 100 characters'),
    
  query('brand')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Brand filter must be between 1 and 100 characters'),
    
  query('min_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a non-negative number'),
    
  query('max_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a non-negative number'),
    
  query('sort_by')
    .optional()
    .isIn(['name', 'price', 'created_at', 'rating'])
    .withMessage('Sort field must be name, price, created_at, or rating'),
    
  query('sort_order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
    
  handleValidationErrors
];

// Order validation rules
const validateCreateOrder = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),
    
  body('items.*.product_id')
    .isInt({ min: 1 })
    .withMessage('Each item must have a valid product ID'),
    
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Each item must have a positive quantity'),
    
  body('items.*.size')
    .optional()
    .isString()
    .withMessage('Size must be a string'),
    
  body('items.*.color')
    .optional()
    .isString()
    .withMessage('Color must be a string'),
    
  body('shipping_address')
    .isObject()
    .withMessage('Shipping address is required'),
    
  body('shipping_address.street')
    .notEmpty()
    .withMessage('Street address is required'),
    
  body('shipping_address.city')
    .notEmpty()
    .withMessage('City is required'),
    
  body('shipping_address.postal_code')
    .notEmpty()
    .withMessage('Postal code is required'),
    
  body('shipping_address.country')
    .notEmpty()
    .withMessage('Country is required'),
    
  body('payment_method')
    .optional()
    .isIn(['cash_on_delivery', 'credit_card', 'debit_card', 'paypal'])
    .withMessage('Invalid payment method'),
    
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
    
  handleValidationErrors
];

const validateUpdateOrderStatus = [
  body('status')
    .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid order status'),
    
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
    
  handleValidationErrors
];

const validateGetOrders = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
    
  query('status')
    .optional()
    .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid order status'),
    
  query('user_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),
    
  query('start_date')
    .optional()
    .isDate()
    .withMessage('Start date must be a valid date'),
    
  query('end_date')
    .optional()
    .isDate()
    .withMessage('End date must be a valid date'),
    
  handleValidationErrors
];

// Cart validation rules
const validateAddToCart = [
  body('product_id')
    .isInt({ min: 1 })
    .withMessage('Product ID must be a positive integer'),
    
  body('quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
    
  body('size')
    .optional()
    .isString()
    .withMessage('Size must be a string'),
    
  body('color')
    .optional()
    .isString()
    .withMessage('Color must be a string'),
    
  handleValidationErrors
];

const validateUpdateCartItem = [
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
    
  handleValidationErrors
];

// User management validation rules (Admin)
const validateCreateUser = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
    
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
    
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    
  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Role must be either user or admin'),
    
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
    
  body('date_of_birth')
    .optional()
    .isDate()
    .withMessage('Please provide a valid date of birth'),
    
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),
    
  handleValidationErrors
];

const validateUpdateUser = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
    
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
    
  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Role must be either user or admin'),
    
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
    
  body('date_of_birth')
    .optional()
    .isDate()
    .withMessage('Please provide a valid date of birth'),
    
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),
    
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be true or false'),
    
  handleValidationErrors
];

const validateToggleUserStatus = [
  body('is_active')
    .isBoolean()
    .withMessage('is_active must be true or false'),
    
  handleValidationErrors
];

const validateGetUsers = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
    
  query('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Role must be either user or admin'),
    
  query('is_active')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('is_active must be true or false'),
    
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateChangePassword,
  validateRefreshToken,
  validateCreateProduct,
  validateUpdateProduct,
  validateGetProducts,
  validateCreateOrder,
  validateUpdateOrderStatus,
  validateGetOrders,
  validateAddToCart,
  validateUpdateCartItem,
  validateCreateUser,
  validateUpdateUser,
  validateToggleUserStatus,
  validateGetUsers
};