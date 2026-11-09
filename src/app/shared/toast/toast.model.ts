export type ToastPoliteness = 'polite' | 'assertive';
export type ToastVariant = 'neutral' | 'danger';

export interface ToastAction {
  label: string;
  callback: () => void;
}

export interface Toast {
  id: number;
  message: string;
  action?: ToastAction;
  dismissible: boolean;
  politeness: ToastPoliteness;
  durationMs: number;
  variant: ToastVariant;
}

export interface ShowToastOptions {
  message: string;
  action?: ToastAction;
  dismissible?: boolean;
  politeness?: ToastPoliteness;
  durationMs?: number;
  variant?: ToastVariant;
}
