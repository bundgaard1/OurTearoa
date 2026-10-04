import { Router } from 'express';

import { requireAuth } from '../middleware/auth.js';
import { deleteCurrentUser, getCurrentUser, getUser } from '../controllers/users.controller.js';

const router = Router();

router.get('/me', requireAuth, getCurrentUser);
router.delete('/me', requireAuth, deleteCurrentUser);
router.get('/:id', requireAuth, getUser);

export default router;
