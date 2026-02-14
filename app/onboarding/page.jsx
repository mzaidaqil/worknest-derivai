"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

/* ════════════ STEP CONFIG ════════════ */

const STEPS = [
    { key: "setup", label: "Setup", icon: "person" },
    { key: "account", label: "Create Account", icon: "upload" },
    { key: "upload", label: "Upload", icon: "document" },
    { key: "verification", label: "Verification", icon: "shield" },
];

/* ════════════ MOCK EMPLOYEE DATA ════════════ */

const INITIAL_DATA = {
    _id: "user_123",
    full_name: "Alya Tan",
    region: "MY",
    role: "Software Engineer",
    level: "L2",
    manager: "user_001",
    address: {
        line1: "",
        line2: "",
        city: "",
        state: "",
        postal_code: "",
        country: "",
    },
    last_updated: "2026-02-06",
};

/* ════════════ D11 STATIC DATA ════════════ */

const D11_STATIC = {
    employer_name: "WorkNest Inc.",
    employer_address: "Cyberjaya, Selangor, Malaysia",
    work_permit_duration: "24 months",
};

/* ════════════ STEP ICON SVGs ════════════ */

function StepIcon({ type, active, completed }) {
    const color = completed ? "#fff" : active ? "#fff" : "#94a3b8";
    const size = 22;

    const icons = {
        person: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
            </svg>
        ),
        upload: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
        ),
        document: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
        ),
        shield: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
        ),
        check: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
        ),
    };

    return icons[type] || null;
}

/* ════════════ PASSWORD VALIDATION ════════════ */

function checkPassword(pw, confirm) {
    return {
        length: pw.length >= 8,
        special: /[!@#$%^&*(),.?":{}|<>]/.test(pw),
        number: /\d/.test(pw),
        match: pw.length > 0 && pw === confirm,
    };
}

/* ════════════ MAIN COMPONENT ════════════ */

export default function OnboardingPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);

    // Step 1 state
    const [preferredName, setPreferredName] = useState("");
    const [region, setRegion] = useState(INITIAL_DATA.region);

    // Step 2 state
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [agreePolicy, setAgreePolicy] = useState(false);

    // Step 3 state
    const [passportFile, setPassportFile] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);

    // OCR state
    const [ocrData, setOcrData] = useState(null);
    const [ocrLoading, setOcrLoading] = useState(false);
    const [ocrError, setOcrError] = useState(null);

    const pwRules = checkPassword(password, confirmPassword);
    const emailPrefix = INITIAL_DATA.full_name.toLowerCase().replace(/\s+/g, ".");

    // D11 is generated for non-MY regions (handled by HR Dashboard)
    const needsD11 = region !== "MY";

    /* ── save onboarding to localStorage for HR Dashboard ── */
    const saveToHRDashboard = () => {
        const regionLabels = {
            MY: "🇲🇾 Malaysia", ID: "🇮🇩 Indonesia", PH: "🇵🇭 Philippines",
            SG: "🇸🇬 Singapore", UK: "🇬🇧 United Kingdom", IN: "🇮🇳 India",
        };

        const submission = {
            id: `EMP-2026-${String(Date.now()).slice(-3)}`,
            name: INITIAL_DATA.full_name,
            region: region,
            regionLabel: regionLabels[region] || region,
            role: INITIAL_DATA.role,
            level: INITIAL_DATA.level,
            startDate: new Date().toISOString().split("T")[0],
            submittedAt: new Date().toISOString(),
            passportUploaded: !!passportFile,
            d11Generated: needsD11 && !!ocrData,
            ocrData: ocrData || null,
        };

        try {
            const existing = JSON.parse(localStorage.getItem("hr_onboarding_submissions") || "[]");
            // Avoid duplicates based on name
            const filtered = existing.filter((e) => e.name !== submission.name);
            filtered.push(submission);
            localStorage.setItem("hr_onboarding_submissions", JSON.stringify(filtered));
        } catch (e) {
            console.error("Failed to save to localStorage:", e);
        }
    };

    /* ── navigation ── */
    const goNext = () => {
        // Save onboarding data when moving past upload step
        if (currentStep === 2) {
            saveToHRDashboard();
        }
        // After verification, go to dashboard
        if (currentStep === 3) {
            router.push("/");
            return;
        }
        setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
    };

    const goBack = () => setCurrentStep((s) => Math.max(s - 1, 0));

    /* ── OCR processing ── */
    const performOCR = async (file) => {
        setOcrLoading(true);
        setOcrError(null);
        setOcrData(null);

        try {
            // Convert file to base64
            const base64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    // Remove the data:...;base64, prefix
                    const result = reader.result.split(",")[1];
                    resolve(result);
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            const res = await fetch("/api/ocr", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: base64 }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "OCR request failed");
            }

            setOcrData(data.parsed);
        } catch (err) {
            console.error("OCR failed:", err);
            setOcrError(err.message);
        } finally {
            setOcrLoading(false);
        }
    };

    /* ── file handling ── */
    const handleFileDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer?.files?.[0] || e.target?.files?.[0];
        if (file) {
            setPassportFile(file);
            // Auto-trigger OCR for image files
            if (file.type.startsWith("image/")) {
                performOCR(file);
            }
        }
    };

    const removeFile = () => {
        setPassportFile(null);
        setOcrData(null);
        setOcrError(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    /* ── validation ── */
    const canContinueStep1 = INITIAL_DATA.full_name.trim().length > 0;
    const canContinueStep2 = pwRules.length && pwRules.special && pwRules.number && pwRules.match && agreePolicy;
    const canContinueStep3 = passportFile !== null;

    /* ── helpers ── */
    const fmtDate = () => new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    return (
        <div className="ob-shell">
            {/* ── Top Bar ── */}
            <header className="ob-topbar">
                <div className="ob-brand">
                    <div className="ob-brand-icon">WN</div>
                    <span>WorkNest</span>
                </div>
                <span className="ob-portal-label">Secure Onboarding Portal</span>
            </header>

            {/* ── Step Indicator ── */}
            <nav className="ob-stepper">
                {STEPS.map((step, i) => {

                    const isActive = i === currentStep;
                    const isCompleted = i < currentStep;

                    return (
                        <div key={step.key} className={`ob-step ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}>
                            <div className={`ob-step-circle ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}>
                                {isCompleted ? (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                ) : (
                                    <StepIcon type={step.icon} active={isActive} completed={isCompleted} />
                                )}
                            </div>
                            <span className={`ob-step-label ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </nav>

            {/* ── Step Content ── */}
            <div className="ob-content">

                {/* ═══════ STEP 1: SETUP ═══════ */}
                {currentStep === 0 && (
                    <div className="ob-card">
                        <h1 className="ob-card-title">Let&apos;s get you set up</h1>
                        <p className="ob-card-subtitle">We need a few details to configure your employee profile.</p>

                        <div className="ob-form">
                            <div className="ob-field">
                                <label className="ob-label">Legal Name</label>
                                <div className="ob-input-with-icon">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                                    </svg>
                                    <input type="text" className="ob-input" value={INITIAL_DATA.full_name} readOnly />
                                </div>
                                <span className="ob-hint">Matched to your offer letter. Contact HR to correct.</span>
                            </div>

                            <div className="ob-field">
                                <label className="ob-label">Preferred Name</label>
                                <input
                                    type="text"
                                    className="ob-input"
                                    placeholder="What should we call you at work?"
                                    value={preferredName}
                                    onChange={(e) => setPreferredName(e.target.value)}
                                />
                                <span className="ob-hint">This will be displayed in Slack, Email, and the company directory.</span>
                            </div>

                            <div className="ob-field">
                                <label className="ob-label">Region</label>
                                <select
                                    className="ob-select"
                                    value={region}
                                    onChange={(e) => setRegion(e.target.value)}
                                >
                                    <option value="MY">🇲🇾 Malaysia</option>
                                    <option value="ID">🇮🇩 Indonesia</option>
                                    <option value="PH">🇵🇭 Philippines</option>
                                    <option value="SG">🇸🇬 Singapore</option>
                                    <option value="UK">🇬🇧 United Kingdom</option>
                                    <option value="IN">🇮🇳 India</option>
                                </select>
                                <span className="ob-hint">Select the country you are from.</span>
                            </div>

                            <button className="ob-btn-primary" onClick={goNext} disabled={!canContinueStep1}>
                                Continue <span className="ob-btn-arrow">→</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* ═══════ STEP 2: CREATE WORK ACCOUNT ═══════ */}
                {currentStep === 1 && (
                    <div className="ob-card">
                        <h1 className="ob-card-title">Create your work account</h1>
                        <p className="ob-card-subtitle">Set up your credentials for accessing company systems.</p>

                        <div className="ob-form">
                            {/* Email (read-only) */}
                            <div className="ob-email-card">
                                <span className="ob-email-label">WORK EMAIL ADDRESS</span>
                                <div className="ob-email-row">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                        <polyline points="22,6 12,13 2,6" />
                                    </svg>
                                    <span className="ob-email-value">{emailPrefix}@company.com</span>
                                    <button className="ob-edit-link" type="button">Edit</button>
                                </div>
                                <span className="ob-hint" style={{ marginTop: 4 }}>This will be your primary login ID.</span>
                            </div>

                            {/* Password */}
                            <div className="ob-field">
                                <label className="ob-label">Password</label>
                                <div className="ob-input-with-icon">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                    <input
                                        type="password"
                                        className="ob-input"
                                        placeholder="Create a strong password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div className="ob-field">
                                <label className="ob-label">Confirm Password</label>
                                <div className="ob-input-with-icon">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                    <input
                                        type="password"
                                        className="ob-input"
                                        placeholder="Re-enter password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Password rules */}
                            <div className="ob-pw-rules">
                                <div className={`ob-pw-rule ${pwRules.length ? "pass" : ""}`}>
                                    <span className="ob-pw-dot" /> 8+ characters
                                </div>
                                <div className={`ob-pw-rule ${pwRules.number ? "pass" : ""}`}>
                                    <span className="ob-pw-dot" /> Contains number
                                </div>
                                <div className={`ob-pw-rule ${pwRules.special ? "pass" : ""}`}>
                                    <span className="ob-pw-dot" /> Special character
                                </div>
                                <div className={`ob-pw-rule ${pwRules.match ? "pass" : ""}`}>
                                    <span className="ob-pw-dot" /> Passwords match
                                </div>
                            </div>

                            {/* Policy checkbox */}
                            <label className="ob-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={agreePolicy}
                                    onChange={(e) => setAgreePolicy(e.target.checked)}
                                />
                                I agree to the <a href="#" className="ob-link">Company IT Policy</a> and Acceptable Use Guidelines.
                            </label>

                            <div className="ob-btn-row">
                                <button className="ob-btn-secondary" onClick={goBack}>Back</button>
                                <button className="ob-btn-primary" onClick={goNext} disabled={!canContinueStep2}>
                                    Create Account <span className="ob-btn-arrow">→</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══════ STEP 3: UPLOAD DOCUMENT ═══════ */}
                {currentStep === 2 && (
                    <div className="ob-card">
                        <h1 className="ob-card-title">Upload Documents</h1>
                        <p className="ob-card-subtitle">Securely upload your identification and banking details.</p>

                        <div className="ob-form">
                            {/* Passport upload */}
                            <div
                                className={`ob-dropzone ${dragOver ? "drag-over" : ""} ${passportFile ? "has-file" : ""}`}
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleFileDrop}
                                onClick={() => !passportFile && fileInputRef.current?.click()}
                            >
                                {passportFile ? (
                                    <div className="ob-file-preview">
                                        <div className="ob-file-icon">📄</div>
                                        <div className="ob-file-info">
                                            <strong>{passportFile.name}</strong>
                                            <span>{(passportFile.size / 1024).toFixed(1)} KB</span>
                                        </div>
                                        <button className="ob-file-remove" type="button" onClick={(e) => { e.stopPropagation(); removeFile(); }}>✕</button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="ob-dropzone-icon">
                                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                <polyline points="17 8 12 3 7 8" />
                                                <line x1="12" y1="3" x2="12" y2="15" />
                                            </svg>
                                        </div>
                                        <strong>Upload Passport <span style={{ color: "#ef4444" }}>*</span></strong>
                                        <span className="ob-dropzone-hint">Drag and drop or click to browse</span>
                                    </>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*,.pdf"
                                    style={{ display: "none" }}
                                    onChange={handleFileDrop}
                                />
                            </div>

                            {/* OCR Status */}
                            {ocrLoading && (
                                <div className="ob-ocr-status loading">
                                    <div className="ob-ocr-spinner" />
                                    <span>Extracting passport data with AI...</span>
                                </div>
                            )}

                            {ocrError && (
                                <div className="ob-ocr-status error">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                                    </svg>
                                    <span>{ocrError}</span>
                                    <button className="ob-ocr-retry" onClick={() => passportFile && performOCR(passportFile)}>Retry</button>
                                </div>
                            )}

                            {ocrData && !ocrLoading && (
                                <div className="ob-ocr-preview">
                                    <div className="ob-ocr-preview-header">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                        <span>Passport data extracted</span>
                                    </div>
                                    <div className="ob-ocr-preview-grid">
                                        {ocrData.full_name && <div className="ob-ocr-field"><span className="ob-ocr-field-label">Name</span><span>{ocrData.full_name}</span></div>}
                                        {ocrData.passport_number && <div className="ob-ocr-field"><span className="ob-ocr-field-label">Passport</span><span>{ocrData.passport_number}</span></div>}
                                        {ocrData.nationality && <div className="ob-ocr-field"><span className="ob-ocr-field-label">Nationality</span><span>{ocrData.nationality}</span></div>}
                                        {ocrData.date_of_birth && <div className="ob-ocr-field"><span className="ob-ocr-field-label">DOB</span><span>{ocrData.date_of_birth}</span></div>}
                                        {ocrData.gender && <div className="ob-ocr-field"><span className="ob-ocr-field-label">Gender</span><span>{ocrData.gender}</span></div>}
                                        {ocrData.passport_expiry && <div className="ob-ocr-field"><span className="ob-ocr-field-label">Expiry</span><span>{ocrData.passport_expiry}</span></div>}
                                    </div>
                                </div>
                            )}

                            <div className="ob-btn-row">
                                <button className="ob-btn-secondary" onClick={goBack}>Back</button>
                                <button className="ob-btn-primary" onClick={goNext} disabled={!canContinueStep3}>
                                    Submit for Verification <span className="ob-btn-arrow">→</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══════ STEP 4: SUBMITTED FOR VERIFICATION ═══════ */}
                {currentStep === 3 && (
                    <div className="ob-card ob-card-center">
                        <div className="ob-check-circle">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                        </div>
                        <h1 className="ob-card-title" style={{ textAlign: "center" }}>Submitted for Verification</h1>
                        <p className="ob-card-subtitle" style={{ textAlign: "center", maxWidth: 440, margin: "0 auto" }}>
                            Your documents have been securely received. Our AI and HR team will review them shortly.
                        </p>

                        {/* Timeline */}
                        <div className="ob-timeline-card">
                            <span className="ob-timeline-title">TIMELINE</span>
                            <div className="ob-timeline">
                                <div className="ob-timeline-item">
                                    <div className="ob-timeline-dot done">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    </div>
                                    <div className="ob-timeline-text">
                                        <strong>Submission Received</strong>
                                        <span>Just now</span>
                                    </div>
                                </div>
                                <div className="ob-timeline-item">
                                    <div className="ob-timeline-dot in-progress">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                                        </svg>
                                    </div>
                                    <div className="ob-timeline-text">
                                        <strong>AI Verification</strong>
                                        <span>In progress...</span>
                                    </div>
                                </div>
                                <div className="ob-timeline-item last">
                                    <div className="ob-timeline-dot pending">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                                        </svg>
                                    </div>
                                    <div className="ob-timeline-text">
                                        <strong>HR Review</strong>
                                        <span>Pending</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button className="ob-btn-primary ob-btn-wide" onClick={goNext}>
                            Go to Dashboard <span className="ob-btn-arrow">→</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
