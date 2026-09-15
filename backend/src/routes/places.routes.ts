import { Router } from 'express';

import {
  createPlace,
  deletePlace,
  getPlace,
  listPlaces,
  updatePlace,
} from '../controllers/places.controller.js';
import { getPlaceReviews } from '../controllers/reviews.controller.js';

const router = Router();

router.get('/', listPlaces);
router.get('/:id/reviews', getPlaceReviews);
router.get('/:id', getPlace);
router.post('/', createPlace);
router.put('/:id', updatePlace);
router.delete('/:id', deletePlace);

export default router;