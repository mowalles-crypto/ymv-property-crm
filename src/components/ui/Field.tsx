import { type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes, forwardRef, type ReactNode } from "react";

const inputClass =
  "block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-500";

function Wrapper({
  label,
  htmlFor,
  error,
  optional,
  children,
}: {
  label?: string;
  htmlFor?: string;
  error?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      {label && (
        <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-slate-700">
          {label}
          {optional && <span className="ml-1 text-xs font-normal text-slate-400">(optional)</span>}
        </label>
      )}
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string; optional?: boolean }
>(function Input({ label, error, optional, id, className = "", ...props }, ref) {
  return (
    <Wrapper label={label} htmlFor={id} error={error} optional={optional}>
      <input ref={ref} id={id} className={`${inputClass} ${className}`} {...props} />
    </Wrapper>
  );
});

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string; optional?: boolean }
>(function Select({ label, error, optional, id, className = "", children, ...props }, ref) {
  return (
    <Wrapper label={label} htmlFor={id} error={error} optional={optional}>
      <select ref={ref} id={id} className={`${inputClass} bg-white ${className}`} {...props}>
        {children}
      </select>
    </Wrapper>
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string; optional?: boolean }
>(function Textarea({ label, error, optional, id, className = "", ...props }, ref) {
  return (
    <Wrapper label={label} htmlFor={id} error={error} optional={optional}>
      <textarea ref={ref} id={id} className={`${inputClass} ${className}`} {...props} />
    </Wrapper>
  );
});

export function Checkbox({
  label,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label htmlFor={id} className="flex items-center gap-2 text-sm text-slate-700">
      <input
        type="checkbox"
        id={id}
        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        {...props}
      />
      {label}
    </label>
  );
}
