"use client";

import { X } from "lucide-react";
import { ReactNode } from "react";

interface FormModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onSubmit?: () => void;
  onClose: () => void;
  submitText?: string;
  cancelText?: string;
  loading?: boolean;
}

export function FormModal({
  open,
  title,
  children,
  onSubmit,
  onClose,
  submitText = "提交",
  cancelText = "取消",
  loading = false,
}: FormModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-card rounded-[var(--border-radius)] shadow-heavy max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
            <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
            <button
              onClick={onClose}
              className="text-text-tertiary hover:text-text-secondary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">{children}</div>

          {/* Footer */}
          {onSubmit && (
            <div className="flex items-center justify-end gap-3 p-6 border-t border-border flex-shrink-0">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-text-secondary bg-card border border-border rounded-[var(--border-radius)] hover:bg-bg-page transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelText}
              </button>
              <button
                onClick={onSubmit}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-danger rounded-[var(--border-radius)] hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "提交中..." : submitText}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

