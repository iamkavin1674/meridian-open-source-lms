/**
 * Isolated AI Study Coach client helper.
 *
 * When the FastAPI backend exposes `POST /ai/chat`, replace the mock
 * implementation below with:
 *   return apiRequest("/ai/chat", { method: "POST", body: { message, context: studentContext } });
 * using `apiRequest` from `./client`.
 */

const SIMULATED_DELAY_MS = 900;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildContextualReply(message, studentContext = {}) {
  const query = (message || "").toLowerCase();
  const firstName = studentContext.firstName || "there";
  const actionPlan = studentContext.actionPlan || [];
  const weeklyScores = studentContext.weeklyScores || [];
  const feedback = studentContext.trainerFeedback || [];

  const latest = weeklyScores[weeklyScores.length - 1];
  const previous = weeklyScores[weeklyScores.length - 2];
  const latestFeedback = feedback[0];
  const step1 = actionPlan[0];
  const step2 = actionPlan[1];
  const step3 = actionPlan[2];
  const doneCount = actionPlan.filter((s) => s.status === "done").length;

  // Check if user asks about a specific feedback item
  if (query.includes("feedback") || query.includes("trainer") || query.includes("okafor") || query.includes("mensah")) {
    const matchedFeedback =
      feedback.find(
        (item) =>
          query.includes(item.module.toLowerCase()) ||
          query.includes(item.trainer.toLowerCase()) ||
          query.includes(item.date.toLowerCase())
      ) || latestFeedback;

    if (matchedFeedback) {
      return (
        `Here is what ${matchedFeedback.trainer} highlighted in ${matchedFeedback.module} (${matchedFeedback.date}, ${matchedFeedback.score}):\n\n` +
        `• Key takeaway: "${matchedFeedback.note}"\n` +
        `• Recommended focus: Turn that note into a verifiable test case before your next evaluation.\n` +
        (step2 && step2.status !== "done"
          ? `• Connection to your plan: Step ${step2.stepNumber} ("${step2.title}") directly addresses this.`
          : `• You already have ${doneCount}/${actionPlan.length} Action Plan steps marked Done—great momentum!`)
      );
    }
  }

  // Check if user asks about a specific action plan step
  if (query.includes("step") || query.includes("action plan")) {
    const matchedStep =
      (query.includes("step 1") && step1) ||
      (query.includes("step 2") && step2) ||
      (query.includes("step 3") && step3) ||
      actionPlan.find((s) => query.includes(s.title.toLowerCase().slice(0, 14))) ||
      actionPlan.find((s) => s.status !== "done") ||
      step2 ||
      step1;

    if (matchedStep) {
      return (
        `Let's break down Step ${matchedStep.stepNumber}: "${matchedStep.title}" (${matchedStep.module})\n\n` +
        `1. Why it matters: ${matchedStep.rationale}\n` +
        `2. Quick ${matchedStep.estimatedMinutes || 25}-min checklist:\n` +
        `   • Review your latest lab output and isolate 3 representative test queries.\n` +
        `   • Run a before/after comparison and note one concrete metric.\n` +
        `   • Update your status pill to "Done" once verified.`
      );
    }
  }

  // Check if user asks about score change or progress
  if (query.includes("score") || query.includes("progress") || query.includes("week") || query.includes("trend")) {
    if (latest && previous) {
      const diff = (latest.score - previous.score).toFixed(1);
      const sign = Number(diff) >= 0 ? "+" : "";
      return (
        `Your score moved from ${previous.score}/10 in ${previous.week} to ${latest.score}/10 in ${latest.week} (${sign}${diff} vs last week).\n\n` +
        `What drove the improvement:\n` +
        `• Strong execution in ${latest.topic}.\n` +
        (latestFeedback ? `• ${latestFeedback.trainer} praised your pipeline structure on ${latestFeedback.date}.\n` : "") +
        `• You have completed ${doneCount} of ${actionPlan.length} Action Plan steps so far—finishing the remaining steps should push you past 9.0.`
      );
    }
  }

  // Check if user asks for a study plan
  if (query.includes("study plan") || query.includes("30-min") || query.includes("today") || query.includes("schedule")) {
    const nextStep = actionPlan.find((s) => s.status !== "done") || step1;
    return (
      `Here is a focused 30-minute study block for today, ${firstName}:\n\n` +
      `• Minutes 0–5: Re-read ${latestFeedback ? `${latestFeedback.trainer}'s note on ${latestFeedback.module}` : "your latest trainer feedback"}.\n` +
      `• Minutes 5–22: Work on ${nextStep ? `Step ${nextStep.stepNumber} ("${nextStep.title}")` : "your active Action Plan step"}.\n` +
      `• Minutes 22–30: Write down 2 takeaways and submit your Weekly Pulse Survey if you haven't yet.`
    );
  }

  // Default contextual response
  const pendingSteps = actionPlan.filter((s) => s.status !== "done");
  return (
    `Hi ${firstName}! Based on your ${latest ? `${latest.week} score (${latest.score}/10)` : "recent progress"} and ${doneCount}/${actionPlan.length} completed Action Plan steps:\n\n` +
    (pendingSteps.length > 0
      ? `• Next highest-impact task: Step ${pendingSteps[0].stepNumber} — "${pendingSteps[0].title}".\n`
      : `• You've completed all Action Plan steps—consider reviewing your trainer notes for bonus polish.\n`) +
    (latestFeedback
      ? `• Latest trainer note (${latestFeedback.module}): "${latestFeedback.note}"\n\n`
      : "\n") +
    `Ask me to break down any step, explain your score trend, or draft a 30-minute study session.`
  );
}

export async function sendChatMessage(message, studentContext) {
  await delay(SIMULATED_DELAY_MS);
  return {
    id: `ai-${Date.now()}`,
    role: "assistant",
    content: buildContextualReply(message, studentContext),
    timestamp: new Date().toISOString(),
  };
}
