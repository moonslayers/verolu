import { Component, input } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';

export type IconName =
  | 'sun'
  | 'moon'
  | 'monitor'
  | 'search'
  | 'x'
  | 'file-down'
  | 'file-spreadsheet'
  | 'settings'
  | 'arrow-left'
  | 'check'
  | 'info';

export type IconSize = 16 | 20 | 24;

@Component({
  selector: 'app-icon',
  imports: [LucideDynamicIcon],
  template: `
    @if (label(); as lbl) {
      <span
        role="img"
        [attr.aria-label]="lbl"
        class="inline-flex items-center justify-center leading-none"
      >
        <svg
          [lucideIcon]="name()"
          [size]="size()"
          color="currentColor"
          [strokeWidth]="1.75"
          aria-hidden="true"
        ></svg>
      </span>
    } @else {
      <svg
        [lucideIcon]="name()"
        [size]="size()"
        color="currentColor"
        [strokeWidth]="1.75"
        aria-hidden="true"
      ></svg>
    }
  `,
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input<IconSize>(20);
  readonly label = input<string | undefined>(undefined);
}
