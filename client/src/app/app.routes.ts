import { Routes } from '@angular/router';

import { FavoritesPage } from './pages/favorites';
import { ItineraryPage } from './pages/itinerary';
import { LoginPage } from './pages/login';
import { NotFoundPage } from './pages/not-found';
import { PlaceDetailPage } from './pages/place-detail';
import { PlacesPage } from './pages/places';
import { ProfilePage } from './pages/profile';
import { RegisterPage } from './pages/register';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'places' },
  { path: 'places', component: PlacesPage, children: [{ path: ':id', component: PlaceDetailPage }] },
  { path: 'login', component: LoginPage },
  { path: 'register', component: RegisterPage },
  { path: 'favorites', component: FavoritesPage },
  { path: 'itinerary', component: ItineraryPage },
  { path: 'profile', component: ProfilePage },
  { path: '**', component: NotFoundPage },
];
