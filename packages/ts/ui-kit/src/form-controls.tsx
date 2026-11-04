import { forwardRef, useId, type ChangeEvent } from "react";

interface FieldPresentation {
  id?: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  requiredLabel?: string;
  disabled?: boolean;
  readOnly?: boolean;
  onBlur?: () => void;
}

type ResolvedField = FieldPresentation & { id: string };

interface TextControl extends FieldPresentation {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number | null;
  lang?: string;
}

function descriptionIds({
  id,
  hint,
  error,
}: ResolvedField): string | undefined {
  const ids = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean);
  return ids.length ? ids.join(" ") : undefined;
}

function FieldLabel({ id, label, required, requiredLabel }: ResolvedField) {
  return (
    <label htmlFor={id} className="ui-field-label">
      {label}
      {required && (
        <span className="ui-required" aria-hidden="true">
          {requiredLabel}
        </span>
      )}
    </label>
  );
}

function FieldMessages({ id, hint, error }: ResolvedField) {
  return (
    <div className="ui-field-messages" data-msgs>
      {hint && (
        <p id={`${id}-hint`} className="ui-field-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="ui-field-error">
          {error}
        </p>
      )}
    </div>
  );
}

/** @req FR-UI-02, NFR-10: reusable controlled text field with explicit associations. */
export function TextField(
  props: TextControl & {
    inputDir?: "ltr" | "rtl" | "auto";
    inputMode?: "decimal" | "text";
    autoComplete?: string;
  },
) {
  const {
    error,
    required = false,
    disabled = false,
    readOnly = false,
    value,
    onChange,
    placeholder,
    maxLength = 256,
    inputDir,
    inputMode,
    lang,
    autoComplete,
    onBlur,
  } = props;
  const generatedId = useId();
  const id = props.id ?? generatedId;
  const field = { ...props, id };
  return (
    <div className="ui-field">
      <FieldLabel {...field} />
      <input
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        maxLength={maxLength ?? undefined}
        inputMode={inputMode}
        dir={inputDir ?? "auto"}
        lang={lang}
        autoComplete={autoComplete}
        required={required}
        disabled={disabled}
        readOnly={readOnly}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={descriptionIds(field)}
        aria-errormessage={error ? `${id}-error` : undefined}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          onChange(event.currentTarget.value)
        }
        onBlur={onBlur}
      />
      <FieldMessages {...field} />
    </div>
  );
}

/** @req FR-UI-02: the value remains a string; no binary float conversion occurs. */
export function isExactDecimalText(value: string): boolean {
  return (
    value.length <= 128 && /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/u.test(value)
  );
}

export function NumberTextField(
  props: Omit<TextControl, "maxLength"> & {
    decimalError: string;
    showDecimalError: boolean;
  },
) {
  const error =
    props.showDecimalError &&
    props.value !== "" &&
    !isExactDecimalText(props.value)
      ? props.decimalError
      : props.error;
  return (
    <TextField
      {...props}
      error={error}
      inputMode="decimal"
      inputDir="ltr"
      autoComplete="off"
      maxLength={null}
    />
  );
}

/** @req FR-UI-02, NFR-10: long-form text uses native keyboard and read-only semantics. */
export function TextArea(props: TextControl & { rows?: number }) {
  const {
    value,
    onChange,
    error,
    required = false,
    disabled = false,
    readOnly = false,
    placeholder,
    maxLength = 2048,
    rows = 4,
    onBlur,
    lang,
  } = props;
  const generatedId = useId();
  const id = props.id ?? generatedId;
  const field = { ...props, id };
  return (
    <div className="ui-field">
      <FieldLabel {...field} />
      <textarea
        id={id}
        value={value}
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
          onChange(event.currentTarget.value)
        }
        placeholder={placeholder}
        maxLength={maxLength ?? undefined}
        rows={rows}
        dir="auto"
        lang={lang}
        required={required}
        disabled={disabled}
        readOnly={readOnly}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={descriptionIds(field)}
        aria-errormessage={error ? `${id}-error` : undefined}
        onBlur={onBlur}
      />
      <FieldMessages {...field} />
    </div>
  );
}

export interface SelectOption {
  value: string;
  label: string;
}

/** Native select: no required choice is silently preselected. */
export function Select(
  props: FieldPresentation & {
    value: string;
    onChange: (value: string) => void;
    options: readonly SelectOption[];
    placeholder?: string;
  },
) {
  const {
    value,
    onChange,
    options,
    placeholder,
    error,
    required = false,
    disabled = false,
    readOnly = false,
    onBlur,
  } = props;
  const generatedId = useId();
  const id = props.id ?? generatedId;
  const field = { ...props, id };
  return (
    <div className="ui-field">
      <FieldLabel {...field} />
      <select
        id={id}
        value={value}
        required={required}
        disabled={disabled}
        aria-required={required || undefined}
        aria-readonly={readOnly || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={descriptionIds(field)}
        aria-errormessage={error ? `${id}-error` : undefined}
        onBlur={onBlur}
        onChange={(event: ChangeEvent<HTMLSelectElement>) => {
          if (!readOnly) onChange(event.currentTarget.value);
        }}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <FieldMessages {...field} />
    </div>
  );
}

/** @req FR-UI-02, NFR-10: native checkbox supports all controlled states. */
export function Checkbox(
  props: FieldPresentation & {
    checked: boolean;
    onChange: (checked: boolean) => void;
  },
) {
  const {
    checked,
    onChange,
    error,
    required = false,
    disabled = false,
    readOnly = false,
    onBlur,
  } = props;
  const generatedId = useId();
  const id = props.id ?? generatedId;
  const field = { ...props, id };
  return (
    <div className="ui-field ui-checkbox-field">
      <div className="ui-checkbox-row">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          required={required}
          disabled={disabled}
          aria-required={required || undefined}
          aria-readonly={readOnly || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={descriptionIds(field)}
          aria-errormessage={error ? `${id}-error` : undefined}
          onBlur={onBlur}
          onClick={(event) => {
            if (readOnly) event.preventDefault();
          }}
          onKeyDown={(event) => {
            if (readOnly && event.key === " ") event.preventDefault();
          }}
          onChange={(event) => {
            if (!readOnly) onChange(event.currentTarget.checked);
          }}
        />
        <FieldLabel {...field} />
      </div>
      <FieldMessages {...field} />
    </div>
  );
}

export interface FormFinding {
  id: string;
  label: string;
  message: string;
}

/** @req FR-UI-02, NFR-10: one polite announcement; field messages remain non-live. */
export const FormSummary = forwardRef<
  HTMLDivElement,
  { title: string; findings: readonly FormFinding[] }
>(function FormSummary({ title, findings }, ref) {
  if (findings.length === 0) return null;
  return (
    <div
      className="ui-form-summary"
      ref={ref}
      tabIndex={-1}
      role="status"
      aria-live="polite"
    >
      <p className="ui-form-summary-title">{title}</p>
      <ul>
        {findings.map(({ id, label, message }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              onClick={() => document.getElementById(id)?.focus()}
            >
              {label}: {message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
});
