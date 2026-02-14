export const EMPLOYEE_PROFILE = {
    name: "Aiman Miller",
    id: "T001",
    department: "Engineering",
    role: "Senior Designer",
    location: "Cyberjaya, Malaysia"
};

export const COMPLIANCE_DATA = {
    expirations: [
        { type: "Work Visa (EP Category I)", expiry: "2026-08-15", status: "good", daysLeft: 186 },
        { type: "Passport", expiry: "2027-04-10", status: "good", daysLeft: 424 },
        { type: "Health & Safety Cert", expiry: "2026-03-01", status: "warning", daysLeft: 14 },
        { type: "MacBook Pro Return", expiry: "2026-02-15", status: "critical", daysLeft: 7 }
    ],
    trainings: [
        { module: "Data Privacy & GDPR", deadline: "2026-02-28", status: "In Progress", progress: 60, required: true },
        { module: "Anti-Harassment Policy", deadline: "2026-03-15", status: "Not Started", progress: 0, required: true },
        { module: "Cybersecurity Awareness", deadline: "2026-01-30", status: "Overdue", progress: 10, required: true },
        { module: "Code of Conduct", deadline: "2025-12-15", status: "Completed", progress: 100, required: true }
    ],
    audit_docs: [
        { name: "Tax Clearance Form (CP22)", date: "2025-12-01", size: "1.2 MB" },
        { name: "Annual Performance Review 2025", date: "2025-11-20", size: "850 KB" },
        { name: "Right to Work Check", date: "2025-01-10", size: "2.4 MB" }
    ]
};
