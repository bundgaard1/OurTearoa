import { Place } from './place.model';

export interface ItineraryEntry {
  id: string;
  placeId: string;
  userId: string;
  startDate: string;
  endDate: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  place: Place;
}

export interface ItineraryInput {
  placeId: string;
  startDate: string;
  endDate: string;
  note?: string | null;
}
