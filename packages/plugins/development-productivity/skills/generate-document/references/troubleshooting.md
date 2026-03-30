# Troubleshooting

## PDF generation fails

1. Check if LaTeX is installed: `which xelatex`
2. Try alternative PDF engine: `--pdf-engine=wkhtmltopdf`
3. Install missing LaTeX packages if prompted

## Fonts not rendering correctly

- For XeLaTeX: Use `--variable mainfont="Font Name"` to specify fonts
- Ensure the font is installed on the system

## Tables look wrong

- Ensure consistent column separators in markdown
- Use `--columns=80` to control text wrapping
