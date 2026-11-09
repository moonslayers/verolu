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

export type ToastOptions = ShowToastOptions;
export type ToastShowOptions = ShowToastOptions;
export type ToastConfig = ShowToastOptions;
export type ToastInput = ShowToastOptions;
export type ToastProps = ShowToastOptions;
export type ToastData = ShowToastOptions;
export type CreateToastOptions = ShowToastOptions;
export type ToastCreateOptions = ShowToastOptions;
export type ToastItem = Toast;
