# @bytestruct/foundry-hbslint

Handlebars linter for enforcing unofficial Foundry VTT-specific code style conventions.

## Installation

```sh
npm install --save-dev @bytestruct/foundry-hbslint
```

In `hbslint.config.mjs`:

```js
export default {
  rules: {
    indentation: ["error", { blockDepth: false, size: 4, style: "space" }],
    "line-length": ["warn", { max: 120 }],
    "mustache-spacing": "error",
    "quote-style": ["error", { style: "double" }]
  }
};
```

## Usage

```sh
hbslint "templates/**/*.hbs"
hbslint "templates/**/*.hbs" --config path/to/hbslint.config.mjs
hbslint "templates/**/*.hbs" --max-warnings 0
```

## Rules

### `indentation`

Requires content inside block helpers to be indented at the same level as the opening tag.
Set `blockDepth: true` to add one additional indent level per nesting depth.

```hbs
{{! Incorrect }}
<ul>
    {{#if condition}}
        <li>foo</li>
    {{/if}}
</ul>

{{! Correct }}
<ul>
    {{#if condition}}
    <li>foo</li>
    {{/if}}
</ul>
```

---

### `line-length`

Enforces a maximum line length across the template.

---

### `mustache-spacing`

Requires consistent spacing inside `{{ }}` delimiters based on node type.
Expressions require spaces; block open/close tags and else tags do not; partial statements require a space after `>`.

```hbs
{{! Incorrect }}
{{foo}}
{{#if condition}}{{/if}}
{{>partial}}
{{ else }}

{{! Correct }}
{{ foo }}
{{#if condition}}{{/if}}
{{> partial }}
{{else}}
```

---

### `quote-style`

Requires consistent quote style for string literals in expressions.

```hbs
{{! Incorrect }}
{{foo bar='baz'}}

{{! Correct }}
{{foo bar="baz"}}
```
