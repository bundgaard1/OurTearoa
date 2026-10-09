import { TestBed } from '@angular/core/testing';
import * as L from 'leaflet';

import { PlaceMap } from './place-map';

describe('PlaceMap', () => {
  function create(lat = -44.67, lng = 167.92) {
    const fixture = TestBed.createComponent(PlaceMap);
    fixture.componentRef.setInput('latitude', lat);
    fixture.componentRef.setInput('longitude', lng);
    fixture.componentRef.setInput('name', 'Milford Sound');
    fixture.detectChanges();
    return fixture;
  }

  it('renders a map with a marker and the OpenStreetMap attribution', () => {
    const fixture = create();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.leaflet-container')).not.toBeNull();
    expect(el.querySelectorAll('.leaflet-marker-icon').length).toBe(1);
    expect(el.querySelector('.leaflet-control-attribution')?.textContent).toContain('OpenStreetMap');
  });

  it('moves the map when the coordinates change', () => {
    const fixture = create();
    fixture.componentRef.setInput('latitude', -38.14);
    fixture.componentRef.setInput('longitude', 176.25);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.leaflet-marker-icon').length).toBe(1);
  });

  it('destroys the Leaflet instance with the component', () => {
    const remove = vi.spyOn(L.Map.prototype, 'remove');
    const fixture = create();
    fixture.destroy();
    expect(remove).toHaveBeenCalled();
    remove.mockRestore();
  });
});
