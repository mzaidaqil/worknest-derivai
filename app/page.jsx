"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

/* ════════════ MOCK DATA ════════════ */

const NEWS = [
  {
    id: 1,
    title: "Global Townhall: Q3 Financial Results",
    summary: "Join us this Friday for a review of our Q3 performance and a look ahead at Q4 goals. CEO and CFO will be presenting.",
    date: "2026-02-12",
    tag: "All Hands"
  },
  {
    id: 2,
    title: "Welcome our new CTO, Sarah Jenks",
    summary: "We are thrilled to announce Sarah Jenks is joining as our new Chief Technology Officer. Sarah brings 15 years of experience from TechGiant Inc.",
    date: "2026-02-10",
    tag: "HR Announcement"
  },
  {
    id: 3,
    title: "New 'Work from Anywhere' Policy",
    summary: "Effective immediately, employees can work from any location for up to 4 weeks per year. Check the policy handbook for details.",
    date: "2026-02-05",
    tag: "Policy Update"
  }
];

const EVENTS = [
  { id: 1, title: "Hiking Trip: Bukit Tabur", icon: "⛰️", time: "Sat, Feb 14 · 7:00 AM" },
  { id: 2, title: "Hackathon 2026 Registration", icon: "💻", time: "Ends Feb 20 · 5:00 PM" },
  { id: 3, title: "Scrum Team Lunch", icon: "🍕", time: "Wed, Feb 18 · 12:30 PM" }
];

const REQUESTS = [
  { id: 1, title: "Annual Leave", date: "Feb 5, 2026", status: "Approved" },
  { id: 2, title: "MacBook Pro M4", date: "Jan 28, 2026", status: "Processing" },
  { id: 3, title: "Expense Claim #4022", date: "Jan 15, 2026", status: "Paid" }
];

const REMINDERS = [
  { id: 1, text: "Complete 'Data Security' training", urgent: true, due: "Due Tomorrow" },
  { id: 2, text: "Submit performance self-review", urgent: false, due: "Due in 3 days" },
  { id: 3, text: "Update emergency contact info", urgent: false, due: "Action Required" }
];

const QUOTES = [
  "Creativity is intelligence having fun. – Albert Einstein",
  "The only way to do great work is to love what you do. – Steve Jobs",
  "Don't watch the clock; do what it does. Keep going. – Sam Levenson"
];

/* ════════════ HELPER FUNCTIONS ════════════ */

function getDay(d) { return new Date(d).getDate(); }
function getMonth(d) { return new Date(d).toLocaleString('default', { month: 'short' }); }

export default function Dashboard() {
  const [quote, setQuote] = useState(QUOTES[0]);

  useEffect(() => {
    // Random quote on mount
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  }, []);

  return (
    <main className="shell">
      {/* ── sidebar ── */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">WN</div>
          <span>WorkNest</span>
        </div>
        <nav className="nav">
          <Link href="/" className="nav-item nav-link active">
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
          <Link href="/hr-dashboard" className="nav-item nav-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            HR Dashboard
          </Link>
        </nav>
        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="avatar">AM</div>
            <div>
              <p>Aiman Miller</p>
              <span>Senior Designer</span>
            </div>
          </div>
        </div>
      </aside>

      <div className="content">
        {/* ── top bar ── */}
        <header className="topbar">
          <div className="search" style={{ visibility: "hidden" }}>
            {/* Search removed as requested */}
          </div>
          <div className="top-actions">
            <button className="icon-button" type="button">&#x1F514;</button>
            <div className="avatar small">AM</div>
          </div>
        </header>

        {/* ── DASHBOARD GRID ── */}
        <div className="dashboard-grid">

          {/* Welcome Banner */}
          <section className="welcome-section">
            <div className="welcome-content">
              <h1 className="welcome-title">Welcome back, Aiman! 👋</h1>
              <p className="welcome-subtitle">Here's what's happening at WorkNest today. You have 2 pending tasks and 1 upcoming event.</p>
              <div className="welcome-quote">"{quote}"</div>
            </div>
          </section>

          {/* LEFT COLUMN (8 cols) */}
          <div className="col-span-8" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>



            {/* My Requests Tracker */}
            <div className="dashboard-card">
              <div className="section-title">
                <span>My Requests</span>
                <Link href="/profile" className="section-link">View All</Link>
              </div>
              <div className="request-mini-list">
                {REQUESTS.map(req => (
                  <div key={req.id} className="request-mini-item">
                    <div className="request-info">
                      <strong>{req.title}</strong>
                      <small>{req.date}</small>
                    </div>
                    <span className={`status-pill ${req.status === 'Approved' ? 'good' : req.status === 'Paid' ? 'good' : 'warn'}`}>
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Company News */}
            <div className="dashboard-card">
              <div className="section-title">
                <span>Company News</span>
                <Link href="#" className="section-link">View Archive</Link>
              </div>
              <div className="news-list">
                {NEWS.map(news => (
                  <div key={news.id} className="news-item">
                    <div className="news-date">
                      <span className="news-day">{getDay(news.date)}</span>
                      <span className="news-month">{getMonth(news.date)}</span>
                    </div>
                    <div className="news-content">
                      <h4>{news.title}</h4>
                      <p>{news.summary}</p>
                      <div className="news-meta">
                        <span className="news-tag">{news.tag}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN (4 cols) */}
          <div className="col-span-4" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Compliance Widget */}
            <div className="dashboard-card">
              <div className="section-title">
                <span>Compliance Health</span>
                <Link href="/profile" className="section-link">Check</Link>
              </div>
              <div className="compliance-widget">
                <div className="compliance-score">
                  <div className="score-circle">A</div>
                  <div className="score-text">
                    <h4>Good Standing</h4>
                    <span>All items up to date</span>
                  </div>
                </div>
                <div className="compliance-mini-list">
                  <div className="compliance-mini-item">
                    <span>Work Visa</span>
                    <span className="status-pill good">Valid</span>
                  </div>
                  <div className="compliance-mini-item">
                    <span>Code of Conduct</span>
                    <span className="status-pill good">Signed</span>
                  </div>
                  <div className="compliance-mini-item">
                    <span>IT Security</span>
                    <span className="status-pill warn">Expiring Soon</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Reminders */}
            <div className="dashboard-card">
              <h3 className="section-title">Reminders</h3>
              <div className="reminder-list">
                {REMINDERS.map(rem => (
                  <div key={rem.id} className={`reminder-item ${rem.urgent ? 'urgent' : ''}`}>
                    <div className="reminder-icon">{rem.urgent ? '🔴' : '🟡'}</div>
                    <div className="reminder-content">
                      <div className="reminder-text">{rem.text}</div>
                      <span className="reminder-time">{rem.due}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Events */}
            <div className="dashboard-card">
              <div className="section-title">
                <span>Upcoming Activities</span>
                <Link href="#" className="section-link">Calendar</Link>
              </div>
              <div className="event-list">
                {EVENTS.map(ev => (
                  <div key={ev.id} className="event-card">
                    <div className="event-icon">{ev.icon}</div>
                    <div className="event-info">
                      <h5>{ev.title}</h5>
                      <span>{ev.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
    </main>
  );
}
