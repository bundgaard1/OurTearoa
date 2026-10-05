import { Router } from 'express';

import {
  createPlace,
  deletePlace,
  getPlace,
  listPlaces,
  updatePlace,
} from '../controllers/places.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { getPlaceReviews } from '../controllers/reviews.controller.js';

const router = Router();

router.get('/', listPlaces);
router.get('/:id/reviews', getPlaceReviews);
router.get('/:id', getPlace);
router.post('/', requireAuth, createPlace);
router.put('/:id', requireAuth, updatePlace);
router.delete('/:id', requireAuth, deletePlace);

export default router;