import { Router } from 'express';

import { addFavorite, listFavorites } from '../controllers/favorites.controller.js';

const router = Router();

router.get('/', listFavorites);
router.post('/', addFavorite);

export default router;