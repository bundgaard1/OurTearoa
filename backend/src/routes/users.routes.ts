import { Router } from 'express';

import { requireAuth } from '../middleware/auth.js';
import { getUser } from '../controllers/users.controller.js';

const router = Router();

router.get('/:id', requireAuth, getUser);

export default router;