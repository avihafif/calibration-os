import { importAllowed } from "./ts_boundary_policy.mjs";

const visible = /[A-Za-z\u0590-\u05ff]/u;
const visibleAttributes = new Set([
  "aria-label",
  "aria-description",
  "alt",
  "placeholder",
  "title",
]);

export const calosRules = {
  rules: {
    "import-boundary": {
      meta: {
        type: "problem",
        messages: { forbidden: "Import violates ADR-0001 A1–A4 boundary." },
      },
      create(context) {
        function inspect(source, node) {
          if (
            typeof source === "string" &&
            !importAllowed(context.filename, source)
          ) {
            context.report({ node, messageId: "forbidden" });
          }
        }
        return {
          ImportDeclaration(node) {
            inspect(node.source.value, node);
          },
          ExportNamedDeclaration(node) {
            inspect(node.source?.value, node);
          },
          ExportAllDeclaration(node) {
            inspect(node.source.value, node);
          },
          ImportExpression(node) {
            inspect(node.source.value, node);
          },
        };
      },
    },
    "no-hardcoded-ui-text": {
      meta: {
        type: "problem",
        messages: {
          text: "User-visible text must use a compiled i18n system key.",
        },
      },
      create(context) {
        return {
          JSXText(node) {
            if (visible.test(node.value))
              context.report({ node, messageId: "text" });
          },
          JSXAttribute(node) {
            if (
              visibleAttributes.has(node.name.name) &&
              node.value?.type === "Literal" &&
              typeof node.value.value === "string" &&
              visible.test(node.value.value)
            ) {
              context.report({ node, messageId: "text" });
            }
          },
          JSXExpressionContainer(node) {
            if (
              node.expression.type === "Literal" &&
              typeof node.expression.value === "string" &&
              visible.test(node.expression.value)
            ) {
              context.report({ node, messageId: "text" });
            }
          },
        };
      },
    },
  },
};
