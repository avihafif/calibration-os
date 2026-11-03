import type { ChangeEvent } from "react";

interface FieldPresentation {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  requiredLabel?: string;
  disabled?: boolean;
  readOnly?: boolean;
}

interface TextControl extends FieldPresentation {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
}

function descriptionIds({
  id,
  hint,
  error,
}: FieldPresentation): string | undefined {
  const ids = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean);
  return ids.length ? ids.join(" ") : undefined;
}

function FieldLabel({ id, label, required, requiredLabel }: FieldPresentation) {
  return (
    <label htmlFor={id} className="ui-field-label">
      {label}
      {required && (
        <span className="ui-required" title={requiredLabel} aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
}

function FieldMessages({ id, hint, error }: FieldPresentation) {
  return (
    <div className="ui-field-messages" data-msgs>
      {hint && (
        <p id={`${id}-hint`} className="ui-field-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="ui-field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** @req FR-UI-02, NFR-10: reusable controlled text field with explicit associations. */
export function TextField(
  props: TextControl & {
    inputDir?: "ltr" | "rtl";
    inputMode?: "decimal" | "text";
  },
) {
  const {
    id,
    label,
    hint,
    error,
    required = false,
    requiredLabel,
    disabled = false,
    readOnly = false,
    value,
    onChange,
    placeholder,
    maxLength = 256,
    inputDir,
    inputMode,
  } = props;
  return (
    <div className="ui-field">
      <FieldLabel {...props} />
      <input
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        inputMode={inputMode}
        dir={inputDir}
        required={required}
        disabled={disabled}
        readOnly={readOnly}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={descriptionIds(props)}
        aria-errormessage={error ? `${id}-error` : undefined}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          onChange(event.currentTarget.value)
        }
      />
      <FieldMessages
        id={id}
        label={label}
        hint={hint}
        error={error}
        required={required}
        requiredLabel={requiredLabel}
        disabled={disabled}
        readOnly={readOnly}
      />
    </div>
  );
}

/** @req FR-UI-02: the value remains a string; no binary float conversion occurs. */
export function isExactDecimalText(value: string): boolean {
  return (
    value.length <= 128 && /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/u.test(value)
  );
}

export function NumberTextField(props: TextControl & { decimalError: string }) {
  const error =
    props.error ??
    (props.value !== "" && !isExactDecimalText(props.value)
      ? props.decimalError
      : undefined);
  return (
    <TextField
      {...props}
      error={error}
      inputMode="decimal"
      inputDir="ltr"
      maxLength={128}
    />
  );
}

/** @req FR-UI-02, NFR-10: long-form text uses native keyboard and read-only semantics. */
export function TextArea(props: TextControl & { rows?: number }) {
  const {
    id,
    value,
    onChange,
    error,
    required = false,
    disabled = false,
    readOnly = false,
    placeholder,
    maxLength = 2048,
    rows = 4,
  } = props;
  return (
    <div className="ui-field">
      <FieldLabel {...props} />
      <textarea
        id={id}
        value={value}
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
          onChange(event.currentTarget.value)
        }
        placeholder={placeholder}
        maxLength={maxLength}
        rows={rows}
        required={required}
        disabled={disabled}
        readOnly={readOnly}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={descriptionIds(props)}
        aria-errormessage={error ? `${id}-error` : undefined}
      />
      <FieldMessages {...props} />
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
    id,
    value,
    onChange,
    options,
    placeholder,
    error,
    required = false,
    disabled = false,
    readOnly = false,
  } = props;
  return (
    <div className="ui-field">
      <FieldLabel {...props} />
      <select
        id={id}
        value={value}
        required={required}
        disabled={disabled}
        aria-required={required || undefined}
        aria-readonly={readOnly || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={descriptionIds(props)}
        aria-errormessage={error ? `${id}-error` : undefined}
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
      <FieldMessages {...props} />
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
    id,
    label,
    checked,
    onChange,
    hint,
    error,
    required = false,
    disabled = false,
    readOnly = false,
  } = props;
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
          aria-describedby={descriptionIds(props)}
          aria-errormessage={error ? `${id}-error` : undefined}
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
        <FieldLabel {...props} />
      </div>
      <FieldMessages
        id={id}
        label={label}
        hint={hint}
        error={error}
        required={required}
        disabled={disabled}
        readOnly={readOnly}
      />
    </div>
  );
}
