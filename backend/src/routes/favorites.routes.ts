import { Router } from 'express';

import { requireAuth } from '../middleware/auth.js';
import { addFavorite, listFavorites } from '../controllers/favorites.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', listFavorites);
router.post('/', addFavorite);

export default router;