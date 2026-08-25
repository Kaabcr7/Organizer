/**
 * Reusable error state component
 */

import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  title: string;
  message: string;
  onRetry?: () => void;
  isDismissible?: boolean;
  onDismiss?: () => void;
}

export function ErrorState({
  title,
  message,
  onRetry,
  isDismissible = false,
  onDismiss,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-900/10">
      <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
      <div className="text-center">
        <h3 className="font-semibold text-red-900 dark:text-red-200">{title}</h3>
        <p className="mt-1 text-sm text-red-700 dark:text-red-300">{message}</p>
      </div>
      <div className="flex gap-2">
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        )}
        {isDismissible && onDismiss && (
          <button
            onClick={onDismiss}
            className="rounded-md bg-red-100 px-3 py-1.5 text-sm font-medium text-red-900 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-200 dark:hover:bg-red-900/50"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-slate-200 bg-slate-50 p-12 dark:border-slate-800 dark:bg-slate-900/50">
      <div className="text-center">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h3>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {message}
        </p>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-8">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-blue-500 dark:border-slate-700" />
      <p className="text-sm text-slate-600 dark:text-slate-400">{message}</p>
    </div>
  );
}
