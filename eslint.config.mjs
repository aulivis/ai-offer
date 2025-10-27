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

const noHardcodedUiStringsPlugin = {
  rules: {
    'no-hardcoded-ui-strings': {
      meta: {
        type: 'problem',
        docs: {
          description:
            'Disallow hardcoded UI strings in TSX files to enforce translation usage.',
        },
        schema: [],
        messages: {
          noHardcoded:
            'Hardcoded UI string detected. Use the translation helper instead.',
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

          if (
            parent.type === 'JSXExpressionContainer' &&
            parent.parent?.type === 'JSXAttribute'
          ) {
            reportAttribute(reportNode, parent.parent);
            return;
          }

          if (
            parent.type === 'JSXExpressionContainer' &&
            (parent.parent?.type === 'JSXElement' ||
              parent.parent?.type === 'JSXFragment')
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
    },
  },
  {
    ignores: ['node_modules/**', '.next/**', 'out/**', 'build/**', 'next-env.d.ts'],
  },
];

export default eslintConfig;
