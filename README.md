# ✦ CV Tailor — AI-Powered Resume Generator

> Paste a job description. Select your profile. Get a tailored, ATS-optimised CV in seconds.

![CV Tailor Screenshot](https://img.shields.io/badge/status-active-22c55e?style=flat-square) ![License](https://img.shields.io/badge/license-MIT-6c63ff?style=flat-square) ![OpenAI](https://img.shields.io/badge/powered%20by-GPT--4%20Turbo-black?style=flat-square)

---

## What it does

CV Tailor is a single-file HTML application that uses the OpenAI API to:

- **Analyse any job description** — extracts ATS keywords, requirements, seniority level, and must-have skills
- **Score your CV against the JD** — shows an ATS match percentage with matched skills and gaps
- **Generate a tailored CV** — rewrites your experience in Jake Resume format, mirroring the JD's language
- **Export as PDF or DOCX** — download a professional, formatted resume instantly
- **Generate job search links** — opens pre-filtered searches on LinkedIn, Indeed, Glassdoor, Bayt, and GulfTalent
- **Manage multiple profiles** — store different CVs for different people or career directions

---

## Live Demo

If hosted on GitHub Pages, the tool runs directly in the browser. No server, no database, no backend.

**[Open CV Tailor →](https://yourusername.github.io/cv-tailor/)**

---

## Quick Start

### Option 1 — Run locally (fastest)

```bash
# Clone the repo
git clone https://github.com/yourusername/cv-tailor.git

# Open in browser — no server needed
open cv-tailor/index.html
```

### Option 2 — GitHub Pages (share with others)

1. Fork this repo
2. Go to **Settings → Pages**
3. Set source to **main branch, root folder**
4. Your tool is live at `https://yourusername.github.io/cv-tailor/`

---

## Setup

### You need an OpenAI API key

1. Go to [platform.openai.com](https://platform.openai.com)
2. Create an account and add billing
3. Generate an API key under **API Keys**
4. Paste it into the CV Tailor app when prompted

> **Your API key is never stored in the code.** It lives only in your browser session and is cleared when you close the tab.

### Cost

CV Tailor uses **GPT-4 Turbo**. Each CV generation call costs approximately **$0.02–0.06 USD** depending on CV length. For regular use, budget $2–5/month.

---

## How to use

### 1. Connect your API key
Paste your `sk-...` key in the sidebar and click **Connect**.

### 2. Add your profile
Click **+ Add Profile** and paste:
- Your full name
- Target role / industry
- Contact details (phone, email, LinkedIn, location)
- Your full CV text (copy-paste from Word or PDF)

Profiles are saved to **localStorage** — they persist between sessions in your browser.

### 3. Analyse a job description
- Go to the **Analyse JD** tab
- Paste the full job description
- Select your profile
- Click **Analyse JD**

You'll see:
- ATS match score (0–100%)
- Matched skills from your CV
- Gaps and missing keywords
- Top ATS keywords to include
- Honest recommendation

### 4. Generate your tailored CV
- Switch to **Generate CV**
- Add any extra instructions (optional)
- Click **Generate Tailored CV**

The AI rewrites your experience using the JD's exact vocabulary while staying truthful to your actual background.

### 5. Export
- Switch to **Preview & Export**
- **Download PDF** — uses your browser's print-to-PDF (best for sharing)
- **Download DOCX** — generates a Word document in Jake Resume format
- **Copy Text** — copies plain text to clipboard

---

## Features

| Feature | Details |
|---|---|
| Multiple profiles | Add, edit, delete — unlimited profiles |
| ATS analysis | Score, keywords, matches, gaps |
| CV generation | Jake Resume format, ATS-optimised |
| PDF export | Browser print-to-PDF, clean layout |
| DOCX export | Real Word document using docx.js |
| Job search links | LinkedIn, Indeed, Glassdoor, Bayt, GulfTalent |
| localStorage | Profiles persist between sessions |
| Zero backend | Pure HTML + JS, runs anywhere |
| Privacy-first | API key never stored, profiles only in your browser |

---

## Jake Resume Format

Generated CVs follow the Jake Resume template — a clean, ATS-friendly single-column format widely used by engineers and professionals:

```
FULL NAME
phone | email | linkedin | location
─────────────────────────────────────────
PROFESSIONAL SUMMARY
...

EXPERIENCE
Job Title                              Date – Date
Organisation                           Location
• Achievement-led bullet point
• Achievement-led bullet point

TECHNICAL SKILLS
Category: skill1, skill2, skill3

EDUCATION
Degree                                 Year
Institution

CERTIFICATIONS
• Certification name
```

---

## Project Structure

```
cv-tailor/
├── index.html     # Entire application — one file
└── README.md      # This file
```

That's it. One HTML file. No dependencies to install, no build process, no Node.js required.

The only external dependency is **docx.js** loaded from a CDN for DOCX generation.

---

## Privacy & Security

- **Your API key** is typed into the browser each session and held only in JavaScript memory. It is never written to localStorage, never sent anywhere except directly to OpenAI's API.
- **Your CV data** is stored in your browser's localStorage under the key `cvtailor_profiles`. It never leaves your device except when you click Generate (at which point it's sent to OpenAI to generate your CV).
- **No analytics, no tracking, no server.** This is a static HTML file.

> ⚠️ Do not publish your OpenAI API key in any file in this repo. The app asks for it at runtime — it is never hardcoded.

---

## Customisation

### Change the AI model
In `index.html`, find:
```javascript
model: 'gpt-4-turbo',
```
Change to:
- `gpt-4o` — faster and slightly cheaper than gpt-4-turbo
- `gpt-3.5-turbo` — much cheaper, lower quality output

### Change the colour scheme
CSS variables are at the top of the `<style>` block:
```css
:root {
  --accent: #6c63ff;   /* Purple — change to your brand colour */
  --bg: #0f1117;       /* Dark background */
  --surface: #1a1d27;  /* Card background */
}
```

### Add more job boards to search
In the `generateSearchLinks()` function, add a new `<a>` block following the same pattern.

---

## Limitations

**What this tool does well:**
- Tailoring CV language to a specific JD
- ATS keyword matching and gap analysis
- Fast export in professional formats

**What this tool cannot do:**
- Search LinkedIn automatically (LinkedIn blocks all scraping)
- Access the internet or verify company information
- Invent experience you don't have — it only rewrites what you provide
- Replace a human career counsellor for complex career pivots

---

## Contributing

Pull requests welcome. If you find a bug or have a feature idea:

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/your-idea`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push: `git push origin feature/your-idea`
5. Open a Pull Request

---

## License

MIT License — free to use, modify, and distribute. Attribution appreciated but not required.

---

## Built with

- [OpenAI GPT-4 Turbo](https://platform.openai.com) — CV analysis and generation
- [docx.js](https://docx.js.org) — DOCX file generation
- Vanilla HTML, CSS, JavaScript — no frameworks, no build tools

---

*CV Tailor was built to solve a real problem: spending hours manually tailoring CVs for every application. The hard part isn't writing — it's knowing exactly which words to use. This tool handles that.*
