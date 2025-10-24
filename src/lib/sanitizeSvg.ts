const SVG_ALLOWED_TAGS = new Set([
  'svg',
  'path',
  'g',
  'defs',
  'clippath',
  'title',
  'desc',
  'circle',
  'ellipse',
  'line',
  'polyline',
  'polygon',
  'rect',
  'use',
  'symbol',
  'lineargradient',
  'radialgradient',
  'stop',
  'pattern',
  'mask',
  'metadata',
  'view',
]);

const SVG_SELF_CLOSING_TAGS = new Set([
  'path',
  'circle',
  'ellipse',
  'line',
  'polyline',
  'polygon',
  'rect',
  'stop',
  'use',
  'title',
  'desc',
  'lineargradient',
  'radialgradient',
  'pattern',
  'mask',
  'metadata',
  'view',
]);

const SVG_DROP_CONTENT_TAGS = new Set(['script', 'foreignobject']);

const GLOBAL_ALLOWED_ATTRIBUTES = new Set([
  'fill',
  'stroke',
  'stroke-width',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-dasharray',
  'stroke-dashoffset',
  'fill-rule',
  'opacity',
  'transform',
  'clip-path',
  'id',
  'class',
  'href',
  'xlink:href',
  'filter',
  'rx',
  'ry',
  'cx',
  'cy',
  'r',
  'x',
  'y',
  'x1',
  'y1',
  'x2',
  'y2',
  'd',
  'points',
  'offset',
  'stop-color',
  'stop-opacity',
  'gradientunits',
  'gradienttransform',
  'patternunits',
  'patterncontentunits',
  'maskunits',
  'maskcontentunits',
  'viewbox',
  'preserveaspectratio',
]);

const SVG_SPECIFIC_ATTRIBUTES: Record<string, Set<string>> = {
  svg: new Set(['width', 'height', 'viewbox', 'xmlns', 'xmlns:xlink', 'version']),
};

const URL_ATTRS = new Set(['href', 'xlink:href']);
const URL_ALLOWED_SCHEMES = new Set(['http', 'https']);
const DATA_URL_PATTERN = /^data:image\/(?:svg\+xml|png|jpeg);base64,[a-z0-9+/=\s-]+$/i;
const CLIP_PATH_PATTERN = /^url\(#[-_a-z0-9]+\)$/i;

const ATTRIBUTE_PATTERN = /([a-zA-Z0-9:-]+)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>/=`]+)))?/g;
const TAG_PATTERN = /<\/?\s*([a-zA-Z][a-zA-Z0-9:-]*)([^<>]*)>/g;
const COMMENT_PATTERN = /<!--([\s\S]*?)-->/g;

function escapeText(value: string): string {
  return value.replace(/[<>&]/g, (ch) => {
    switch (ch) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      default:
        return ch;
    }
  });
}

function escapeAttribute(value: string): string {
  return value.replace(/[&"'<>]/g, (ch) => {
    switch (ch) {
      case '&':
        return '&amp;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      default:
        return ch;
    }
  });
}

function sanitiseUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('#')) return trimmed;
  if (trimmed.startsWith('data:')) {
    return DATA_URL_PATTERN.test(trimmed) ? trimmed : null;
  }

  const schemeMatch = trimmed.match(/^([a-zA-Z][\w+.-]*):/);
  if (!schemeMatch) {
    return trimmed;
  }

  const scheme = schemeMatch[1].toLowerCase();
  if (!URL_ALLOWED_SCHEMES.has(scheme)) {
    return null;
  }

  return trimmed;
}

function sanitiseAttribute(tagName: string, attrName: string, rawValue: string): string | null {
  const lowerAttr = attrName.toLowerCase();
  const trimmedValue = rawValue.trim();

  if (lowerAttr === 'style') {
    return null;
  }

  if (lowerAttr === 'clip-path') {
    if (!CLIP_PATH_PATTERN.test(trimmedValue)) {
      return null;
    }
    return trimmedValue;
  }

  if (URL_ATTRS.has(lowerAttr)) {
    const sanitised = sanitiseUrl(trimmedValue);
    return sanitised !== null ? sanitised : null;
  }

  if (lowerAttr === 'class') {
    const tokens = trimmedValue
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 0 && /^[-_a-zA-Z0-9]+$/.test(token));
    return tokens.length ? tokens.join(' ') : null;
  }

  if (lowerAttr === 'id') {
    return /^[-_a-zA-Z][-_a-zA-Z0-9:.]*$/.test(trimmedValue) ? trimmedValue : null;
  }

  return escapeAttribute(trimmedValue);
}

function getAllowedAttributes(tagName: string): Set<string> {
  const specific = SVG_SPECIFIC_ATTRIBUTES[tagName];
  if (!specific) {
    return GLOBAL_ALLOWED_ATTRIBUTES;
  }

  return new Set([...GLOBAL_ALLOWED_ATTRIBUTES, ...specific]);
}

function sanitiseTag(tagName: string, rawAttributes: string, isSelfClosing: boolean): string {
  const allowedAttributes = getAllowedAttributes(tagName);
  const sanitisedAttributes: string[] = [];

  rawAttributes.replace(
    ATTRIBUTE_PATTERN,
    (_match, name, _valueWithQuotes, valueDouble, valueSingle, valueUnquoted) => {
      const attrName = String(name).toLowerCase();
      if (!allowedAttributes.has(attrName)) {
        return '';
      }

      const rawValue = valueDouble ?? valueSingle ?? valueUnquoted ?? '';
      const sanitisedValue = sanitiseAttribute(tagName, attrName, rawValue);
      if (sanitisedValue !== null) {
        sanitisedAttributes.push(`${attrName}="${sanitisedValue}"`);
      }
      return '';
    },
  );

  const attributeString = sanitisedAttributes.length ? ` ${sanitisedAttributes.join(' ')}` : '';
  return `<${tagName}${attributeString}${isSelfClosing ? ' /' : ''}>`;
}

function normaliseTagName(name: string): string {
  return name.toLowerCase();
}

function isSelfClosingTag(tagName: string, isExplicitSelfClosing: boolean): boolean {
  return isExplicitSelfClosing || SVG_SELF_CLOSING_TAGS.has(tagName);
}

function isTagAllowed(tagName: string): boolean {
  return SVG_ALLOWED_TAGS.has(tagName);
}

export function sanitizeSvgMarkup(svg: string | undefined | null): string {
  if (!svg) return '';

  const source = String(svg).replace(COMMENT_PATTERN, '');
  let result = '';
  let lastIndex = 0;
  const dropStack: string[] = [];
  const openTags: string[] = [];

  TAG_PATTERN.lastIndex = 0;

  source.replace(
    TAG_PATTERN,
    (match, tagNameRaw: string, rawAttributes: string, offset: number) => {
      if (dropStack.length === 0) {
        result += escapeText(source.slice(lastIndex, offset));
      }
      lastIndex = offset + match.length;

      const normalisedName = normaliseTagName(tagNameRaw);
      const isClosing = match.startsWith('</');
      const isExplicitSelfClosing = /\/\s*>$/.test(match);
      const selfClosing = isSelfClosingTag(normalisedName, isExplicitSelfClosing);

      if (SVG_DROP_CONTENT_TAGS.has(normalisedName)) {
        if (!isClosing && !selfClosing) {
          dropStack.push(normalisedName);
        } else if (isClosing && dropStack[dropStack.length - 1] === normalisedName) {
          dropStack.pop();
        }
        return '';
      }

      if (!isTagAllowed(normalisedName) || dropStack.length > 0) {
        if (!isClosing && !selfClosing) {
          dropStack.push(normalisedName);
        }
        return '';
      }

      if (isClosing) {
        while (openTags.length > 0) {
          const top = openTags.pop();
          if (top === normalisedName) {
            result += `</${normalisedName}>`;
            break;
          }
        }
        return '';
      }

      if (!selfClosing) {
        openTags.push(normalisedName);
      }

      const attributesSection = rawAttributes ?? '';
      const attributeContent = attributesSection.replace(/\/\s*$/, '');

      result += sanitiseTag(normalisedName, attributeContent, selfClosing);
      return '';
    },
  );

  if (dropStack.length === 0) {
    result += escapeText(source.slice(lastIndex));
  }

  return result.trim();
}
