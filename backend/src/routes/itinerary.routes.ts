import { Router } from 'express';

import { requireAuth } from '../middleware/auth.js';
import {
  createItineraryEntry,
  deleteItineraryEntry,
  listItinerary,
  updateItineraryEntry,
} from '../controllers/itinerary.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', listItinerary);
router.post('/', createItineraryEntry);
router.put('/:id', updateItineraryEntry);
router.delete('/:id', deleteItineraryEntry);

export default router;