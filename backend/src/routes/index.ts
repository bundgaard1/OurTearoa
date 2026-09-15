import { Router } from 'express';

import authRoutes from './auth.routes.js';
import favoritesRoutes from './favorites.routes.js';
import healthRoutes from './health.routes.js';
import itineraryRoutes from './itinerary.routes.js';
import placesRoutes from './places.routes.js';
import reviewsRoutes from './reviews.routes.js';
import usersRoutes from './users.routes.js';

const apiRouter = Router();

apiRouter.use('/health', healthRoutes);
apiRouter.use('/places', placesRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', usersRoutes);
apiRouter.use('/reviews', reviewsRoutes);
apiRouter.use('/favorites', favoritesRoutes);
apiRouter.use('/itinerary', itineraryRoutes);

export default apiRouter;