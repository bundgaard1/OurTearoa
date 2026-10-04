import { Router } from 'express';

import { addFavorite, listFavorites, removeFavorite } from '../controllers/favorites.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', listFavorites);
router.post('/', addFavorite);
router.delete('/:id', removeFavorite);

export default router;
