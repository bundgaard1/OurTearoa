import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { EmptyState } from './empty-state';
import { ErrorAlert } from './error-alert';
import { Loading } from './loading';

@Component({
  imports: [EmptyState],
  template: `<app-empty-state message="No favourites yet"><a href="/places">Browse</a></app-empty-state>`,
})
class EmptyHost {}

describe('shared primitives', () => {
  it('Loading renders a status message', () => {
    const fixture = TestBed.createComponent(Loading);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[role="status"]')?.textContent).toContain('Loading');
  });

  it('ErrorAlert shows the message and emits retry on click', () => {
    const fixture = TestBed.createComponent(ErrorAlert);
    fixture.componentRef.setInput('message', 'Boom');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Boom');

    let retries = 0;
    fixture.componentInstance.retry.subscribe(() => retries++);
    el.querySelector<HTMLButtonElement>('button.retry')!.click();
    expect(retries).toBe(1);
  });

  it('EmptyState shows the message and projected content', () => {
    const fixture = TestBed.createComponent(EmptyHost);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.message')?.textContent).toContain('No favourites yet');
    expect(el.querySelector('a')?.textContent).toBe('Browse');
  });
});
