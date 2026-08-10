import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

interface FieldWrapperProps {
  label?: string;
  error?: string;
  children: React.ReactNode;
}

function FieldWrapper({ label, error, children }: FieldWrapperProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-ink">{label}</label>}
      {children}
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}

const baseInputClasses =
  "w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-200";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = "", ...props }: InputProps) {
  return (
    <FieldWrapper label={label} error={error}>
      <input className={[baseInputClasses, className].join(" ")} {...props} />
    </FieldWrapper>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className = "", ...props }: TextareaProps) {
  return (
    <FieldWrapper label={label} error={error}>
      <textarea className={[baseInputClasses, "min-h-[100px]", className].join(" ")} {...props} />
    </FieldWrapper>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export function Select({ label, error, className = "", children, ...props }: SelectProps) {
  return (
    <FieldWrapper label={label} error={error}>
      <select className={[baseInputClasses, "bg-white", className].join(" ")} {...props}>
        {children}
      </select>
    </FieldWrapper>
  );
}
