import { Router } from 'express';

import { requireAuth } from '../middleware/auth.js';
import { createReview, getReview } from '../controllers/reviews.controller.js';

const router = Router();

router.post('/', requireAuth, createReview);
router.get('/:id', getReview);

export default router;