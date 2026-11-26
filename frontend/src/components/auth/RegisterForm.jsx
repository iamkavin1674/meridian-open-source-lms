import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";

import { useAuth } from "../../context/AuthContext.jsx";

export default function RegisterForm({ onRegistered }) {
  const { register, isAuthenticated } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      const data = await register({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
      });
      if (!data?.access_token && !isAuthenticated) onRegistered?.();
    } catch (err) {
      setError(err.message || "Could not create your account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full border border-ink/20 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-slate-500 dark:border-white/20 dark:bg-white/5 dark:text-white";

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {error && (
        <p role="alert" className="border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
          {error}
        </p>
      )}

      <div>
        <label htmlFor="register-name" className="mb-1.5 block text-sm font-medium">
          Full name
        </label>
        <input
          id="register-name"
          type="text"
          autoComplete="name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Your full name"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="register-email" className="mb-1.5 block text-sm font-medium">
          Email
        </label>
        <input
          id="register-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="register-password" className="mb-1.5 block text-sm font-medium">
          Password
        </label>
        <div className="relative">
          <input
            id="register-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className={`${inputClass} pr-11`}
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
      </div>

      <div>
        <label htmlFor="register-confirm" className="mb-1.5 block text-sm font-medium">
          Confirm password
        </label>
        <input
          id="register-confirm"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repeat your password"
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 bg-lagoon px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-lagoon-deep disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting && <Loader2 size={16} className="animate-spin" aria-hidden />}
        {submitting ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
