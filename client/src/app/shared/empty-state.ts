import { Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  template: `
    <div class="empty">
      <p class="message">{{ message() }}</p>
      <ng-content />
    </div>
  `,
  styles: `.empty { text-align: center; color: var(--color-muted); padding: var(--space-5) var(--space-3); }`,
})
export class EmptyState {
  message = input.required<string>();
}
