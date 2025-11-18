import express from 'express';
import { body } from 'express-validator';
import {
  startStream,
  joinStream,
  endStream,
  getStreamStatus,
  getStreamHistory
} from '../controllers/videoController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Validation rules
const joinStreamValidation = [
  body('streamKey')
    .notEmpty()
    .withMessage('Stream key is required')
];

const endStreamValidation = [
  body('streamKey')
    .notEmpty()
    .withMessage('Stream key is required')
];

// Routes
router.post('/start', startStream);
router.post('/join', joinStreamValidation, validate, joinStream);
router.post('/end', endStreamValidation, validate, endStream);
router.get('/status/:id', getStreamStatus);
router.get('/history', getStreamHistory);

export default router;

