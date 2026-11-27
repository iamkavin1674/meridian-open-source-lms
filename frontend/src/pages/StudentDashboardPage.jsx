import { ArrowLeft, BookOpen, Globe2, UserCheck } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { sendChatMessage } from "../api/aiChat.js";
import ActionPlanCard from "../components/dashboard/ActionPlanCard.jsx";
import AICoachDrawer from "../components/dashboard/AICoachDrawer.jsx";
import DashboardLayout from "../components/dashboard/DashboardLayout.jsx";
import KpiCards from "../components/dashboard/KpiCards.jsx";
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
  const [actionPlan, setActionPlan] = useState(INITIAL_ACTION_PLAN);
  const [surveySubmitted, setSurveySubmitted] = useState(false);
  const [surveyData, setSurveyData] = useState(null);

  const [isAiOpen, setIsAiOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [draftPrompt, setDraftPrompt] = useState({ text: "", nonce: 0 });

  const studentContext = useMemo(
    () => ({
      firstName: user?.full_name?.trim()?.split(/\s+/)[0] || "Learner",
      actionPlan,
      weeklyScores: WEEKLY_SCORES,
      trainerFeedback: TRAINER_FEEDBACK,
      surveySubmitted,
    }),
    [user, actionPlan, surveySubmitted]
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
      return (
        <div className="mx-auto max-w-6xl">
          {renderSubViewHeader("Active cohort enrollments across the 5-country Meridian curriculum.")}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {MOCK_COURSES.map((course) => (
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
                  {user?.full_name || "Meridian Student"}
                </dd>
              </div>
              <div className="flex items-center justify-between py-3">
                <dt className="text-slate-500 dark:text-slate-400">Email</dt>
                <dd className="font-medium text-ink dark:text-white">
                  {user?.email || "—"}
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
          <ActionPlanCard
            steps={actionPlan}
            onCycleStatus={handleCycleStatus}
            onAskAi={handleAskAiWithPrompt}
          />
          <ProgressChartCard weeklyScores={WEEKLY_SCORES} />
          <WeeklyPulseCard
            submitted={surveySubmitted}
            submittedData={surveyData}
            onSubmit={handleSurveySubmit}
          />
          <TrainerFeedbackCard
            feedbackList={TRAINER_FEEDBACK}
            onAskAi={handleAskAiWithPrompt}
          />
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      activeNav={activeNav}
      onSelectNav={setActiveNav}
      user={user}
      onSignOut={handleSignOut}
      isAiOpen={isAiOpen}
      onToggleAi={() => setIsAiOpen((open) => !open)}
      drawer={
        <AICoachDrawer
          isOpen={isAiOpen}
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
