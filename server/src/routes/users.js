const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { 
  validateCreateUser, 
  validateUpdateUser,
  validateToggleUserStatus,
  validateGetUsers
} = require('../middleware/validation');

// All routes require admin authentication
router.use(authenticateToken);
router.use(requireAdmin);

router.get('/', validateGetUsers, usersController.getAllUsers);
router.get('/stats', usersController.getUserStats);
router.get('/:id', usersController.getUser);
router.post('/', validateCreateUser, usersController.createUser);
router.put('/:id', validateUpdateUser, usersController.updateUser);
router.patch('/:id/status', validateToggleUserStatus, usersController.toggleUserStatus);
router.delete('/:id', usersController.deleteUser);

module.exports = router;