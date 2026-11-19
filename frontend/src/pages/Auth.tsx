import { useEffect, useState, type FormEvent } from "react";
import { apiRequest } from "../api";
import { Button, Logo, navigate } from "../components/ui";
import type { AuthenticatedUser } from "../supabase";
import { setCurrentUser, setDemoUser } from "../state";

type AuthRole = "student" | "teacher" | "admin";
const supabaseConfigured = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

export function Auth({ register = false }: { register?: boolean }) {
  const query = new URLSearchParams(
    `${window.location.search.slice(1)}&${window.location.hash.split("?")[1] ?? ""}`,
  );
  const completeProfile = register && query.get("completeProfile") === "1";
  const requestedRole = query.get("role");
  const [role, setRole] = useState<AuthRole>(
    requestedRole === "teacher" || requestedRole === "admin" ? requestedRole : "student",
  );
  const oauthError = query.get("error");
  const [error, setError] = useState(
    oauthError === "role_mismatch"
      ? "This provider account is not registered for the selected role."
      : oauthError === "oauth_cancelled"
        ? "Provider sign-in was cancelled."
        : oauthError === "signout"
          ? "Session cleanup was incomplete. You have been signed out of the local workspace."
          : query.get("error_description") || query.get("error") || "",
  );
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({ name: "", email: "", rollNumber: "", section: "", githubProfile: "" });

  useEffect(() => {
    if (!supabaseConfigured || completeProfile) return;
    const pendingRole = sessionStorage.getItem("examspark-oauth-role");
    const hasCallback = new URLSearchParams(window.location.search).has("code");
    if ((pendingRole !== "student" && pendingRole !== "teacher") || !hasCallback) return;
    setLoading(true);
    import("../supabase")
      .then(async ({ supabase, exchangeSupabaseSession }) => {
        if (!supabase) throw new Error("Supabase is not configured in the frontend.");
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!data.session) throw new Error("The provider sign-in did not return a session. Please try again.");
        const user = await exchangeSupabaseSession(data.session.access_token, pendingRole);
        setCurrentUser(user);
        sessionStorage.removeItem("examspark-oauth-role");
        if (user.role === "student" && !user.profile) {
          window.location.hash = "register?completeProfile=1";
        } else {
          navigate(user.role);
        }
      })
      .catch((callbackError: unknown) => {
        sessionStorage.removeItem("examspark-oauth-role");
        setError(callbackError instanceof Error ? callbackError.message : "Provider sign-in could not be completed.");
      })
      .finally(() => setLoading(false));
  }, [completeProfile]);

  useEffect(() => {
    if (!completeProfile) return;
    apiRequest<{ user: { name: string; email: string; role: AuthRole } }>("/auth/me")
      .then(({ user }) => {
        setRole(user.role);
        setProfile((current) => ({ ...current, name: user.name, email: user.email }));
      })
      .catch((requestError: unknown) => {
        setError(requestError instanceof Error ? requestError.message : "Could not load your account details.");
      });
  }, [completeProfile]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") ?? profile.name).trim(),
      rollNumber: String(form.get("rollNumber") ?? profile.rollNumber).trim(),
      section: String(form.get("section") ?? profile.section).trim(),
      githubProfile: String(form.get("githubProfile") ?? profile.githubProfile).trim(),
      email: String(form.get("email") ?? profile.email).trim(),
      password: String(form.get("password") ?? ""),
      role,
    };
    try {
      let user: AuthenticatedUser;
      if (completeProfile) {
        const result = await apiRequest<{ user: AuthenticatedUser }>("/auth/profile", {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        user = result.user;
      } else if (supabaseConfigured && role !== "admin") {
        const { supabase, exchangeSupabaseSession } = await import("../supabase");
        if (!supabase) throw new Error("Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
        if (register) {
          const { data, error: signUpError } = await supabase.auth.signUp({
            email: payload.email,
            password: payload.password,
            options: {
              data: {
                full_name: payload.name,
                app_role: "student",
                roll_number: payload.rollNumber,
                section: payload.section,
                github_profile: payload.githubProfile || null,
              },
            },
          });
          if (signUpError) throw signUpError;
          if (!data.session) {
            setError("Check your email to confirm your account, then return here to sign in.");
            return;
          }
          user = await exchangeSupabaseSession(data.session.access_token, "student", payload);
        } else {
          const { data, error: signInError } = await supabase.auth.signInWithPassword({
            email: payload.email,
            password: payload.password,
          });
          if (signInError) {
            const legacyResult = await apiRequest<{ user: AuthenticatedUser }>("/auth/login", {
              method: "POST",
              body: JSON.stringify({ email: payload.email, password: payload.password, role }),
            });
            user = legacyResult.user;
          } else {
            if (!data.session) throw new Error("Sign-in succeeded without an active session. Please try again.");
            user = await exchangeSupabaseSession(data.session.access_token, role);
          }
        }
      } else if (register) {
        const result = await apiRequest<{ user: AuthenticatedUser }>("/auth/register", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        user = result.user;
      } else {
        const result = await apiRequest<{ user: AuthenticatedUser }>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email: payload.email, password: payload.password, role }),
        });
        user = result.user;
      }
      if (user.id && user.name && user.email) {
        setCurrentUser({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          profile: user.profile,
        });
      }
      navigate(user.role);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "We could not complete the request. Please try again.";
      setError(
        register && /cannot reach|could not complete|not configured/i.test(message)
          ? `${message} Real account creation needs the ExamSpark API and database configured. Use the demo links below to preview a workspace.`
          : message,
      );
    } finally {
      setLoading(false);
    }
  }

  async function beginOAuth(provider: "google" | "github") {
    setError("");
    if (!supabaseConfigured) {
      setError("Google and GitHub sign-in need VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.");
      return;
    }
    if (role === "admin") {
      setError("Administrator accounts use email and password sign-in.");
      return;
    }
    sessionStorage.setItem("examspark-oauth-role", role);
    try {
      const { supabase } = await import("../supabase");
      if (!supabase) throw new Error("Supabase is not configured in the frontend.");
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/?auth=callback` },
      });
      if (oauthError) throw oauthError;
    } catch (oauthError) {
      sessionStorage.removeItem("examspark-oauth-role");
      setError(oauthError instanceof Error ? oauthError.message : "Could not start provider sign-in.");
    }
  }

  function enterDemo(role: "student" | "teacher") {
    setDemoUser(role);
    navigate(role);
  }

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <Logo inverse />
        <div className="auth-message">
          <div className="eyebrow light">
            <span></span> PREPARE · ATTEMPT · REVIEW
          </div>
          <h1>{register ? "Your next chapter starts with one clear step." : "Welcome back to your learning rhythm."}</h1>
          <p>
            Student accounts can be created when the backend is configured. Teacher accounts are
            provisioned by an administrator. You can preview either workspace below.
          </p>
        </div>
        <div className="auth-pattern"></div>
      </div>
      <div className="auth-form-wrap">
        <button className="back-link" onClick={() => navigate("home")}>
          ← Back to home
        </button>
        <form className="auth-form" onSubmit={submit}>
          <span className="form-step">{register ? "STUDENT REGISTRATION" : "SECURE ACCESS"}</span>
          <h2>{register ? "Create your account" : "Sign in"}</h2>
          <p>{register ? "A few details connect your learning record." : "Choose your workspace and continue."}</p>
          {!register && (
            <div className="role-tabs" aria-label="Choose a workspace">
              {(["student", "teacher"] as const).map((value) => (
                <button
                  type="button"
                  className={role === value ? "active" : ""}
                  aria-pressed={role === value}
                  onClick={() => setRole(value)}
                  key={value}
                >
                  {value === "student" ? "Student" : "Teacher"}
                </button>
              ))}
            </div>
          )}
          {!register && (
            <button type="button" className="admin-login-link" onClick={() => setRole("admin")}>
              Administrator access
            </button>
          )}
          {register && (
            <>
              <label>
                Full name
                <input name="name" autoComplete="name" placeholder="Your full name" value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} required disabled={completeProfile} />
              </label>
              <div className="auth-field-row">
                <label>
                  Roll number
                  <input name="rollNumber" placeholder="e.g. STU-20418" value={profile.rollNumber} onChange={(event) => setProfile({ ...profile, rollNumber: event.target.value })} required />
                </label>
                <label>
                  Section
                  <input name="section" placeholder="e.g. A" value={profile.section} onChange={(event) => setProfile({ ...profile, section: event.target.value })} required />
                </label>
              </div>
            </>
          )}
          <label>
            Email address
            <input
              name="email"
              type="email"
              autoComplete="email"
              placeholder={role === "student" ? "you@school.edu" : "teacher@school.edu"}
              required
              value={profile.email}
              onChange={(event) => setProfile({ ...profile, email: event.target.value })}
              disabled={completeProfile}
            />
          </label>
          {register && (
            <label>
              GitHub profile <span className="optional-label">Optional</span>
              <input name="githubProfile" type="url" placeholder="https://github.com/username" value={profile.githubProfile} onChange={(event) => setProfile({ ...profile, githubProfile: event.target.value })} />
            </label>
          )}
          {!completeProfile && <label>
            Password
            <div className="input-wrap">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete={register ? "new-password" : "current-password"}
                placeholder="At least 8 characters"
                minLength={8}
                required
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((shown) => !shown)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </label>}
          {error && <div className="form-error" role="alert">{error}</div>}
          {!register && (
            <div className="form-row">
              <label className="checkbox"><input type="checkbox" /> Keep me signed in</label>
              <span className="text-btn" title="Ask your administrator to reset your password.">Forgot password?</span>
            </div>
          )}
          <Button type="submit" icon="arrow" disabled={loading}>
            {loading ? "Connecting…" : completeProfile ? "Finish profile" : register ? "Create student account" : `Continue as ${role}`}
          </Button>
          {!completeProfile && (
            <>
              <div className="auth-divider"><span>or preview a workspace</span></div>
              <div className="workspace-preview-actions">
                <button type="button" onClick={() => enterDemo("student")}>
                  Continue as Rudrakshi Sharma <span>STUDENT DEMO</span>
                </button>
                <button type="button" onClick={() => enterDemo("teacher")}>
                  Continue as Dr. Elias Ford <span>TEACHER DEMO</span>
                </button>
              </div>
              <p className="oauth-note">Demo access is password-free and uses sample data saved only in this browser.</p>
            </>
          )}
          {!completeProfile && role !== "admin" && <>
            <div className="auth-divider"><span>or continue with</span></div>
            <div className="oauth-actions">
              <button type="button" onClick={() => void beginOAuth("google")}>Google</button>
              <button type="button" onClick={() => void beginOAuth("github")}>GitHub</button>
            </div>
            <p className="oauth-note">
              {supabaseConfigured
                ? "Google and GitHub sign-in must be enabled in your Supabase project."
                : "Configure Supabase in .env to enable Google and GitHub sign-in."}
            </p>
          </>}
          <div className="switch-auth">
            {!completeProfile && <>{register ? "Already have an account?" : "New to ExamSpark?"}{" "}
              <button type="button" onClick={() => navigate(register ? "login" : "register")}>
                {register ? "Sign in" : "Create account"}
              </button></>}
          </div>
        </form>
      </div>
    </div>
  );
}
