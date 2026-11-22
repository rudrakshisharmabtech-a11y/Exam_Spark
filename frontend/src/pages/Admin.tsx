import { useState, useEffect } from "react";
import { exams, users as sampleUsers } from "../data";
import { apiRequest } from "../api";
import { Button, Icon, type IconName } from "../components/ui";
import { Metric, PageTitle, Shell } from "../components/workspace";

export function AdminDashboard() {
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
            <select>
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
              <path
                className="area"
                d="M0,155 C60,130 80,142 130,105 S220,130 280,80 S390,110 450,62 S560,88 610,44 S670,54 700,22 L700,190 L0,190Z"
              />
              <path
                className="line"
                d="M0,155 C60,130 80,142 130,105 S220,130 280,80 S390,110 450,62 S560,88 610,44 S670,54 700,22"
              />
              <g>
                {[
                  [0, 155],
                  [130, 105],
                  [280, 80],
                  [450, 62],
                  [610, 44],
                  [700, 22],
                ].map((p, i) => (
                  <circle key={i} cx={p[0]} cy={p[1]} r="4" />
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
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [role, setRole] = useState("All roles");
  const [page, setPage] = useState(1);
  const [liveUsers, setLiveUsers] = useState<Array<{ name: string; email: string; role: string; status: string; initials: string; activity: string }>>([]);

  useEffect(() => {
    apiRequest<{ users: Array<{ id: number; name: string; email: string; role: string; status: string; createdAt: string; rollNumber?: string }> }>("/admin/users")
      .then((res) => {
        if (res.users && Array.isArray(res.users)) {
          const formatted = res.users.map((u) => ({
            name: u.name,
            email: u.email,
            role: u.role.charAt(0).toUpperCase() + u.role.slice(1),
            status: u.status ? u.status.charAt(0).toUpperCase() + u.status.slice(1) : "Active",
            initials: u.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "US",
            activity: u.rollNumber ? `Roll: ${u.rollNumber}` : "Registered",
          }));
          setLiveUsers(formatted);
        }
      })
      .catch(() => {});
  }, []);

  const allUsers = [...liveUsers, ...sampleUsers.filter(su => !liveUsers.some(lu => lu.email.toLowerCase() === su.email.toLowerCase()))];

  const shown = allUsers.filter(
    (x) =>
      (role === "All roles" || x.role === role) &&
      `${x.name} ${x.email}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const pageSize = 3;
  const totalPages = Math.max(1, Math.ceil(shown.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visible = shown.slice((safePage - 1) * pageSize, safePage * pageSize);
  return (
    <Shell role="admin" route="users">
      <PageTitle
        eyebrow="USER MANAGEMENT"
        title="People and permissions."
        subtitle="Manage access, roles and account status."
        action={
          <Button
            icon="plus"
            onClick={() => setNotice("Demo only: user creation is not connected.")}
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
        </select>
        <button
          className="filter-btn"
          onClick={() => setNotice("Demo only: status filtering is not available.")}
        >
          <Icon name="filter" /> Status
        </button>
      </div>
      <section className="panel">
        <div className="history-table user-table">
          <div className="table-row table-head">
            <span>User</span>
            <span>Role</span>
            <span>Status</span>
            <span>Last activity</span>
            <span></span>
          </div>
          {visible.map((x) => (
            <div className="table-row" key={x.email}>
              <span>
                <i className="avatar-small">{x.initials}</i>
                <b>{x.name}</b>
                <small>{x.email}</small>
              </span>
              <span>
                <em className={`role-pill ${x.role.toLowerCase()}`}>{x.role}</em>
              </span>
              <span>
                <em className={`status ${x.status.toLowerCase()}`}>{x.status}</em>
              </span>
              <span>{x.activity}</span>
              <span>
                <button
                  className="icon-btn"
                  aria-label={`More actions for ${x.name}`}
                  onClick={() => setNotice(`Demo only: actions for ${x.name} are not connected.`)}
                >
                  <Icon name="more" />
                </button>
              </span>
            </div>
          ))}
        </div>
        {visible.length === 0 && (
          <div className="empty-results compact">
            <Icon name="users" size={26} />
            <h2>No demo users match.</h2>
            <button
              className="text-btn"
              onClick={() => {
                setQuery("");
                setRole("All roles");
              }}
            >
              Reset filters
            </button>
          </div>
        )}
        <div className="pagination">
          <span>
            Showing {visible.length ? (safePage - 1) * pageSize + 1 : 0}–
            {Math.min(safePage * pageSize, shown.length)} of {shown.length} demo users
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
    </Shell>
  );
}

export function Oversight() {
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
                <button className="icon-btn">
                  <Icon name="more" />
                </button>
              </span>
            </div>
          ))}
        </div>
      </section>
    </Shell>
  );
}

export function Settings() {
  const [section, setSection] = useState("Subjects");
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
            <Button icon="plus">Add new</Button>
          </div>
          {section === "Subjects" ? (
            <div className="subject-list">
              {["Biology", "Mathematics", "History", "Physics", "English", "Chemistry"].map(
                (x, i) => (
                  <div key={x}>
                    <i style={{ background: exams[i].accent }}>{x.slice(0, 2)}</i>
                    <b>{x}</b>
                    <span>{[28, 34, 18, 26, 22, 19][i]} examinations</span>
                    <em className="status active">Active</em>
                    <button className="icon-btn">
                      <Icon name="more" />
                    </button>
                  </div>
                ),
              )}
            </div>
          ) : (
            <div className="empty-state">
              <Icon name={section === "Announcements" ? "bell" : "settings"} size={34} />
              <h3>{section} workspace</h3>
              <p>
                This interactive area is ready for future backend integration. Demonstration
                controls do not persist data.
              </p>
              <Button variant="secondary">Create demonstration item</Button>
            </div>
          )}
        </section>
      </div>
    </Shell>
  );
}
