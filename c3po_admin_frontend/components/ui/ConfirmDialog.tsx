"use client";

import { X, AlertTriangle } from "lucide-react";
import { ReactNode } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "确认",
  cancelText = "取消",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  const variantStyles = {
    danger: {
      icon: "text-danger",
      button: "bg-danger hover:opacity-90 text-white",
    },
    warning: {
      icon: "text-warning",
      button: "bg-warning hover:opacity-90 text-white",
    },
    info: {
      icon: "text-primary",
      button: "bg-primary hover:opacity-90 text-white",
    },
  };

  const style = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-card rounded-[var(--border-radius)] shadow-heavy max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <AlertTriangle className={`w-6 h-6 ${style.icon}`} />
              <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
            </div>
            <button
              onClick={onCancel}
              className="text-text-tertiary hover:text-text-secondary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            <div className="text-sm text-text-secondary">
              {typeof message === "string" ? <p>{message}</p> : message}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-text-secondary bg-card border border-border rounded-[var(--border-radius)] hover:bg-bg-page transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-sm font-medium rounded-[var(--border-radius)] transition-colors ${style.button}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

