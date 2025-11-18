import express from 'express';
import { body } from 'express-validator';
import {
  getUserProfile,
  updateProfile,
  getRecommendations,
  swipeUser,
  reportUser,
  getUserMatches
} from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Validation rules
const updateProfileValidation = [
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  body('interests')
    .optional()
    .isArray()
    .withMessage('Interests must be an array'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other', 'prefer-not-to-say'])
    .withMessage('Please select a valid gender')
];

const swipeValidation = [
  body('targetUserId')
    .notEmpty()
    .withMessage('Target user ID is required')
    .isMongoId()
    .withMessage('Invalid user ID'),
  body('action')
    .isIn(['like', 'skip'])
    .withMessage('Action must be either "like" or "skip"')
];

const reportValidation = [
  body('targetUserId')
    .notEmpty()
    .withMessage('Target user ID is required')
    .isMongoId()
    .withMessage('Invalid user ID'),
  body('action')
    .isIn(['report', 'block'])
    .withMessage('Action must be either "report" or "block"'),
  body('reason')
    .if(body('action').equals('report'))
    .notEmpty()
    .withMessage('Report reason is required')
];

// Routes
router.get('/recommendations', getRecommendations);
router.get('/matches', getUserMatches);
router.get('/:id', getUserProfile);
router.post('/update', updateProfileValidation, validate, updateProfile);
router.post('/swipe', swipeValidation, validate, swipeUser);
router.post('/report', reportValidation, validate, reportUser);

export default router;

