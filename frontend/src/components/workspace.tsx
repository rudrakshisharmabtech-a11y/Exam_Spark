import { useState, type ReactNode } from "react";
import { apiRequest } from "../api";
import { clearCurrentUser, getCurrentUser } from "../state";
import { Icon, Logo, navigate, type IconName, type Role, type Route } from "./ui";

export const menus: Record<Role, { label: string; route: Route; icon: IconName }[]> = {
  student: [
    { label: "Overview", route: "student", icon: "grid" },
    { label: "Study", route: "study", icon: "book" },
    { label: "Tests", route: "discover", icon: "search" },
    { label: "Analysis", route: "analysis", icon: "chart" },
    { label: "Assignments", route: "assignments", icon: "file" },
    { label: "Reports", route: "results", icon: "chart" },
  ],
  teacher: [
    { label: "Overview", route: "teacher", icon: "grid" },
    { label: "Examinations", route: "create", icon: "file" },
    { label: "Question bank", route: "bank", icon: "book" },
    { label: "Assignments", route: "classwork", icon: "file" },
    { label: "Results & analytics", route: "analytics", icon: "chart" },
  ],
  admin: [
    { label: "Overview", route: "admin", icon: "grid" },
    { label: "User management", route: "users", icon: "users" },
    { label: "Exam oversight", route: "oversight", icon: "file" },
    { label: "Platform settings", route: "settings", icon: "settings" },
  ],
};

export function Shell({
  role,
  route,
  children,
}: {
  role: Role;
  route: Route;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const names = { student: "Rudrakshi Sharma", teacher: "Dr. Elias Ford", admin: "Nina Okafor" };
  const currentUser = getCurrentUser();
  const displayName = currentUser?.name || names[role];

  const signOut = async () => {
    if (!currentUser || currentUser.demo) {
      clearCurrentUser();
      navigate("login");
      return;
    }
    const results = await Promise.allSettled([
      import("../supabase").then(({ supabase }) => supabase?.auth.signOut()),
      apiRequest("/auth/logout", { method: "POST" }),
    ]);
    clearCurrentUser();
    if (results.some((result) => result.status === "rejected")) {
      window.location.hash = "login?error=signout";
      return;
    }
    navigate("login");
  };
  return (
    <div className={`app-shell role-${role}`}>
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="side-head">
          <Logo inverse />
          <button
            className="mobile-close"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          >
            <Icon name="x" />
          </button>
        </div>
        <div className="workspace-tag">{role.toUpperCase()} WORKSPACE</div>
        <nav>
          {menus[role].map((m) => (
            <button
              className={route === m.route ? "active" : ""}
              onClick={() => {
                navigate(m.route);
                setOpen(false);
              }}
              key={m.route}
            >
              <Icon name={m.icon} />
              {m.label}
            </button>
          ))}
        </nav>
        <div className="side-note">
          <Icon name="spark" />
          <b>Demo workspace</b>
          <p>All information shown is sample data.</p>
        </div>
        <button className="side-logout" onClick={() => void signOut()}>
          <Icon name="logout" /> Sign out
        </button>
      </aside>
      {open && (
        <button
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}
      <div className="app-main">
        <header className="app-topbar">
          <button
            className="mobile-menu"
            aria-label="Open navigation"
            onClick={() => setOpen(true)}
          >
            <Icon name="menu" />
          </button>
          <div className="crumb">
            <span>ExamSpark</span>
            <b>/</b>
            <strong>{menus[role].find((x) => x.route === route)?.label || "Workspace"}</strong>
          </div>
          <div className="top-actions">
            <button
              className="icon-btn"
              aria-label="Notifications"
              aria-expanded={showNotifications}
              aria-controls="notification-popover"
              onClick={() => setShowNotifications((current) => !current)}
            >
              <Icon name="bell" />
            </button>
            {showNotifications && (
              <div className="notification-popover" id="notification-popover" role="status">
                <b>Notifications</b>
                <p>You’re all caught up. New account notifications will appear here.</p>
                <button onClick={() => setShowNotifications(false)}>Close</button>
              </div>
            )}
            <div className="profile-chip">
              <span>
                {displayName
                  .split(" ")
                  .map((x) => x[0])
                  .join("")
                  .slice(0, 2)}
              </span>
              <div>
                <b>{displayName}</b>
                <small>{role}</small>
              </div>
            </div>
          </div>
        </header>
        <main className="page">{children}</main>
      </div>
    </div>
  );
}

export function PageTitle({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-title">
      <div>
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

export function Metric({
  label,
  value,
  note,
  icon,
  tone = "",
}: {
  label: string;
  value: string;
  note: string;
  icon: IconName;
  tone?: string;
}) {
  return (
    <article className={`metric ${tone}`}>
      <div className="metric-icon">
        <Icon name={icon} />
      </div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}
