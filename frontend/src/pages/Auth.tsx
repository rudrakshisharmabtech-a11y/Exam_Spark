import { useEffect, useState, type FormEvent } from "react";
import { apiRequest, startOAuth } from "../api";
import { Button, Logo, navigate } from "../components/ui";

type AuthRole = "student" | "teacher" | "admin";

export function Auth({ register = false }: { register?: boolean }) {
  const query = new URLSearchParams(window.location.hash.split("?")[1] ?? "");
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
        : "",
  );
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({ name: "", email: "", rollNumber: "", section: "", githubProfile: "" });

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
      const result = completeProfile
        ? await apiRequest<{ user: { role: AuthRole } }>("/auth/profile", {
            method: "PATCH",
            body: JSON.stringify(payload),
          })
        : register
          ? await apiRequest<{ user: { role: AuthRole } }>("/auth/register", {
            method: "POST",
            body: JSON.stringify(payload),
          })
          : await apiRequest<{ user: { role: AuthRole } }>("/auth/login", {
              method: "POST",
              body: JSON.stringify({ email: payload.email, password: payload.password, role }),
            });
      navigate(result.user.role);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "We could not complete the request. Please try again.",
      );
    } finally {
      setLoading(false);
    }
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
            Student and teacher accounts use secure server sign-in. Administrators are provisioned
            separately.
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
          {!completeProfile && role !== "admin" && <>
            <div className="auth-divider"><span>or continue with</span></div>
            <div className="oauth-actions" style={{ gridTemplateColumns: "1fr" }}>
              <button
                type="button"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  padding: "12px 16px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  background: "#ffffff",
                  color: "#1f2937",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  transition: "all 0.15s ease"
                }}
                onClick={() => startOAuth("google", role)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                Continue with Google
              </button>
            </div>
            <p className="oauth-note">Secure Google Sign-In with instant live profile verification</p>
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
