export interface Place {
  id: string;
  name: string;
  region: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  type: string | null;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlaceInput {
  name: string;
  region: string;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  type?: string | null;
}
