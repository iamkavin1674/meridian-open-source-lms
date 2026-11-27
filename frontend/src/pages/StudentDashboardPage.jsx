import { ArrowLeft, BookOpen, Globe2, Search, UserCheck, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { sendChatMessage } from "../api/aiChat.js";
import ActionPlanCard from "../components/dashboard/ActionPlanCard.jsx";
import AICoachDrawer from "../components/dashboard/AICoachDrawer.jsx";
import CalendarKpiCard from "../components/dashboard/CalendarKpiCard.jsx";
import DashboardLayout from "../components/dashboard/DashboardLayout.jsx";
import KpiCards from "../components/dashboard/KpiCards.jsx";
import ProfileView from "../components/dashboard/ProfileView.jsx";
import ProgressChartCard from "../components/dashboard/ProgressChartCard.jsx";
import TrainerFeedbackCard from "../components/dashboard/TrainerFeedbackCard.jsx";
import WeeklyPulseCard from "../components/dashboard/WeeklyPulseCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import {
  DASHBOARD_CONTEXT_LABEL,
  INITIAL_ACTION_PLAN,
  MOCK_COURSES,
  TRAINER_FEEDBACK,
  WEEKLY_SCORES,
} from "../data/mockStudentDashboard.js";

const NEXT_STATUS = {
  todo: "in_progress",
  in_progress: "done",
  done: "todo",
};

export default function StudentDashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeNav, setActiveNav] = useState("dashboard");
  const [courseSearch, setCourseSearch] = useState("");
  const [actionPlan, setActionPlan] = useState(INITIAL_ACTION_PLAN);
  const [surveySubmitted, setSurveySubmitted] = useState(false);
  const [surveyData, setSurveyData] = useState(null);

  const [isAiOpen, setIsAiOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [draftPrompt, setDraftPrompt] = useState({ text: "", nonce: 0 });

  const [profile, setProfile] = useState(() => ({
    full_name: user?.full_name || "Meridian Student",
    email: user?.email || "",
    avatarUrl: user?.avatar_url || user?.picture || "",
    gender: "",
    work: "",
    education: "",
    birthday: "",
    phone: "",
  }));

  useEffect(() => {
    if (!user) return;
    setProfile((prev) => ({
      ...prev,
      full_name: prev.full_name === "Meridian Student" && user.full_name ? user.full_name : prev.full_name,
      email: !prev.email && user.email ? user.email : prev.email,
      avatarUrl: !prev.avatarUrl && (user.avatar_url || user.picture) ? user.avatar_url || user.picture : prev.avatarUrl,
    }));
  }, [user]);

  const effectiveUser = useMemo(
    () => ({
      ...user,
      full_name: profile.full_name,
      email: profile.email || user?.email,
      avatar_url: profile.avatarUrl || user?.avatar_url || user?.picture || "",
    }),
    [user, profile]
  );

  const studentContext = useMemo(
    () => ({
      firstName: effectiveUser?.full_name?.trim()?.split(/\s+/)[0] || "Learner",
      actionPlan,
      weeklyScores: WEEKLY_SCORES,
      trainerFeedback: TRAINER_FEEDBACK,
      surveySubmitted,
    }),
    [effectiveUser, actionPlan, surveySubmitted]
  );

  const handleCycleStatus = useCallback((stepId) => {
    setActionPlan((prev) =>
      prev.map((step) =>
        step.id === stepId
          ? { ...step, status: NEXT_STATUS[step.status] || "todo" }
          : step
      )
    );
  }, []);

  const handleSurveySubmit = useCallback((payload) => {
    setSurveyData(payload);
    setSurveySubmitted(true);
  }, []);

  const handleAskAiWithPrompt = useCallback((promptText) => {
    setIsAiOpen(true);
    setDraftPrompt((prev) => ({ text: promptText, nonce: prev.nonce + 1 }));
  }, []);

  const handleSendMessage = useCallback(
    async (text) => {
      const userMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
        timestamp: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, userMessage]);
      setIsAiThinking(true);
      try {
        const reply = await sendChatMessage(text, studentContext);
        setChatMessages((prev) => [...prev, reply]);
      } finally {
        setIsAiThinking(false);
      }
    },
    [studentContext]
  );

  const handleSignOut = useCallback(() => {
    logout();
    navigate("/login", { replace: true });
  }, [logout, navigate]);

  function renderSubViewHeader(subtitle) {
    return (
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600 dark:text-slate-300">{subtitle}</p>
        <button
          type="button"
          onClick={() => setActiveNav("dashboard")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-ink/15 bg-white px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-ink/5 dark:border-white/15 dark:bg-ink dark:text-white dark:hover:bg-white/10"
        >
          <ArrowLeft size={14} aria-hidden />
          <span>Back to Dashboard</span>
        </button>
      </div>
    );
  }

  function renderMainContent() {
    if (activeNav === "courses") {
      const query = courseSearch.trim().toLowerCase();
      const filteredCourses = MOCK_COURSES.filter((course) => {
        if (!query) return true;
        return (
          course.title.toLowerCase().includes(query) ||
          course.code.toLowerCase().includes(query) ||
          course.instructor.toLowerCase().includes(query) ||
          course.region.toLowerCase().includes(query)
        );
      });

      return (
        <div className="mx-auto max-w-6xl space-y-6">
          {renderSubViewHeader("Active cohort enrollments across the 5-country Meridian curriculum.")}

          {/* Search bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-md">
              <Search
                size={16}
                aria-hidden
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
              />
              <input
                type="text"
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                placeholder="Search by course title, code (e.g. ML-204), or trainer…"
                aria-label="Search courses"
                className="w-full rounded-xl border border-ink/15 bg-white py-2.5 pl-10 pr-9 text-sm text-ink placeholder:text-slate-400 focus:border-lagoon focus:outline-none dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-400"
              />
              {courseSearch && (
                <button
                  type="button"
                  onClick={() => setCourseSearch("")}
                  aria-label="Clear course search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-ink dark:text-slate-500 dark:hover:text-white"
                >
                  <X size={15} aria-hidden />
                </button>
              )}
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing <span className="font-semibold text-ink dark:text-white">{filteredCourses.length}</span> of {MOCK_COURSES.length} courses
            </p>
          </div>

          {filteredCourses.length === 0 ? (
            <div className="rounded-xl border border-dashed border-ink/20 bg-white/50 p-8 text-center dark:border-white/20 dark:bg-ink/50">
              <p className="text-sm font-semibold text-ink dark:text-white">
                No courses matched &ldquo;{courseSearch}&rdquo;
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Try searching by course code (e.g., &ldquo;ML-204&rdquo;), trainer name, or subject.
              </p>
              <button
                type="button"
                onClick={() => setCourseSearch("")}
                className="mt-3 inline-flex items-center rounded-lg border border-ink/15 px-3 py-1.5 text-xs font-semibold text-lagoon hover:bg-lagoon/10 dark:border-white/15 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
              >
                Reset search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {filteredCourses.map((course) => (
                <article
                  key={course.id}
                  className="flex flex-col justify-between rounded-xl border border-ink/10 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-ink"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="rounded-full bg-lagoon/10 px-2.5 py-0.5 font-semibold text-lagoon dark:bg-emerald-500/15 dark:text-emerald-300">
                        {course.code}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">{course.region}</span>
                    </div>
                    <h2 className="mt-3 font-display text-lg font-semibold text-ink dark:text-white">
                      {course.title}
                    </h2>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Trainer: {course.instructor}
                    </p>
                  </div>

                  <div className="mt-5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-600 dark:text-slate-300">Module progress</span>
                      <span className="text-lagoon dark:text-emerald-300">{course.progress}%</span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-ink/10 dark:bg-white/10">
                      <div
                        className="h-full rounded-full bg-lagoon dark:bg-emerald-400"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                    <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <BookOpen size={13} aria-hidden />
                      <span>Next live session: {course.nextSession}</span>
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (activeNav === "action-plan") {
      return (
        <div className="mx-auto max-w-4xl space-y-6">
          {renderSubViewHeader("Focused view of your personalized Flow A coaching plan.")}
          <ActionPlanCard
            steps={actionPlan}
            onCycleStatus={handleCycleStatus}
            onAskAi={handleAskAiWithPrompt}
          />
        </div>
      );
    }

    if (activeNav === "survey") {
      return (
        <div className="mx-auto max-w-2xl space-y-6">
          {renderSubViewHeader("Share honest weekly signals with your cohort trainers—never linked to your profile.")}
          <WeeklyPulseCard
            submitted={surveySubmitted}
            submittedData={surveyData}
            onSubmit={handleSurveySubmit}
          />
        </div>
      );
    }

    if (activeNav === "profile") {
      return (
        <div className="mx-auto max-w-3xl">
          {renderSubViewHeader("Manage your personal details, contact info, work, and education.")}
          <ProfileView
            profile={profile}
            role={user?.role}
            onSave={(updated) => setProfile(updated)}
          />
        </div>
      );
    }

    if (activeNav === "settings") {
      return (
        <div className="mx-auto max-w-2xl">
          {renderSubViewHeader("Account profile loaded from your active Meridian session.")}
          <section className="rounded-xl border border-ink/10 bg-white p-6 shadow-xs dark:border-white/10 dark:bg-ink">
            <h2 className="font-display text-xl font-semibold text-ink dark:text-white">
              Learner Profile
            </h2>
            <dl className="mt-5 divide-y divide-ink/10 text-sm dark:divide-white/10">
              <div className="flex items-center justify-between py-3">
                <dt className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <UserCheck size={15} aria-hidden /> Full Name
                </dt>
                <dd className="font-medium text-ink dark:text-white">
                  {effectiveUser?.full_name || "Meridian Student"}
                </dd>
              </div>
              <div className="flex items-center justify-between py-3">
                <dt className="text-slate-500 dark:text-slate-400">Email</dt>
                <dd className="font-medium text-ink dark:text-white">
                  {effectiveUser?.email || "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between py-3">
                <dt className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Globe2 size={15} aria-hidden /> Role
                </dt>
                <dd className="font-medium capitalize text-ink dark:text-white">
                  {user?.role || "trainee"}
                </dd>
              </div>
            </dl>
          </section>
        </div>
      );
    }

    // Default: Full Student Bento Grid Dashboard
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <KpiCards
          actionPlan={actionPlan}
          weeklyScores={WEEKLY_SCORES}
          surveySubmitted={surveySubmitted}
        />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="space-y-6">
            <ActionPlanCard
              steps={actionPlan}
              onCycleStatus={handleCycleStatus}
              onAskAi={handleAskAiWithPrompt}
            />
            <WeeklyPulseCard
              submitted={surveySubmitted}
              submittedData={surveyData}
              onSubmit={handleSurveySubmit}
            />
          </div>

          <div className="space-y-6">
            <CalendarKpiCard />
            <ProgressChartCard weeklyScores={WEEKLY_SCORES} />
            <TrainerFeedbackCard
              feedbackList={TRAINER_FEEDBACK}
              onAskAi={handleAskAiWithPrompt}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      activeNav={activeNav}
      onSelectNav={setActiveNav}
      user={effectiveUser}
      onSignOut={handleSignOut}
      isAiOpen={isAiOpen}
      onToggleAi={() => setIsAiOpen((open) => !open)}
      drawer={
        <AICoachDrawer
          isOpen={isAiOpen}
          onToggle={() => setIsAiOpen((open) => !open)}
          onClose={() => setIsAiOpen(false)}
          messages={chatMessages}
          isThinking={isAiThinking}
          onSendMessage={handleSendMessage}
          contextLabel={DASHBOARD_CONTEXT_LABEL}
          draftPrompt={draftPrompt}
        />
      }
    >
      {renderMainContent()}
    </DashboardLayout>
  );
}
