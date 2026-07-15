import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const COLORS = {
  navy: "#1B2E57",
  green: "#8CC63F",
  bg: "#F4F5F0",
  border: "#E4E6DD",
  muted: "#6E7788",
};

function peso(n) {
  return "₱" + Number(n).toLocaleString("en-PH");
}

function fmtHour(h) {
  const ap = h < 12 ? "AM" : "PM";
  let hh = h % 12;
  if (hh === 0) hh = 12;
  return hh + ":00 " + ap;
}

function formatHours(hours) {
  if (!Array.isArray(hours) || hours.length === 0) return "";
  return hours.map(fmtHour).join(", ");
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

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 700);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCheckingSession(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) loadBookings();
  }, [session]);

  async function loadBookings() {
    setLoadingBookings(true);
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("booking_date", { ascending: true })
      .order("created_at", { ascending: false });
    if (!error) setBookings(data || []);
    setLoadingBookings(false);
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

  async function handleCancel(ref) {
    if (!window.confirm("Cancel booking " + ref + "? This frees up its time slot immediately.")) return;
    setActionMsg("");
    const { data, error } = await supabase.rpc("cancel_booking", { p_ref: ref });
    if (error) {
      setActionMsg("Error: " + error.message);
    } else {
      setActionMsg(data);
      loadBookings();
    }
  }

  const inputStyle = { width: "100%", padding: "11px 13px", border: `1px solid ${COLORS.border}`, borderRadius: 10, fontSize: 15, marginBottom: 12 };
  const thStyle = { textAlign: "left", padding: "8px 10px", fontSize: 12, textTransform: "uppercase", letterSpacing: ".4px", color: COLORS.muted, borderBottom: `2px solid ${COLORS.border}` };
  const tdStyle = { padding: "10px 10px", fontSize: 13, borderBottom: `1px solid ${COLORS.border}`, verticalAlign: "top" };

  if (checkingSession) {
    return <div style={{ padding: 40, fontFamily: "sans-serif" }}>Loading\u2026</div>;
  }

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
            {loggingIn ? "Logging in\u2026" : "Log In"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, fontFamily: "sans-serif", padding: "24px 20px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h1 style={{ margin: 0, color: COLORS.navy, fontSize: 24 }}>Bookings</h1>
            <p style={{ margin: "4px 0 0", color: COLORS.muted, fontSize: 13 }}>{session.user.email}</p>
          </div>
          <button onClick={handleLogout} style={{ padding: "9px 16px", background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 8, cursor: "pointer", fontSize: 13 }}>
            Log out
          </button>
        </div>

        {actionMsg && (
          <div style={{ background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 13 }}>{actionMsg}</div>
        )}

        <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", border: `1px solid ${COLORS.border}` }}>
          {loadingBookings ? (
            <div style={{ padding: 24, textAlign: "center", color: COLORS.muted }}>Loading bookings\u2026</div>
          ) : bookings.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: COLORS.muted }}>No bookings yet.</div>
          ) : isMobile ? (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {bookings.map((b) => (
                <div key={b.id} style={{ padding: 14, borderBottom: `1px solid ${COLORS.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, color: COLORS.navy, fontSize: 15 }}>{b.ref}</span>
                    <span style={{
                      padding: "3px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                      background: b.status === "confirmed" ? "#EEF6DC" : b.status === "cancelled" ? "#F0F1EC" : "#FFF7E0",
                      color: b.status === "confirmed" ? "#3C4A22" : b.status === "cancelled" ? "#8A93A1" : "#7A5D00",
                    }}>{b.status}</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>{b.customer_name}</div>
                  <div style={{ fontSize: 13, color: COLORS.muted, marginBottom: 8 }}>{b.booking_date} · {formatHours(b.hours)}</div>
                  <div style={{ fontSize: 13, color: "#33415C", lineHeight: 1.7 }}>
                    <div>{b.customer_phone}</div>
                    <div>{b.customer_facebook}</div>
                    <div style={{ fontWeight: 700 }}>{peso(b.total)}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    {b.payment_reference && (
                      <a href={b.payment_reference} target="_blank" rel="noopener noreferrer" style={{ flex: 1, textAlign: "center", padding: "9px 0", background: COLORS.bg, color: COLORS.navy, borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                        View proof
                      </a>
                    )}
                    {b.status !== "cancelled" && (
                      <button onClick={() => handleCancel(b.ref)} style={{ flex: 1, padding: "9px 0", background: "#FDECEC", color: "#8A2323", border: "1px solid #F5C6C6", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
                        Cancel
                      </button>
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
                  {bookings.map((b) => (
                    <tr key={b.id}>
                      <td style={{ ...tdStyle, fontWeight: 700 }}>{b.ref}</td>
                      <td style={tdStyle}>{b.customer_name}</td>
                      <td style={tdStyle}>{b.customer_phone}</td>
                      <td style={tdStyle}>{b.customer_facebook}</td>
                      <td style={tdStyle}>{b.booking_date}</td>
                      <td style={tdStyle}>{formatHours(b.hours)}</td>
                      <td style={tdStyle}>{peso(b.total)}</td>
                      <td style={tdStyle}>
                        <span style={{
                          padding: "3px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                          background: b.status === "confirmed" ? "#EEF6DC" : b.status === "cancelled" ? "#F0F1EC" : "#FFF7E0",
                          color: b.status === "confirmed" ? "#3C4A22" : b.status === "cancelled" ? "#8A93A1" : "#7A5D00",
                        }}>{b.status}</span>
                      </td>
                      <td style={tdStyle}>
                        {b.payment_reference ? <a href={b.payment_reference} target="_blank" rel="noopener noreferrer" style={{ color: COLORS.navy }}>View</a> : "\u2014"}
                      </td>
                      <td style={tdStyle}>
                        {b.status !== "cancelled" && (
                          <button onClick={() => handleCancel(b.ref)} style={{ padding: "6px 12px", background: "#FDECEC", color: "#8A2323", border: "1px solid #F5C6C6", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
