import { Place } from './place.model';

export interface Favorite {
  id: string;
  placeId: string;
  userId: string;
  createdAt: string;
  place: Place;
}
