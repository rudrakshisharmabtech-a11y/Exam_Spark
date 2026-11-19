import { useEffect, useState, type FormEvent } from "react";
import { useDialogFocus } from "../components/useDialogFocus";
import { apiRequest } from "../api";
import { courseSubjects, exams, type Exam } from "../data";
import { Button, Icon, type IconName } from "../components/ui";
import { Metric, PageTitle, Shell } from "../components/workspace";

export function AdminDashboard() {
  const [activity, setActivity] = useState("Submissions");
  const activityPoints =
    activity === "Submissions" ? [155, 130, 105, 130, 80, 62, 22] : [125, 112, 138, 90, 75, 96, 55];
  const chartLine = activityPoints
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"}${index * (700 / (activityPoints.length - 1))},${point}`,
    )
    .join(" ");
  return (
    <Shell role="admin" route="admin">
      <PageTitle
        eyebrow="PLATFORM OVERVIEW"
        title="Everything in view."
        subtitle="A clear pulse on people, examinations and platform activity."
      />
      <div className="metric-grid admin-metrics">
        <Metric label="TOTAL USERS" value="2,418" note="+34 this month" icon="users" />
        <Metric label="STUDENTS" value="2,184" note="90.3% of users" icon="book" tone="violet" />
        <Metric label="TEACHERS" value="228" note="Across 14 subjects" icon="users" tone="green" />
        <Metric label="EXAMINATIONS" value="186" note="12 active now" icon="file" tone="gold" />
      </div>
      <div className="dashboard-grid">
        <section className="panel span-2">
          <div className="panel-head">
            <div>
              <span>PLATFORM ACTIVITY</span>
              <h2>Last seven days</h2>
            </div>
            <select
              value={activity}
              onChange={(event) => setActivity(event.target.value)}
              aria-label="Select activity chart"
            >
              <option>Submissions</option>
              <option>Logins</option>
            </select>
          </div>
          <div className="line-chart">
            <svg viewBox="0 0 700 190" preserveAspectRatio="none">
              <defs>
                <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#2563eb" stopOpacity=".25" />
                  <stop offset="1" stopColor="#2563eb" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path className="area" d={`${chartLine} L700,190 L0,190Z`} />
              <path className="line" d={chartLine} />
              <g>
                {activityPoints.map((point, index) => (
                  <circle
                    key={index}
                    cx={index * (700 / (activityPoints.length - 1))}
                    cy={point}
                    r="4"
                  />
                ))}
              </g>
            </svg>
            <div>
              {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((x) => (
                <span key={x}>{x}</span>
              ))}
            </div>
          </div>
        </section>
        <section className="panel">
          <div className="panel-head">
            <div>
              <span>STATUS</span>
              <h2>Examinations</h2>
            </div>
          </div>
          <div className="donut">
            <div>
              <strong>186</strong>
              <span>TOTAL</span>
            </div>
          </div>
          <div className="donut-legend">
            <span>
              <i></i>Published <b>112</b>
            </span>
            <span>
              <i></i>Draft <b>42</b>
            </span>
            <span>
              <i></i>Completed <b>32</b>
            </span>
          </div>
        </section>
      </div>
    </Shell>
  );
}

export function UserManagement() {
  type UserRecord = {
    id: number;
    name: string;
    email: string;
    role: "student" | "teacher" | "admin";
    status: "active" | "inactive" | "suspended";
    rollNumber: string | null;
    section: string | null;
    lastActivity: string | null;
  };
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [role, setRole] = useState("All roles");
  const [status, setStatus] = useState("All statuses");
  const [page, setPage] = useState(1);
  const pageSize = 3;
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newRole, setNewRole] = useState<"student" | "teacher">("student");
  useDialogFocus(adding, () => setAdding(false), ".drawer");
  const totalPages = Math.max(1, Math.ceil(totalUsers / pageSize));
  const safePage = Math.min(page, totalPages);

  async function loadUsers() {
    setLoading(true);
    setLoadError("");
    const params = new URLSearchParams({ page: String(safePage), pageSize: String(pageSize) });
    if (role !== "All roles") params.set("role", role.toLowerCase());
    if (status !== "All statuses") params.set("status", status.toLowerCase());
    if (query.trim()) params.set("q", query.trim());
    try {
      const result = await apiRequest<{ users: UserRecord[]; total: number }>(
        `/admin/users?${params}`,
      );
      setUsers(result.users);
      setTotalUsers(result.total);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Users could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, [query, role, status, safePage]);

  async function changeStatus(user: UserRecord) {
    const nextStatus = user.status === "active" ? "suspended" : "active";
    try {
      await apiRequest(`/admin/users/${user.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      setNotice(`${user.name} is now ${nextStatus}.`);
      await loadUsers();
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "The account status could not be changed.",
      );
    }
  }

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setFormError("");
    try {
      await apiRequest("/admin/users", {
        method: "POST",
        body: JSON.stringify({
          name: String(form.get("name")).trim(),
          email: String(form.get("email")).trim(),
          password: String(form.get("password")),
          role: newRole,
          rollNumber: String(form.get("rollNumber") || "").trim(),
          section: String(form.get("section") || "").trim(),
        }),
      });
      setAdding(false);
      setNotice("The account was created.");
      setPage(1);
      await loadUsers();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "The account could not be created.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Shell role="admin" route="users">
      <PageTitle
        eyebrow="USER MANAGEMENT"
        title="People and permissions."
        subtitle="Manage access, roles and account status."
        action={
          <Button
            icon="plus"
            onClick={() => {
              setFormError("");
              setAdding(true);
            }}
          >
            Add user
          </Button>
        }
      />
      <div className="search-strip">
        <div className="search-box">
          <Icon name="search" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search name or email…"
          />
        </div>
        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
        >
          <option>All roles</option>
          <option>Student</option>
          <option>Teacher</option>
          <option>Admin</option>
        </select>
        <select
          aria-label="Filter by account status"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
        >
          <option>All statuses</option>
          <option>Active</option>
          <option>Inactive</option>
          <option>Suspended</option>
        </select>
      </div>
      <section className="panel">
        {loadError && (
          <p className="form-error" role="alert">
            {loadError}
          </p>
        )}
        <div className="history-table user-table">
          <div className="table-row table-head">
            <span>User</span>
            <span>Role</span>
            <span>Status</span>
            <span>Last activity</span>
            <span></span>
          </div>
          {users.map((x) => (
            <div className="table-row" key={x.id}>
              <span>
                <i className="avatar-small">
                  {x.name
                    .split(/\s+/)
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </i>
                <b>{x.name}</b>
                <small>
                  {x.email}
                  {x.rollNumber ? ` · ${x.rollNumber}` : ""}
                </small>
              </span>
              <span>
                <em className={`role-pill ${x.role}`}>{x.role}</em>
              </span>
              <span>
                <em className={`status ${x.status}`}>{x.status}</em>
              </span>
              <span>
                {x.lastActivity ? new Date(x.lastActivity).toLocaleDateString() : "No activity"}
              </span>
              <span>
                <button
                  className="icon-btn"
                  aria-label={`${x.status === "active" ? "Suspend" : "Reactivate"} ${x.name}`}
                  title={x.status === "active" ? "Suspend account" : "Reactivate account"}
                  onClick={() => void changeStatus(x)}
                >
                  <Icon name={x.status === "active" ? "shield" : "check"} />
                </button>
              </span>
            </div>
          ))}
          {loading && <p className="tool-empty">Loading users…</p>}
        </div>
        {!loading && users.length === 0 && (
          <div className="empty-results compact">
            <Icon name="users" size={26} />
            <h2>{loadError ? "Users could not be loaded." : "No users match these filters."}</h2>
            <button
              className="text-btn"
              onClick={() => {
                setQuery("");
                setRole("All roles");
                setStatus("All statuses");
              }}
            >
              Reset filters
            </button>
          </div>
        )}
        <div className="pagination">
          <span>
            Showing {users.length ? (safePage - 1) * pageSize + 1 : 0}–
            {Math.min(safePage * pageSize, totalUsers)} of {totalUsers} users
          </span>
          <div>
            <button
              aria-label="Previous page"
              disabled={safePage === 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              ←
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((item) => (
              <button
                className={safePage === item ? "active" : ""}
                aria-current={safePage === item ? "page" : undefined}
                onClick={() => setPage(item)}
                key={item}
              >
                {item}
              </button>
            ))}
            <button
              aria-label="Next page"
              disabled={safePage === totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            >
              →
            </button>
          </div>
        </div>
        {notice && (
          <div className="toast" role="status">
            {notice}
            <button aria-label="Dismiss notification" onClick={() => setNotice("")}>
              <Icon name="x" size={16} />
            </button>
          </div>
        )}
      </section>
      {adding && (
        <div className="drawer-backdrop">
          <aside
            className="drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-user-title"
          >
            <div className="drawer-head">
              <div>
                <span>USER MANAGEMENT</span>
                <h2 id="add-user-title">Create an account.</h2>
              </div>
              <button onClick={() => setAdding(false)} aria-label="Close user form">
                <Icon name="x" />
              </button>
            </div>
            <form onSubmit={createUser}>
              <label>
                Full name
                <input name="name" autoComplete="name" required maxLength={120} />
              </label>
              <label>
                Email address
                <input name="email" type="email" autoComplete="email" required />
              </label>
              <label>
                Temporary password
                <input
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>
              <label>
                Role
                <select
                  value={newRole}
                  onChange={(event) => setNewRole(event.target.value as "student" | "teacher")}
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </select>
              </label>
              {newRole === "student" && (
                <div className="form-grid">
                  <label>
                    Roll number
                    <input name="rollNumber" required maxLength={32} />
                  </label>
                  <label>
                    Section
                    <input name="section" required maxLength={32} />
                  </label>
                </div>
              )}
              {formError && (
                <p className="form-error" role="alert">
                  {formError}
                </p>
              )}
              <div className="drawer-actions">
                <Button variant="secondary" onClick={() => setAdding(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Creating…" : "Create account"}
                </Button>
              </div>
            </form>
          </aside>
        </div>
      )}
    </Shell>
  );
}

export function Oversight() {
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  return (
    <Shell role="admin" route="oversight">
      <PageTitle
        eyebrow="EXAMINATION OVERSIGHT"
        title="A platform-wide record."
        subtitle="Monitor status, ownership and examination activity."
      />
      <div className="metric-grid">
        <Metric label="ACTIVE NOW" value="12" note="614 students online" icon="spark" />
        <Metric label="SCHEDULED" value="28" note="Next 14 days" icon="calendar" tone="violet" />
        <Metric label="COMPLETED" value="32" note="This month" icon="check" tone="green" />
        <Metric label="FLAGGED" value="03" note="Needs review" icon="flag" tone="gold" />
      </div>
      <section className="panel">
        <div className="history-table management">
          <div className="table-row table-head">
            <span>Examination</span>
            <span>Owner</span>
            <span>Participation</span>
            <span>Status</span>
            <span></span>
          </div>
          {exams.map((x, i) => (
            <div className="table-row" key={x.id}>
              <span>
                <i style={{ background: x.accent }}></i>
                <b>{x.title}</b>
                <small>
                  {x.code} · {x.subject}
                </small>
              </span>
              <span>
                {
                  [
                    "Dr. Elias Ford",
                    "Ana Silva",
                    "Marco Lee",
                    "Dr. Elias Ford",
                    "Jane Abbott",
                    "Priya Nair",
                  ][i]
                }
              </span>
              <span>{[42, 38, 29, 47, 31, 0][i] || "—"}</span>
              <span>
                <em className={`status ${x.status.toLowerCase()}`}>{x.status}</em>
              </span>
              <span>
                <button
                  className="icon-btn"
                  aria-label={`View ${x.title} details`}
                  onClick={() => setSelectedExam(x)}
                >
                  <Icon name="more" />
                </button>
              </span>
            </div>
          ))}
        </div>
      </section>
      {selectedExam && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="oversight-title"
          >
            <div className="modal-icon">
              <Icon name="file" />
            </div>
            <span>EXAMINATION OVERSIGHT</span>
            <h2 id="oversight-title">{selectedExam.title}</h2>
            <p>
              {selectedExam.code} · {selectedExam.subject} · {selectedExam.duration} minutes ·{" "}
              {selectedExam.marks} marks
            </p>
            <p>
              Status: {selectedExam.status}. Scheduled {selectedExam.date}.
            </p>
            <div className="modal-actions">
              <Button onClick={() => setSelectedExam(null)}>Close</Button>
            </div>
          </section>
        </div>
      )}
    </Shell>
  );
}

const settingsKey = "examspark-admin-settings";
const defaultSettings: Record<string, string[]> = {
  Subjects: [...courseSubjects],
  Announcements: [],
  "Files & resources": [],
  "Audit history": [],
  "General settings": [],
};

function readSettings(): Record<string, string[]> {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const saved = window.localStorage.getItem(settingsKey);
    if (!saved) return defaultSettings;
    const parsed = JSON.parse(saved) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(defaultSettings).map(([section, defaults]) => [
        section,
        Array.isArray(parsed[section]) && parsed[section].every((item) => typeof item === "string")
          ? (parsed[section] as string[])
          : defaults,
      ]),
    );
  } catch {
    return defaultSettings;
  }
}

export function Settings() {
  const [section, setSection] = useState("Subjects");
  const [entries, setEntries] = useState<Record<string, string[]>>(readSettings);
  const [adding, setAdding] = useState(false);
  const [newEntry, setNewEntry] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    try {
      window.localStorage.setItem(settingsKey, JSON.stringify(entries));
    } catch {
      setNotice(
        "Browser storage is unavailable; this change will not persist after closing the page.",
      );
    }
  }, [entries]);

  function addEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = newEntry.trim();
    if (!value) return;
    setEntries((current) => ({ ...current, [section]: [...current[section], value] }));
    setNewEntry("");
    setAdding(false);
    setNotice(`${section.slice(0, -1) || section} added to this browser.`);
  }

  function removeEntry(value: string) {
    setEntries((current) => ({
      ...current,
      [section]: current[section].filter((item) => item !== value),
    }));
  }

  return (
    <Shell role="admin" route="settings">
      <PageTitle
        eyebrow="PLATFORM MANAGEMENT"
        title="Shape the system."
        subtitle="Configure shared structures, communication and records."
      />
      <div className="settings-layout">
        <nav>
          {[
            "Subjects",
            "Announcements",
            "Files & resources",
            "Audit history",
            "General settings",
          ].map((x, i) => (
            <button className={section === x ? "active" : ""} onClick={() => setSection(x)} key={x}>
              <Icon
                name={(["book", "bell", "file", "shield", "settings"] as const)[i]! as IconName}
              />
              {x}
            </button>
          ))}
        </nav>
        <section className="panel settings-panel">
          <div className="panel-head">
            <div>
              <span>PLATFORM / {section.toUpperCase()}</span>
              <h2>{section}</h2>
            </div>
            <Button
              icon="plus"
              onClick={() => {
                setAdding((current) => !current);
                setNewEntry("");
              }}
              disabled={section === "Audit history"}
            >
              Add new
            </Button>
          </div>
          {adding && (
            <form className="study-tool-form" onSubmit={addEntry}>
              <label>
                {section === "Subjects" ? "Subject name" : `${section.slice(0, -1)} title`}
                <input
                  value={newEntry}
                  onChange={(event) => setNewEntry(event.target.value)}
                  required
                  maxLength={120}
                />
              </label>
              <div className="drawer-actions">
                <Button variant="secondary" onClick={() => setAdding(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          )}
          {entries[section].length > 0 ? (
            <div className="subject-list">
              {entries[section].map((item, index) => (
                <div key={`${item}-${index}`}>
                  <i style={{ background: exams[index % exams.length]!.accent }}>
                    {item.slice(0, 2).toUpperCase()}
                  </i>
                  <b>{item}</b>
                  <span>
                    {section === "Subjects"
                      ? `${exams.filter((exam) => exam.subject === item).length} examinations`
                      : "Saved in this browser"}
                  </span>
                  {section === "Audit history" ? (
                    <em className="status active">Read only</em>
                  ) : (
                    <button
                      className="icon-btn"
                      aria-label={`Remove ${item}`}
                      onClick={() => removeEntry(item)}
                    >
                      <Icon name="x" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Icon name={section === "Announcements" ? "bell" : "settings"} size={34} />
              <h3>{section} workspace</h3>
              <p>
                {section === "Audit history"
                  ? "Audit history will appear when audit events are connected."
                  : "Add an item to keep it in this browser's platform settings."}
              </p>
              {section !== "Audit history" && (
                <Button variant="secondary" onClick={() => setAdding(true)}>
                  Add item
                </Button>
              )}
            </div>
          )}
          {section !== "Audit history" && (
            <p className="analytics-note">
              These settings are saved in this browser, not in the shared database.
            </p>
          )}
          {notice && (
            <p className="form-success" role="status">
              {notice}
            </p>
          )}
        </section>
      </div>
    </Shell>
  );
}
