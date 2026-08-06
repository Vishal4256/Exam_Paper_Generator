import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const purify = DOMPurify(window);

/**
 * Sanitizes an HTML string to prevent XSS attacks.
 * @param {string} html 
 * @returns {string} 
 */
export const sanitizeHtml = (html) => {
    if (!html) return '';
    return purify.sanitize(html, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'h1', 'h2', 'ul', 'ol', 'li', 'br', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'pre', 'code', 'u'],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'data-type', 'data-formula', 'data-display-mode', 'style', 'target', 'colspan', 'rowspan'],
        ALLOW_DATA_ATTR: true, // Needed for KaTeX
    });
};

/**
 * Deep sanitize a TipTap node object or array
 */
export const sanitizeTipTapJson = (obj) => {
    if (typeof obj === 'string') {
        // Just as a precaution, remove script/iframe strings even from plain JSON text
        return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                  .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
    }
    
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeTipTapJson(item));
    }
    
    if (obj !== null && typeof obj === 'object') {
        const sanitizedObj = {};
        for (const [key, value] of Object.entries(obj)) {
            if (key === 'htmlCache' && typeof value === 'string') {
                sanitizedObj[key] = sanitizeHtml(value);
            } else {
                sanitizedObj[key] = sanitizeTipTapJson(value);
            }
        }
        return sanitizedObj;
    }
    
    return obj;
};
