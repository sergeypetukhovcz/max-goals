"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    return (
      <div>
        {label && (
          <label htmlFor={id} className="mb-1 block text-sm text-zinc-400">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`w-full rounded-lg border bg-zinc-900 px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 ${
            error
              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
              : "border-zinc-800 focus:border-red-500 focus:ring-red-500"
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
