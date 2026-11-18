import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Route } from "./components/ui";
import { menus } from "./components/workspace";
import { Marketing } from "./pages/Marketing";
import { Auth } from "./pages/Auth";
import { StudentDashboard, Discover, Analysis, Prepare } from "./pages/Student";
import { Study, StudentAssignments, TeacherAssignments } from "./pages/Learning";
import { Attempt } from "./pages/Attempt";
import { Results } from "./pages/Results";
import { TeacherDashboard, ExamManagement, QuestionBank, Analytics } from "./pages/Teacher";
import { AdminDashboard, UserManagement, Oversight, Settings } from "./pages/Admin";

export default function App() {
  const validRoutes: Route[] = [
    "home",
    "login",
    "register",
    "study",
    "assignments",
    "classwork",
    "student",
    "discover",
    "analysis",
    "prepare",
    "attempt",
    "results",
    "teacher",
    "create",
    "bank",
    "analytics",
    "admin",
    "users",
    "oversight",
    "settings",
  ];
  const getRoute = (): Route => {
    const candidate = (window.location.hash.replace("#", "").split("?")[0] || "home");
    const callbackQuery = new URLSearchParams(window.location.search);
    if (
      candidate === "home" &&
      (callbackQuery.has("code") || callbackQuery.has("error") || callbackQuery.get("auth") === "callback")
    ) {
      return "login";
    }
    return validRoutes.includes(candidate as Route) ? (candidate as Route) : "home";
  };
  const [route, setRoute] = useState<Route>(getRoute);
  useEffect(() => {
    const fn = () => {
      const nextRoute = getRoute();
      setRoute(nextRoute);
      document.title =
        nextRoute === "home"
          ? "ExamSpark — Prepare. Attempt. Review."
          : `${menus.student.find((item) => item.route === nextRoute)?.label || menus.teacher.find((item) => item.route === nextRoute)?.label || menus.admin.find((item) => item.route === nextRoute)?.label || (nextRoute === "login" ? "Sign in" : nextRoute === "register" ? "Create account" : nextRoute === "prepare" ? "Prepare examination" : nextRoute === "attempt" ? "Examination in progress" : "ExamSpark")} · ExamSpark`;
    };
    fn();
    window.addEventListener("hashchange", fn);
    return () => window.removeEventListener("hashchange", fn);
  }, []);
  const pages: Record<Route, ReactNode> = useMemo(
    () => ({
      home: <Marketing />,
      login: <Auth />,
      register: <Auth register />,
      study: <Study />,
      assignments: <StudentAssignments />,
      classwork: <TeacherAssignments />,
      student: <StudentDashboard />,
      discover: <Discover />,
      analysis: <Analysis />,
      prepare: <Prepare />,
      attempt: <Attempt />,
      results: <Results />,
      teacher: <TeacherDashboard />,
      create: <ExamManagement />,
      bank: <QuestionBank />,
      analytics: <Analytics />,
      admin: <AdminDashboard />,
      users: <UserManagement />,
      oversight: <Oversight />,
      settings: <Settings />,
    }),
    [],
  );
  return pages[route] || <Marketing />;
}
