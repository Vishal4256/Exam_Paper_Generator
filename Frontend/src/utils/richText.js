/**
 * Safe text extractor for RichText fields.
 * Handles both the legacy string format and the new object format:
 *   { content: {...}, plainText: "...", htmlCache: "..." }
 */
export const getText = (val) => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
        return val.plainText || val.text || '';
    }
    return String(val);
};

/**
 * Safe HTML extractor for RichText fields.
 * Falls back to plainText if htmlCache is not available.
 */
export const getHtml = (val) => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
        return val.htmlCache || `<p>${val.plainText || ''}</p>`;
    }
    return String(val);
};

export const isRichText = (val) => {
    return typeof val === 'object' && val !== null && ('plainText' in val || 'htmlCache' in val || 'content' in val);
};

export const normalizeRichText = (val) => {
    if (!val) return { content: '', plainText: '', htmlCache: '' };
    if (typeof val === 'string') {
        return { 
            content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: val }] }] }, 
            plainText: val, 
            htmlCache: `<p>${val}</p>` 
        };
    }
    return val;
};

export const toRichText = normalizeRichText;

