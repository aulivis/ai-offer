import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import prettierPlugin from 'eslint-plugin-prettier';

const UI_STRING_ATTRIBUTE_NAMES = new Set([
  'placeholder',
  'title',
  'alt',
  'label',
  'aria-label',
  'aria-placeholder',
  'helperText',
  'caption',
  'tooltip',
]);

const PDF_TEMPLATE_FILE_PATTERN = /(\\|\/)src(\\|\/)app(\\|\/)pdf(\\|\/)templates(\\|\/)/;

function isPdfTemplateFile(filename) {
  if (!filename.endsWith('.ts')) {
    return false;
  }

  if (!PDF_TEMPLATE_FILE_PATTERN.test(filename)) {
    return false;
  }

  if (/(\\|\/)(?:__tests__|__mocks__)(\\|\/)/.test(filename)) {
    return false;
  }

  if (/\.(?:test|spec)\.ts$/.test(filename)) {
    return false;
  }

  return true;
}

const TEST_FILE_PATTERN =
  /(\\|\/)(?:__tests__|__mocks__|mocks|fixtures)(\\|\/)|\.(?:test|spec)\.[jt]sx?$/i;
const PDF_PIPELINE_FILE_PATTERN = /(\\|\/)(?:pdf|pdf-worker|ai-generate)(?:\b|\W)/i;

function isTestLikeFile(filename) {
  return TEST_FILE_PATTERN.test(filename);
}

function isPdfPipelineFile(filename) {
  return PDF_PIPELINE_FILE_PATTERN.test(filename);
}

const noHardcodedUiStringsPlugin = {
  rules: {
    'no-hardcoded-ui-strings': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Disallow hardcoded UI strings in TSX files to enforce translation usage.',
        },
        schema: [],
        messages: {
          noHardcoded: 'Hardcoded UI string detected. Use the translation helper instead.',
        },
      },
      create(context) {
        const filename = context.getFilename();

        if (
          !filename.endsWith('.tsx') ||
          !/(\\|\/)src(\\|\/)app(\\|\/)settings(\\|\/)/.test(filename) ||
          /(\\|\/)(?:__tests__|__mocks__|mocks|fixtures)(\\|\/)/.test(filename) ||
          /\.(?:test|spec)\.tsx$/.test(filename)
        ) {
          return {};
        }

        function getAttributeName(attribute) {
          if (!attribute || attribute.type !== 'JSXAttribute') {
            return undefined;
          }

          const { name } = attribute;

          if (!name) {
            return undefined;
          }

          if (name.type === 'JSXIdentifier') {
            return name.name;
          }

          if (name.type === 'JSXNamespacedName' && name.name?.type === 'JSXIdentifier') {
            return name.name.name;
          }

          return undefined;
        }

        function isUiAttribute(attributeName) {
          if (!attributeName) {
            return false;
          }
          if (attributeName.startsWith('aria-')) {
            return true;
          }
          return UI_STRING_ATTRIBUTE_NAMES.has(attributeName);
        }

        function isEmptyString(value) {
          return !value || !value.trim();
        }

        function reportAttribute(node, attribute) {
          const attributeName = getAttributeName(attribute);

          if (isUiAttribute(attributeName)) {
            context.report({ node, messageId: 'noHardcoded' });
          }
        }

        function handleLiteral(node, reportNode = node) {
          if (typeof node.value !== 'string' || isEmptyString(node.value)) {
            return;
          }

          const parent = node.parent;

          if (!parent) {
            return;
          }

          if (parent.type === 'JSXAttribute') {
            reportAttribute(reportNode, parent);
            return;
          }

          if (parent.type === 'JSXExpressionContainer' && parent.parent?.type === 'JSXAttribute') {
            reportAttribute(reportNode, parent.parent);
            return;
          }

          if (
            parent.type === 'JSXExpressionContainer' &&
            (parent.parent?.type === 'JSXElement' || parent.parent?.type === 'JSXFragment')
          ) {
            context.report({ node: reportNode, messageId: 'noHardcoded' });
          }
        }

        return {
          JSXText(node) {
            if (isEmptyString(node.value)) {
              return;
            }
            context.report({ node, messageId: 'noHardcoded' });
          },
          Literal: handleLiteral,
          TemplateLiteral(node) {
            if (
              node.expressions.length === 0 &&
              !isEmptyString(node.quasis[0]?.value?.cooked ?? '')
            ) {
              handleLiteral(
                {
                  value: node.quasis[0]?.value?.cooked ?? '',
                  parent: node.parent,
                },
                node,
              );
            }
          },
        };
      },
    },
    'pdf-templates-no-hardcoded-strings': {
      meta: {
        type: 'problem',
        docs: {
          description:
            'Disallow hardcoded visible strings inside PDF template markup to enforce i18n usage.',
        },
        schema: [],
        messages: {
          pdfNoHardcoded:
            'Hardcoded string detected in PDF template markup. Use ctx.i18n.t(...) instead.',
        },
      },
      create(context) {
        const filename = context.getFilename();

        if (!isPdfTemplateFile(filename)) {
          return {};
        }

        const visibleTextPattern = />\s*[A-Za-zÁÉÍÓÖŐÚÜŰáéíóöőúüű].*?</;
        const placeholderPattern = /placeholder=".*?"/i;

        return {
          TemplateElement(node) {
            const raw = node.value.raw;

            if (typeof raw !== 'string') {
              return;
            }

            if (visibleTextPattern.test(raw) || placeholderPattern.test(raw)) {
              context.report({ node, messageId: 'pdfNoHardcoded' });
            }
          },
        };
      },
    },
    'pdf-templates-no-untrusted-assets': {
      meta: {
        type: 'problem',
        docs: {
          description:
            'Prevent hardcoded external asset URLs inside PDF templates to ensure trusted origins only.',
        },
        schema: [],
        messages: {
          pdfNoUntrustedAsset:
            'External asset URL detected in template markup. Use trusted tokens or ctx data instead.',
        },
      },
      create(context) {
        const filename = context.getFilename();

        if (!isPdfTemplateFile(filename)) {
          return {};
        }

        function checkStringValue(value, node) {
          if (typeof value !== 'string' || value.length === 0) {
            return;
          }

          const attributePattern = /\b(?:src|href)\s*=\s*["']https?:\/\//i;
          const cssUrlPattern = /url\(\s*["']?https?:\/\//i;

          if (attributePattern.test(value) || cssUrlPattern.test(value)) {
            context.report({ node, messageId: 'pdfNoUntrustedAsset' });
          }
        }

        return {
          Literal(node) {
            checkStringValue(node.value, node);
          },
          TemplateElement(node) {
            checkStringValue(node.value.raw, node);
          },
        };
      },
    },
    'pdf-templates-no-inline-styles-outside-tokens': {
      meta: {
        type: 'problem',
        docs: {
          description:
            'Ensure inline styles within PDF templates rely on theme tokens (CSS variables).',
        },
        schema: [],
        messages: {
          pdfInlineStylesOutsideTokens:
            'Inline style detected without using theme tokens. Use CSS variables from tokens instead.',
        },
      },
      create(context) {
        const filename = context.getFilename();

        if (!isPdfTemplateFile(filename)) {
          return {};
        }

        const styleAttributePattern = /style\s*=\s*(["'])([^"']*)\1/gi;

        function checkRawValue(raw, node) {
          if (typeof raw !== 'string' || raw.length === 0) {
            return;
          }

          for (const match of raw.matchAll(styleAttributePattern)) {
            const styleValue = match[2] ?? '';
            if (styleValue.trim().length === 0) {
              continue;
            }

            if (!/var\(--/i.test(styleValue)) {
              context.report({ node, messageId: 'pdfInlineStylesOutsideTokens' });
              return;
            }
          }
        }

        return {
          TemplateElement(node) {
            checkRawValue(node.value.raw, node);
          },
        };
      },
    },
    'pdf-no-plain-html': {
      meta: {
        type: 'problem',
        docs: {
          description:
            'Disallow raw string literals as PDF HTML payloads so the template engine signature is required.',
        },
        schema: [],
        messages: {
          pdfNoPlainHtml:
            'PDF HTML must be generated by the offer template engine. Use buildOfferHtml or a trusted helper.',
        },
      },
      create(context) {
        const filename = context.getFilename();

        if (!isPdfPipelineFile(filename) || isTestLikeFile(filename)) {
          return {};
        }

        const HTML_ROOT_FRAGMENT = /<html/i;

        function getPropertyName(node) {
          if (!node) {
            return undefined;
          }

          if (node.type === 'Identifier') {
            return node.name;
          }

          if (node.type === 'Literal' && typeof node.value === 'string') {
            return node.value;
          }

          return undefined;
        }

        function getStaticStringValue(node) {
          if (!node) {
            return null;
          }

          if (node.type === 'Literal' && typeof node.value === 'string') {
            return node.value;
          }

          if (node.type === 'TemplateLiteral' && node.expressions.length === 0) {
            return node.quasis[0]?.value?.cooked ?? '';
          }

          return null;
        }

        function reportIfPlainString(node) {
          const value = getStaticStringValue(node);
          if (value && value.trim() && !HTML_ROOT_FRAGMENT.test(value)) {
            context.report({ node, messageId: 'pdfNoPlainHtml' });
          }
        }

        return {
          AssignmentExpression(node) {
            if (
              node.left?.type === 'MemberExpression' &&
              !node.left.computed &&
              node.left.property?.type === 'Identifier' &&
              node.left.property.name === 'html'
            ) {
              reportIfPlainString(node.right);
            }
          },
          Property(node) {
            if (node.computed) {
              return;
            }

            const name = getPropertyName(node.key);
            if (name !== 'html') {
              return;
            }

            reportIfPlainString(node.value);
          },
        };
      },
    },
  },
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    plugins: {
      prettier: prettierPlugin,
      'no-hardcoded-ui-strings': noHardcodedUiStringsPlugin,
    },
    rules: {
      'prettier/prettier': 'error',
      'no-hardcoded-ui-strings/no-hardcoded-ui-strings': 'error',
      'no-hardcoded-ui-strings/pdf-templates-no-hardcoded-strings': 'error',
      'no-hardcoded-ui-strings/pdf-templates-no-untrusted-assets': 'error',
      'no-hardcoded-ui-strings/pdf-templates-no-inline-styles-outside-tokens': 'error',
      'no-hardcoded-ui-strings/pdf-no-plain-html': 'error',
    },
  },
  {
    ignores: ['node_modules/**', '.next/**', 'out/**', 'build/**', 'next-env.d.ts'],
  },
];

export default eslintConfig;
