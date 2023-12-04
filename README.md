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

This extension is currently under development,
and is not yet available on the Visual Studio Code Marketplace.


## Features

<!-- This section needs to be expanded. -->

* Display alternative text for certain words or patterns,
    without changing the original text.


## Extension Settings

This extension contributes the following settings:

* `visualAlias.patterns`:
    An array of objects of the form
    ```json
    {
        "language": "languageId",
        "patterns": [
            "pattern/replacement",
            ...
        ]
    }
    ```
    
    * The `languageId` can be `*`
        to apply the replacement rules to all languages,
        or can be an array of language IDs.

    * `pattern` is a regular expression,
        and `replacement` is a string.
        Note that special characters in the pattern,
        such as `\`, `/` and `[`, must be escaped,
        so for example, to match `\alpha` in the document,
        the pattern should be `"\\\\alpha/α"`.

    * (Not yet implemented) Instead of a string `"pattern/replacement"`,
        one can also use an object of the form
        ```json
        {
            "pattern": "pattern",
            "replacement": "replacement",
            "style": {
                "color": "#ff0000",
                "fontWeight": "bold",
                ...
            }
        }
        ```
        where the `style` field is optional,
        and applies the specified style to the replacement text.

    The default value is a list of patterns for `latex`.

* `visualAlias.maxLineCount` (default: `10000`):
    The maximum number of lines to process.
    If a document has more lines than this value,
    the extension will not process the document.

* `visualAlias.maxLineLength` (default: `1000`):
    The maximum number of characters in a line to process.


## Usage notes

* When using with LaTeX to replace mathematical symbols,
    using a suitable fallback font with math support,
    such as [JuliaMono](https://github.com/cormullion/juliamono),
    can greatly improve the appearance of the replacement text.
