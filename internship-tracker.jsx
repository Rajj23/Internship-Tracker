import { useState, useMemo, useEffect } from "react";
import { collection, addDoc, onSnapshot, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "./firebase";

const TABS = ["Applications", "LinkedIn Outreach"];
const APP_STATUSES = ["Applied", "No Response", "Interviewing", "Rejected", "Offer"];
const LI_STATUSES = ["Request Sent", "Connected", "Messaged", "Replied", "No Response"];
const STATUS_COLORS = {
  "Applied": "#3b82f6",
  "No Response": "#6b7280",
  "Interviewing": "#f59e0b",
  "Rejected": "#ef4444",
  "Offer": "#10b981",
  "Request Sent": "#8b5cf6",
  "Connected": "#3b82f6",
  "Messaged": "#f59e0b",
  "Replied": "#10b981",
};

const today = () => new Date().toISOString().split("T")[0];

export default function App() {
  const [tab, setTab] = useState(0);
  const [apps, setApps] = useState([]);
  const [li, setLi] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const blankApp = { company: "", role: "", date: today(), source: "", status: "Applied", notes: "" };
  const blankLI = { name: "", company: "", role: "", date: today(), status: "Request Sent", notes: "", linkedinUrl: "" };

  const [form, setForm] = useState(blankApp);

  const isApp = tab === 0;
  const data = isApp ? apps : li;
  const statuses = isApp ? APP_STATUSES : LI_STATUSES;

  // Firebase Setup: Listen to collections
  useEffect(() => {
    setLoading(true);
    const unsubscribeApps = onSnapshot(
      collection(db, "applications"),
      (snapshot) => {
        setApps(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      },
      (error) => {
        console.error("Firestore applications error:", error);
        setLoading(false);
      }
    );

    const unsubscribeLi = onSnapshot(
      collection(db, "contacts"),
      (snapshot) => {
        setLi(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (error) => {
        console.error("Firestore contacts error:", error);
      }
    );

    return () => {
      unsubscribeApps();
      unsubscribeLi();
    };
  }, []);


  const filtered = useMemo(() => {
    return data.filter(r => {
      const matchStatus = filter === "All" || r.status === filter;
      const q = search.toLowerCase();
      const matchSearch = !q || r.company?.toLowerCase().includes(q) || r.name?.toLowerCase().includes(q) || r.role?.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [data, filter, search]);

  const openNew = () => {
    setForm(isApp ? blankApp : blankLI);
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (row) => {
    setForm({ ...row });
    setEditId(row.id);
    setShowForm(true);
  };

  const save = async () => {
    const collectionName = isApp ? "applications" : "contacts";
    // Exclude the 'id' field from the form data when saving to Firestore
    const { id, ...dataToSave } = form;

    try {
      if (editId) {
        // Update existing document in Firebase
        await updateDoc(doc(db, collectionName, editId), dataToSave);
      } else {
        // Add new document to Firebase
        await addDoc(collection(db, collectionName), dataToSave);
      }
      setShowForm(false);
    } catch (error) {
      console.error("Error saving document: ", error);
      alert("Failed to save. Check your connection or Firebase rules.");
    }
  };

  const remove = async (id) => {
    const collectionName = isApp ? "applications" : "contacts";
    if (window.confirm("Are you sure you want to delete this?")) {
      try {
        await deleteDoc(doc(db, collectionName, id));
      } catch (error) {
        console.error("Error deleting document: ", error);
        alert("Failed to delete.");
      }
    }
  };

  const statusCounts = useMemo(() => {
    const counts = {};
    data.forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1; });
    return counts;
  }, [data]);

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif", minHeight: "100vh", background: "#0f0f13", color: "#e8e8f0", padding: "0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #1a1a24; } ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
        input, select, textarea { background: #1e1e2e !important; color: #e8e8f0 !important; border: 1px solid #2e2e42 !important; border-radius: 8px !important; padding: 9px 12px !important; font-size: 14px !important; font-family: inherit !important; width: 100%; outline: none; transition: border .2s; }
        input:focus, select:focus, textarea:focus { border-color: #6366f1 !important; }
        select option { background: #1e1e2e; }
        .btn { border: none; border-radius: 8px; padding: 9px 18px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all .15s; font-family: inherit; }
        .btn-primary { background: #6366f1; color: #fff; }
        .btn-primary:hover { background: #4f52d9; }
        .btn-ghost { background: transparent; color: #888; border: 1px solid #2e2e42 !important; }
        .btn-ghost:hover { background: #1e1e2e; color: #e8e8f0; }
        .btn-danger { background: #2a1a1a; color: #ef4444; border: 1px solid #3a2020 !important; }
        .btn-danger:hover { background: #3a2020; }
        .row-item:hover { background: #16161f !important; }
        .tab-btn { background: transparent; border: none; color: #888; font-size: 15px; font-weight: 500; padding: 10px 0; cursor: pointer; font-family: inherit; border-bottom: 2px solid transparent; transition: all .15s; }
        .tab-btn.active { color: #6366f1; border-bottom-color: #6366f1; }
      `}</style>

      {/* Header */}
      <div style={{ background: "#13131c", borderBottom: "1px solid #1e1e2e", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Space Mono', monospace", color: "#e8e8f0" }}>interntrack<span style={{ color: "#6366f1" }}>.</span></div>
          <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>Your internship hunt, organized</div>
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 13, color: "#666" }}>
          <span><b style={{ color: "#e8e8f0" }}>{apps.length}</b> applications</span>
          <span><b style={{ color: "#e8e8f0" }}>{li.length}</b> connections</span>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px" }}>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 28, borderBottom: "1px solid #1e1e2e", marginBottom: 24 }}>
          {TABS.map((t, i) => (
            <button key={t} className={`tab-btn ${tab === i ? "active" : ""}`} onClick={() => { setTab(i); setFilter("All"); setSearch(""); setShowForm(false); }}>{t}</button>
          ))}
        </div>

        {/* Status summary pills */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          <button className="btn btn-ghost" style={{ fontSize: 12, padding: "5px 12px", borderRadius: 99, borderColor: filter === "All" ? "#6366f1" : undefined, color: filter === "All" ? "#6366f1" : undefined }} onClick={() => setFilter("All")}>All ({data.length})</button>
          {statuses.map(s => (
            <button key={s} className="btn btn-ghost" onClick={() => setFilter(s === filter ? "All" : s)}
              style={{ fontSize: 12, padding: "5px 12px", borderRadius: 99, borderColor: filter === s ? STATUS_COLORS[s] || "#6366f1" : undefined, color: filter === s ? STATUS_COLORS[s] || "#6366f1" : undefined }}>
              {s} {statusCounts[s] ? `(${statusCounts[s]})` : "(0)"}
            </button>
          ))}
        </div>

        {/* Search + Add */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <input placeholder={isApp ? "Search company or role..." : "Search name or company..."} value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, maxWidth: 320 }} />
          <button className="btn btn-primary" onClick={openNew}>+ Add {isApp ? "Application" : "Contact"}</button>
        </div>

        {/* Form */}
        {showForm && (
          <div style={{ background: "#13131c", border: "1px solid #2e2e42", borderRadius: 12, padding: "20px", marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: "#c8c8e0" }}>{editId ? "Edit" : "New"} {isApp ? "Application" : "LinkedIn Contact"}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
              {isApp ? <>
                <div><label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}>Company *</label><input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="e.g. Google" /></div>
                <div><label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}>Role *</label><input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="e.g. SWE Intern" /></div>
                <div><label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}>Date Applied</label><input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
                <div><label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}>Source</label><input value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} placeholder="LinkedIn / College Portal" /></div>
                <div><label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}>Status</label><select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>{APP_STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
                <div><label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}>Notes</label><input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any quick notes" /></div>
              </> : <>
                <div><label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}>Name *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Priya Sharma" /></div>
                <div><label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}>Company</label><input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="Works at..." /></div>
                <div><label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}>Role / Title</label><input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="e.g. Senior SWE" /></div>
                <div><label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}>Date Sent</label><input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
                <div><label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}>Status</label><select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>{LI_STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
                <div><label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}>How you know them</label><input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Alumni / Professor / Referral" /></div>
              </>}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button className="btn btn-primary" onClick={save}>Save</button>
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#666" }}>
            <div>Loading data from Firebase...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#444" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
            <div>Nothing here yet. Add your first {isApp ? "application" : "contact"}!</div>
          </div>
        ) : (
          <div style={{ background: "#13131c", border: "1px solid #1e1e2e", borderRadius: 12, overflow: "hidden" }}>
            {/* Table header */}
            <div style={{ display: "grid", gridTemplateColumns: isApp ? "1fr 1fr 100px 110px 90px 1fr 80px" : "1fr 1fr 1fr 100px 110px 1fr 80px", padding: "10px 16px", borderBottom: "1px solid #1e1e2e", fontSize: 11, color: "#555", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {isApp ? ["Company", "Role", "Date", "Source", "Status", "Notes", ""].map((h, i) => <div key={i}>{h}</div>)
                : ["Name", "Company", "Role", "Date", "Status", "Notes", ""].map((h, i) => <div key={i}>{h}</div>)}
            </div>
            {filtered.map(row => (
              <div key={row.id} className="row-item" style={{ display: "grid", gridTemplateColumns: isApp ? "1fr 1fr 100px 110px 90px 1fr 80px" : "1fr 1fr 1fr 100px 110px 1fr 80px", padding: "12px 16px", borderBottom: "1px solid #1a1a24", fontSize: 14, alignItems: "center", transition: "background .1s", cursor: "default" }}>
                {isApp ? <>
                  <div style={{ fontWeight: 600, color: "#c8c8e8" }}>{row.company}</div>
                  <div style={{ color: "#aaa" }}>{row.role}</div>
                  <div style={{ color: "#666", fontSize: 13 }}>{row.date}</div>
                  <div style={{ color: "#777", fontSize: 12 }}>{row.source || "—"}</div>
                  <div><span style={{ background: (STATUS_COLORS[row.status] || "#444") + "22", color: STATUS_COLORS[row.status] || "#aaa", border: `1px solid ${STATUS_COLORS[row.status] || "#444"}44`, borderRadius: 6, padding: "2px 8px", fontSize: 12, fontWeight: 500 }}>{row.status}</span></div>
                  <div style={{ color: "#666", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.notes || "—"}</div>
                </> : <>
                  <div style={{ fontWeight: 600, color: "#c8c8e8" }}>{row.name}</div>
                  <div style={{ color: "#aaa" }}>{row.company || "—"}</div>
                  <div style={{ color: "#888", fontSize: 13 }}>{row.role || "—"}</div>
                  <div style={{ color: "#666", fontSize: 13 }}>{row.date}</div>
                  <div><span style={{ background: (STATUS_COLORS[row.status] || "#444") + "22", color: STATUS_COLORS[row.status] || "#aaa", border: `1px solid ${STATUS_COLORS[row.status] || "#444"}44`, borderRadius: 6, padding: "2px 8px", fontSize: 12, fontWeight: 500 }}>{row.status}</span></div>
                  <div style={{ color: "#666", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.notes || "—"}</div>
                </>}
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => openEdit(row)}>Edit</button>
                  <button className="btn btn-danger" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => remove(row.id)}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tips */}
        <div style={{ marginTop: 28, background: "#13131c", border: "1px solid #1e1e2e", borderRadius: 12, padding: "16px 20px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>💡 Quick Tips</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10, fontSize: 13, color: "#666" }}>
            <div>🔁 <b style={{ color: "#888" }}>Follow up</b> on LinkedIn contacts after 5–7 days if no reply</div>
            <div>🏫 <b style={{ color: "#888" }}>Check alumni</b> — search your college name on LinkedIn → filter by company</div>
            <div>📌 <b style={{ color: "#888" }}>Update status</b> same day you hear back — don't let it pile up</div>
            <div>🎯 <b style={{ color: "#888" }}>Quality &gt; Quantity</b> — 3 good referrals beat 20 cold applies</div>
          </div>
        </div>
      </div>
    </div>
  );
}
