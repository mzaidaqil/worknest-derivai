"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_BASE_URL = "https://hr-rag-1v1j.onrender.com";

/* ───────── helpers ───────── */

function createMessage(role, content, meta) {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role,
    content,
    ts: new Date(),
    ...(meta || {})
  };
}

function extractReply(payload) {
  if (!payload || typeof payload !== "object") return "";
  return (
    payload.text ||
    payload.reply ||
    payload.answer ||
    payload.message ||
    payload.output ||
    ""
  );
}

function fmtTime(date) {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

/* ───────── escalation scenarios ───────── */

const ESCALATION_SCENARIOS = {
  compensation: {
    triggers: [
      "compensation",
      "salary",
      "pay raise",
      "pay increase",
      "bonus",
      "pay cut",
      "wage"
    ],
    approver: {
      name: "Sarah Chen",
      role: "HR Manager, Compensation & Benefits",
      initials: "SC"
    },
    category: "Compensation Adjustment",
    priority: "High",
    assistantReply:
      "I understand you'd like to discuss a compensation adjustment. This is a sensitive request that requires HR review and cannot be processed automatically by the AI assistant.\n\nLet me route this to the right approver for you.",
    routingReply:
      "I've identified Sarah Chen (HR Manager, Compensation & Benefits) as the appropriate approver for compensation-related requests. Routing now...",
    hrGreeting:
      "Hi Aiman, I've received your compensation adjustment request. I'll review this against our current compensation bands and your recent performance reviews. I'll follow up within 24 hours with next steps.",
    hrResolution:
      "I've completed my initial review. Based on your performance rating (Exceeds Expectations) and current market data, I'm scheduling a compensation review meeting for next week. You'll receive a calendar invite shortly. Approved for review."
  },
  leave: {
    triggers: [
      "annual leave",
      "leave request",
      "vacation",
      "time off",
      "sick leave",
      "request leave",
      "day off"
    ],
    approver: {
      name: "David Park",
      role: "Line Manager, Design Team",
      initials: "DP"
    },
    category: "Leave Request",
    priority: "Medium",
    assistantReply:
      "I can help you with a leave request. Since leave approvals require manager sign-off per company policy, I'll need to route this to your line manager.\n\nLet me identify the right approver.",
    routingReply:
      "I've identified David Park (Line Manager, Design Team) as your direct approver for leave requests. Routing now...",
    hrGreeting:
      "Hi Aiman, I see you'd like to request time off. Could you confirm the dates you have in mind? I'll check team coverage and get back to you.",
    hrResolution:
      "I've checked the team calendar and we have sufficient coverage. Your leave request is approved. I'll update the system and you'll see it reflected in your leave balance. Enjoy your time off!"
  },
  escalate: {
    triggers: [
      "escalate to hr",
      "escalate",
      "speak to hr",
      "talk to hr",
      "hr help",
      "need hr",
      "human help",
      "speak to someone"
    ],
    approver: {
      name: "Sarah Chen",
      role: "HR Manager",
      initials: "SC"
    },
    category: "HR Escalation",
    priority: "High",
    assistantReply:
      "I understand you'd like to speak with HR directly. Let me escalate this conversation to an HR representative who can assist you further.",
    routingReply:
      "I've routed this to Sarah Chen (HR Manager). She'll join this conversation shortly.",
    hrGreeting:
      "Hi Aiman, I've been looped in on your request. I'm here to help — could you give me a bit more detail about what you need?",
    hrResolution:
      "Thank you for the details. I've noted everything and will take the appropriate action. You'll receive an email confirmation shortly. Is there anything else I can help with?"
  },
  offer_letter: {
    triggers: [
      "offer letter",
      "employment letter",
      "generate letter",
      "generate offer",
      "employment contract",
      "generate contract",
      "grant letter",
      "vesting schedule",
      "exercise agreement",
      "equity document"
    ],
    approver: {
      name: "Maria Torres",
      role: "HR Director, People Operations",
      initials: "MT"
    },
    category: "Document Generation",
    priority: "Medium",
    assistantReply:
      "I can help with document generation! You can use our Intelligent Document Generation system to create employment contracts, equity grant letters, vesting schedules, and exercise agreements — all localized to the correct jurisdiction.\n\nLet me route this for HR approval, or you can go directly to the Documents page to generate documents from structured data.",
    routingReply:
      "I've identified Maria Torres (HR Director, People Operations) as the approver for document generation requests. You can also visit the Documents page to use the self-service document generator. Routing now...",
    hrGreeting:
      "Hi Aiman, I've received the document generation request. I'll verify the details and compensation package before proceeding. You can also visit the Documents section to preview and generate documents directly from structured data.",
    hrResolution:
      "I've reviewed and approved the document generation. The document has been drafted and is ready for your review in the Documents section. You can access all generated documents, track versions, and download localized contracts there."
  }
};

function detectEscalation(text) {
  const lower = (text || "").toLowerCase();
  for (const [key, scenario] of Object.entries(ESCALATION_SCENARIOS)) {
    if (scenario.triggers.some((t) => lower.includes(t))) {
      return { key, ...scenario };
    }
  }
  return null;
}

/* ───────── main component ───────── */

export default function Home() {
  const [messages, setMessages] = useState([
    createMessage(
      "assistant",
      "Hi Aiman. I can help you update your profile, request leave, or generate documents. What do you need help with today?"
    )
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [health, setHealth] = useState("unknown");

  // Workflow & address form
  const [activeWorkflow, setActiveWorkflow] = useState(null);
  const [addressForm, setAddressForm] = useState({
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: ""
  });

  // Tabs + audit + approvals
  const [activeTab, setActiveTab] = useState("details");
  const [auditTrail, setAuditTrail] = useState([]);
  const [approvals, setApprovals] = useState([]);

  const bottomRef = useRef(null);
  const timeoutsRef = useRef([]);

  const apiBaseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_CHATBOT_API_URL || DEFAULT_BASE_URL,
    []
  );

  /* ── clean up timers on unmount ── */
  useEffect(() => {
    return () => timeoutsRef.current.forEach(clearTimeout);
  }, []);

  /* ── health check ── */
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/healthz", { cache: "no-store" });
        setHealth(r.ok ? "online" : "offline");
      } catch {
        setHealth("offline");
      }
    })();
  }, []);

  /* ── auto-scroll ── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  /* ── audit helper ── */
  const addAudit = useCallback((action, actor, details) => {
    setAuditTrail((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), ts: new Date(), action, actor, details }
    ]);
  }, []);

  /* ── schedule a delayed callback (cleaned up on unmount) ── */
  const delay = useCallback((ms, fn) => {
    const id = setTimeout(fn, ms);
    timeoutsRef.current.push(id);
    return id;
  }, []);

  /* ── escalation flow ── */
  const runEscalation = useCallback(
    (scenario, userText) => {
      setIsLoading(true);

      // 1. Audit: request received
      addAudit("Request received", "System", userText);
      addAudit(
        "AI classification",
        "WorkNest AI",
        `Classified as "${scenario.category}" — requires human approval`
      );

      // 2. Assistant: "I can't handle this, routing..."
      delay(800, () => {
        setMessages((prev) => [
          ...prev,
          createMessage("assistant", scenario.assistantReply)
        ]);
        addAudit(
          "Approver identified",
          "WorkNest AI",
          `${scenario.approver.name} (${scenario.approver.role})`
        );
      });

      // 3. Assistant: routing message
      delay(2500, () => {
        setMessages((prev) => [
          ...prev,
          createMessage("assistant", scenario.routingReply, { isRouting: true })
        ]);
        addAudit(
          "Request routed",
          "WorkNest AI",
          `Sent to ${scenario.approver.name}`
        );

        // Create approval record
        const approvalId = `APR-${Date.now().toString(36).toUpperCase()}`;
        setApprovals((prev) => [
          ...prev,
          {
            id: approvalId,
            category: scenario.category,
            priority: scenario.priority,
            approver: scenario.approver,
            status: "pending",
            createdAt: new Date(),
            description: userText
          }
        ]);

        // Switch to workflow view
        setActiveWorkflow({
          route: "escalation",
          category: scenario.category,
          approver: scenario.approver,
          priority: scenario.priority
        });
        setActiveTab("approvals");
      });

      // 4. HR joins the conversation
      delay(5000, () => {
        setMessages((prev) => [
          ...prev,
          createMessage("hr", scenario.hrGreeting, {
            actor: scenario.approver
          })
        ]);
        addAudit(
          "HR joined conversation",
          scenario.approver.name,
          "Reviewing the request"
        );
        setIsLoading(false);
      });

      // 5. HR resolves
      delay(10000, () => {
        setMessages((prev) => [
          ...prev,
          createMessage("hr", scenario.hrResolution, {
            actor: scenario.approver
          })
        ]);
        addAudit(
          "Request resolved",
          scenario.approver.name,
          "Approved / Action taken"
        );

        // Update approval status
        setApprovals((prev) =>
          prev.map((a) =>
            a.status === "pending"
              ? { ...a, status: "approved", resolvedAt: new Date() }
              : a
          )
        );
        setActiveTab("audit");
      });
    },
    [addAudit, delay]
  );

  /* ── send message ── */
  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMessage = createMessage("user", trimmed);
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Check for escalation triggers first
    const escalation = detectEscalation(trimmed);
    if (escalation) {
      addAudit("Message sent", "Aiman Miller", trimmed);
      runEscalation(escalation, trimmed);
      return; // escalation flow handles setIsLoading
    }

    // Normal backend flow
    try {
      addAudit("Message sent", "Aiman Miller", trimmed);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed })
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const errMsg =
          payload?.error ||
          payload?.detail ||
          (response.status === 500
            ? "The AI service is temporarily unavailable. Please try again later."
            : `Backend error (${response.status})`);

        console.error("[chat] backend error:", response.status, payload);
        throw new Error(errMsg);
      }

      const reply = extractReply(payload) || "I did not receive a response.";
      setMessages((prev) => [...prev, createMessage("assistant", reply)]);
      addAudit("Response received", "WorkNest AI", reply.slice(0, 80) + "...");

      // Only activate workflow if the route is valid and relevant to the user's message
      // For "updateAddress" route, only trigger if user explicitly mentioned address-related keywords
      if (payload?.route) {
        const lowerMessage = trimmed.toLowerCase();
        const shouldActivateWorkflow =
          payload.route !== "updateAddress" ||
          ["change address", "update address", "new address", "change my address", "update my address", "move to", "moved to", "relocate", "relocation"].some(
            keyword => lowerMessage.includes(keyword)
          );

        if (shouldActivateWorkflow) {
          setActiveWorkflow({
            route: payload.route,
            text: payload.text || reply
          });
          addAudit(
            "Workflow activated",
            "System",
            `Route: ${payload.route}`
          );
        }
      }
    } catch (error) {
      console.error("[chat] error:", error);
      setMessages((prev) => [
        ...prev,
        createMessage(
          "assistant",
          `Sorry, something went wrong: ${error.message}`
        )
      ]);
      addAudit("Error", "System", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput("");
    await sendMessage(trimmed);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    setMessages([
      createMessage(
        "assistant",
        "Hi Aiman. I can help you update your profile, request leave, or generate documents. What do you need help with today?"
      )
    ]);
    setActiveWorkflow(null);
    setAddressForm({
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      postal_code: "",
      country: ""
    });
    setAuditTrail([]);
    setApprovals([]);
    setActiveTab("details");
  };

  const handleAddressChange = (field, value) => {
    setAddressForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    const payload = [
      `address_line1: ${addressForm.address_line1}`,
      addressForm.address_line2
        ? `address_line2: ${addressForm.address_line2}`
        : null,
      `city: ${addressForm.city}`,
      `state: ${addressForm.state}`,
      `postal_code: ${addressForm.postal_code}`,
      `country: ${addressForm.country}`
    ]
      .filter(Boolean)
      .join("\n");
    await sendMessage(payload);
  };

  /* ───────── render ───────── */

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
          <Link href="/assistant" className="nav-item nav-link active">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            Assistant
          </Link>
          <Link href="/profile" className="nav-item nav-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            Profile
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
            {/* Search removed */}
          </div>
          <div className="top-actions">
            <button className="icon-button" type="button">
              &#x1F514;
            </button>
            <button className="icon-button" type="button">
              ?
            </button>
            <div className="avatar small">AM</div>
          </div>
        </header>

        <div className="banner">
          <span className="shield">&#x1F6E1;&#xFE0F;</span>
          WorkNest Assistant can make mistakes. Check important info.
        </div>

        <div className="workspace">
          {/* ════════════ CHAT PANEL ════════════ */}
          <section className="panel chat-panel">
            <header className="panel-header">
              <div className="panel-title">
                <div className="assistant-icon">&#x1F916;</div>
                <div>
                  <h2>WorkNest Assistant</h2>
                  <div className={`status ${health}`}>
                    <span className="dot" />
                    {health}
                  </div>
                </div>
              </div>
              <button className="ghost" type="button">
                History
              </button>
            </header>

            {/* ── messages ── */}
            <section className="messages">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`bubble ${msg.role}${msg.isRouting ? " routing" : ""}`}
                >
                  {msg.role === "hr" && msg.actor ? (
                    <span className="role hr-role">
                      <span className="hr-badge">HR</span>
                      {msg.actor.name} &middot; {msg.actor.role}
                    </span>
                  ) : (
                    <span className="role">{msg.role}</span>
                  )}
                  <p>{msg.content}</p>
                  <span className="msg-time">{fmtTime(msg.ts)}</span>
                </div>
              ))}
              {isLoading && (
                <div className="bubble assistant">
                  <span className="role">assistant</span>
                  <p className="typing">
                    <span />
                    <span />
                    <span />
                  </p>
                </div>
              )}
              <div ref={bottomRef} />
            </section>

            {/* ── quick actions ── */}
            <div className="quick-actions">
              <button
                type="button"
                onClick={() => setInput("Update my address")}
              >
                Update my address
              </button>
              <button
                type="button"
                onClick={() => setInput("Request annual leave")}
              >
                Request annual leave
              </button>
              <button
                type="button"
                onClick={() => setInput("Generate employment contract")}
              >
                Generate contract
              </button>
              <button
                type="button"
                onClick={() => setInput("Escalate to HR")}
              >
                Escalate to HR
              </button>
            </div>

            {/* ── composer ── */}
            <section className="composer">
              <div className="composer-row">
                <textarea
                  className="input"
                  placeholder="Type a message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                />
                <button
                  className="send"
                  type="button"
                  onClick={handleSend}
                  disabled={isLoading}
                >
                  &#x27A4;
                </button>
              </div>
              <div className="composer-actions">
                <button className="ghost" type="button" onClick={handleReset}>
                  Reset
                </button>

              </div>
            </section>
          </section>

          {/* ════════════ DETAILS / APPROVALS / AUDIT ════════════ */}
          <section className="panel details-panel">
            <header className="tabs">
              {["details", "approvals", "audit"].map((tab) => (
                <button
                  key={tab}
                  className={`tab${activeTab === tab ? " active" : ""}${tab === "approvals" && approvals.length > 0
                    ? " has-badge"
                    : ""
                    }`}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === "details"
                    ? "Details"
                    : tab === "approvals"
                      ? `Approvals${approvals.length ? ` (${approvals.length})` : ""}`
                      : `Audit Trail${auditTrail.length ? ` (${auditTrail.length})` : ""}`}
                </button>
              ))}
            </header>

            {/* ──── DETAILS TAB ──── */}
            {activeTab === "details" && (
              <>
                {activeWorkflow?.route === "updateAddress" ? (
                  <div className="workflow">
                    <div className="workflow-header">
                      <span className="pill">Update Residential Address</span>
                    </div>
                    <form
                      className="address-form"
                      onSubmit={handleAddressSubmit}
                    >
                      <label>
                        Street Address
                        <input
                          type="text"
                          value={addressForm.address_line1}
                          onChange={(e) =>
                            handleAddressChange("address_line1", e.target.value)
                          }
                          placeholder="123 Main St"
                          required
                        />
                      </label>
                      <label>
                        Address Line 2
                        <input
                          type="text"
                          value={addressForm.address_line2}
                          onChange={(e) =>
                            handleAddressChange("address_line2", e.target.value)
                          }
                          placeholder="Apt 3"
                        />
                      </label>
                      <div className="grid">
                        <label>
                          City
                          <input
                            type="text"
                            value={addressForm.city}
                            onChange={(e) =>
                              handleAddressChange("city", e.target.value)
                            }
                            placeholder="New York"
                            required
                          />
                        </label>
                        <label>
                          Zip / Postcode
                          <input
                            type="text"
                            value={addressForm.postal_code}
                            onChange={(e) =>
                              handleAddressChange("postal_code", e.target.value)
                            }
                            placeholder="10001"
                            required
                          />
                        </label>
                      </div>
                      <div className="grid">
                        <label>
                          State
                          <input
                            type="text"
                            value={addressForm.state}
                            onChange={(e) =>
                              handleAddressChange("state", e.target.value)
                            }
                            placeholder="NY"
                            required
                          />
                        </label>
                        <label>
                          Country
                          <input
                            type="text"
                            value={addressForm.country}
                            onChange={(e) =>
                              handleAddressChange("country", e.target.value)
                            }
                            placeholder="US"
                            required
                          />
                        </label>
                      </div>
                      <button
                        className="primary"
                        type="submit"
                        disabled={isLoading}
                      >
                        Submit Change Request
                      </button>
                    </form>
                  </div>
                ) : activeWorkflow?.route === "escalation" ? (
                  <div className="workflow">
                    <div className="workflow-header">
                      <span className="pill escalation">
                        {activeWorkflow.category}
                      </span>
                      <span
                        className={`priority-badge ${activeWorkflow.priority?.toLowerCase()}`}
                      >
                        {activeWorkflow.priority}
                      </span>
                    </div>
                    <div className="escalation-card">
                      <div className="escalation-row">
                        <span className="escalation-label">Status</span>
                        <span className="escalation-value status-routed">
                          Routed to Approver
                        </span>
                      </div>
                      <div className="escalation-row">
                        <span className="escalation-label">Approver</span>
                        <div className="approver-chip">
                          <div className="avatar small accent">
                            {activeWorkflow.approver.initials}
                          </div>
                          <div>
                            <strong>{activeWorkflow.approver.name}</strong>
                            <span>{activeWorkflow.approver.role}</span>
                          </div>
                        </div>
                      </div>
                      <div className="escalation-row">
                        <span className="escalation-label">Category</span>
                        <span className="escalation-value">
                          {activeWorkflow.category}
                        </span>
                      </div>
                      <div className="escalation-row">
                        <span className="escalation-label">
                          Routing Method
                        </span>
                        <span className="escalation-value">
                          AI Auto-Classification
                        </span>
                      </div>
                    </div>
                  </div>
                ) : activeWorkflow ? (
                  <div className="workflow">
                    <div className="workflow-header">
                      <span className="pill">{activeWorkflow.route}</span>
                    </div>
                    <p className="workflow-text">{activeWorkflow.text}</p>
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="assistant-icon muted">&#x1F916;</div>
                    <h3>No active workflow</h3>
                    <p>Start a conversation to trigger an action.</p>
                  </div>
                )}
              </>
            )}

            {/* ──── APPROVALS TAB ──── */}
            {activeTab === "approvals" && (
              <div className="approvals-list">
                {approvals.length === 0 ? (
                  <div className="empty-state">
                    <h3>No pending approvals</h3>
                    <p>
                      Approval requests will appear here when the assistant
                      escalates a workflow.
                    </p>
                  </div>
                ) : (
                  approvals.map((a) => (
                    <div
                      key={a.id}
                      className={`approval-card ${a.status}`}
                    >
                      <div className="approval-top">
                        <span className="pill small">{a.category}</span>
                        <span
                          className={`approval-status ${a.status}`}
                        >
                          {a.status === "pending"
                            ? "Pending"
                            : a.status === "approved"
                              ? "Approved"
                              : "Rejected"}
                        </span>
                      </div>
                      <p className="approval-desc">{a.description}</p>
                      <div className="approver-chip compact">
                        <div className="avatar tiny accent">
                          {a.approver.initials}
                        </div>
                        <div>
                          <strong>{a.approver.name}</strong>
                          <span>{a.approver.role}</span>
                        </div>
                      </div>
                      <div className="approval-meta">
                        <span>ID: {a.id}</span>
                        <span>
                          {a.status === "approved" && a.resolvedAt
                            ? `Resolved ${fmtTime(a.resolvedAt)}`
                            : `Created ${fmtTime(a.createdAt)}`}
                        </span>
                      </div>
                      {a.priority && (
                        <span
                          className={`priority-badge small ${a.priority.toLowerCase()}`}
                        >
                          {a.priority} Priority
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ──── AUDIT TRAIL TAB ──── */}
            {activeTab === "audit" && (
              <div className="audit-list">
                {auditTrail.length === 0 ? (
                  <div className="empty-state">
                    <h3>No activity yet</h3>
                    <p>
                      Every action — messages, routing decisions, and
                      approvals — is logged here automatically.
                    </p>
                  </div>
                ) : (
                  auditTrail.map((entry, i) => (
                    <div key={entry.id} className="audit-entry">
                      <div className="audit-line">
                        {i < auditTrail.length - 1 && (
                          <span className="audit-connector" />
                        )}
                        <span
                          className={`audit-dot ${entry.action.toLowerCase().includes("error")
                            ? "error"
                            : entry.action
                              .toLowerCase()
                              .includes("resolved") ||
                              entry.action
                                .toLowerCase()
                                .includes("approved")
                              ? "success"
                              : entry.action
                                .toLowerCase()
                                .includes("hr joined")
                                ? "hr"
                                : ""
                            }`}
                        />
                      </div>
                      <div className="audit-body">
                        <div className="audit-header">
                          <strong>{entry.action}</strong>
                          <span className="audit-time">
                            {fmtTime(entry.ts)}
                          </span>
                        </div>
                        <span className="audit-actor">{entry.actor}</span>
                        {entry.details && (
                          <p className="audit-details">{entry.details}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
