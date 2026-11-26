import { GoogleLogin } from "@react-oauth/google";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";

import { useAuth } from "../../context/AuthContext.jsx";

export default function LoginForm({ onForgotPassword, isDark }) {
  const { login, googleLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState("");

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
  const busy = submitting || googleBusy;

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err.message || "Sign-in failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle(credentialResponse) {
    if (!credentialResponse?.credential) {
      setError("Google did not return a credential. Please try again.");
      return;
    }
    setError("");
    setGoogleBusy(true);
    try {
      await googleLogin(credentialResponse.credential);
    } catch (err) {
      setError(err.message || "Google sign-in failed. Please try again.");
    } finally {
      setGoogleBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {error && (
        <p role="alert" className="border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
          {error}
        </p>
      )}

      <div>
        <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium">
          Email
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full border border-ink/20 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-slate-500 dark:border-white/20 dark:bg-white/5 dark:text-white"
        />
      </div>

      <div>
        <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium">
          Password
        </label>
        <div className="relative">
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            className="w-full border border-ink/20 bg-white px-3.5 py-2.5 pr-11 text-sm text-ink placeholder:text-slate-500 dark:border-white/20 dark:bg-white/5 dark:text-white"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-ink dark:text-slate-300 dark:hover:text-white"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <div className="mt-2 text-right">
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-sm font-medium text-lagoon underline-offset-4 hover:underline dark:text-emerald-300"
          >
            Forgot password?
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 bg-lagoon px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-lagoon-deep disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting && <Loader2 size={16} className="animate-spin" aria-hidden />}
        {submitting ? "Signing in…" : "Sign in"}
      </button>

      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
        <span className="h-px flex-1 bg-ink/15 dark:bg-white/15" />
        or continue with
        <span className="h-px flex-1 bg-ink/15 dark:bg-white/15" />
      </div>

      {googleClientId ? (
        <div className="flex justify-center" aria-busy={googleBusy}>
          <GoogleLogin
            onSuccess={handleGoogle}
            onError={() => setError("Google sign-in failed. Please try again.")}
            theme={isDark ? "filled_black" : "outline"}
            size="large"
            text="continue_with"
            shape="rectangular"
          />
        </div>
      ) : (
        <p className="border border-ink/10 bg-ink/5 px-4 py-3 text-center text-xs text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          Google sign-in is not configured yet. Set <code>VITE_GOOGLE_CLIENT_ID</code> in
          <code> frontend/.env</code> and restart the dev server.
        </p>
      )}
    </form>
  );
}
