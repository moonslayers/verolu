import { Component, input } from '@angular/core';

@Component({
  selector: 'app-brand-mark',
  template: `
    <svg
      viewBox="0 0 32 32"
      [attr.width]="size()"
      [attr.height]="size()"
      role="img"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="32" height="32" rx="6" fill="currentColor" />
      <rect x="7.25" y="8.5" width="3" height="15.75" rx="0.75" fill="#FAF7F0" />
      <rect x="11.75" y="9.25" width="11.25" height="3.5" rx="0.75" fill="#FAF7F0" />
      <rect x="11.75" y="14.25" width="13.5" height="3.5" rx="0.75" fill="#C2410C" />
      <rect x="11.75" y="19.25" width="12" height="3.5" rx="0.75" fill="#FAF7F0" />
    </svg>
  `,
  host: {
    class: 'inline-flex items-center justify-center leading-none',
  },
})
export class BrandMark {
  readonly size = input<number>(32);
}
