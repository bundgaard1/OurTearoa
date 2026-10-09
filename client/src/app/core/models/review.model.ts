export interface ReviewAuthor {
  id: string;
  name: string;
}

export interface Review {
  id: string;
  placeId: string;
  userId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  user: ReviewAuthor;
}

export interface ReviewInput {
  placeId: string;
  rating: number;
  comment?: string;
}
