# SimamaCV
## StandOut to ATS and Recruiters 

SimamaCV is a browser-based, AI powered ,resume tailoring tool that helps you:

- analyze a job description for ATS keywords and gaps
- generate a tailored CV from your saved profile
- export to PDF or DOCX
- create quick job-search links for major job boards

No backend is required. The app rcan run as static files in your browser.
##  Live Demo

[Try SimamaCV](https://tbaraka.github.io/simamaCV/)

## Project structure

```text
simamaCV/
├── index.html
├── styles.css
├── app.js
└── README.md
```
## Installation
```bash
git clone https://github.com/Tbaraka/simamaCV.git
cd simamaCV
```

## Quick start

1. Open `index.html` in your browser.
2. Paste your OpenAI API key in the app and connect.
3. Add a profile, analyze a job description, then generate and export your CV.

## How it works

1. Add profile details (name, role, contact, CV text).
2. Paste a job description in **Analyse JD**.
3. Review match score, matches, and gaps.
4. Use **Generate CV** to create a tailored version.
5. Use **Preview & Export** to:
   - print to PDF
   - download DOCX
   - copy plain text

## Data and privacy

- API key is used in-browser at runtime and is not saved to localStorage.
- Profiles are saved locally in your browser storage.
- CV/job data is sent to OpenAI only when you run analysis or generation.

## Notes

- LinkedIn and some job platforms block automated scraping. This app generates search links instead.
- DOCX export depends on the `docx` CDN script loaded in `index.html`.
- PDF export uses browser print mode.

## Customization

- Model config is in `app.js` (`callGPT` request body).
- Theme variables are in `styles.css` (`:root` CSS variables).
- Search providers are in `generateSearchLinks()` in `app.js`.

## License

MIT
