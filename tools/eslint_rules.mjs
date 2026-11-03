import { importAllowed } from "./ts_boundary_policy.mjs";

const visible = /\p{L}/u;
const textAttributes =
  /^(?:aria-label|aria-description|alt|placeholder|title|label|description|message|helpText|emptyText|tooltip|caption|heading|summary|text)$/u;
const textVariable =
  /(?:^|[A-Z_])(?:label|title|message|description|placeholder|heading|caption|helpText)$/iu;
const unsafeMembers = new Set([
  "localStorage",
  "sessionStorage",
  "indexedDB",
  "caches",
  "cookie",
  "serviceWorker",
  "fetch",
  "XMLHttpRequest",
  "WebSocket",
  "EventSource",
  "sendBeacon",
  "eval",
  "innerHTML",
  "outerHTML",
  "insertAdjacentHTML",
  "srcdoc",
  "write",
  "createContextualFragment",
]);

function memberName(node) {
  if (node.property.type === "Identifier" && !node.computed)
    return node.property.name;
  if (
    node.property.type === "Literal" &&
    typeof node.property.value === "string"
  )
    return node.property.value;
  return null;
}

function isImportMeta(node) {
  return (
    node.type === "MetaProperty" &&
    node.meta.name === "import" &&
    node.property.name === "meta"
  );
}

function checkTextExpression(node, report) {
  if (node.type === "Literal" && typeof node.value === "string") {
    if (visible.test(node.value)) report(node);
  } else if (node.type === "TemplateLiteral") {
    for (const quasi of node.quasis) {
      if (visible.test(quasi.value.cooked ?? quasi.value.raw)) report(quasi);
    }
  } else if (node.type === "ConditionalExpression") {
    checkTextExpression(node.consequent, report);
    checkTextExpression(node.alternate, report);
  } else if (node.type === "LogicalExpression") {
    if (node.operator !== "&&") checkTextExpression(node.left, report);
    checkTextExpression(node.right, report);
  } else if (node.type === "BinaryExpression") {
    if (node.operator === "+") {
      checkTextExpression(node.left, report);
      checkTextExpression(node.right, report);
    }
  } else if (node.type === "ArrayExpression") {
    for (const element of node.elements) {
      if (element !== null) checkTextExpression(element, report);
    }
  }
}

export const calosRules = {
  rules: {
    "import-boundary": {
      meta: {
        type: "problem",
        messages: {
          forbidden:
            "Import violates ADR-0001 A1–A4 boundary or the approved external allow-list.",
        },
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
            if (
              node.source.type !== "Literal" ||
              typeof node.source.value !== "string"
            ) {
              context.report({ node, messageId: "forbidden" });
              return;
            }
            inspect(node.source.value, node);
          },
          CallExpression(node) {
            if (
              node.callee.type === "Identifier" &&
              node.callee.name === "require"
            ) {
              context.report({ node, messageId: "forbidden" });
            }
          },
        };
      },
    },
    "no-unsafe-web-api": {
      meta: {
        type: "problem",
        messages: {
          unsafe:
            "Runtime network, storage, DOM injection and dynamic asset loading are forbidden.",
        },
      },
      create(context) {
        function report(node) {
          context.report({ node, messageId: "unsafe" });
        }
        return {
          MemberExpression(node) {
            const name = memberName(node);
            if (name !== null && unsafeMembers.has(name)) report(node);
            if (
              node.computed &&
              node.property.type !== "Literal" &&
              node.object.type === "Identifier" &&
              ["window", "globalThis", "document"].includes(node.object.name)
            )
              report(node);
          },
          CallExpression(node) {
            if (
              node.callee.type === "MemberExpression" &&
              isImportMeta(node.callee.object) &&
              ["glob", "globEager"].includes(memberName(node.callee))
            )
              report(node);
          },
          NewExpression(node) {
            if (
              node.callee.type === "Identifier" &&
              [
                "URL",
                "Function",
                "WebSocket",
                "XMLHttpRequest",
                "EventSource",
              ].includes(node.callee.name)
            )
              report(node);
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
        function report(node) {
          context.report({ node, messageId: "text" });
        }
        return {
          JSXText(node) {
            if (visible.test(node.value)) report(node);
          },
          JSXAttribute(node) {
            if (!textAttributes.test(node.name.name)) return;
            if (
              node.value?.type === "Literal" &&
              typeof node.value.value === "string" &&
              visible.test(node.value.value)
            )
              report(node);
            if (node.value?.type === "JSXExpressionContainer")
              checkTextExpression(node.value.expression, report);
          },
          JSXExpressionContainer(node) {
            if (node.parent.type === "JSXAttribute") return;
            checkTextExpression(node.expression, report);
          },
          VariableDeclarator(node) {
            if (
              node.id.type === "Identifier" &&
              textVariable.test(node.id.name) &&
              node.init
            ) {
              checkTextExpression(node.init, report);
            }
          },
        };
      },
    },
  },
};
