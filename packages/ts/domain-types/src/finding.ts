// Generated from schemas/finding/v1.schema.json; do not edit.

export interface FindingPointer {
  value: string;
}

export interface FindingMessageParamsItem {
  name: string;
  value: string;
}

export interface FindingMessage {
  key: string;
  params?: FindingMessageParamsItem[];
}

export interface FindingFixParamsItem {
  name: string;
  value: string;
}

export interface FindingFix {
  id: string;
  params?: FindingFixParamsItem[];
}

export interface Finding {
  code: string;
  severity: "error" | "warning" | "info";
  pointer: FindingPointer;
  message: FindingMessage;
  stage: string;
  fix?: FindingFix;
}
