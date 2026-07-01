"use client";

import { useFormStatus } from "react-dom";

const dots = (
  <span className="inline-flex gap-0.5">
    <span className="animate-bounce [animation-delay:0ms] h-1.5 w-1.5 rounded-full bg-current" />
    <span className="animate-bounce [animation-delay:150ms] h-1.5 w-1.5 rounded-full bg-current" />
    <span className="animate-bounce [animation-delay:300ms] h-1.5 w-1.5 rounded-full bg-current" />
  </span>
);

const spinner = (
  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

type Props = {
  children: React.ReactNode;
  loadingText?: string;
  action?: (formData: FormData) => void;
  className?: string;
  variant?: "primary" | "danger" | "outline" | "ghost" | "success" | "warning" | "link-danger";
  type?: "submit" | "button";
  style?: "spinner" | "dots" | "pulse";
};

const variantClasses: Record<string, string> = {
  primary:
    "rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-indigo-400",
  danger:
    "rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:bg-red-400",
  outline:
    "rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:text-gray-400",
  ghost:
    "rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-100 disabled:text-gray-400",
  success:
    "rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:bg-green-400",
  warning:
    "rounded-lg bg-yellow-100 text-yellow-800 px-4 py-2 text-sm font-medium hover:bg-yellow-200 disabled:opacity-60",
  "link-danger": "text-xs text-red-500 hover:underline disabled:opacity-40",
};

export default function ActionButton({
  children,
  loadingText,
  action,
  className,
  variant = "primary",
  type = "submit",
  style = "spinner",
}: Props) {
  const { pending } = useFormStatus();

  const loadingIndicator =
    style === "dots" ? dots : style === "pulse" ? dots : spinner;

  return (
    <button
      formAction={action}
      type={type}
      disabled={pending}
      className={`${variantClasses[variant]} inline-flex items-center justify-center gap-2 transition-all duration-200 disabled:cursor-not-allowed ${
        pending && style === "pulse" ? "animate-pulse" : ""
      } ${className ?? ""}`}
    >
      {pending && style === "spinner" && loadingIndicator}
      {pending ? (
        <span className="inline-flex items-center gap-1.5">
          {loadingText ?? children}
          {style === "dots" && loadingIndicator}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
