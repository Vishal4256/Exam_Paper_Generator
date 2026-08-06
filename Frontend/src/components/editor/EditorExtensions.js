import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import CharacterCount from '@tiptap/extension-character-count';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { Node, mergeAttributes, nodeInputRule } from '@tiptap/core';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const lowlight = createLowlight(common);

export const MathNode = Node.create({
    name: 'math',
    group: 'inline',
    inline: true,
    atom: true,

    addAttributes() {
        return {
            formula: {
                default: '',
            },
            displayMode: {
                default: false,
            }
        };
    },

    parseHTML() {
        return [
            {
                tag: 'span[data-type="math"]',
                getAttrs: (dom) => ({
                    formula: dom.getAttribute('data-formula'),
                    displayMode: dom.getAttribute('data-display-mode') === 'true',
                }),
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        let html = '';
        try {
            html = katex.renderToString(HTMLAttributes.formula || '', {
                throwOnError: false,
                displayMode: HTMLAttributes.displayMode,
            });
        } catch (e) {
            html = HTMLAttributes.formula;
        }

        return ['span', mergeAttributes(HTMLAttributes, {
            'data-type': 'math',
            'data-formula': HTMLAttributes.formula,
            'data-display-mode': HTMLAttributes.displayMode,
        }), ['span', { class: 'katex-render', innerHTML: html }]];
    },

    addNodeView() {
        return ({ node }) => {
            const dom = document.createElement('span');
            dom.classList.add('math-node-view');
            dom.style.cursor = 'pointer';
            
            try {
                katex.render(node.attrs.formula, dom, {
                    throwOnError: false,
                    displayMode: node.attrs.displayMode,
                });
            } catch (e) {
                dom.textContent = node.attrs.formula;
            }

            // A click could trigger an external popup or we just rely on bubble menu
            return {
                dom,
            };
        };
    },

    addInputRules() {
        return [
            nodeInputRule({
                find: /\$\$(.+?)\$\$$/,
                type: this.type,
                getAttributes: match => {
                    return {
                        formula: match[1],
                        displayMode: true,
                    };
                },
            }),
            nodeInputRule({
                find: /\$(.+?)\$$/,
                type: this.type,
                getAttributes: match => {
                    return {
                        formula: match[1],
                        displayMode: false,
                    };
                },
            }),
        ];
    }
});

export const getExtensions = () => [
    StarterKit.configure({
        codeBlock: false, // disable default codeBlock, using lowlight instead
    }),
    Underline,
    Link.configure({ openOnClick: false }),
    Image,
    Table.configure({ resizable: true }),
    TableRow,
    TableCell,
    TableHeader,
    CodeBlockLowlight.configure({
        lowlight,
    }),
    CharacterCount,
    MathNode,
];
