import { ArrowLeft, Loader2 } from "lucide-react";
import { useState } from "react";

import * as authApi from "../../api/auth";

export default function ForgotPasswordFlow({ onBack, onResetSuccess }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleRequestCode(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await authApi.forgotPassword(email.trim());
      setStep(2);
    } catch (err) {
      setError(err.message || "Could not send a reset code. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReset(event) {
    event.preventDefault();
    setError("");
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    setSubmitting(true);
    try {
      await authApi.resetPassword({ email: email.trim(), otp, new_password: newPassword });
      onResetSuccess?.();
    } catch (err) {
      setError(err.message || "That code did not work. Check it and try again, or request a new one.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full border border-ink/20 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-slate-500 dark:border-white/20 dark:bg-white/5 dark:text-white";

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-lagoon underline-offset-4 hover:underline dark:text-emerald-300"
      >
        <ArrowLeft size={16} aria-hidden /> Back to Sign In
      </button>

      <h3 className="font-display text-2xl font-semibold">Reset your password</h3>

      {error && (
        <p role="alert" className="mt-4 border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
          {error}
        </p>
      )}

      {step === 1 ? (
        <form onSubmit={handleRequestCode} noValidate className="mt-5 space-y-5">
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Enter your account email and we will send a 6-digit reset code. In local development
            the code is printed in the backend server console.
          </p>
          <div>
            <label htmlFor="forgot-email" className="mb-1.5 block text-sm font-medium">
              Email
            </label>
            <input
              id="forgot-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 bg-lagoon px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-lagoon-deep disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting && <Loader2 size={16} className="animate-spin" aria-hidden />}
            {submitting ? "Sending code…" : "Send reset code"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleReset} noValidate className="mt-5 space-y-5">
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            If an account exists for <strong>{email.trim()}</strong>, a 6-digit code is on its
            way. Enter it below with your new password. The code expires in 10 minutes.
          </p>
          <div>
            <label htmlFor="reset-otp" className="mb-1.5 block text-sm font-medium">
              6-digit code
            </label>
            <input
              id="reset-otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              className={`${inputClass} tracking-[0.3em]`}
            />
          </div>
          <div>
            <label htmlFor="reset-password" className="mb-1.5 block text-sm font-medium">
              New password
            </label>
            <input
              id="reset-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 bg-lagoon px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-lagoon-deep disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting && <Loader2 size={16} className="animate-spin" aria-hidden />}
            {submitting ? "Resetting password…" : "Reset password"}
          </button>
          <button
            type="button"
            onClick={() => setStep(1)}
            className="w-full text-center text-sm font-medium text-lagoon underline-offset-4 hover:underline dark:text-emerald-300"
          >
            Send a new code
          </button>
        </form>
      )}
    </div>
  );
}
