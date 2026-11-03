import { useMemo, useState, type FormEvent } from "react";
import { createSystemI18n, type SupportedLocale } from "@calos/i18n";
import {
  Button,
  Card,
  Checkbox,
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
  const update = <K extends keyof PreviewFields>(
    key: K,
    value: PreviewFields[K],
  ) => {
    setFields((current) => ({ ...current, [key]: value }));
    setResult(null);
  };
  const validate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAttempted(true);
    setResult(Object.values(errors).some(Boolean) ? "invalid" : "valid");
  };
  const reset = () => {
    setFields(emptyFields);
    setAttempted(false);
    setResult(null);
  };
  const requiredLabel = t("form.requiredLabel");

  return (
    <div className="form-demo">
      <Card title={t("form.title")}>
        <p className="form-demo-description">{t("form.description")}</p>
        <form noValidate onSubmit={validate} className="form-demo-grid">
          <TextField
            id="preview-name"
            label={t("form.name")}
            hint={t("form.nameHint")}
            error={attempted ? errors.name : undefined}
            required
            requiredLabel={requiredLabel}
            value={fields.name}
            onChange={(value) => update("name", value)}
          />
          <TextArea
            id="preview-summary"
            label={t("form.summary")}
            hint={t("form.summaryHint")}
            value={fields.summary}
            onChange={(value) => update("summary", value)}
          />
          <NumberTextField
            id="preview-decimal"
            label={t("form.decimal")}
            hint={t("form.decimalHint")}
            error={attempted ? errors.decimal : undefined}
            decimalError={t("form.decimalInvalid")}
            required
            requiredLabel={requiredLabel}
            value={fields.decimal}
            onChange={(value) => update("decimal", value)}
          />
          <Select
            id="preview-category"
            label={t("form.category")}
            placeholder={t("form.choose")}
            required
            requiredLabel={requiredLabel}
            value={fields.category}
            onChange={(value) => update("category", value)}
            error={attempted ? errors.category : undefined}
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
            error={attempted ? errors.confirmed : undefined}
          />
          <div className="form-demo-actions">
            <Button type="submit" variant="primary">
              {t("form.validate")}
            </Button>
            <Button onClick={reset}>{t("form.reset")}</Button>
          </div>
          {result && (
            <Notification tone={result === "valid" ? "ok" : "error"}>
              {t(result === "valid" ? "form.valid" : "form.invalid")}
            </Notification>
          )}
        </form>
      </Card>
    </div>
  );
}
