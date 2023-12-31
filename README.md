# Visual Alias

**Visual Alias** is a Visual Studio Code extension
that displays alternative text for certain words or patterns,
without changing the original text.
For example, in LaTeX, the following code

```latex
\begin{equation}
    G_{\mu \nu} + \Lambda g_{\mu \nu} = \frac{8 \pi G}{c^4} T_{\mu \nu}
\end{equation}
```

can be configured to be displayed as

```latex
\begin{equation}
    G_{μ ν} + Λ g_{μ ν} = \frac{8 π G}{c^4} T_{μ ν}
\end{equation}
```

The original code for each symbol is revealed
when the caret touches the symbol.

The functionality of this extension is similar to that of the
[Prettify Symbols Mode](https://github.com/siegebell/vsc-prettify-symbols-mode) and
[Symbol Masks](https://github.com/stevengeeky/symbol-masks)
extensions, but they both seem to be unmaintained,
and are no longer working properly,
although a [new version](https://github.com/ctf0/symbol-masks)
of Symbol Masks is working.
This extension is intended to be an alternative for these extensions.


## Features

<!-- This section needs to be expanded. -->

* Display alternative text for certain words or patterns,
    without changing the original text.


## Extension Settings

This extension contributes the following settings:

* `visualAlias.patterns`:
    An array of pattern groups. For example,
    a pattern group can be
    ```json
    {
        "language": "latex",
        "defaultSuffix": "(?![a-zA-Z])",
        "patterns": [
            "\\\\alpha/α",
            // ...
        ]
    }
    ```

    * The `language` field specifies the language ID
        that the pattern group applies to.
        It can be set to `"*"`
        to apply the replacement rules to all languages,
        or can be an array of language IDs.

    * The optional `defaultSuffix` field specifies a regular expression
        that is appended to each pattern.
        Similarly, the optional `defaultPrefix` field can be used
        to specify a regular expression that is prepended to each pattern.

    * The `patterns` field
        is an array of patterns to be replaced.
        Each pattern can be a string of the form `"pattern/replacement"`,
        where `pattern` is a regular expression,
        and `replacement` is a string.
        Note that special characters in the pattern,
        such as `\`, `/` and `[`, must be escaped,
        so for example, to match `\alpha` in the document,
        the pattern should be `"\\\\alpha/α"`.
        One can also use `"/pattern/replacement"`
        to disable the default prefix and suffix.

    * Instead of a string `"pattern/replacement"`,
        a pattern can also be an object of the form
        ```json
        {
            "pattern": "pattern",
            "replacement": "replacement",
            "color": "#ff0000",
            "fontWeight": "bold",
            // ...
        }
        ```
        which can apply specified styles to the replacement text.
        The supported styles are
        `backgroundColor`, `border`, `color`,
        `fontFamily`, `fontSize`, `fontStyle`, `fontWeight`, `textDecoration`.

    * Additionally, the optional `defaultStyle` field can be used
        to specify a default style for all patterns in the group.
        The default style is overridden by the styles specified
        in the individual patterns.

    The default value is a list of patterns for `latex`.

* `visualAlias.maxLineCount` (default: `10000`):
    The maximum number of lines to process.
    If a document has more lines than this value,
    the extension will not process the document.

* `visualAlias.maxLineLength` (default: `1000`):
    The maximum number of characters in a line to process.


## Usage notes

* When using with LaTeX to replace mathematical symbols,
    using a suitable font with math support,
    such as [JuliaMono](https://github.com/cormullion/juliamono),
    either as a fallback font or in the `fontFamily` setting,
    can greatly improve the appearance of the replacement text.
