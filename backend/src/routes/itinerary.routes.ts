import { Router } from 'express';

import {
  createItineraryEntry,
  deleteItineraryEntry,
  listItinerary,
  updateItineraryEntry,
} from '../controllers/itinerary.controller.js';

const router = Router();

router.get('/', listItinerary);
router.post('/', createItineraryEntry);
router.put('/:id', updateItineraryEntry);
router.delete('/:id', deleteItineraryEntry);

export default router;