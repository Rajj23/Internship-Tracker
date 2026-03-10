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
  const [companyFilter, setCompanyFilter] = useState("All");
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


  // Unique company lists for dropdown filters
  const appCompanies = useMemo(() => [...new Set(apps.map(a => a.company).filter(Boolean))].sort(), [apps]);
  const liCompanies = useMemo(() => [...new Set(li.map(c => c.company).filter(Boolean))].sort(), [li]);
  const companies = isApp ? appCompanies : liCompanies;

  // Set of companies where the user has applied (for cross-referencing)
  const appliedCompanySet = useMemo(() => new Set(apps.map(a => a.company?.toLowerCase()).filter(Boolean)), [apps]);

  const filtered = useMemo(() => {
    return data.filter(r => {
      const matchStatus = filter === "All" || r.status === filter;
      const q = search.toLowerCase();
      const matchSearch = !q || r.company?.toLowerCase().includes(q) || r.name?.toLowerCase().includes(q) || r.role?.toLowerCase().includes(q);

      let matchCompany = true;
      if (companyFilter === "__applied__") {
        // Cross-reference: show only contacts at companies where user has applied
        matchCompany = r.company && appliedCompanySet.has(r.company.toLowerCase());
      } else if (companyFilter !== "All") {
        matchCompany = r.company === companyFilter;
      }

      return matchStatus && matchSearch && matchCompany;
    });
  }, [data, filter, search, companyFilter, appliedCompanySet]);

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

  const updateStatus = async (rowId, newStatus) => {
    const collectionName = isApp ? "applications" : "contacts";
    try {
      await updateDoc(doc(db, collectionName, rowId), { status: newStatus });
    } catch (error) {
      console.error("Error updating status: ", error);
      alert("Failed to update status.");
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
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif", minHeight: "100vh", background: "#1a1c2e", color: "#d8d8e8", padding: "0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #1e2035; } ::-webkit-scrollbar-thumb { background: #3a3d55; border-radius: 3px; }
        input, select:not(.status-select), textarea { background: #262842 !important; color: #d8d8e8 !important; border: 1px solid #3a3d55 !important; border-radius: 8px !important; padding: 9px 12px !important; font-size: 14px !important; font-family: inherit !important; width: 100%; outline: none; transition: border .2s; }
        input:focus, select:focus, textarea:focus { border-color: #6366f1 !important; }
        select option { background: #262842; color: #d8d8e8; }
        .btn { border: none; border-radius: 8px; padding: 9px 18px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all .15s; font-family: inherit; }
        .btn-primary { background: #6366f1; color: #fff; }
        .btn-primary:hover { background: #4f52d9; }
        .btn-ghost { background: transparent; color: #9a9ab0; border: 1px solid #3a3d55 !important; }
        .btn-ghost:hover { background: #262842; color: #d8d8e8; }
        .btn-danger { background: #2e1a1e; color: #ef4444; border: 1px solid #4a2028 !important; }
        .btn-danger:hover { background: #3a2028; }
        .row-item:hover { background: #222440 !important; }
        .tab-btn { background: transparent; border: none; color: #7a7a95; font-size: 15px; font-weight: 500; padding: 10px 0; cursor: pointer; font-family: inherit; border-bottom: 2px solid transparent; transition: all .15s; }
        .tab-btn.active { color: #818cf8; border-bottom-color: #818cf8; }
        .status-select { padding: 3px 10px !important; font-size: 12px !important; font-weight: 600 !important; cursor: pointer; border-radius: 20px !important; width: auto !important; font-family: inherit !important; outline: none; transition: all .15s; }
      `}</style>

      {/* Header */}
      <div style={{ background: "#1e2038", borderBottom: "1px solid #2e3050", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Space Mono', monospace", color: "#e0e0f0" }}>interntrack<span style={{ color: "#818cf8" }}>.</span></div>
          <div style={{ fontSize: 12, color: "#6a6a85", marginTop: 2 }}>Your internship hunt, organized</div>
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 13, color: "#7a7a95" }}>
          <span><b style={{ color: "#d8d8e8" }}>{apps.length}</b> applications</span>
          <span><b style={{ color: "#d8d8e8" }}>{li.length}</b> connections</span>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px" }}>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 28, borderBottom: "1px solid #2e3050", marginBottom: 24 }}>
          {TABS.map((t, i) => (
            <button key={t} className={`tab-btn ${tab === i ? "active" : ""}`} onClick={() => { setTab(i); setFilter("All"); setSearch(""); setCompanyFilter("All"); setShowForm(false); }}>{t}</button>
          ))}
        </div>

        {/* Status summary pills */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          <button className="btn btn-ghost" style={{ fontSize: 12, padding: "5px 12px", borderRadius: 99, borderColor: filter === "All" ? "#6366f1" : undefined, color: filter === "All" ? "#6366f1" : undefined, fontWeight: filter === "All" ? 600 : 400 }} onClick={() => setFilter("All")}>All ({data.length})</button>
          {statuses.map(s => (
            <button key={s} className="btn btn-ghost" onClick={() => setFilter(s === filter ? "All" : s)}
              style={{ fontSize: 12, padding: "5px 12px", borderRadius: 99, borderColor: filter === s ? STATUS_COLORS[s] || "#6366f1" : undefined, color: filter === s ? STATUS_COLORS[s] || "#6366f1" : undefined, fontWeight: filter === s ? 600 : 400 }}>
              {s} {statusCounts[s] ? `(${statusCounts[s]})` : "(0)"}
            </button>
          ))}
        </div>

        {/* Search + Company Filter + Add */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
          <input placeholder={isApp ? "Search company or role..." : "Search name or company..."} value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, maxWidth: 280 }} />
          <select value={companyFilter} onChange={e => setCompanyFilter(e.target.value)} style={{ maxWidth: 200 }}>
            <option value="All">All Companies</option>
            {!isApp && <option value="__applied__">Applied Companies</option>}
            {companies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button className="btn btn-primary" onClick={openNew}>+ Add {isApp ? "Application" : "Contact"}</button>
        </div>

        {/* Form */}
        {showForm && (
          <div style={{ background: "#1e2038", border: "1px solid #2e3050", borderRadius: 12, padding: "20px", marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: "#d8d8e8" }}>{editId ? "Edit" : "New"} {isApp ? "Application" : "LinkedIn Contact"}</div>
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
          <div style={{ textAlign: "center", padding: "60px 0", color: "#888" }}>
            <div>Loading data from Firebase...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#999" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
            <div>Nothing here yet. Add your first {isApp ? "application" : "contact"}!</div>
          </div>
        ) : (
          <div style={{ background: "#1e2038", border: "1px solid #2e3050", borderRadius: 12, overflow: "hidden" }}>
            {/* Table header */}
            <div style={{ display: "grid", gridTemplateColumns: isApp ? "36px 1fr 1fr 100px 100px 120px 1fr 80px" : "36px 1fr 1fr 1fr 100px 120px 1fr 80px", padding: "10px 16px", borderBottom: "1px solid #2e3050", fontSize: 11, color: "#6a6a85", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", background: "#1a1c30" }}>
              {isApp ? ["#", "Company", "Role", "Date", "Source", "Status", "Notes", ""].map((h, i) => <div key={i}>{h}</div>)
                : ["#", "Name", "Company", "Role", "Date", "Status", "Notes", ""].map((h, i) => <div key={i}>{h}</div>)}
            </div>
            {filtered.map((row, idx) => (
              <div key={row.id} className="row-item" style={{ display: "grid", gridTemplateColumns: isApp ? "36px 1fr 1fr 100px 100px 120px 1fr 80px" : "36px 1fr 1fr 1fr 100px 120px 1fr 80px", padding: "12px 16px", borderBottom: "1px solid #262842", fontSize: 14, alignItems: "center", transition: "background .1s", cursor: "default" }}>
                <div style={{ color: "#6a6a85", fontSize: 12, fontWeight: 500 }}>{idx + 1}</div>
                {isApp ? <>
                  <div style={{ fontWeight: 600, color: "#d8d8e8" }}>{row.company}</div>
                  <div style={{ color: "#a0a0b8" }}>{row.role}</div>
                  <div style={{ color: "#7a7a95", fontSize: 13 }}>{row.date}</div>
                  <div style={{ color: "#7a7a95", fontSize: 12 }}>{row.source || "—"}</div>
                  <div>
                    <select className="status-select" value={row.status} onChange={e => updateStatus(row.id, e.target.value)}
                      style={{ color: STATUS_COLORS[row.status] || "#9a9ab0", background: (STATUS_COLORS[row.status] || "#888") + "22", borderColor: (STATUS_COLORS[row.status] || "#888") + "44" }}>
                      {APP_STATUSES.map(s => <option key={s} value={s} style={{ color: STATUS_COLORS[s] || "#d8d8e8", background: "#1e2038" }}>{s}</option>)}
                    </select>
                  </div>
                  <div style={{ color: "#7a7a95", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.notes || "—"}</div>
                </> : <>
                  <div style={{ fontWeight: 600, color: "#d8d8e8" }}>{row.name}</div>
                  <div style={{ color: "#a0a0b8" }}>{row.company || "—"}</div>
                  <div style={{ color: "#8888a0", fontSize: 13 }}>{row.role || "—"}</div>
                  <div style={{ color: "#7a7a95", fontSize: 13 }}>{row.date}</div>
                  <div>
                    <select className="status-select" value={row.status} onChange={e => updateStatus(row.id, e.target.value)}
                      style={{ color: STATUS_COLORS[row.status] || "#9a9ab0", background: (STATUS_COLORS[row.status] || "#888") + "22", borderColor: (STATUS_COLORS[row.status] || "#888") + "44" }}>
                      {LI_STATUSES.map(s => <option key={s} value={s} style={{ color: STATUS_COLORS[s] || "#d8d8e8", background: "#1e2038" }}>{s}</option>)}
                    </select>
                  </div>
                  <div style={{ color: "#7a7a95", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.notes || "—"}</div>
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
        <div style={{ marginTop: 28, background: "#1e2038", border: "1px solid #2e3050", borderRadius: 12, padding: "16px 20px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#6a6a85", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Quick Tips</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10, fontSize: 13, color: "#7a7a95" }}>
            <div>Follow up on LinkedIn contacts after 5-7 days if no reply</div>
            <div>Check alumni — search your college name on LinkedIn, filter by company</div>
            <div>Update status same day you hear back — don't let it pile up</div>
            <div>Quality over Quantity — 3 good referrals beat 20 cold applies</div>
          </div>
        </div>
      </div>
    </div>
  );
}
