// ─── STATE ───────────────────────────────────────────────────────────────────
let state = {
  apiKey: '',
  connected: false,
  profiles: [],
  activeProfile: null,
  editingProfileId: null,
  lastJD: '',
  lastRoleOverride: '',
  lastAnalysis: null,
  generatedCV: '',
  generatedCVRaw: ''
};
const PROFILE_STORAGE_KEY = 'simamacv_profiles';
const LEGACY_PROFILE_STORAGE_KEY = 'cvtailor_profiles';

// ─── INIT ─────────────────────────────────────────────────────────────────────
window.addEventListener('load', () => {
  try {
    const saved = localStorage.getItem(PROFILE_STORAGE_KEY) || localStorage.getItem(LEGACY_PROFILE_STORAGE_KEY);
    if (saved) state.profiles = JSON.parse(saved);
  } catch(e) {
  }
  renderProfiles();
});

// ─── API ──────────────────────────────────────────────────────────────────────
function toggleApiVisibility() {
  const input = document.getElementById('apiKey');
  const toggle = document.querySelector('.api-toggle');
  input.type = input.type === 'password' ? 'text' : 'password';
  if (toggle) toggle.textContent = input.type === 'password' ? 'Show' : 'Hide';
}

function connectAPI() {
  const key = document.getElementById('apiKey').value.trim();
  if (!key.startsWith('sk-')) {
    showAlert('analysisOutput', 'API key must start with sk-', 'error');
    return;
  }
  const accepted = confirm('Security reminder: this static app sends your key directly from the browser. Use a backend proxy in production. Continue?');
  if (!accepted) return;
  state.apiKey = key;
  state.connected = true;
  document.getElementById('apiKey').value = '';
  document.getElementById('statusDot').classList.add('connected');
  document.getElementById('statusText').textContent = 'API connected';
}

async function callGPT(systemPrompt, userPrompt) {
  if (!state.connected) throw new Error('Connect your OpenAI API key first.');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${state.apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.4,
      max_tokens: 3000
    })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'API error');
  }
  const data = await res.json();
  return data.choices[0].message.content;
}

async function humanizeCV(cvData, context = {}) {
  const safeCV = normalizeCVData(cvData);
  const systemPrompt = `You are a CV humanizer and editor.

Writing style:
- Write like a human.
- Keep it professional but conversational.
- Don't use em dashes or buzzwords like "streamlined" or "delve into".
- Avoid sounding like a press release.
- Be clear, direct, and natural.

Rules:
- Keep ATS keyword relevance.
- Preserve truthfulness and factual content.
- Do NOT add new jobs, dates, numbers, degrees, certifications, or achievements.
- Do NOT remove important evidence of skills.
- Return valid JSON only, with this exact structure:
{
  "name": "Full Name",
  "contact": "phone | email | linkedin | location",
  "summary": "5-sentence professional summary targeting this role",
  "experience": [
    {
      "title": "Job Title",
      "org": "Organisation",
      "location": "City, Country",
      "dates": "Mon YYYY – Mon YYYY",
      "bullets": ["bullet 1","bullet 2","bullet 3"]
    }
  ],
  "education": [
    { "degree": "Degree Name", "institution": "University", "dates": "YYYY", "notes": "optional" }
  ],
  "skills": [
    { "category": "Category Name", "items": "skill1, skill2, skill3" }
  ],
  "certifications": ["cert1","cert2"]
}`;

  const userPrompt = `Role target: ${context.roleOverride || 'None'}\n\nJob description:\n${context.jd || ''}\n\nAdditional instructions:\n${context.extra || 'None'}\n\nCurrent CV JSON:\n${JSON.stringify(safeCV)}\n\nRewrite the CV to sound more human and polished while preserving facts exactly.`;
  const raw = await callGPT(systemPrompt, userPrompt);
  const clean = raw.replace(/```json|```/g, '').trim();
  return normalizeCVData(JSON.parse(clean));
}

// ─── PROFILES ─────────────────────────────────────────────────────────────────
function saveProfiles() {
  try { localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(state.profiles)); }
  catch(e) { /* silent */ }
}

function renderProfiles() {
  const list = document.getElementById('profileList');
  const sel = document.getElementById('profileSelect');
  list.textContent = '';
  sel.textContent = '';
  const defaultOpt = document.createElement('option');
  defaultOpt.value = '';
  defaultOpt.textContent = 'Select a profile';
  sel.appendChild(defaultOpt);

  if (state.profiles.length === 0) {
    const empty = document.createElement('p');
    empty.style.color = 'var(--muted)';
    empty.style.fontSize = '12px';
    empty.textContent = 'No profiles yet. Add one below.';
    list.appendChild(empty);
    return;
  }

  state.profiles.forEach(p => {
    const card = document.createElement('div');
    card.className = 'profile-card' + (state.activeProfile?.id === p.id ? ' active' : '');

    const info = document.createElement('div');
    info.style.flex = '1';
    info.style.cursor = 'pointer';
    info.addEventListener('click', () => selectProfile(p.id));

    const name = document.createElement('div');
    name.className = 'profile-name';
    name.textContent = p.name || '';
    info.appendChild(name);

    const role = document.createElement('div');
    role.className = 'profile-role';
    role.textContent = p.role || '';
    info.appendChild(role);
    card.appendChild(info);

    const actions = document.createElement('div');
    actions.className = 'profile-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn-icon edit';
    editBtn.type = 'button';
    editBtn.setAttribute('aria-label', 'Edit profile');
    editBtn.title = 'Edit';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => editProfile(p.id));
    actions.appendChild(editBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-icon danger delete';
    deleteBtn.type = 'button';
    deleteBtn.setAttribute('aria-label', 'Delete profile');
    deleteBtn.title = 'Delete';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => deleteProfile(p.id));
    actions.appendChild(deleteBtn);

    card.appendChild(actions);
    list.appendChild(card);

    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.name;
    sel.appendChild(opt);
  });

  sel.value = state.activeProfile?.id || '';
}

function selectProfile(id) {
  state.activeProfile = state.profiles.find(p => p.id === id);
  document.getElementById('profileSelect').value = id;
  renderProfiles();
}

function openProfileModal(editId = null) {
  state.editingProfileId = editId;
  if (editId) {
    const p = state.profiles.find(x => x.id === editId);
    document.getElementById('modalTitle').textContent = 'Edit Profile';
    document.getElementById('pName').value = p.name;
    document.getElementById('pRole').value = p.role;
    document.getElementById('pContact').value = p.contact;
    document.getElementById('pCV').value = p.cv;
  } else {
    document.getElementById('modalTitle').textContent = 'Add Profile';
    ['pName','pRole','pContact','pCV'].forEach(id => document.getElementById(id).value = '');
  }
  document.getElementById('profileModal').classList.add('open');
}

function editProfile(id) { openProfileModal(id); }

function closeProfileModal() {
  document.getElementById('profileModal').classList.remove('open');
  state.editingProfileId = null;
}

function openCVEditModal() {
  if (!state.generatedCV) {
    showAlert('generateOutput', 'Generate a CV first before editing.', 'error');
    return;
  }
  const input = document.getElementById('cvEditJson');
  const err = document.getElementById('cvEditError');
  if (input) input.value = JSON.stringify(state.generatedCV, null, 2);
  if (err) err.textContent = '';
  document.getElementById('cvEditModal').classList.add('open');
}

function closeCVEditModal() {
  document.getElementById('cvEditModal').classList.remove('open');
}

function normalizeCVData(data) {
  const cv = data && typeof data === 'object' ? data : {};
  return {
    name: String(cv.name || '').trim(),
    contact: String(cv.contact || '').trim(),
    summary: String(cv.summary || '').trim(),
    experience: Array.isArray(cv.experience) ? cv.experience.map(e => ({
      title: String(e?.title || '').trim(),
      org: String(e?.org || '').trim(),
      location: String(e?.location || '').trim(),
      dates: String(e?.dates || '').trim(),
      bullets: Array.isArray(e?.bullets) ? e.bullets.map(b => String(b || '').trim()).filter(Boolean) : []
    })) : [],
    education: Array.isArray(cv.education) ? cv.education.map(e => ({
      degree: String(e?.degree || '').trim(),
      institution: String(e?.institution || '').trim(),
      dates: String(e?.dates || '').trim(),
      notes: String(e?.notes || '').trim()
    })) : [],
    skills: Array.isArray(cv.skills) ? cv.skills.map(s => ({
      category: String(s?.category || '').trim(),
      items: String(s?.items || '').trim()
    })) : [],
    certifications: Array.isArray(cv.certifications) ? cv.certifications.map(c => String(c || '').trim()).filter(Boolean) : []
  };
}

function saveCVEdits() {
  const raw = document.getElementById('cvEditJson').value.trim();
  const errContainer = document.getElementById('cvEditError');
  if (errContainer) errContainer.textContent = '';
  if (!raw) {
    showAlert('cvEditError', 'Paste valid CV JSON before saving.', 'error');
    return;
  }
  try {
    const parsed = JSON.parse(raw);
    const normalized = normalizeCVData(parsed);
    if (!normalized.name || !normalized.summary) {
      showAlert('cvEditError', 'Please include at least `name` and `summary`.', 'error');
      return;
    }
    state.generatedCV = normalized;
    state.generatedCVRaw = JSON.stringify(normalized);
    renderCVPreview(normalized);
    closeCVEditModal();
    showAlert('generateOutput', 'CV updated with your manual edits.', 'success');
  } catch (e) {
    showAlert('cvEditError', `Invalid JSON: ${e.message}`, 'error');
  }
}

function saveProfile() {
  const name = document.getElementById('pName').value.trim();
  const role = document.getElementById('pRole').value.trim();
  const contact = document.getElementById('pContact').value.trim();
  const cv = document.getElementById('pCV').value.trim();
  if (!name || !cv) { alert('Name and CV text are required.'); return; }

  if (state.editingProfileId) {
    const idx = state.profiles.findIndex(p => p.id === state.editingProfileId);
    state.profiles[idx] = { ...state.profiles[idx], name, role, contact, cv };
    if (state.activeProfile?.id === state.editingProfileId) {
      state.activeProfile = state.profiles[idx];
    }
  } else {
    const newProfile = { id: Date.now().toString(), name, role, contact, cv };
    state.profiles.push(newProfile);
    state.activeProfile = newProfile;
  }
  saveProfiles();
  renderProfiles();
  closeProfileModal();
}

function deleteProfile(id) {
  if (!confirm('Delete this profile?')) return;
  state.profiles = state.profiles.filter(p => p.id !== id);
  if (state.activeProfile?.id === id) state.activeProfile = null;
  saveProfiles();
  renderProfiles();
}

// ─── TABS ─────────────────────────────────────────────────────────────────────
function switchTab(evt, name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  if (evt?.currentTarget) evt.currentTarget.classList.add('active');
  document.getElementById('tab-' + name).classList.add('active');
}

// ─── ANALYSE JD ───────────────────────────────────────────────────────────────
async function analyseJD() {
  const jd = document.getElementById('jdInput').value.trim();
  const profileId = document.getElementById('profileSelect').value;
  const roleOverride = document.getElementById('roleOverride').value.trim();
  if (!jd) { showAlert('analysisOutput', 'Paste a job description first.', 'error'); return; }
  if (!state.connected) { showAlert('analysisOutput', 'Connect your OpenAI API key first.', 'error'); return; }

  const profile = state.profiles.find(p => p.id === profileId) || state.activeProfile;
  state.lastJD = jd;
  state.lastRoleOverride = roleOverride;
  if (profile) state.activeProfile = profile;

  const btn = document.getElementById('analyseBtn');
  btn.disabled = true;
  document.getElementById('analysisOutput').innerHTML = '<div class="loading"><div class="spinner"></div>Analysing job description...</div>';

  try {
    const systemPrompt = `You are an expert ATS and CV analyst. Analyse a job description and return ONLY valid JSON with this exact structure:
{
  "title": "job title",
  "company": "company name or Unknown",
  "level": "entry/mid/senior",
  "keywords": ["keyword1","keyword2",...],
  "requirements": ["req1","req2",...],
  "mustHave": ["critical skill 1","critical skill 2",...],
  "niceToHave": ["optional skill 1",...],
  "atsScore": 0,
  "matches": ["matched skill/exp from CV",...],
  "gaps": ["missing skill/exp",...],
  "recommendation": "2-3 sentence honest assessment"
}

SCORING RUBRIC (required):
- Do NOT use a fixed/default score. Compute atsScore from evidence each time.
- atsScore must be an integer from 0 to 100.
- If candidate CV is provided, calculate:
  1) Must-have coverage (40 points):
     - score = 40 * (must-have items matched in CV / total must-have items).
  2) Core requirements coverage (30 points):
     - score = 30 * (requirements matched in CV / total requirements).
  3) Keyword alignment (20 points):
     - score = 20 * (JD keywords present in CV / total JD keywords).
  4) Seniority/role alignment (10 points):
     - 10 = clear alignment, 6 = partial alignment, 2 = weak alignment, 0 = mismatch.
  5) atsScore = rounded sum of the four components above.
- If no CV is provided, set atsScore to 0 and leave matches/gaps as JD-only observations.
- Base matches and gaps strictly on explicit text evidence. Do not invent candidate experience.
- Keep requirements, mustHave, and keywords concise and deduplicated.`;
    const userPrompt = `${roleOverride ? `Target role override: ${roleOverride}\n\n` : ''}${profile ? `Candidate CV:\n${profile.cv}\n\n` : ''}Job Description:\n${jd}`;
    const raw = await callGPT(systemPrompt, userPrompt);
    const clean = raw.replace(/```json|```/g, '').trim();
    state.lastAnalysis = JSON.parse(clean);
    renderAnalysis(state.lastAnalysis);
  } catch(e) {
    showAlert('analysisOutput', `Error: ${e.message}`, 'error');
  }
  btn.disabled = false;
}

function renderAnalysis(a) {
  const score = Math.max(0, Math.min(100, Number(a?.atsScore) || 0));
  const scoreColor = score >= 80 ? '#22c55e' : score >= 65 ? '#f59e0b' : '#ef4444';
  const label = score >= 80 ? 'Strong' : score >= 65 ? 'Good' : 'Needs work';
  const title = `${escapeHtml(a?.title || '')}${a?.company && a.company !== 'Unknown' ? ' · ' + escapeHtml(a.company) : ''}`;

  document.getElementById('analysisOutput').innerHTML = `
    <div class="analysis-card">
      <h4 style="margin-bottom:6px">ATS Match Score</h4>
      <div class="score-number" style="color:${scoreColor}">${score}%</div>
      <div class="score-label">${label}</div>
      <div style="font-size:12px;color:var(--muted);margin-top:4px">${title}</div>
      <div style="margin-top:12px;font-size:12px;color:var(--text);line-height:1.6">${escapeHtml(a?.recommendation || '')}</div>
      <div class="tag-list" style="margin-top:10px">
        ${(a.keywords||[]).slice(0, 12).map(k => `<span class="tag keyword">${escapeHtml(String(k))}</span>`).join('')}
      </div>
      <div style="margin-top:8px;font-size:12px;color:var(--muted)">
        Matches: ${(a.matches||[]).length} · Gaps: ${(a.gaps||[]).length} · Level: ${escapeHtml(a?.level || 'Unknown')}
      </div>
    </div>
    <div class="alert success" style="margin-top:8px">Analysis complete. Switch to the <strong>Generate CV</strong> tab to create your tailored resume.</div>`;
}

// ─── GENERATE CV ──────────────────────────────────────────────────────────────
async function generateCV() {
  if (!state.lastJD) { showAlert('generateOutput', 'Run an analysis first.', 'error'); return; }
  if (!state.activeProfile) { showAlert('generateOutput', 'Select a profile first.', 'error'); return; }
  if (!state.connected) { showAlert('generateOutput', 'Connect your OpenAI API key first.', 'error'); return; }

  const extra = document.getElementById('extraInstructions').value.trim();
  const useHumanizer = document.getElementById('humanizeTone')?.checked ?? true;
  const btn = document.getElementById('generateBtn');
  btn.disabled = true;
  document.getElementById('generateOutput').innerHTML = '<div class="loading"><div class="spinner"></div>Generating tailored CV...</div>';

  try {
    const systemPrompt = `You are an expert ATS-optimised CV writer. Write a tailored, professional CV in Jake Resume format.

RULES:

- Use ONLY information from the candidate's CV. Never invent experience.
- Rewrite bullets using action verbs and impact language.
- Mirror the job description's exact keywords naturally.
- If a target role override is provided, optimise wording for that role title.
- Use the analysis guidance (must-have, gaps, recommendation) to prioritise what to emphasise.
- Output structured JSON only — no markdown, no preamble.
- Keep it honest, professional, and ATS-friendly.

Output this exact JSON:
{
  "name": "Full Name",
  "contact": "phone | email | linkedin | location",
  "summary": "5-sentence professional summary targeting this role",
  "experience": [
    {
      "title": "Job Title",
      "org": "Organisation",
      "location": "City, Country",
      "dates": "Mon YYYY – Mon YYYY",
      "bullets": ["bullet 1","bullet 2","bullet 3"]
    }
  ],
  "education": [
    { "degree": "Degree Name", "institution": "University", "dates": "YYYY", "notes": "optional" }
  ],
  "skills": [
    { "category": "Category Name", "items": "skill1, skill2, skill3" }
  ],
  "certifications": ["cert1","cert2"]
}`;

    const analysisHint = state.lastAnalysis ? JSON.stringify({
      title: state.lastAnalysis.title,
      level: state.lastAnalysis.level,
      keywords: state.lastAnalysis.keywords,
      mustHave: state.lastAnalysis.mustHave,
      requirements: state.lastAnalysis.requirements,
      gaps: state.lastAnalysis.gaps,
      recommendation: state.lastAnalysis.recommendation
    }) : '{}';

    const userPrompt = `Candidate CV:\n${state.activeProfile.cv}\n\nContact: ${state.activeProfile.contact}\n\n${state.lastRoleOverride ? `Target role override: ${state.lastRoleOverride}\n\n` : ''}Job Description:\n${state.lastJD}\n\nAnalysis guidance JSON:\n${analysisHint}\n\nUse this guidance to improve ATS alignment, but never add experience not present in Candidate CV.\n\n${extra ? 'Additional instructions: ' + extra : ''}`;

    const raw = await callGPT(systemPrompt, userPrompt);
    const clean = raw.replace(/```json|```/g, '').trim();
    let cvData = normalizeCVData(JSON.parse(clean));
    let humanizerWarning = '';

    if (useHumanizer) {
      document.getElementById('generateOutput').innerHTML = '<div class="loading"><div class="spinner"></div>Humanizing CV tone while preserving facts...</div>';
      try {
        cvData = await humanizeCV(cvData, {
          jd: state.lastJD,
          roleOverride: state.lastRoleOverride,
          extra
        });
      } catch (humanizeError) {
        humanizerWarning = `<div class="alert info" style="margin-top:8px">Humanizer was skipped: ${escapeHtml(humanizeError.message || 'Unknown error')}</div>`;
      }
    }

    state.generatedCV = cvData;
    state.generatedCVRaw = JSON.stringify(cvData);

    renderCVPreview(cvData);
    document.getElementById('generateOutput').innerHTML = `<div class="alert success">CV generated. Switch to <strong>Preview & Export</strong> to download.</div>${humanizerWarning}`;
    document.getElementById('exportButtons').style.display = 'flex';
  } catch(e) {
    showAlert('generateOutput', `Error: ${e.message}`, 'error');
  }
  btn.disabled = false;
}

function renderCVPreview(cv) {
  const experience = Array.isArray(cv.experience) ? cv.experience : [];
  const skills = Array.isArray(cv.skills) ? cv.skills : [];
  const education = Array.isArray(cv.education) ? cv.education : [];
  const certifications = Array.isArray(cv.certifications) ? cv.certifications : [];

  const expHTML = experience.map(e => `
    <div class="cv-role-row"><span>${escapeHtml(e.title || '')}</span><span>${escapeHtml(e.dates || '')}</span></div>
    <div class="cv-sub-row"><span>${escapeHtml(e.org || '')}</span><span>${escapeHtml(e.location || '')}</span></div>
    <ul>${(Array.isArray(e.bullets) ? e.bullets : []).map(b => `<li>${escapeHtml(String(b))}</li>`).join('')}</ul>
  `).join('');

  const skillsHTML = skills.map(s =>
    `<div class="cv-skills-line"><strong>${escapeHtml(s.category || '')}:</strong> ${escapeHtml(s.items || '')}</div>`
  ).join('');

  const eduHTML = education.map(e =>
    `<div class="cv-role-row"><span>${escapeHtml(e.degree || '')}</span><span>${escapeHtml(e.dates || '')}</span></div>
     <div style="font-style:italic;font-size:9.5pt;color:#444">${escapeHtml(e.institution || '')}</div>
     ${e.notes ? `<div style="font-size:9pt;color:#555">${escapeHtml(e.notes)}</div>` : ''}`
  ).join('<div style="margin-top:6px"></div>');

  const certHTML = certifications.length
    ? `<div class="cv-section-title">Certifications</div>
       <ul>${certifications.map(c => `<li>${escapeHtml(String(c))}</li>`).join('')}</ul>`
    : '';

  document.getElementById('cvPreviewContainer').innerHTML = `
    <div class="cv-preview" id="cvPreview">
      <div class="cv-name">${escapeHtml(cv.name || '')}</div>
      <div class="cv-contact">${escapeHtml(cv.contact || '')}</div>
      <div class="cv-section-title">Professional Summary</div>
      <p>${escapeHtml(cv.summary || '')}</p>
      <div class="cv-section-title">Experience</div>
      ${expHTML}
      <div class="cv-section-title">Technical Skills</div>
      ${skillsHTML}
      <div class="cv-section-title">Education</div>
      ${eduHTML}
      ${certHTML}
    </div>`;

  // Switch to preview tab
  document.querySelectorAll('.tab').forEach((t,i) => t.classList.toggle('active', i===2));
  document.querySelectorAll('.panel').forEach((p,i) => p.classList.toggle('active', i===2));
}

// ─── EXPORT ───────────────────────────────────────────────────────────────────
function downloadPDF() {
  const preview = document.getElementById('cvPreview');
  if (!preview) {
    showAlert('generateOutput', 'Generate a CV first before exporting to PDF.', 'error');
    return;
  }

  const body = document.body;
  const clearPrintMode = () => body.classList.remove('print-cv-only');
  body.classList.add('print-cv-only');
  window.addEventListener('afterprint', clearPrintMode, { once: true });
  setTimeout(clearPrintMode, 4000);
  window.print();
}

async function downloadDOCX() {
  if (!state.generatedCV) { alert('Generate a CV first.'); return; }
  if (!window.docx) {
    showAlert('generateOutput', 'DOCX library failed to load. Refresh and try again.', 'error');
    return;
  }
  const cv = state.generatedCV;
  const experience = Array.isArray(cv.experience) ? cv.experience : [];
  const skills = Array.isArray(cv.skills) ? cv.skills : [];
  const education = Array.isArray(cv.education) ? cv.education : [];
  const certifications = Array.isArray(cv.certifications) ? cv.certifications : [];
  const safeName = String(cv.name || 'Candidate').trim() || 'Candidate';
  const safeContact = String(cv.contact || '');
  const safeSummary = String(cv.summary || '');

  const { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle, LevelFormat, TabStopType } = docx;
  const BN = { reference: "bullets", level: 0 };
  const FONT = "Arial";
  const BS = 18; // body size in half-points

  function sH(text) {
    return new Paragraph({
      spacing: { before: 160, after: 50 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000", space: 1 } },
      children: [new TextRun({ text, font: FONT, size: 20, bold: true })]
    });
  }
  function rR(l, r) {
    return new Paragraph({
      spacing: { before: 100, after: 0 },
      tabStops: [{ type: TabStopType.RIGHT, position: 9200 }],
      children: [new TextRun({ text: l, font: FONT, size: BS, bold: true }), new TextRun({ text: "\t" }), new TextRun({ text: r, font: FONT, size: BS })]
    });
  }
  function sR(l, r) {
    return new Paragraph({
      spacing: { before: 0, after: 0 },
      tabStops: [{ type: TabStopType.RIGHT, position: 9200 }],
      children: [new TextRun({ text: l, font: FONT, size: BS, italics: true, bold: true }), new TextRun({ text: "\t" }), new TextRun({ text: r, font: FONT, size: BS })]
    });
  }
  function bul(text) {
    return new Paragraph({ numbering: BN, spacing: { before: 0, after: 0 }, children: [new TextRun({ text, font: FONT, size: BS })] });
  }
  function skL(cat, items) {
    return new Paragraph({
      spacing: { before: 30, after: 0 },
      children: [new TextRun({ text: cat + ": ", font: FONT, size: BS, bold: true }), new TextRun({ text: items, font: FONT, size: BS })]
    });
  }

  const children = [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 50 }, children: [new TextRun({ text: safeName, font: FONT, size: 28, bold: true })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 0 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" } }, children: [new TextRun({ text: safeContact, font: FONT, size: BS })] }),
    sH("Professional Summary"),
    new Paragraph({ spacing: { before: 50, after: 0 }, children: [new TextRun({ text: safeSummary, font: FONT, size: BS })] }),
    sH("Experience"),
    ...experience.flatMap(e => {
      const bullets = Array.isArray(e.bullets) ? e.bullets : [];
      return [rR(String(e.title || ''), String(e.dates || '')), sR(String(e.org || ''), String(e.location || '')), ...bullets.map(b => bul(String(b)))];
    }),
    sH("Technical Skills"),
    ...skills.map(s => skL(String(s.category || ''), String(s.items || ''))),
    sH("Education"),
    ...education.flatMap(e => [
      rR(String(e.degree || ''), String(e.dates || '')),
      new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: String(e.institution || ''), font: FONT, size: BS, italics: true })] }),
      ...(e.notes ? [new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: String(e.notes), font: FONT, size: BS })] })] : [])
    ]),
    ...(certifications.length ? [sH("Certifications"), ...certifications.map(c => bul(String(c)))] : [])
  ];

  const docObj = new Document({
    numbering: { config: [{ reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 200 } } } }] }] },
    sections: [{ properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 720, right: 1080, bottom: 720, left: 1080 } } }, children }]
  });

  const buf = await Packer.toBlob(docObj);
  const url = URL.createObjectURL(buf);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeName.replace(/[^\w.-]+/g, '_')}_CV.docx`;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function copyCV() {
  if (!state.generatedCV) return;
  const cv = state.generatedCV;
  let text = `${cv.name}\n${cv.contact}\n\nSUMMARY\n${cv.summary}\n\nEXPERIENCE\n`;
  cv.experience.forEach(e => {
    text += `\n${e.title} | ${e.org} | ${e.dates}\n`;
    e.bullets.forEach(b => text += `• ${b}\n`);
  });
  text += '\nSKILLS\n';
  cv.skills.forEach(s => text += `${s.category}: ${s.items}\n`);
  navigator.clipboard.writeText(text).then(() => {
    showAlert('generateOutput', 'CV copied to clipboard.', 'success');
  });
}

// ─── SEARCH ───────────────────────────────────────────────────────────────────
function generateSearchLinks() {
  const kw = document.getElementById('searchKeywords').value.trim();
  const loc = document.getElementById('searchLocation').value.trim();
  const level = document.getElementById('searchLevel').value;
  if (!kw) { showAlert('searchOutput', 'Enter keywords first.', 'error'); return; }

  const encode = s => encodeURIComponent(s);
  const liBase = 'https://www.linkedin.com/jobs/search/?';
  const indeedBase = 'https://www.indeed.com/jobs?';
  const glassdoorBase = 'https://www.glassdoor.com/Job/jobs.htm?';

  const liParams = new URLSearchParams({ keywords: kw, ...(loc && { location: loc }), ...(level && { f_E: level }), f_TPR: 'r604800' });
  const indeedParams = new URLSearchParams({ q: kw, ...(loc && { l: loc }), fromage: '7' });
  const glassdoorParams = new URLSearchParams({ sc_keyword: kw, ...(loc && { locT: 'C', locId: loc }) });

  document.getElementById('searchOutput').innerHTML = `
    <div style="margin-top:16px">
      <div style="font-size:12px;color:var(--muted);margin-bottom:10px">Results filtered for past 7 days. Click to open in a new tab.</div>
      <div class="search-links">
        <a href="${liBase}${liParams}" target="_blank" rel="noopener noreferrer" class="search-link">
          <div><div class="link-label"><span class="source-badge source-linkedin"></span>LinkedIn Jobs</div><div class="link-desc">${escapeHtml(kw)}${loc ? ' | ' + escapeHtml(loc) : ''} | Past 7 days</div></div>
          <span style="color:var(--muted)">Open</span>
        </a>
        <a href="${indeedBase}${indeedParams}" target="_blank" rel="noopener noreferrer" class="search-link">
          <div><div class="link-label"><span class="source-badge source-indeed"></span>Indeed</div><div class="link-desc">${escapeHtml(kw)}${loc ? ' | ' + escapeHtml(loc) : ''} | Past 7 days</div></div>
          <span style="color:var(--muted)">Open</span>
        </a>
        <a href="${glassdoorBase}${glassdoorParams}" target="_blank" rel="noopener noreferrer" class="search-link">
          <div><div class="link-label"><span class="source-badge source-glassdoor"></span>Glassdoor</div><div class="link-desc">${escapeHtml(kw)}${loc ? ' | ' + escapeHtml(loc) : ''}</div></div>
          <span style="color:var(--muted)">Open</span>
        </a>
        <a href="https://www.bayt.com/en/international/jobs/${encode(kw.toLowerCase().replace(/\s+/g,'-'))}-jobs/" target="_blank" rel="noopener noreferrer" class="search-link">
          <div><div class="link-label"><span class="source-badge source-bayt"></span>Bayt.com</div><div class="link-desc">Middle East specialist job board | ${escapeHtml(kw)}</div></div>
          <span style="color:var(--muted)">Open</span>
        </a>
        <a href="https://gulftalent.com/jobs/search?term=${encode(kw)}${loc ? '&location=' + encode(loc) : ''}" target="_blank" rel="noopener noreferrer" class="search-link">
          <div><div class="link-label"><span class="source-badge source-gulftalent"></span>GulfTalent</div><div class="link-desc">Gulf region specialist | ${escapeHtml(kw)}${loc ? ' | ' + escapeHtml(loc) : ''}</div></div>
          <span style="color:var(--muted)">Open</span>
        </a>
      </div>
    </div>`;
}

// ─── UTILS ────────────────────────────────────────────────────────────────────
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showAlert(containerId, message, type) {
  const prefixes = { error: '[Error]', success: '[Success]', info: '[Info]' };
  const container = document.getElementById(containerId);
  container.textContent = '';
  const alert = document.createElement('div');
  alert.className = `alert ${type}`;
  alert.textContent = `${prefixes[type] || '[Info]'} ${String(message)}`;
  container.appendChild(alert);
}
