import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { createSystemI18n, type SupportedLocale } from "@calos/i18n";
import {
  Button,
  Card,
  Checkbox,
  FormSummary,
  NumberTextField,
  Notification,
  Select,
  TextArea,
  TextField,
  isExactDecimalText,
} from "@calos/ui-kit";

interface PreviewFields {
  name: string;
  summary: string;
  decimal: string;
  category: string;
  confirmed: boolean;
}

const emptyFields: PreviewFields = Object.freeze({
  name: "",
  summary: "",
  decimal: "",
  category: "",
  confirmed: false,
});

/** @req FR-UI-02, NFR-10, NFR-11: synthetic form state stays in React memory. */
export function SyntheticFormDemo({ locale }: { locale: SupportedLocale }) {
  const [fields, setFields] = useState<PreviewFields>(emptyFields);
  const [attempted, setAttempted] = useState(false);
  const [touched, setTouched] = useState<
    Partial<Record<keyof PreviewFields, boolean>>
  >({});
  const [submissionId, setSubmissionId] = useState(0);
  const summaryRef = useRef<HTMLDivElement>(null);
  const [result, setResult] = useState<"valid" | "invalid" | null>(null);
  const t = useMemo(() => createSystemI18n(locale).format, [locale]);
  const requiredError = t("form.required");
  const errors = {
    name: fields.name.trim() ? undefined : requiredError,
    decimal: !fields.decimal
      ? requiredError
      : !isExactDecimalText(fields.decimal)
        ? t("form.decimalInvalid")
        : undefined,
    category: fields.category ? undefined : requiredError,
    confirmed: fields.confirmed ? undefined : requiredError,
  };
  const findings = (["name", "decimal", "category", "confirmed"] as const)
    .filter((key) => errors[key])
    .map((key) => ({
      id: `preview-${key === "confirmed" ? "confirm" : key}`,
      label: t(
        key === "name"
          ? "form.name"
          : key === "decimal"
            ? "form.decimal"
            : key === "category"
              ? "form.category"
              : "form.confirm",
      ),
      message: errors[key]!,
    }));
  useEffect(() => {
    if (submissionId > 0 && result === "invalid") summaryRef.current?.focus();
  }, [submissionId, result]);
  const visit = (key: keyof PreviewFields) =>
    setTouched((current) => ({ ...current, [key]: true }));
  const update = <K extends keyof PreviewFields>(
    key: K,
    value: PreviewFields[K],
  ) => {
    setFields((current) => ({ ...current, [key]: value }));
    setResult((current) => (current === "valid" ? null : current));
  };
  const validate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAttempted(true);
    setSubmissionId((current) => current + 1);
    setResult(Object.values(errors).some(Boolean) ? "invalid" : "valid");
  };
  const reset = () => {
    setFields(emptyFields);
    setAttempted(false);
    setTouched({});
    setResult(null);
  };
  const requiredLabel = t("form.requiredLabel");

  return (
    <div
      className="form-demo"
      data-test-form-sentinel="CALOS_SYNTHETIC_FORM_DEMO_ONLY"
    >
      <Card title={t("form.title")}>
        <p className="form-demo-description">{t("form.description")}</p>
        <form noValidate onSubmit={validate} className="form-demo-grid">
          {result === "invalid" && (
            <FormSummary
              ref={summaryRef}
              title={t("form.invalid")}
              findings={findings}
            />
          )}
          <TextField
            id="preview-name"
            label={t("form.name")}
            hint={t("form.nameHint")}
            error={attempted || touched.name ? errors.name : undefined}
            required
            requiredLabel={requiredLabel}
            value={fields.name}
            lang={locale}
            onChange={(value) => update("name", value)}
            onBlur={() => visit("name")}
          />
          <TextArea
            id="preview-summary"
            label={t("form.summary")}
            hint={t("form.summaryHint")}
            lang={locale}
            value={fields.summary}
            onChange={(value) => update("summary", value)}
          />
          <NumberTextField
            id="preview-decimal"
            label={t("form.decimal")}
            hint={t("form.decimalHint")}
            error={attempted || touched.decimal ? errors.decimal : undefined}
            decimalError={t("form.decimalInvalid")}
            showDecimalError={attempted || Boolean(touched.decimal)}
            required
            requiredLabel={requiredLabel}
            value={fields.decimal}
            onChange={(value) => update("decimal", value)}
            onBlur={() => visit("decimal")}
          />
          <Select
            id="preview-category"
            label={t("form.category")}
            placeholder={t("form.choose")}
            required
            requiredLabel={requiredLabel}
            value={fields.category}
            onChange={(value) => update("category", value)}
            error={attempted || touched.category ? errors.category : undefined}
            onBlur={() => visit("category")}
            options={[
              { value: "general", label: t("form.categoryFirst") },
              { value: "interface", label: t("form.categorySecond") },
            ]}
          />
          <Checkbox
            id="preview-confirm"
            label={t("form.confirm")}
            hint={t("form.confirmHint")}
            required
            requiredLabel={requiredLabel}
            checked={fields.confirmed}
            onChange={(checked) => update("confirmed", checked)}
            error={
              attempted || touched.confirmed ? errors.confirmed : undefined
            }
            onBlur={() => visit("confirmed")}
          />
          <div className="form-demo-actions">
            <Button type="submit" variant="primary">
              {t("form.validate")}
            </Button>
            <Button onClick={reset}>{t("form.reset")}</Button>
          </div>
          {result === "valid" && (
            <Notification tone="ok">{t("form.valid")}</Notification>
          )}
        </form>
      </Card>
    </div>
  );
}
