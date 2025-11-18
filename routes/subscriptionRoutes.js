import express from 'express';
import { body } from 'express-validator';
import {
  cancelSubscription,
  getPlans,
  getSubscriptionStatus,
  handleWebhook,
  subscribe,
} from '../controllers/subscriptionController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// Validation rules
const subscribeValidation = [
  body('plan').isIn(['free', 'premium']).withMessage('Invalid plan selected'),
  body('paymentMethodId')
    .if(body('plan').equals('premium'))
    .notEmpty()
    .withMessage('Payment method is required for premium plan'),
];

// Public routes
router.get('/plans', getPlans);

// Webhook route (no auth required, verified by Stripe signature)
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  handleWebhook,
);

// Protected routes
router.use(protect);
router.get('/status', getSubscriptionStatus);
router.get('/plans', getPlans);
router.post('/subscribe', subscribeValidation, validate, subscribe);
router.post('/cancel', cancelSubscription);

export default router;
