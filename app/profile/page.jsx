"use client";

import Link from "next/link";
import { useRef, useState } from "react";

/* ═══════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════ */

function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function fmtCurrency(amount, currency = "USD", locale = "en-US") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2
  }).format(amount);
}

function fmtDateTime(d) {
  return new Date(d).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

/* ═══════════════════════════════════════════════
   EMPLOYEE / OFFER / EQUITY DATA
   ═══════════════════════════════════════════════ */

const EMPLOYEE = {
  name: "Aiman Miller",
  title: "Senior Product Designer",
  id: "E-942",
  department: "Product Team",
  manager: "Sarah Chen",
  location: "San Francisco, CA",
  initials: "AM"
};

const EMP = {
  employee_id: "SW01083541",
  full_name: "Aiman Miller",
  address: "No. 170, Taman Indah Baru 2, 71010, Port Dickson, Negeri Sembilan",
  country: "MY",
  location_city: "Cyberjaya",
  role_title: "Software Engineer",
  department: "Engineering"
};

const OFFER = {
  salary_monthly: 4500,
  start_date: "2026-02-10",
  employment_type: "FULL_TIME",
  probation_months: 3,
  offer_accepted: true
};

const EQUITY = {
  grant_date: "2026-02-10",
  total_options: 1000,
  strike_price: 1.5
};

const EMPLOYER = {
  name: "Deriv (Demo Company)",
  address: "Cyberjaya, Selangor, Malaysia",
  state: "Selangor"
};

/* ═══════════════════════════════════════════════
   COUNTRY LOCALIZATION (MY + UK)
   ═══════════════════════════════════════════════ */

const COUNTRIES = {
  MY: {
    name: "Malaysia",
    flag: "\u{1F1F2}\u{1F1FE}",
    currency: "MYR",
    locale: "ms-MY",
    laborLaw: "Employment Act 1955",
    noticePeriod: "4 weeks (for less than 2 years of service)",
    workHours: "45 hours/week",
    probation: "3\u20136 months",
    benefits: ["EPF (Employees Provident Fund)", "SOCSO (Social Security Organisation)", "EIS (Employment Insurance System)"],
    mandatoryClause:
      "This agreement is governed by the Employment Act 1955. The Employer shall contribute to EPF and SOCSO as required by Malaysian law.",
    governingLaw: "the laws of Malaysia"
  },
  UK: {
    name: "United Kingdom",
    flag: "\u{1F1EC}\u{1F1E7}",
    currency: "GBP",
    locale: "en-GB",
    laborLaw: "Employment Rights Act 1996",
    noticePeriod: "1 month statutory minimum (after 1 month of service)",
    workHours: "48 hours/week maximum (Working Time Regulations 1998)",
    probation: "3\u20136 months",
    benefits: ["Workplace pension (auto-enrolment)", "28 days statutory annual leave", "Statutory Sick Pay (SSP)"],
    mandatoryClause:
      "Employment is subject to the Employment Rights Act 1996. The Employee is entitled to statutory notice periods and protection against unfair dismissal.",
    governingLaw: "the laws of England and Wales"
  }
};

/* ═══════════════════════════════════════════════
   VESTING TABLE
   ═══════════════════════════════════════════════ */

const VESTING_ROWS = (() => {
  const rows = [];
  for (let y = 0; y <= 6; y++) {
    const cliff = y >= 3 ? 100 : 0;
    let graded = 0;
    if (y === 2) graded = 20;
    else if (y === 3) graded = 40;
    else if (y === 4) graded = 60;
    else if (y === 5) graded = 80;
    else if (y >= 6) graded = 100;
    rows.push({ year: y, cliff, graded });
  }
  return rows;
})();

/* ═══════════════════════════════════════════════
   DOCUMENT TYPES
   ═══════════════════════════════════════════════ */

const DOCUMENT_TYPES = [
  { key: "employment_contract", title: "Employment Contract", description: "Complete employment agreement in correct legal format", icon: "\u{1F4C4}" },
  { key: "grant_letter", title: "Option Grant Letter", description: "Official equity option grant letter", icon: "\u{1F4C8}" },
  { key: "vesting_schedule", title: "Vesting Schedule", description: "Cliff & graded vesting breakdown", icon: "\u{1F4CA}" },
  { key: "exercise_agreement", title: "Exercise Agreement", description: "Independent contractor exercise agreement", icon: "\u{1F4DD}" }
];

/* ═══════════════════════════════════════════════
   VERSION HISTORY
   ═══════════════════════════════════════════════ */

const VERSION_HISTORY = [
  { type: "Employment Contract", version: "2.0", country: "MY", createdAt: "2026-02-01T10:00:00", createdBy: "WorkNest AI", status: "active", changelog: "Current version \u2014 localized for Malaysia (Employment Act 1955)" },
  { type: "Employment Contract", version: "1.1", country: "MY", createdAt: "2026-01-20T14:15:00", createdBy: "Maria Torres", status: "amended", changelog: "Amendment: salary adjustment from RM 3,500 to RM 4,500" },
  { type: "Employment Contract", version: "1.0", country: "MY", createdAt: "2026-01-15T09:30:00", createdBy: "Maria Torres", status: "superseded", changelog: "Initial contract generated for Malaysia jurisdiction" },
  { type: "Employment Contract", version: "1.0", country: "UK", createdAt: "2026-01-16T10:30:00", createdBy: "WorkNest AI", status: "active", changelog: "Localized for United Kingdom (Employment Rights Act 1996)" },
  { type: "Option Grant Letter", version: "1.0", country: "MY", createdAt: "2026-02-10T11:00:00", createdBy: "System", status: "active", changelog: "Auto-generated \u2014 1,000 options at RM 1.50 strike price" },
  { type: "Vesting Schedule", version: "1.0", country: "MY", createdAt: "2026-02-10T11:00:00", createdBy: "System", status: "active", changelog: "Auto-generated with cliff & graded vesting schedule" },
  { type: "Exercise Agreement", version: "1.0", country: "MY", createdAt: "2026-02-10T11:05:00", createdBy: "System", status: "active", changelog: "Standard exercise agreement generated" }
];

/* ═══════════════════════════════════════════════
   PROFILE TABS
   ═══════════════════════════════════════════════ */

const PROFILE_TABS = ["Overview", "Personal", "Leave", "Documents", "Compliance"];

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("Documents");

  // Document viewer state
  const [docView, setDocView] = useState("list"); // "list" | "versions" | document key
  const [selectedCountry, setSelectedCountry] = useState("MY");
  const printRef = useRef(null);

  const country = COUNTRIES[selectedCountry] || COUNTRIES["MY"];

  const handlePrint = () => window.print();
  const openDoc = (key) => setDocView(key);
  const backToList = () => setDocView("list");

  return (
    <main className="shell">
      {/* ══════════ SIDEBAR ══════════ */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">WN</div>
          <span>WorkNest</span>
        </div>
        <nav className="nav">
          <Link href="/" className="nav-item nav-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Home
          </Link>
          <Link href="/" className="nav-item nav-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Assistant
          </Link>
          <Link href="/profile" className="nav-item nav-link active">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Profile
          </Link>
        </nav>
        <div className="sidebar-footer">
          <div className="view-mode">
            <span>VIEW MODE</span>
            <div className="view-mode-row">
              <div className="view-mode-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
              </div>
              <div>
                <strong>Employee View</strong>
                <small>Restricted Access</small>
              </div>
            </div>
          </div>
          <div className="user-chip">
            <div className="avatar">AM</div>
            <div>
              <p>Aiman Miller</p>
              <span>Senior Designer</span>
            </div>
            <button className="logout-btn" type="button" aria-label="Sign out">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </div>
      </aside>

      <div className="content">
        {/* ── top bar ── */}
        <header className="topbar">
          <div className="search">
            <span className="search-icon">&#x2315;</span>
            <input type="text" placeholder="Search policies, requests, documents..." aria-label="Search" />
          </div>
          <div className="top-actions">
            <button className="icon-button" type="button">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            </button>
            <button className="icon-button" type="button">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </button>
            <div className="avatar small topbar-avatar">AM<span className="avatar-caret">&#x25BE;</span></div>
          </div>
        </header>

        <div className="banner">
          <span className="shield">&#x1F6E1;&#xFE0F;</span>
          Privacy &amp; Human Oversight: Sensitive changes require HR approval. AI drafts are for assistance only.
        </div>

        {/* ════════════ PROFILE CONTENT ════════════ */}
        <div className="profile-page">
          {/* ── profile header ── */}
          <section className="profile-header-card">
            <div className="profile-header-top">
              <div className="profile-header-left">
                <div className="profile-avatar-wrapper">
                  <div className="profile-avatar">AM</div>
                  <span className="profile-online-dot" />
                </div>
                <div className="profile-info">
                  <h1 className="profile-name">{EMPLOYEE.name}</h1>
                  <p className="profile-title">{EMPLOYEE.title} &middot; ID: #{EMPLOYEE.id}</p>
                  <div className="profile-meta">
                    <span className="profile-meta-item">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                      {EMPLOYEE.department}
                    </span>
                    <span className="profile-meta-item">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      Manager: {EMPLOYEE.manager}
                    </span>
                    <span className="profile-meta-item">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      {EMPLOYEE.location}
                    </span>
                  </div>
                </div>
              </div>
              <div className="profile-header-actions">
                <button className="btn-outline" type="button">Request Transfer</button>
                <button className="btn-filled" type="button">Edit Profile</button>
              </div>
            </div>
          </section>

          {/* ── profile tabs ── */}
          <section className="profile-body-card">
            <nav className="profile-tabs">
              {PROFILE_TABS.map((tab) => (
                <button
                  key={tab}
                  className={`profile-tab${activeTab === tab ? " active" : ""}`}
                  type="button"
                  onClick={() => { setActiveTab(tab); if (tab === "Documents") setDocView("list"); }}
                >
                  {tab}
                </button>
              ))}
            </nav>

            {/* ════════════════════════════════════════════
               DOCUMENTS TAB — Intelligent Document Generation
               ════════════════════════════════════════════ */}
            {activeTab === "Documents" && (
              <div className="documents-section">

                {/* ── toolbar: jurisdiction selector + sub-tabs ── */}
                <div className="doc-inner-toolbar">
                  <div className="doc-inner-tabs">
                    <button type="button" className={`doc-inner-tab${docView !== "versions" ? " active" : ""}`} onClick={() => setDocView("list")}>
                      My Documents
                    </button>
                    <button type="button" className={`doc-inner-tab${docView === "versions" ? " active" : ""}`} onClick={() => setDocView("versions")}>
                      Version Control ({VERSION_HISTORY.length})
                    </button>
                  </div>
                  {docView !== "versions" && (
                    <label className="country-selector">
                      <span className="country-selector-label">Jurisdiction</span>
                      <select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)}>
                        {Object.entries(COUNTRIES).map(([code, c]) => (
                          <option key={code} value={code}>{c.flag} {c.name}</option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>

                {/* ── DOCUMENT LIST VIEW ── */}
                {docView === "list" && (
                  <>
                    <div className="jurisdiction-bar">
                      <span className="jurisdiction-flag">{country.flag}</span>
                      <div className="jurisdiction-info-text">
                        <strong>{country.name}</strong>
                        <span>{country.laborLaw} &middot; {country.currency} &middot; {country.workHours}</span>
                      </div>
                    </div>
                    <div className="doc-card-grid">
                      {DOCUMENT_TYPES.map((doc) => (
                        <button key={doc.key} type="button" className="doc-card" onClick={() => openDoc(doc.key)}>
                          <span className="doc-card-icon">{doc.icon}</span>
                          <div className="doc-card-text">
                            <strong>{doc.title}</strong>
                            <span>{doc.description}</span>
                          </div>
                          <span className="doc-card-arrow">&rarr;</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* ── DOCUMENT PREVIEW ── */}
                {docView !== "list" && docView !== "versions" && (
                  <div className="doc-viewer">
                    <div className="doc-viewer-toolbar">
                      <button className="btn-back" type="button" onClick={backToList}>&larr; Back to Documents</button>
                      <button className="btn-print" type="button" onClick={handlePrint}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                        Print / Save PDF
                      </button>
                    </div>

                    <div className="legal-document" ref={printRef}>

                      {/* ─── EMPLOYMENT CONTRACT ─── */}
                      {docView === "employment_contract" && (
                        <>
                          <h1 className="legal-title">EMPLOYMENT AGREEMENT</h1>
                          <p>THIS EMPLOYMENT AGREEMENT is made and entered into as of <span className="legal-fill">{fmtDate(new Date())}</span> by and between:</p>
                          <div className="legal-party">
                            <strong>[NAME OF EMPLOYER]</strong>, <span className="legal-fill">{EMPLOYER.name}</span><br />
                            Registered Address: <span className="legal-fill">{EMPLOYER.address}</span><br />
                            (the &ldquo;Employer&rdquo;)
                          </div>
                          <p className="legal-center muted-text">&mdash; and &mdash;</p>
                          <div className="legal-party">
                            <strong>[NAME OF EMPLOYEE]</strong>, <span className="legal-fill">{EMP.full_name}</span>, an individual residing at<br />
                            <span className="legal-fill">{EMP.address}</span><br />
                            (the &ldquo;Employee&rdquo;)
                          </div>
                          <p className="legal-whereas"><strong>WHEREAS</strong>, the Employer desires to employ Employee as a <span className="legal-fill">{EMP.role_title}</span>, and Employee desires to accept employment with the Employer, on the terms and conditions set forth in this Agreement;</p>
                          <p className="legal-whereas"><strong>NOW, THEREFORE</strong>, in consideration of the premises and the mutual covenants and agreements contained herein, the parties hereto covenant and agree as follows:</p>
                          <h3>1. Employment</h3>
                          <p><strong>1.1</strong> The Employer hereby agrees to employ the Employee, and the Employee agrees to be employed by the Employer, on a <span className="legal-fill">{OFFER.employment_type === "FULL_TIME" ? "full-time" : OFFER.employment_type === "PART_TIME" ? "part-time" : "contract"}</span> basis at the remuneration and on the terms and conditions contained in this Agreement.</p>
                          <h3>2. Commencement; Term; Renewal</h3>
                          <p><strong>2.1</strong> The Employee shall commence employment on <span className="legal-fill">{fmtDate(OFFER.start_date)}</span> at the Employer&apos;s location in <span className="legal-fill">{EMP.location_city}</span>.</p>
                          <p><strong>2.2</strong> Probation period: <span className="legal-fill">{OFFER.probation_months}</span> months from commencement date.</p>
                          <h3>3. Workplace</h3>
                          <p><strong>3.1</strong> The Employee shall perform duties at the Employer&apos;s location, or such other place as may be agreed between the parties in writing.</p>
                          <h3>4. Compensation</h3>
                          <p><strong>4.1</strong> The Employee&apos;s monthly salary shall be <span className="legal-fill">{fmtCurrency(OFFER.salary_monthly, country.currency, country.locale)}</span>.</p>
                          <h3>5. Working Hours</h3>
                          <p><strong>5.1</strong> Standard working hours: <span className="legal-fill">{country.workHours}</span>.</p>
                          <h3>6. Statutory Benefits</h3>
                          <ul>{country.benefits.map((b, i) => (<li key={i}>{b}</li>))}</ul>
                          <h3>7. Notice Period</h3>
                          <p><strong>7.1</strong> <span className="legal-fill">{country.noticePeriod}</span>.</p>
                          <h3>8. Governing Law</h3>
                          <p><strong>8.1</strong> This Agreement shall be governed by and construed in accordance with <span className="legal-fill">{country.governingLaw}</span>.</p>
                          <div className="legal-clause-box">
                            <strong>Jurisdiction-Specific Clause ({country.laborLaw})</strong>
                            <p>{country.mandatoryClause}</p>
                          </div>
                          <div className="legal-signatures">
                            <div className="legal-sign-box"><p><strong>Employer</strong></p><div className="legal-sign-line" /><p className="muted-text small-text">Authorized Signature</p></div>
                            <div className="legal-sign-box"><p><strong>Employee</strong></p><div className="legal-sign-line" /><p className="muted-text small-text">{EMP.full_name}</p></div>
                          </div>
                          <p className="legal-footer">Generated from structured data in company database (Employee ID: {EMP.employee_id}) &middot; Jurisdiction: {country.name}</p>
                        </>
                      )}

                      {/* ─── OPTION GRANT LETTER ─── */}
                      {docView === "grant_letter" && (
                        <>
                          <h1 className="legal-title letter-style">Grant Letter</h1>
                          <p className="legal-date">{fmtDate(new Date())}</p>
                          <p><strong>{EMP.full_name}</strong><br />{EMP.address}</p>
                          <p>Dear {EMP.full_name},</p>
                          <p>We are pleased to grant you stock options under the Company&apos;s equity plan, subject to the terms below:</p>
                          <ul className="legal-list">
                            <li><strong>Grant Date:</strong> {fmtDate(EQUITY.grant_date)}</li>
                            <li><strong>Total Options:</strong> {EQUITY.total_options.toLocaleString()}</li>
                            <li><strong>Strike Price:</strong> {fmtCurrency(EQUITY.strike_price, country.currency, country.locale)}</li>
                          </ul>
                          <p>Your options will vest according to the vesting schedule available in the Employee Portal.</p>
                          <p>Thank you, and we look forward to your continued contribution.</p>
                          <p>Sincerely,<br /><strong>HR Operations</strong></p>
                          <p className="legal-footer">Generated from structured data in company database (Employee ID: {EMP.employee_id})</p>
                        </>
                      )}

                      {/* ─── VESTING SCHEDULE ─── */}
                      {docView === "vesting_schedule" && (
                        <>
                          <h1 className="legal-title">Vesting Schedule</h1>
                          <p className="muted-text" style={{ textAlign: "center" }}>Employee: {EMP.full_name} &middot; Options: {EQUITY.total_options.toLocaleString()} &middot; Grant Date: {fmtDate(EQUITY.grant_date)}</p>
                          <table className="vesting-table">
                            <thead><tr><th>Years of Service</th><th>Cliff Vesting</th><th>Graded Vesting</th><th>Options (Graded)</th></tr></thead>
                            <tbody>
                              {VESTING_ROWS.map((r) => (
                                <tr key={r.year} className={r.graded > 0 ? "vested-row" : ""}>
                                  <td className="year-cell">Year {r.year}</td>
                                  <td>{r.cliff}%</td>
                                  <td>{r.graded}%</td>
                                  <td>{Math.round((r.graded / 100) * EQUITY.total_options).toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="vesting-legend">
                            <div className="legend-item"><span className="legend-dot cliff" /><span>Cliff Vesting: 100% vests after 3 years of service</span></div>
                            <div className="legend-item"><span className="legend-dot graded" /><span>Graded Vesting: Gradual vesting from Year 2 to Year 6</span></div>
                          </div>
                          <p className="legal-footer">Generated from structured data in company database (Employee ID: {EMP.employee_id})</p>
                        </>
                      )}

                      {/* ─── EXERCISE AGREEMENT ─── */}
                      {docView === "exercise_agreement" && (
                        <>
                          <h1 className="legal-title">Exercise Agreement</h1>
                          <p className="legal-center muted-text">Agreement made on the <span className="legal-fill">{new Date().getDate()}</span>th day of <span className="legal-fill">{new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span></p>
                          <p>Agreement made this ____ day of ________________, 20__, by and between <span className="legal-fill">{EMPLOYER.name}</span>, a corporation organized and existing under the laws of the state of <span className="legal-fill">{EMPLOYER.state}</span>, with its principal office located at <span className="legal-fill">{EMPLOYER.address}</span>, referred to herein as <strong>Company</strong>, and <span className="legal-fill">{EMP.full_name}</span> of <span className="legal-fill">{EMP.address}</span>, referred to herein as <strong>Contractor</strong>.</p>
                          <p><strong>Whereas</strong>, Contractor is an independent contractor willing to provide certain skills and abilities to Company; and</p>
                          <p><strong>Whereas</strong>, Company has a need for such services;</p>
                          <p><strong>Now, therefore</strong>, for and in consideration of the mutual covenants contained in this Agreement, the parties agree as follows:</p>
                          <ol className="legal-ordered-list">
                            <li>Company hereby engages the services of the Contractor as an independent contractor, and the Contractor hereby accepts the engagement.</li>
                            <li>The term of this Agreement shall commence on <span className="legal-fill">{fmtDate(OFFER.start_date)}</span>. Either party may terminate this Agreement by giving <span className="legal-fill">30</span> days&apos; written notice to the other.</li>
                            <li>The Contractor is responsible for his/her own tax returns as a self-employed service provider. Travel or related expenses are the responsibility of the Contractor.</li>
                            <li>Company shall be paid <span className="legal-fill">20</span>% of all related profit, such amount to be paid on the first business day of each month for the previous month.</li>
                            <li>Contractor shall provide copies of the following: current liability papers, current certifications and first aid/CPR certifications (where applicable).</li>
                            <li>Contractor may engage in other business activities; however, Contractor agrees not to compete during the term of this Agreement, or for a period of <span className="legal-fill">6</span> months from termination of this Agreement.</li>
                          </ol>
                          <div className="legal-signatures">
                            <div className="legal-sign-box"><p><strong>Company</strong></p><div className="legal-sign-line" /><p className="muted-text small-text">Authorized Signature</p></div>
                            <div className="legal-sign-box"><p><strong>Contractor</strong></p><div className="legal-sign-line" /><p className="muted-text small-text">{EMP.full_name}</p></div>
                          </div>
                          <p className="legal-footer">Generated from company database (Employee ID: {EMP.employee_id})</p>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* ── VERSION CONTROL VIEW ── */}
                {docView === "versions" && (
                  <div className="version-control-inner">
                    <div className="version-header">
                      <div>
                        <h3 style={{ margin: 0 }}>Document Version History</h3>
                        <p className="muted-text">Track contract changes, amendments, and renewals</p>
                      </div>
                      <div className="version-stats">
                        <span className="version-stat"><strong>{VERSION_HISTORY.length}</strong> Total</span>
                        <span className="version-stat active-stat"><strong>{VERSION_HISTORY.filter((d) => d.status === "active").length}</strong> Active</span>
                        <span className="version-stat amended-stat"><strong>{VERSION_HISTORY.filter((d) => d.status === "amended").length}</strong> Amended</span>
                      </div>
                    </div>
                    <div className="version-timeline">
                      {VERSION_HISTORY.map((doc, idx) => (
                        <div key={idx} className={`version-entry ${doc.status}`}>
                          <div className="version-line">
                            <span className={`version-dot ${doc.status}`} />
                            {idx < VERSION_HISTORY.length - 1 && <span className="version-connector" />}
                          </div>
                          <div className="version-body">
                            <div className="version-entry-header">
                              <div className="version-entry-left">
                                <strong>{doc.type}</strong>
                                <span className="version-tag">v{doc.version}</span>
                                <span className={`version-status-badge ${doc.status}`}>{doc.status}</span>
                              </div>
                              <span className="version-time">{fmtDateTime(doc.createdAt)}</span>
                            </div>
                            <p className="version-changelog">{doc.changelog}</p>
                            <div className="version-meta">
                              <span>{COUNTRIES[doc.country]?.flag} {COUNTRIES[doc.country]?.name}</span>
                              <span>&middot;</span>
                              <span>By: {doc.createdBy}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ──── Overview Tab ──── */}
            {activeTab === "Overview" && (
              <div className="tab-placeholder">
                <div className="empty-state">
                  <h3>Employee Overview</h3>
                  <p>Summary information, recent activity, and quick stats will appear here.</p>
                </div>
              </div>
            )}

            {/* ──── Personal Tab ──── */}
            {activeTab === "Personal" && (
              <div className="tab-placeholder">
                <div className="empty-state">
                  <h3>Personal Information</h3>
                  <p>Contact details, emergency contacts, and personal records will appear here.</p>
                </div>
              </div>
            )}

            {/* ──── Leave Tab ──── */}
            {activeTab === "Leave" && (
              <div className="tab-placeholder">
                <div className="empty-state">
                  <h3>Leave Balance</h3>
                  <p>Leave balances, history, and upcoming time off will appear here.</p>
                </div>
              </div>
            )}

            {/* ──── Compliance Tab ──── */}
            {activeTab === "Compliance" && (
              <div className="tab-placeholder">
                <div className="empty-state">
                  <h3>Compliance &amp; Training</h3>
                  <p>Compliance certifications, mandatory trainings, and deadlines will appear here.</p>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
