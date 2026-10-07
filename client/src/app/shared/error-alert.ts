import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-error-alert',
  template: `
    <div class="alert" role="alert">
      <span class="message">{{ message() }}</span>
      <button type="button" class="retry" (click)="retry.emit()">Retry</button>
    </div>
  `,
  styles: `
    .alert {
      display: flex;
      gap: var(--space-3);
      align-items: center;
      padding: var(--space-3);
      border-radius: var(--radius);
      background: var(--color-error-bg);
      color: var(--color-error);
    }
  `,
})
export class ErrorAlert {
  message = input('Something went wrong.');
  retry = output<void>();
}
