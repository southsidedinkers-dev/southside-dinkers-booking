import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { sendConfirmedEmail } from "./emailClient";

const COLORS = {
  navy: "#1B2E57",
  green: "#8CC63F",
  bg: "#F4F5F0",
  border: "#E4E6DD",
  muted: "#6E7788",
};

const COURT_OPTIONS = ["Court 1"];
const RECLUB_URL = "https://reclub.co/clubs/@southside-dinkers-2";

function peso(n) {
  return "₱" + Number(n).toLocaleString("en-PH");
}

function fmtHour(h) {
  const norm = ((h % 24) + 24) % 24;
  if (norm === 0) return "12:00 AM";
  if (norm === 12) return "12:00 PM";
  const ap = norm < 12 ? "AM" : "PM";
  const hh = norm % 12;
  return hh + ":00 " + ap;
}

function formatHours(hours) {
  if (!Array.isArray(hours) || hours.length === 0) return "";
  const sorted = [...hours].sort((a, b) => a - b);
  const ranges = [];
  let start = sorted[0], end = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) {
      end = sorted[i];
    } else {
      ranges.push(fmtHour(start) + " - " + fmtHour(end + 1));
      start = sorted[i];
      end = sorted[i];
    }
  }
  ranges.push(fmtHour(start) + " - " + fmtHour(end + 1));
  return ranges.join(", ");
}

function formatDateNice(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}


// ── CALENDAR PICKER COMPONENT ──
function CalendarPicker({ blockDates, setBlockDates }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build 3 months of data
  const months = [];
  for (let m = 0; m < 3; m++) {
    const d = new Date(today.getFullYear(), today.getMonth() + m, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() });
  }

  function dateKey(y, mo, d) {
    return `${y}-${String(mo + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  function toggleDate(key) {
    setBlockDates(prev => prev.includes(key) ? prev.filter(d => d !== key) : [...prev, key].sort());
  }

  function selectWeekday(dow) {
    const toAdd = [];
    months.forEach(({ year, month }) => {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d);
        if (date >= today && date.getDay() === dow) {
          toAdd.push(dateKey(year, month, d));
        }
      }
    });
    setBlockDates(prev => {
      const set = new Set(prev);
      const allSelected = toAdd.every(d => set.has(d));
      if (allSelected) { toAdd.forEach(d => set.delete(d)); }
      else { toAdd.forEach(d => set.add(d)); }
      return [...set].sort();
    });
  }

  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div>
      {/* Weekday quick-select buttons */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {DAYS.map((day, i) => (
          <button
            key={day}
            onClick={() => selectWeekday(i)}
            style={{
              padding: "5px 10px", fontSize: 12, borderRadius: 6, cursor: "pointer", fontWeight: 600,
              border: "1px solid #1B2E57", background: "#1B2E57", color: "#fff",
            }}
          >
            All {day}s
          </button>
        ))}
        {blockDates.length > 0 && (
          <button
            onClick={() => setBlockDates([])}
            style={{ padding: "5px 10px", fontSize: 12, borderRadius: 6, cursor: "pointer", fontWeight: 600, border: "1px solid #E4E6DD", background: "#FDECEC", color: "#8A2323" }}
          >
            Clear all ({blockDates.length})
          </button>
        )}
      </div>

      {/* 3-month calendar grids */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {months.map(({ year, month }) => {
          const firstDay = new Date(year, month, 1).getDay();
          const daysInMonth = new Date(year, month + 1, 0).getDate();
          const cells = [];
          for (let i = 0; i < firstDay; i++) cells.push(null);
          for (let d = 1; d <= daysInMonth; d++) cells.push(d);

          return (
            <div key={`${year}-${month}`}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#1B2E57", marginBottom: 6 }}>
                {MONTHS[month]} {year}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
                {DAYS.map(d => (
                  <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "#6E7788", padding: "4px 0" }}>{d}</div>
                ))}
                {cells.map((d, idx) => {
                  if (!d) return <div key={`empty-${idx}`} />;
                  const key = dateKey(year, month, d);
                  const date = new Date(year, month, d);
                  const isPast = date < today;
                  const isSelected = blockDates.includes(key);
                  const isToday = date.getTime() === today.getTime();
                  return (
                    <button
                      key={key}
                      disabled={isPast}
                      onClick={() => toggleDate(key)}
                      style={{
                        padding: "6px 2px", fontSize: 12, borderRadius: 6, cursor: isPast ? "default" : "pointer",
                        border: isToday ? "2px solid #1B2E57" : "1px solid #E4E6DD",
                        background: isSelected ? "#1B2E57" : isPast ? "#F9FAFB" : "#fff",
                        color: isSelected ? "#fff" : isPast ? "#C9CDD6" : "#1B2E57",
                        fontWeight: isSelected ? 700 : 400,
                      }}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {blockDates.length > 0 && (
        <div style={{ marginTop: 10, fontSize: 12, color: "#3C4A22", fontWeight: 600 }}>
          {blockDates.length} date(s) selected
        </div>
      )}
    </div>
  );
}

export default function AdminApp() {
  const [session, setSession] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [actionMsg, setActionMsg] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 700);
  const [isOpen, setIsOpen] = useState(null);
  const [closedMessage, setClosedMessage] = useState("");
  const [savingToggle, setSavingToggle] = useState(false);

  // Block slots state
  const [blockedSlots, setBlockedSlots] = useState([]);
  const [blockCourt, setBlockCourt] = useState("Court 1");
  const [blockDates, setBlockDates] = useState([]);
  const [blockHours, setBlockHours] = useState([]);
  const [blockType, setBlockType] = useState("blocked");
  const [savingBlock, setSavingBlock] = useState(false);
  const [blockMsg, setBlockMsg] = useState("");
  const [showBlockPanel, setShowBlockPanel] = useState(false);
  const [bookingFilter, setBookingFilter] = useState("pending");

  useEffect(() => {
    function handleResize() { setIsMobile(window.innerWidth < 700); }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCheckingSession(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => { setSession(s); });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      loadBookings();
      loadSiteSettings();
      loadBlockedSlots();
    }
  }, [session]);

  async function loadSiteSettings() {
    const { data } = await supabase.from("site_settings").select("is_open, closed_message").eq("id", 1).single();
    if (data) { setIsOpen(data.is_open); setClosedMessage(data.closed_message); }
  }

  async function toggleOpen() {
    setSavingToggle(true);
    const newValue = !isOpen;
    const { error } = await supabase.from("site_settings").update({ is_open: newValue }).eq("id", 1);
    setSavingToggle(false);
    if (!error) setIsOpen(newValue);
  }

  async function saveClosedMessage() {
    await supabase.from("site_settings").update({ closed_message: closedMessage }).eq("id", 1);
  }

  async function loadBookings() {
    setLoadingBookings(true);
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setBookings(data || []);
    setLoadingBookings(false);
  }

  async function loadBlockedSlots() {
    const { data } = await supabase
      .from("blocked_slots")
      .select("*")
      .gte("date", new Date().toISOString().slice(0, 10))
      .order("date", { ascending: true })
      .order("hour", { ascending: true });
    setBlockedSlots(data || []);
  }

  async function handleSaveBlock() {
    if (blockDates.length === 0) { setBlockMsg("Please select at least one date."); return; }
    if (blockHours.length === 0) { setBlockMsg("Please select at least one hour."); return; }
    setSavingBlock(true);
    setBlockMsg("");
    const rows = [];
    blockDates.forEach(date => {
      blockHours.forEach(h => {
        rows.push({ court: blockCourt, date, hour: h, type: blockType });
      });
    });
    const { error } = await supabase.from("blocked_slots").upsert(rows, { onConflict: "court,date,hour" });
    setSavingBlock(false);
    if (error) {
      setBlockMsg("Error: " + error.message);
    } else {
      setBlockMsg(`Saved ${rows.length} slot(s) across ${blockDates.length} date(s) as ${blockType === "open_play" ? "Open Play" : blockType === "message_request" ? "Message to Request" : "Blocked"}.`);
      setBlockDates([]);
      setBlockHours([]);
      loadBlockedSlots();
    }
  }

  async function handleRemoveBlock(id) {
    await supabase.from("blocked_slots").delete().eq("id", id);
    loadBlockedSlots();
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoggingIn(false);
    if (error) setLoginError(error.message || "Login failed. Check your email and password.");
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setBookings([]);
  }

  function emailParamsFor(b) {
    return {
      to_name: b.customer_name,
      to_email: b.customer_email,
      booking_ref: b.ref,
      booking_date: formatDateNice(b.booking_date),
      booking_times: formatHours(b.hours),
      booking_total: peso(b.total),
      court_label: b.court || "Court 1",
    };
  }

  async function handleConfirm(b) {
    if (!window.confirm("Confirm booking " + b.ref + "? The customer will get a confirmation email.")) return;
    setActionMsg("");
    const { error } = await supabase.rpc("confirm_booking", { p_ref: b.ref });
    if (error) { setActionMsg("Error: " + error.message); return; }
    setActionMsg("Confirmed " + b.ref + ".");
    sendConfirmedEmail(emailParamsFor(b));
    loadBookings();
  }

  async function handleDecline(b) {
    if (!window.confirm("Decline booking " + b.ref + "? This frees up its time slot. No email is sent.")) return;
    setActionMsg("");
    const { error } = await supabase.rpc("decline_booking", { p_ref: b.ref });
    if (error) { setActionMsg("Error: " + error.message); return; }
    setActionMsg("Declined " + b.ref + " and freed its time slot.");
    loadBookings();
  }

  async function handleCancel(b) {
    if (!window.confirm("Cancel booking " + b.ref + "? This frees up its time slot immediately.")) return;
    setActionMsg("");
    const { data, error } = await supabase.rpc("cancel_booking", { p_ref: b.ref });
    if (error) { setActionMsg("Error: " + error.message); }
    else { setActionMsg(data); loadBookings(); }
  }

  function toggleBlockHour(h) {
    setBlockHours(prev => prev.includes(h) ? prev.filter(x => x !== h) : [...prev, h].sort((a,b)=>a-b));
  }

  const inputStyle = { width: "100%", padding: "11px 13px", border: `1px solid ${COLORS.border}`, borderRadius: 10, fontSize: 15, marginBottom: 12 };
  const thStyle = { textAlign: "left", padding: "8px 10px", fontSize: 12, textTransform: "uppercase", letterSpacing: ".4px", color: COLORS.muted, borderBottom: `2px solid ${COLORS.border}` };
  const tdStyle = { padding: "10px 10px", fontSize: 13, borderBottom: `1px solid ${COLORS.border}`, verticalAlign: "top" };

  if (checkingSession) return <div style={{ padding: 40, fontFamily: "sans-serif" }}>Loading…</div>;

  if (!session) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: COLORS.bg, fontFamily: "sans-serif" }}>
        <form onSubmit={handleLogin} style={{ background: "#fff", padding: 32, borderRadius: 16, width: 320, boxShadow: "0 10px 30px -10px rgba(0,0,0,.15)" }}>
          <h2 style={{ marginTop: 0, color: COLORS.navy }}>Staff Login</h2>
          <p style={{ fontSize: 13, color: COLORS.muted, marginTop: -8 }}>Southside Dinkers admin</p>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} required />
          {loginError && <div style={{ color: "#c0392b", fontSize: 13, marginBottom: 12 }}>{loginError}</div>}
          <button type="submit" disabled={loggingIn} style={{ width: "100%", padding: 12, background: COLORS.navy, color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>
            {loggingIn ? "Logging in…" : "Log In"}
          </button>
        </form>
      </div>
    );
  }

  const allHours = Array.from({ length: 22 }, (_, i) => i + 5); // 5am to 2am next day

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, fontFamily: "sans-serif", padding: "24px 20px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h1 style={{ margin: 0, color: COLORS.navy, fontSize: 24 }}>Bookings</h1>
            <p style={{ margin: "4px 0 0", color: COLORS.muted, fontSize: 13 }}>{session.user.email}</p>
          </div>
          <button onClick={handleLogout} style={{ padding: "9px 16px", background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 8, cursor: "pointer", fontSize: 13 }}>
            Log out
          </button>
        </div>

        {/* Open/Close toggle */}
        {isOpen !== null && (
          <div style={{ background: "#fff", border: `1px solid ${isOpen ? COLORS.border : "#F0D98A"}`, borderRadius: 14, padding: 16, marginBottom: 16, display: "flex", flexDirection: isMobile ? "column" : "row", gap: 12, alignItems: isMobile ? "stretch" : "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={toggleOpen} disabled={savingToggle} style={{ width: 46, height: 26, borderRadius: 20, border: "none", cursor: "pointer", position: "relative", flex: "none", background: isOpen ? COLORS.green : "#D7DBD1", transition: "background .15s" }}>
                <div style={{ position: "absolute", top: 3, left: isOpen ? 23 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left .15s" }} />
              </button>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.navy }}>{isOpen ? "Bookings are OPEN" : "Bookings are CLOSED"}</div>
                <div style={{ fontSize: 12, color: COLORS.muted }}>{isOpen ? "Customers can book normally." : "Customers see your closed message instead of the booking form."}</div>
              </div>
            </div>
          </div>
        )}

        {isOpen === false && (
          <div style={{ background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 16, marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: COLORS.muted, marginBottom: 6 }}>Message customers see while closed</label>
            <textarea value={closedMessage} onChange={(e) => setClosedMessage(e.target.value)} onBlur={saveClosedMessage} rows={2} style={{ width: "100%", padding: 10, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14, fontFamily: "inherit", resize: "vertical" }} />
          </div>
        )}

        {/* ── BLOCK SLOTS PANEL ── */}
        <div style={{ background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 14, marginBottom: 16, overflow: "hidden" }}>
          <div
            onClick={() => setShowBlockPanel(p => !p)}
            style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", userSelect: "none" }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.navy }}>🚫 Manage Blocked &amp; Open Play Slots</div>
              <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>Block timeslots or mark them as Open Play</div>
            </div>
            <div style={{ fontSize: 18, color: COLORS.muted }}>{showBlockPanel ? "▲" : "▼"}</div>
          </div>

          {showBlockPanel && (
            <div style={{ borderTop: `1px solid ${COLORS.border}`, padding: 16 }}>
              {/* Form */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: COLORS.muted, marginBottom: 4 }}>COURT</label>
                  <select value={blockCourt} onChange={e => setBlockCourt(e.target.value)} style={{ width: "100%", padding: "9px 12px", border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14 }}>
                    {COURT_OPTIONS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: isMobile ? "1" : "1 / -1" }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: COLORS.muted, marginBottom: 8 }}>SELECT DATES</label>
                  <CalendarPicker blockDates={blockDates} setBlockDates={setBlockDates} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: COLORS.muted, marginBottom: 4 }}>TYPE</label>
                  <select value={blockType} onChange={e => setBlockType(e.target.value)} style={{ width: "100%", padding: "9px 12px", border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14 }}>
                    <option value="blocked">🚫 Blocked</option>
                    <option value="open_play">🏓 Open Play</option>
                    <option value="message_request">💬 Message to Request</option>
                  </select>
                </div>
              </div>

              {/* Hour picker */}
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: COLORS.muted, marginBottom: 8 }}>SELECT HOURS</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6, marginBottom: 14 }}>
                {allHours.map(h => {
                  const selected = blockHours.includes(h);
                  const isPeak = h >= 16;
                  return (
                    <button
                      key={h}
                      onClick={() => toggleBlockHour(h)}
                      style={{
                        padding: "7px 4px", fontSize: 11, borderRadius: 8, cursor: "pointer", textAlign: "center",
                        border: selected ? "2px solid " + COLORS.navy : `1px solid ${COLORS.border}`,
                        background: selected ? COLORS.navy : isPeak ? "#FFFBEB" : "#fff",
                        color: selected ? "#fff" : isPeak ? "#92400E" : COLORS.navy,
                        fontWeight: selected ? 700 : 400,
                      }}
                    >
                      {fmtHour(h)}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <button
                  onClick={handleSaveBlock}
                  disabled={savingBlock}
                  style={{ padding: "10px 20px", background: COLORS.navy, color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 13 }}
                >
                  {savingBlock ? "Saving…" : "Save Slots"}
                </button>
                {blockMsg && <span style={{ fontSize: 13, color: blockMsg.startsWith("Error") ? "#c0392b" : "#3C4A22" }}>{blockMsg}</span>}
              </div>

              {/* Current blocked slots list */}
              {blockedSlots.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.muted, textTransform: "uppercase", marginBottom: 8 }}>Current Blocked / Open Play Slots</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 300, overflowY: "auto", paddingRight: 4 }}>
                    {blockedSlots.map(s => (
                      <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: 8, background: s.type === "open_play" ? "#EEF6DC" : s.type === "message_request" ? "#EAF0FB" : "#FFF7E0", border: `1px solid ${s.type === "open_play" ? "#D9EAB0" : s.type === "message_request" ? "#B8CCF0" : "#F0D98A"}` }}>
                        <span style={{ fontSize: 13, color: COLORS.navy }}>
                          {s.type === "open_play" ? "🏓 Open Play" : s.type === "message_request" ? "💬 Message to Request" : "🚫 Blocked"} — {s.court} · {formatDateNice(s.date)} · {fmtHour(s.hour)}–{fmtHour(s.hour + 1)}
                        </span>
                        <button onClick={() => handleRemoveBlock(s.id)} style={{ fontSize: 11, padding: "4px 10px", background: "#FDECEC", color: "#8A2323", border: "1px solid #F5C6C6", borderRadius: 6, cursor: "pointer", fontWeight: 700 }}>
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action message */}
        {actionMsg && (
          <div style={{ background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 13 }}>{actionMsg}</div>
        )}

        {/* Booking filter tabs */}
        <div style={{ display: "flex", gap: 0, marginBottom: 0, background: "#fff", borderRadius: "14px 14px 0 0", border: `1px solid ${COLORS.border}`, borderBottom: "none", overflow: "hidden" }}>
          {[
            { key: "pending", label: "⏳ Needs Action", count: bookings.filter(b => b.status === "pending_payment").length },
            { key: "confirmed", label: "✅ Confirmed", count: bookings.filter(b => b.status === "confirmed").length },
            { key: "all", label: "All Bookings", count: bookings.length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setBookingFilter(tab.key)}
              style={{
                flex: 1, padding: "12px 8px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700,
                background: bookingFilter === tab.key ? "#fff" : "#F4F5F0",
                color: bookingFilter === tab.key ? COLORS.navy : COLORS.muted,
                borderBottom: bookingFilter === tab.key ? `2px solid ${COLORS.navy}` : "2px solid transparent",
              }}
            >
              {tab.label} {tab.count > 0 && <span style={{ background: bookingFilter === tab.key ? COLORS.navy : "#D7DBD1", color: bookingFilter === tab.key ? "#fff" : COLORS.muted, borderRadius: 20, padding: "1px 7px", fontSize: 11, marginLeft: 4 }}>{tab.count}</span>}
            </button>
          ))}
        </div>

        {/* Bookings table */}
        <div style={{ background: "#fff", borderRadius: "0 0 14px 14px", overflow: "hidden", border: `1px solid ${COLORS.border}`, borderTop: "none" }}>
          {(() => {
            const filtered = bookingFilter === "pending"
              ? bookings.filter(b => b.status === "pending_payment")
              : bookingFilter === "confirmed"
              ? bookings.filter(b => b.status === "confirmed")
              : bookings;
            return (
          <>
          {loadingBookings ? (
            <div style={{ padding: 24, textAlign: "center", color: COLORS.muted }}>Loading bookings…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: COLORS.muted }}>{bookingFilter === "pending" ? "No pending bookings. 🎉" : bookingFilter === "confirmed" ? "No confirmed bookings yet." : "No bookings yet."}</div>
          ) : isMobile ? (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {filtered.map((b) => (
                <div key={b.id} style={{ padding: 14, borderBottom: `1px solid ${COLORS.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, color: COLORS.navy, fontSize: 15 }}>{b.ref}</span>
                    <span style={{ padding: "3px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: "uppercase", background: b.status === "confirmed" ? "#EEF6DC" : b.status === "cancelled" ? "#F0F1EC" : b.status === "declined" ? "#FDECEC" : "#FFF7E0", color: b.status === "confirmed" ? "#3C4A22" : b.status === "cancelled" ? "#8A93A1" : b.status === "declined" ? "#8A2323" : "#7A5D00" }}>{b.status}</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>{b.customer_name}</div>
                  <div style={{ fontSize: 13, color: COLORS.muted, marginBottom: 8 }}>{b.booking_date} · {formatHours(b.hours)}</div>
                  <div style={{ fontSize: 13, color: "#33415C", lineHeight: 1.7 }}>
                    <div>{b.customer_phone}</div>
                    <div>{b.customer_facebook}</div>
                    <div style={{ fontWeight: 700 }}>{peso(b.total)}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                    {b.payment_reference && (
                      <a href={b.payment_reference} target="_blank" rel="noopener noreferrer" style={{ flex: 1, textAlign: "center", padding: "9px 0", background: COLORS.bg, color: COLORS.navy, borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>View proof</a>
                    )}
                    {b.status === "pending_payment" && (
                      <>
                        <button onClick={() => handleConfirm(b)} style={{ flex: 1, padding: "9px 0", background: "#EEF6DC", color: "#3C4A22", border: "1px solid #D9EAB0", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700 }}>Confirm</button>
                        <button onClick={() => handleDecline(b)} style={{ flex: 1, padding: "9px 0", background: "#FDECEC", color: "#8A2323", border: "1px solid #F5C6C6", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700 }}>Decline</button>
                      </>
                    )}
                    {b.status === "confirmed" && (
                      <button onClick={() => handleCancel(b)} style={{ flex: 1, padding: "9px 0", background: "#FDECEC", color: "#8A2323", border: "1px solid #F5C6C6", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700 }}>Cancel</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Ref</th>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Phone</th>
                    <th style={thStyle}>Facebook</th>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Hours</th>
                    <th style={thStyle}>Total</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Proof</th>
                    <th style={thStyle}></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((b) => (
                    <tr key={b.id}>
                      <td style={{ ...tdStyle, fontWeight: 700 }}>{b.ref}</td>
                      <td style={tdStyle}>{b.customer_name}</td>
                      <td style={tdStyle}>{b.customer_phone}</td>
                      <td style={tdStyle}>{b.customer_facebook}</td>
                      <td style={tdStyle}>{b.booking_date}</td>
                      <td style={tdStyle}>{formatHours(b.hours)}</td>
                      <td style={tdStyle}>{peso(b.total)}</td>
                      <td style={tdStyle}>
                        <span style={{ padding: "3px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: "uppercase", background: b.status === "confirmed" ? "#EEF6DC" : b.status === "cancelled" ? "#F0F1EC" : b.status === "declined" ? "#FDECEC" : "#FFF7E0", color: b.status === "confirmed" ? "#3C4A22" : b.status === "cancelled" ? "#8A93A1" : b.status === "declined" ? "#8A2323" : "#7A5D00" }}>{b.status}</span>
                      </td>
                      <td style={tdStyle}>
                        {b.payment_reference ? <a href={b.payment_reference} target="_blank" rel="noopener noreferrer" style={{ color: COLORS.navy }}>View</a> : "—"}
                      </td>
                      <td style={tdStyle}>
                        {b.status === "pending_payment" && (
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={() => handleConfirm(b)} style={{ padding: "6px 10px", background: "#EEF6DC", color: "#3C4A22", border: "1px solid #D9EAB0", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Confirm</button>
                            <button onClick={() => handleDecline(b)} style={{ padding: "6px 10px", background: "#FDECEC", color: "#8A2323", border: "1px solid #F5C6C6", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Decline</button>
                          </div>
                        )}
                        {b.status === "confirmed" && (
                          <button onClick={() => handleCancel(b)} style={{ padding: "6px 12px", background: "#FDECEC", color: "#8A2323", border: "1px solid #F5C6C6", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Cancel</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
