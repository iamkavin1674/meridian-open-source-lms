import { Briefcase, Camera, CheckCircle2, GraduationCap, Mail, Phone, Trash2, User } from "lucide-react";
import { useRef, useState } from "react";

function getInitials(fullName, email) {
  const source = (fullName || email || "M").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export default function ProfileView({ profile, role, onSave }) {
  const [form, setForm] = useState(profile);
  const [savedBanner, setSavedBanner] = useState(false);
  const fileInputRef = useRef(null);

  const initials = getInitials(form.full_name, form.email);

  function updateField(key, value) {
    setSavedBanner(false);
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleAvatarChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateField("avatarUrl", reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSave({
      ...form,
      full_name: form.full_name.trim() || "Meridian Student",
      email: form.email.trim(),
    });
    setSavedBanner(true);
  }

  const inputClass =
    "w-full rounded-lg border border-ink/15 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-lagoon focus:outline-none dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-400";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. Profile Picture & Identity Header */}
      <section className="rounded-xl border border-ink/10 bg-white p-6 shadow-xs dark:border-white/10 dark:bg-ink">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {form.avatarUrl ? (
              <img
                src={form.avatarUrl}
                alt={form.full_name || "Profile picture"}
                className="h-18 w-18 shrink-0 rounded-full border border-ink/15 object-cover dark:border-white/20"
              />
            ) : (
              <div
                aria-hidden="true"
                className="flex h-18 w-18 shrink-0 items-center justify-center rounded-full bg-ink text-xl font-semibold text-white dark:bg-emerald-400 dark:text-ink-deep"
              >
                {initials}
              </div>
            )}

            <div>
              <h2 className="font-display text-xl font-semibold text-ink dark:text-white">
                {form.full_name || "Meridian Student"}
              </h2>
              <p className="mt-0.5 text-xs font-medium capitalize text-slate-500 dark:text-slate-400">
                {role || "trainee"} · Meridian LMS
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-ink/15 bg-paper/60 px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-lagoon/50 hover:text-lagoon dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:border-emerald-400/50 dark:hover:text-emerald-300"
                >
                  <Camera size={14} aria-hidden />
                  <span>{form.avatarUrl ? "Change profile picture" : "Add profile picture"}</span>
                </button>

                {form.avatarUrl && (
                  <button
                    type="button"
                    onClick={() => updateField("avatarUrl", "")}
                    className="inline-flex items-center gap-1 rounded-lg border border-ink/10 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:border-white/10 dark:text-slate-300 dark:hover:border-red-900/60 dark:hover:bg-red-950/40 dark:hover:text-red-300"
                  >
                    <Trash2 size={13} aria-hidden />
                    <span>Remove</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Personal Details */}
      <section className="rounded-xl border border-ink/10 bg-white p-6 shadow-xs dark:border-white/10 dark:bg-ink">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <User size={14} aria-hidden />
          <span>Personal Details</span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="profile-name" className="mb-1.5 block text-xs font-semibold">
              Full Name
            </label>
            <input
              id="profile-name"
              type="text"
              required
              value={form.full_name}
              onChange={(e) => updateField("full_name", e.target.value)}
              placeholder="Your full name"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="profile-birthday" className="mb-1.5 block text-xs font-semibold">
              Birthday
            </label>
            <input
              id="profile-birthday"
              type="date"
              value={form.birthday}
              onChange={(e) => updateField("birthday", e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="profile-gender" className="mb-1.5 block text-xs font-semibold">
              Gender
            </label>
            <select
              id="profile-gender"
              value={form.gender}
              onChange={(e) => updateField("gender", e.target.value)}
              className={`${inputClass} dark:[&>option]:bg-ink-deep dark:[&>option]:text-white`}
            >
              <option value="" className="bg-white text-ink dark:bg-ink-deep dark:text-white">Select gender</option>
              <option value="Female" className="bg-white text-ink dark:bg-ink-deep dark:text-white">Female</option>
              <option value="Male" className="bg-white text-ink dark:bg-ink-deep dark:text-white">Male</option>
              <option value="Non-binary" className="bg-white text-ink dark:bg-ink-deep dark:text-white">Non-binary</option>
              <option value="Prefer not to say" className="bg-white text-ink dark:bg-ink-deep dark:text-white">Prefer not to say</option>
              <option value="Other" className="bg-white text-ink dark:bg-ink-deep dark:text-white">Other</option>
            </select>
          </div>
        </div>
      </section>

      {/* 3. Contact Information */}
      <section className="rounded-xl border border-ink/10 bg-white p-6 shadow-xs dark:border-white/10 dark:bg-ink">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <Mail size={14} aria-hidden />
          <span>Contact Information</span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="profile-email" className="mb-1.5 block text-xs font-semibold">
              Email Address
            </label>
            <input
              id="profile-email"
              type="email"
              required
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="you@example.com"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="profile-phone" className="mb-1.5 block text-xs font-semibold">
              Phone Number
            </label>
            <div className="relative">
              <Phone
                size={15}
                aria-hidden
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                id="profile-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="+254 700 000 000"
                className={`${inputClass} pl-9`}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 4. Work & Education */}
      <section className="rounded-xl border border-ink/10 bg-white p-6 shadow-xs dark:border-white/10 dark:bg-ink">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <Briefcase size={14} aria-hidden />
          <span>Work & Education</span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="profile-work" className="mb-1.5 block text-xs font-semibold">
              Work / Occupation
            </label>
            <input
              id="profile-work"
              type="text"
              value={form.work}
              onChange={(e) => updateField("work", e.target.value)}
              placeholder="e.g., Data Analyst at Meridian"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="profile-education" className="mb-1.5 block text-xs font-semibold">
              Education
            </label>
            <div className="relative">
              <GraduationCap
                size={15}
                aria-hidden
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                id="profile-education"
                type="text"
                value={form.education}
                onChange={(e) => updateField("education", e.target.value)}
                placeholder="e.g., B.Sc. Computer Science"
                className={`${inputClass} pl-9`}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Save Action & Confirmation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {savedBanner ? (
          <p
            role="status"
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-950/60 dark:text-emerald-200"
          >
            <CheckCircle2 size={15} aria-hidden />
            <span>Profile changes saved.</span>
          </p>
        ) : (
          <span />
        )}

        <button
          type="submit"
          className="rounded-lg bg-lagoon px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-lagoon-deep dark:bg-emerald-500 dark:text-ink-deep dark:hover:bg-emerald-400"
        >
          Save Profile
        </button>
      </div>
    </form>
  );
}
