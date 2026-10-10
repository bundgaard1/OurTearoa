import { Component, ElementRef, OnDestroy, effect, input, viewChild } from '@angular/core';
import * as L from 'leaflet';

const icon = L.icon({
  iconUrl: '/leaflet/marker-icon.png',
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  shadowUrl: '/leaflet/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

@Component({
  selector: 'app-place-map',
  template: `<div #container class="map" role="img" [attr.aria-label]="'Map of ' + name()"></div>`,
  styles: `.map { height: 18rem; border-radius: var(--radius); }`,
})
export class PlaceMap implements OnDestroy {
  readonly latitude = input.required<number>();
  readonly longitude = input.required<number>();
  readonly name = input('place');

  private readonly container = viewChild.required<ElementRef<HTMLDivElement>>('container');
  private map?: L.Map;
  private marker?: L.Marker;

  constructor() {
    effect(() => {
      const center: L.LatLngTuple = [this.latitude(), this.longitude()];
      if (!this.map) {
        this.map = L.map(this.container().nativeElement).setView(center, 10);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(this.map);
        this.marker = L.marker(center, { icon }).addTo(this.map);
        return;
      }
      this.map.setView(center);
      this.marker?.setLatLng(center);
    });
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }
}
