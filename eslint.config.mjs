import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import globals from 'globals';
import ts from 'typescript-eslint';

export default [
    {
        ignores: ['**/node_modules/', '**/dist/'],
    },
    js.configs.recommended,
    ...ts.configs.recommended,
    stylistic.configs['all-flat'],
    eslintPluginUnicorn.configs['flat/all'],
    {
        files: ['**/*.{js,cjs,mjs,ts}'],
        languageOptions: {
            globals: { ...globals.node },
        },
        plugins: {
            '@stylistic': stylistic,
        },
        rules: {
            'unicorn/better-regex': ['error', { sortCharacterClasses: true }],
            'unicorn/consistent-function-scoping': ['error', { checkArrowFunctions: true }],
            'unicorn/expiring-todo-comments': ['error', { allowWarningComments: false }],
            'unicorn/filename-case': ['error', { cases: { camelCase: true, pascalCase: true } }],
            'unicorn/no-array-reduce': ['error', { allowSimpleOperations: false }],
            'unicorn/no-typeof-undefined': ['error', { checkGlobalVariables: true }],
            'unicorn/no-unnecessary-polyfills': ['error', { targets: { node: 'lts' } }],
            'unicorn/no-process-exit': ['off'],
            'unicorn/no-null': ['off'],

            /* @stylistic */
            '@stylistic/array-bracket-newline': ['error', 'consistent'],
            '@stylistic/array-bracket-spacing': ['error', 'never'],
            '@stylistic/array-element-newline': ['error', 'consistent'],
            '@stylistic/arrow-parens': ['error', 'always'],
            '@stylistic/arrow-spacing': ['error', { before: true, after: true }],
            '@stylistic/block-spacing': ['error', 'always'],
            '@stylistic/brace-style': ['error', '1tbs', { allowSingleLine: false }],
            '@stylistic/comma-dangle': ['error', 'always-multiline'],
            '@stylistic/comma-spacing': ['error', { before: false, after: true }],
            '@stylistic/comma-style': ['error', 'last'],
            '@stylistic/computed-property-spacing': ['error', 'never'],
            '@stylistic/dot-location': ['error', 'property'],
            '@stylistic/eol-last': ['error', 'always'],
            '@stylistic/function-call-argument-newline': ['error', 'consistent'],
            '@stylistic/function-call-spacing': ['error', 'never'],
            '@stylistic/function-paren-newline': ['error', 'multiline'],
            '@stylistic/generator-star-spacing': ['error', { before: true, after: true }],
            '@stylistic/implicit-arrow-linebreak': ['error', 'beside'],
            '@stylistic/indent': ['error', 4],
            '@stylistic/indent-binary-ops': ['error', 4],
            '@stylistic/key-spacing': ['error', { beforeColon: false, afterColon: true, mode: 'strict' }],
            '@stylistic/keyword-spacing': ['error', { before: true, after: true }],
            '@stylistic/line-comment-position': ['error', 'above'],
            '@stylistic/linebreak-style': ['error', 'unix'],
            '@stylistic/lines-around-comment': [
                'error',
                { beforeBlockComment: false, afterBlockComment: false, beforeLineComment: true, afterLineComment: false },
            ],
            '@stylistic/lines-between-class-members': ['error', 'always'],
            '@stylistic/max-len': [
                'error',
                { code: 160, tabWidth: 4, comments: 160, ignoreUrls: true, ignoreStrings: true, ignoreTemplateLiterals: true, ignoreRegExpLiterals: true },
            ],
            '@stylistic/max-statements-per-line': ['error', { max: 1 }],
            '@stylistic/member-delimiter-style': [
                'error',
                { multiline: { delimiter: 'semi', requireLast: true }, singleline: { delimiter: 'semi', requireLast: false }, multilineDetection: 'brackets' },
            ],
            '@stylistic/multiline-comment-style': ['error', 'starred-block'],
            '@stylistic/multiline-ternary': ['error', 'always-multiline'],
            '@stylistic/new-parens': ['error', 'always'],
            '@stylistic/newline-per-chained-call': ['error', { ignoreChainWithDepth: 3 }],
            '@stylistic/no-confusing-arrow': ['error', { allowParens: true, onlyOneSimpleParam: false }],
            '@stylistic/no-extra-parens': ['error', 'functions'],
            '@stylistic/no-mixed-operators': ['error', { allowSamePrecedence: true }],
            '@stylistic/no-multi-spaces': ['error', { exceptions: { Property: false } }],
            '@stylistic/no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1, maxBOF: 0 }],
            '@stylistic/no-trailing-spaces': ['error', { skipBlankLines: false, ignoreComments: false }],
            '@stylistic/nonblock-statement-body-position': ['error', 'beside'],
            '@stylistic/object-curly-newline': ['error', { multiline: true, consistent: true }],
            '@stylistic/object-curly-spacing': ['error', 'always', { arraysInObjects: true, objectsInObjects: true }],
            '@stylistic/object-property-newline': ['error', { allowAllPropertiesOnSameLine: true }],
            '@stylistic/one-var-declaration-per-line': ['error', 'always'],
            '@stylistic/operator-linebreak': ['error', 'after', { overrides: { '?': 'before', ':': 'before' } }],
            '@stylistic/padded-blocks': ['error', 'never'],
            '@stylistic/padding-line-between-statements': ['error', { blankLine: 'always', prev: 'import', next: '*' }, { blankLine: 'never', prev: 'import', next: 'import' }],
            '@stylistic/quote-props': ['error', 'as-needed'],
            '@stylistic/quotes': ['error', 'single', { avoidEscape: true, allowTemplateLiterals: false }],
            '@stylistic/rest-spread-spacing': ['error', 'never'],
            '@stylistic/semi': ['error', 'always'],
            '@stylistic/semi-spacing': ['error', { before: false, after: true }],
            '@stylistic/semi-style': ['error', 'last'],
            '@stylistic/space-before-blocks': ['error', 'always'],
            '@stylistic/space-before-function-paren': ['error', { anonymous: 'always', named: 'never', asyncArrow: 'always' }],
            '@stylistic/space-in-parens': ['error', 'never'],
            '@stylistic/space-unary-ops': ['error', { words: true, nonwords: false }],
            '@stylistic/spaced-comment': ['error', 'always', { exceptions: ['-', '+'], markers: ['=', '!'] }],
            '@stylistic/switch-colon-spacing': ['error', { after: true, before: false }],
            '@stylistic/template-curly-spacing': ['error', 'never'],
            '@stylistic/template-tag-spacing': ['error', 'never'],
            '@stylistic/type-annotation-spacing': ['error', { before: true, after: true, overrides: { arrow: { before: true, after: true }, colon: { before: false, after: true } } }],
            '@stylistic/wrap-iife': ['error', 'inside'],
            '@stylistic/yield-star-spacing': ['error', { before: true, after: false }],
        },
    },
];
