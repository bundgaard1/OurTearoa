import { Router } from 'express';

import { requireAuth } from '../middleware/auth.js';
import { getCurrentUser, getUser } from '../controllers/users.controller.js';

const router = Router();

router.get('/me', requireAuth, getCurrentUser);
router.get('/:id', requireAuth, getUser);

export default router;
