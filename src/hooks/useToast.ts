import toast from 'react-hot-toast';

type ToastVariant = 'default' | 'error' | 'success' | 'info' | 'warning';

export type ToastOptions = {
  title?: string;
  description: string;
  variant?: ToastVariant;
  duration?: number;
};

/**
 * Standard toast hook using react-hot-toast
 * Replaces the custom ToastProvider
 */
export function useToast() {
  const showToast = ({
    title,
    description,
    variant = 'default',
    duration = 6000,
  }: ToastOptions) => {
    const message = title ? `${title}\n${description}` : description;

    switch (variant) {
      case 'success':
        toast.success(message, { duration });
        break;
      case 'error':
        toast.error(message, { duration });
        break;
      case 'warning':
        toast(message, { duration, icon: '⚠️' });
        break;
      case 'info':
        toast(message, { duration, icon: 'ℹ️' });
        break;
      default:
        toast(message, { duration });
    }
  };

  return { showToast };
}


