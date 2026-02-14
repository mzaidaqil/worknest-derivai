"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

/* ════════════════════════════════════════════════════
   MOCK EMPLOYEE DATA — 4 employees with different statuses
   ════════════════════════════════════════════════════ */

const EMPLOYEES = [
    {
        id: "EMP-2026-041",
        name: "Siti Mahansor",
        region: "ID",
        regionLabel: "🇮🇩 Indonesia",
        role: "Software Engineer",
        level: "L2",
        startDate: "2026-02-14",
        status: "complete",
        statusLabel: "Complete",
        passportUploaded: true,
        d11Generated: true,
        d11Data: {
            full_name: "Siti Nurhaliza",
            passport_number: "B87654321",
            nationality: "Indonesian",
            date_of_birth: "1995-03-15",
            gender: "Female",
            passport_expiry: "2030-08-20",
            place_of_issue: "Jakarta",
        },
        aiAnalysis: {
            score: "pass",
            summary: "All required fields successfully extracted and verified. D11 form is ready for submission.",
            checks: [
                { field: "Full Name", status: "pass", detail: "Matched with offer letter — Siti Nurhaliza" },
                { field: "Passport Number", status: "pass", detail: "Verified — B87654321" },
                { field: "Nationality", status: "pass", detail: "Indonesian — matches region" },
                { field: "Date of Birth", status: "pass", detail: "1995-03-15 — valid" },
                { field: "Gender", status: "pass", detail: "Female — filled" },
                { field: "Passport Expiry", status: "pass", detail: "2030-08-20 — valid for 4+ years" },
                { field: "Place of Issue", status: "pass", detail: "Jakarta — filled" },
            ],
            recommendation: "Ready to submit to immigration authority.",
        },
    },
    {
        id: "EMP-2026-042",
        name: "Raj Patel",
        region: "IN",
        regionLabel: "🇮🇳 India",
        role: "Data Analyst",
        level: "L3",
        startDate: "2026-02-12",
        status: "review",
        statusLabel: "Pending Review",
        passportUploaded: true,
        d11Generated: true,
        d11Data: {
            full_name: "Raj Patel",
            passport_number: "K9182736",
            nationality: "Indian",
            date_of_birth: "1992-11-08",
            gender: "Male",
            passport_expiry: "2028-05-14",
            place_of_issue: "",
        },
        aiAnalysis: {
            score: "warning",
            summary: "Most fields verified. One field missing — place of issue could not be extracted from passport scan.",
            checks: [
                { field: "Full Name", status: "pass", detail: "Matched with offer letter — Raj Patel" },
                { field: "Passport Number", status: "pass", detail: "Verified — K9182736" },
                { field: "Nationality", status: "pass", detail: "Indian — matches region" },
                { field: "Date of Birth", status: "pass", detail: "1992-11-08 — valid" },
                { field: "Gender", status: "pass", detail: "Male — filled" },
                { field: "Passport Expiry", status: "warning", detail: "2028-05-14 — expires in ~2 years, consider renewal" },
                { field: "Place of Issue", status: "fail", detail: "Missing — could not extract from scan" },
            ],
            recommendation: "Request employee to re-upload a clearer passport photo or manually enter place of issue.",
        },
    },
    {
        id: "EMP-2026-043",
        name: "Carlos Mendez",
        region: "PH",
        regionLabel: "🇵🇭 Philippines",
        role: "Product Manager",
        level: "L4",
        startDate: "2026-02-15",
        status: "waiting",
        statusLabel: "Awaiting Upload",
        passportUploaded: false,
        d11Generated: false,
        d11Data: null,
        aiAnalysis: {
            score: "pending",
            summary: "Employee has not yet uploaded passport document. D11 form cannot be generated until passport is received.",
            checks: [
                { field: "Passport Upload", status: "fail", detail: "Not received — employee notified via email" },
                { field: "D11 Form", status: "fail", detail: "Cannot generate — waiting for passport" },
            ],
            recommendation: "Send follow-up reminder to employee. Onboarding start date is tomorrow.",
        },
    },
    {
        id: "EMP-2026-044",
        name: "Wei Lin Chen",
        region: "SG",
        regionLabel: "🇸🇬 Singapore",
        role: "UX Researcher",
        level: "L2",
        startDate: "2026-02-10",
        status: "complete",
        statusLabel: "Complete",
        passportUploaded: true,
        d11Generated: true,
        d11Data: {
            full_name: "Chen Wei Lin",
            passport_number: "E12498763",
            nationality: "Singaporean",
            date_of_birth: "1998-07-22",
            gender: "Female",
            passport_expiry: "2031-01-10",
            place_of_issue: "Singapore",
        },
        aiAnalysis: {
            score: "warning",
            summary: "All fields extracted. Minor name order discrepancy detected — passport shows 'Chen Wei Lin' but offer letter has 'Wei Lin Chen'.",
            checks: [
                { field: "Full Name", status: "warning", detail: "Passport: 'Chen Wei Lin' vs Offer: 'Wei Lin Chen' — likely surname/given order difference" },
                { field: "Passport Number", status: "pass", detail: "Verified — E12498763" },
                { field: "Nationality", status: "pass", detail: "Singaporean — matches region" },
                { field: "Date of Birth", status: "pass", detail: "1998-07-22 — valid" },
                { field: "Gender", status: "pass", detail: "Female — filled" },
                { field: "Passport Expiry", status: "pass", detail: "2031-01-10 — valid for 5+ years" },
                { field: "Place of Issue", status: "pass", detail: "Singapore — filled" },
            ],
            recommendation: "Confirm name order with employee. Likely a cultural surname-first format — no action needed if confirmed.",
        },
    },
];

/* ════════════ BUILD AI ANALYSIS FROM OCR ════════════ */

function buildAIAnalysis(sub) {
    const ocr = sub.ocrData;
    if (!ocr) {
        return {
            score: "pending",
            summary: "Employee has not yet uploaded passport document. D11 form cannot be generated until passport is received.",
            checks: [
                { field: "Passport Upload", status: "fail", detail: "Not received — employee notified" },
                { field: "D11 Form", status: "fail", detail: "Cannot generate — waiting for passport" },
            ],
            recommendation: "Send follow-up reminder to employee.",
        };
    }

    const checks = [];
    let hasWarning = false;
    let hasFail = false;

    // Full Name
    if (ocr.full_name) {
        const nameMatch = ocr.full_name.toLowerCase().includes(sub.name.split(" ")[0].toLowerCase());
        checks.push({
            field: "Full Name",
            status: nameMatch ? "pass" : "warning",
            detail: nameMatch
                ? `Matched with offer letter — ${ocr.full_name}`
                : `Passport: '${ocr.full_name}' vs Offer: '${sub.name}' — verify name`,
        });
        if (!nameMatch) hasWarning = true;
    } else {
        checks.push({ field: "Full Name", status: "fail", detail: "Could not extract from scan" });
        hasFail = true;
    }

    // Passport Number
    if (ocr.passport_number) {
        checks.push({ field: "Passport Number", status: "pass", detail: `Verified — ${ocr.passport_number}` });
    } else {
        checks.push({ field: "Passport Number", status: "fail", detail: "Missing — could not extract" });
        hasFail = true;
    }

    // Nationality
    if (ocr.nationality) {
        checks.push({ field: "Nationality", status: "pass", detail: `${ocr.nationality} — matches region` });
    } else {
        checks.push({ field: "Nationality", status: "fail", detail: "Missing — could not extract" });
        hasFail = true;
    }

    // Date of Birth
    if (ocr.date_of_birth) {
        checks.push({ field: "Date of Birth", status: "pass", detail: `${ocr.date_of_birth} — valid` });
    } else {
        checks.push({ field: "Date of Birth", status: "fail", detail: "Missing" });
        hasFail = true;
    }

    // Gender
    if (ocr.gender) {
        checks.push({ field: "Gender", status: "pass", detail: `${ocr.gender} — filled` });
    } else {
        checks.push({ field: "Gender", status: "warning", detail: "Not extracted — may need manual entry" });
        hasWarning = true;
    }

    // Passport Expiry
    if (ocr.passport_expiry) {
        const expiryDate = new Date(ocr.passport_expiry);
        const yearsLeft = ((expiryDate - new Date()) / (365.25 * 24 * 60 * 60 * 1000)).toFixed(0);
        const isExpiringSoon = yearsLeft <= 2;
        checks.push({
            field: "Passport Expiry",
            status: isExpiringSoon ? "warning" : "pass",
            detail: `${ocr.passport_expiry} — ${isExpiringSoon ? `expires in ~${yearsLeft} years, consider renewal` : `valid for ${yearsLeft}+ years`}`,
        });
        if (isExpiringSoon) hasWarning = true;
    } else {
        checks.push({ field: "Passport Expiry", status: "fail", detail: "Missing" });
        hasFail = true;
    }

    // Place of Issue
    if (ocr.place_of_issue) {
        checks.push({ field: "Place of Issue", status: "pass", detail: `${ocr.place_of_issue} — filled` });
    } else {
        checks.push({ field: "Place of Issue", status: "fail", detail: "Missing — could not extract from scan" });
        hasFail = true;
    }

    const score = hasFail ? "warning" : hasWarning ? "warning" : "pass";
    const passCount = checks.filter((c) => c.status === "pass").length;
    const failCount = checks.filter((c) => c.status === "fail").length;
    const summary = hasFail
        ? `Most fields verified. ${failCount} field(s) missing — may need re-upload or manual entry.`
        : hasWarning
            ? `All fields extracted. Minor discrepancies detected — review recommended.`
            : `All required fields successfully extracted and verified. D11 form is ready for submission.`;
    const recommendation = hasFail
        ? "Request employee to re-upload a clearer passport photo or manually fill missing fields."
        : hasWarning
            ? "Review flagged items. Confirm with employee if needed — may be a formatting difference."
            : "Ready to submit to immigration authority.";

    return { score, summary, checks, recommendation };
}

/* ════════════ CONVERT SUBMISSION TO EMPLOYEE ════════════ */

function submissionToEmployee(sub) {
    const ocr = sub.ocrData;
    const analysis = buildAIAnalysis(sub);
    const hasFail = analysis.checks.some((c) => c.status === "fail");

    let status = "review";
    let statusLabel = "Pending Review";
    if (!sub.passportUploaded) {
        status = "waiting";
        statusLabel = "Awaiting Upload";
    } else if (analysis.score === "pass" && sub.d11Generated) {
        status = "complete";
        statusLabel = "Complete";
    }

    return {
        id: sub.id,
        name: sub.name,
        region: sub.region,
        regionLabel: sub.regionLabel,
        role: sub.role,
        level: sub.level,
        startDate: sub.startDate,
        status,
        statusLabel,
        passportUploaded: sub.passportUploaded,
        d11Generated: sub.d11Generated,
        d11Data: ocr ? {
            full_name: ocr.full_name || sub.name,
            passport_number: ocr.passport_number || "—",
            nationality: ocr.nationality || "—",
            date_of_birth: ocr.date_of_birth || "—",
            gender: ocr.gender || "—",
            passport_expiry: ocr.passport_expiry || "—",
            place_of_issue: ocr.place_of_issue || "",
        } : null,
        aiAnalysis: analysis,
    };
}

/* ════════════ STATS ════════════ */

function getStats(employees) {
    const total = employees.length;
    const complete = employees.filter((e) => e.status === "complete").length;
    const review = employees.filter((e) => e.status === "review").length;
    const waiting = employees.filter((e) => e.status === "waiting").length;
    return { total, complete, review, waiting };
}

/* ════════════ ICONS ════════════ */

function ChevronDown({ open }) {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
            <polyline points="6 9 12 15 18 9" />
        </svg>
    );
}

function DownloadIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
        </svg>
    );
}

function SendIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
    );
}

/* ════════════ CHECK STATUS ICON ════════════ */

function CheckIcon({ status }) {
    if (status === "pass") return <span className="hr-check-icon pass">✓</span>;
    if (status === "warning") return <span className="hr-check-icon warn">⚠</span>;
    return <span className="hr-check-icon fail">✕</span>;
}

/* ════════════ STATUS BADGE ════════════ */

function StatusBadge({ status }) {
    const map = {
        complete: { cls: "good", label: "Complete" },
        review: { cls: "warn", label: "Pending Review" },
        waiting: { cls: "critical", label: "Awaiting Upload" },
    };
    const s = map[status] || map.waiting;
    return <span className={`hr-status-badge ${s.cls}`}>{s.label}</span>;
}

/* ════════════ SCORE BADGE ════════════ */

function ScoreBadge({ score }) {
    const map = {
        pass: { cls: "good", icon: "✓", label: "All Clear" },
        warning: { cls: "warn", icon: "⚠", label: "Needs Attention" },
        pending: { cls: "pending", icon: "⏳", label: "Pending" },
    };
    const s = map[score] || map.pending;
    return (
        <span className={`hr-score-badge ${s.cls}`}>
            <span>{s.icon}</span> {s.label}
        </span>
    );
}

/* ════════════ D11 INLINE PREVIEW ════════════ */

function D11Preview({ emp }) {
    if (!emp.d11Data) return null;
    const d = emp.d11Data;
    const fmtDate = () => new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    return (
        <div className="hr-d11-preview">
            <div className="hr-d11-title-block">
                <h4>JABATAN IMIGRESEN MALAYSIA</h4>
                <p>FORM D11 — Work Permit Application</p>
            </div>
            <div className="hr-d11-grid">
                <div className="hr-d11-cell">
                    <span>Full Name</span><strong>{d.full_name}</strong>
                </div>
                <div className="hr-d11-cell">
                    <span>Passport No.</span><strong>{d.passport_number}</strong>
                </div>
                <div className="hr-d11-cell">
                    <span>Nationality</span><strong>{d.nationality}</strong>
                </div>
                <div className="hr-d11-cell">
                    <span>Date of Birth</span><strong>{d.date_of_birth}</strong>
                </div>
                <div className="hr-d11-cell">
                    <span>Gender</span><strong>{d.gender}</strong>
                </div>
                <div className="hr-d11-cell">
                    <span>Passport Expiry</span><strong>{d.passport_expiry}</strong>
                </div>
                <div className="hr-d11-cell">
                    <span>Place of Issue</span><strong>{d.place_of_issue || <em className="hr-missing">— Missing</em>}</strong>
                </div>
                <div className="hr-d11-cell">
                    <span>Position</span><strong>{emp.role}</strong>
                </div>
                <div className="hr-d11-cell">
                    <span>Employer</span><strong>WorkNest Inc.</strong>
                </div>
                <div className="hr-d11-cell">
                    <span>Work Permit Duration</span><strong>24 months</strong>
                </div>
            </div>
            <p className="hr-d11-footer-text">Auto-generated on {fmtDate()} by WorkNest OCR</p>
        </div>
    );
}

/* ════════════ EMPLOYEE ROW ════════════ */

function EmployeeRow({ emp }) {
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("analysis");

    return (
        <div className={`hr-emp-row ${open ? "open" : ""}`}>
            {/* Summary row */}
            <div className="hr-emp-summary" onClick={() => setOpen(!open)}>
                <div className="hr-emp-avatar">{emp.name.split(" ").map(n => n[0]).join("")}</div>
                <div className="hr-emp-info">
                    <strong>{emp.name}</strong>
                    <span>{emp.regionLabel} · {emp.role} · {emp.level}</span>
                </div>
                <div className="hr-emp-meta">
                    <span className="hr-emp-id">{emp.id}</span>
                    <StatusBadge status={emp.status} />
                    <div className="hr-emp-docs">
                        <span className={emp.passportUploaded ? "uploaded" : "missing"}>
                            {emp.passportUploaded ? "📄" : "—"} Passport
                        </span>
                        <span className={emp.d11Generated ? "uploaded" : "missing"}>
                            {emp.d11Generated ? "📋" : "—"} D11
                        </span>
                    </div>
                    <ChevronDown open={open} />
                </div>
            </div>

            {/* Expanded detail */}
            {open && (
                <div className="hr-emp-detail">
                    {/* Tabs */}
                    <div className="hr-tabs">
                        <button className={`hr-tab ${activeTab === "analysis" ? "active" : ""}`} onClick={() => setActiveTab("analysis")}>
                            🤖 AI Analysis
                        </button>
                        {emp.d11Generated && (
                            <button className={`hr-tab ${activeTab === "d11" ? "active" : ""}`} onClick={() => setActiveTab("d11")}>
                                📋 D11 Form
                            </button>
                        )}
                    </div>

                    {/* AI Analysis Tab */}
                    {activeTab === "analysis" && (
                        <div className="hr-analysis">
                            <div className="hr-analysis-header">
                                <ScoreBadge score={emp.aiAnalysis.score} />
                                <p>{emp.aiAnalysis.summary}</p>
                            </div>

                            <div className="hr-checks-list">
                                {emp.aiAnalysis.checks.map((c, i) => (
                                    <div key={i} className={`hr-check-row ${c.status}`}>
                                        <CheckIcon status={c.status} />
                                        <span className="hr-check-field">{c.field}</span>
                                        <span className="hr-check-detail">{c.detail}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="hr-recommendation">
                                <strong>→ Recommendation:</strong> {emp.aiAnalysis.recommendation}
                            </div>
                        </div>
                    )}

                    {/* D11 Form Tab */}
                    {activeTab === "d11" && emp.d11Generated && (
                        <div className="hr-d11-tab">
                            <D11Preview emp={emp} />
                        </div>
                    )}

                    {/* Action buttons */}
                    {emp.d11Generated && (
                        <div className="hr-actions">
                            <button className="hr-btn-download" onClick={() => window.print()}>
                                <DownloadIcon /> Download PDF
                            </button>
                            <button className="hr-btn-submit" disabled={emp.status !== "complete"}>
                                <SendIcon /> Submit to Authority
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/* ════════════ MAIN PAGE ════════════ */

export default function HRDashboard() {
    const [employees, setEmployees] = useState(EMPLOYEES);

    const loadSubmissions = useCallback(() => {
        try {
            const raw = localStorage.getItem("hr_onboarding_submissions");
            if (!raw) return;
            const submissions = JSON.parse(raw);
            // Convert submissions to employee format, skip if already in mock data
            const mockNames = EMPLOYEES.map((e) => e.name);
            const newEmps = submissions
                .filter((s) => !mockNames.includes(s.name))
                .map(submissionToEmployee);
            setEmployees([...newEmps, ...EMPLOYEES]);
        } catch (e) {
            console.error("Failed to load submissions:", e);
        }
    }, []);

    useEffect(() => {
        loadSubmissions();
        // Also reload when tab gains focus (HR navigates back)
        const onFocus = () => loadSubmissions();
        window.addEventListener("focus", onFocus);
        return () => window.removeEventListener("focus", onFocus);
    }, [loadSubmissions]);

    const stats = getStats(employees);

    return (
        <main className="shell">
            {/* ── sidebar ── */}
            <aside className="sidebar">
                <div className="brand">
                    <div className="brand-icon">WN</div>
                    <span>WorkNest</span>
                </div>
                <nav className="nav">
                    <Link href="/" className="nav-item nav-link">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                        Home
                    </Link>
                    <Link href="/assistant" className="nav-item nav-link">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2-2z" /></svg>
                        Assistant
                    </Link>
                    <Link href="/profile" className="nav-item nav-link">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                        Profile
                    </Link>
                    <Link href="/hr-dashboard" className="nav-item nav-link active">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                        HR Dashboard
                    </Link>
                </nav>
                <div className="sidebar-footer">
                    <div className="user-chip">
                        <div className="avatar">HR</div>
                        <div>
                            <p>Sarah Ahmad</p>
                            <span>HR Manager</span>
                        </div>
                    </div>
                </div>
            </aside>

            <div className="content">
                {/* ── top bar ── */}
                <header className="topbar">
                    <div></div>
                    <div className="top-actions">
                        <button className="icon-button" type="button">🔔</button>
                        <div className="avatar small">SA</div>
                    </div>
                </header>

                {/* ── Main Content ── */}
                <div className="hr-page">

                    {/* Page Header */}
                    <div className="hr-page-header">
                        <div>
                            <h1>Onboarding & Compliance</h1>
                            <p>Manage foreign worker applications, AI-verified documents, and D11 form submissions.</p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="hr-stats">
                        <div className="hr-stat-card">
                            <span className="hr-stat-number">{stats.total}</span>
                            <span className="hr-stat-label">Total Onboarding</span>
                        </div>
                        <div className="hr-stat-card good">
                            <span className="hr-stat-number">{stats.complete}</span>
                            <span className="hr-stat-label">Completed</span>
                        </div>
                        <div className="hr-stat-card warn">
                            <span className="hr-stat-number">{stats.review}</span>
                            <span className="hr-stat-label">Pending Review</span>
                        </div>
                        <div className="hr-stat-card critical">
                            <span className="hr-stat-number">{stats.waiting}</span>
                            <span className="hr-stat-label">Action Required</span>
                        </div>
                    </div>

                    {/* Employee List */}
                    <div className="hr-emp-list">
                        <div className="hr-emp-list-header">
                            <h3>Employee Applications</h3>
                            <span className="hr-emp-count">{employees.length} employees</span>
                        </div>
                        {employees.map((emp) => (
                            <EmployeeRow key={emp.id} emp={emp} />
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}
