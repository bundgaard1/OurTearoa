import { Router } from 'express';

import { requireAuth } from '../middleware/auth.js';
import { createReview, deleteReview, getReview, updateReview } from '../controllers/reviews.controller.js';

const router = Router();

router.post('/', requireAuth, createReview);
router.get('/:id', getReview);
router.put('/:id', requireAuth, updateReview);
router.delete('/:id', requireAuth, deleteReview);

export default router;
