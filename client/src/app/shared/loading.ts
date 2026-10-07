import { Component } from '@angular/core';

@Component({
  selector: 'app-loading',
  template: `<p class="loading" role="status">Loading...</p>`,
  styles: `.loading { color: var(--color-muted); padding: var(--space-3); }`,
})
export class Loading {}
