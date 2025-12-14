"use client";

import { ReactNode } from "react";
import { useFormContext, RegisterOptions } from "react-hook-form";

interface FormFieldProps {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  options?: RegisterOptions;
  children?: ReactNode;
}

export function FormField({
  name,
  label,
  type = "text",
  placeholder,
  required = false,
  options,
  children,
}: FormFieldProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const error = errors[name];
  const errorMessage = error?.message as string | undefined;

  return (
    <div className="mb-4">
      <label
        htmlFor={name}
        className="block text-sm font-medium text-text-primary mb-2"
      >
        {label}
        {required && <span className="text-danger ml-1">*</span>}
      </label>

      {children || (
        <input
          {...register(name, { required: required && `${label}是必填项`, ...options })}
          type={type}
          id={name}
          placeholder={placeholder}
          className={`
            w-full px-4 py-2 border rounded-[var(--border-radius)] bg-card text-text-primary
            focus:ring-2 focus:ring-danger focus:border-danger transition-colors
            ${error ? "border-danger" : "border-border"}
          `}
        />
      )}

      {errorMessage && (
        <p className="mt-1 text-sm text-danger">{errorMessage}</p>
      )}
    </div>
  );
}

