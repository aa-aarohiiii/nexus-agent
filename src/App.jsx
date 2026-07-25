import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Moon, Sparkles, Clock, ArrowLeft, Ban, Play, Pause, VolumeX, ShieldAlert,
  Brain, Search, Scale, Zap, CheckCircle2, XCircle, RefreshCw, ChevronDown, ChevronUp,
  CalendarDays, Layers, BarChart3, ListTodo, Square, Pencil, RotateCw, PlusCircle,
  HelpCircle, Send, Wrench, Compass,
} from "lucide-react";

/* ============================== THEME — luxury cream, black type, pink signature accent ============================== */
const C = {
  bg1: "#F7F2E9", bg2: "#EFE4D2",
  card: "#FFFFFF",
  cardTint: "#FDFBF6",
  cardBorder: "rgba(24,22,17,0.07)",
  text: "#18160F",
  muted: "#8E8674",
  mutedSoft: "#BDB49E",
  black: "#161409",
  pink: "#E8447A", pinkSoft: "rgba(232,68,122,0.12)",
  peach: "#F4A97B",
  amber: "#DE9A2E", amberSoft: "rgba(222,154,46,0.14)",
  teal: "#20A79A", tealSoft: "rgba(32,167,154,0.14)",
  blue: "#5B8DEF", blueSoft: "rgba(91,141,239,0.13)",
  green: "#2FAE6E", greenSoft: "rgba(47,174,110,0.13)",
  red: "#D8524A", redSoft: "rgba(216,82,74,0.13)",
  purple: "#8B7CF6", purpleSoft: "rgba(139,124,246,0.13)",
};
const USER_NAME = "Aarohi";
const CATEGORY_PALETTE = [C.purple, C.peach, C.teal, C.blue, C.green, C.amber, C.pink];
function categoryColor(label) {
  const s = label || "task";
  let h = 0; for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
  return CATEGORY_PALETTE[Math.abs(h) % CATEGORY_PALETTE.length];
}

const FONT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
* { box-sizing: border-box; }
.font-display { font-family: 'Poppins', sans-serif; }
.font-body { font-family: 'Inter', sans-serif; }
.font-mono { font-family: 'JetBrains Mono', monospace; }
body,input,button,textarea { font-family: 'Inter', sans-serif; }
@keyframes breathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.055); } }
@keyframes ripple { 0% { transform: scale(0.9); opacity: 0.55; } 100% { transform: scale(1.9); opacity: 0; } }
@keyframes hueDrift { 0%,100% { opacity: 0.9; } 50% { opacity: 0.5; } }
@keyframes dotBounce { 0%,80%,100% { transform: translateY(0); opacity:0.4; } 40% { transform: translateY(-4px); opacity:1; } }
@keyframes fadeSlideUp { from { opacity:0; transform: translateY(22px);} to { opacity:1; transform: translateY(0);} }
@keyframes spinIn { from { opacity:0; transform: rotate(-18deg) scale(0.85);} to { opacity:1; transform: rotate(0) scale(1);} }
@keyframes blink { 0%,49% { opacity:1;} 50%,100% { opacity:0;} }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .4; } }
@keyframes ping { 75%,100% { transform: scale(2.1); opacity: 0; } }
@keyframes spinCW { to { transform: rotate(360deg); } }
::-webkit-scrollbar { width:8px; height:8px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.14); border-radius: 4px; }
.reveal { opacity: 0; transform: translateY(26px); transition: opacity .7s cubic-bezier(.2,.8,.2,1), transform .7s cubic-bezier(.2,.8,.2,1); }
.reveal.in { opacity: 1; transform: translateY(0); }
.reveal-spin { opacity: 0; transform: rotate(-14deg) scale(0.9); transition: opacity .8s cubic-bezier(.2,.8,.2,1), transform .8s cubic-bezier(.2,.8,.2,1); }
.reveal-spin.in { opacity: 1; transform: rotate(0deg) scale(1); }
`;

/* ============================== TOOL REGISTRY (for display) ============================== */
const TOOL_REGISTRY = ["Web Search", "Maps/Places", "Product Search", "Price Search", "Weather", "Calculator", "Calendar", "Restaurant Search", "Hotel Search", "Flight Search", "Route/Distance", "File Generator", "General Research"];

const EXAMPLE_CHIPS = [
  { icon: "✈", label: "Plan a vacation", text: "Plan a Goa trip for 3 days under ₹20,000." },
  { icon: "🛍", label: "Compare products", text: "Find me the best laptop under ₹70,000 for college and gaming." },
  { icon: "📚", label: "Create a study plan", text: "Make me a study schedule for my exams next week." },
  { icon: "🍽", label: "Find restaurants", text: "Find a good restaurant for 5 people tonight." },
  { icon: "📅", label: "Organize my schedule", text: "Plan my entire day tomorrow." },
  { icon: "🎉", label: "Plan an event", text: "Organize my birthday party for 20 people under ₹15,000." },
  { icon: "🔎", label: "Research something", text: "Compare three MBA programs and tell me which one suits me." },
];

/* ============================== AI PLANNER (real Claude call — falls back locally if unavailable) ============================== */

const SCHEMA_PROMPT = `You are the planning module of NEXUS, a general-purpose autonomous personal-assistant agent. You must be able to handle ANY high-level real-world task — do not assume it belongs to a fixed category, and never reuse a generic template across different goals.

Return ONLY a single raw JSON object — no markdown fences, no commentary before or after — matching exactly this shape:
{
  "clarification_needed": boolean,
  "clarification_question": string or null,
  "objective": string,
  "category_label": string (one or two lowercase words describing the domain, e.g. "travel", "shopping", "event planning", "study", "dining", "research", "scheduling"),
  "constraints": { "budget": string or null, "deadline": string or null, "location": string or null, "people": string or null, "preferences": string or null },
  "steps": [ { "title": string (3-6 words), "tool": one of ["Web Search","Maps/Places","Product Search","Price Search","Weather","Calculator","Calendar","Restaurant Search","Hotel Search","Flight Search","Route/Distance","File Generator","General Research","None"], "type": one of ["thinking","search","decision","action","success","replan","failure","approval_required"], "detail": string (max 22 words, written as if this step has already happened, concrete, with plausible specific numbers/names), "decision_reason": string or null, "rejected_option": string or null } ],
  "approval_needed": boolean,
  "approval_summary": string or null,
  "approval_cost": string or null,
  "itinerary_title": string or null,
  "itinerary": [ { "label": string (short, e.g. "Flight: BOM → GOA" or "Table for 5, 8:30pm"), "detail": string (specifics: price, time, name — max 16 words) } ],
  "final_summary": string (2 sentences),
  "important_results": [string] (max 4),
  "recommendations": [string] (max 3),
  "next_steps": [string] (max 3),
  "budget_used": string or null,
  "timeline": string or null
}

Rules:
- Generate 6 to 9 steps tailored SPECIFICALLY to this exact goal. A different goal must produce a genuinely different plan and different tools.
- Whenever the task involves choosing between multiple real options (flights, hotels, products, venues, restaurants, etc.), your "decision" step must find the CHEAPEST option that still clears a reasonable quality/requirements bar — not just the cheapest, and not just the fanciest. decision_reason must explain that trade-off explicitly (e.g. "X was ₹400 cheaper than Y but had noticeably worse reviews, so Y was chosen as the best value").
- If the task results in one or more concrete bookable/purchasable items (a flight, a hotel, a table, a product, a venue, etc.), fill "itinerary" with each item as its own entry, set approval_needed true, and phrase approval_summary as directly asking whether to go ahead and book/execute this itinerary (e.g. "Ready to book: IndiGo 6E-204 + Ocean Breeze Resort. Shall I proceed?"). If the task produces no bookable items (pure research, a schedule, a comparison), leave itinerary as an empty array and approval_needed can be false.
- Unless the task is trivial, include one step of type "failure" immediately followed by one step of type "replan", simulating a realistic hiccup with whichever tool you chose and a specific recovery action. Skip both for genuinely trivial tasks.
- If essential information is missing to proceed responsibly (e.g. budget, dates, headcount, location where relevant), set clarification_needed true, ask exactly ONE concise clarifying question, and leave "steps" and "itinerary" as empty arrays. Otherwise proceed autonomously with reasonable assumptions.
- Use ₹ for Indian rupee amounts unless the goal clearly implies another currency.
- Keep every string concise. Output raw JSON only, nothing else.`;

async function requestPlanFromClaude(promptBody) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 2000, messages: [{ role: "user", content: promptBody }] }),
  });
  const data = await res.json();
  const text = (data.content || []).map((b) => b.text || "").join("\n");
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) throw new Error("No JSON object found in planner response");
  return JSON.parse(text.slice(start, end + 1));
}

async function planForGoal(goal, clarificationAnswer) {
  let body = `${SCHEMA_PROMPT}\n\nUser goal: "${goal}"`;
  if (clarificationAnswer) body += `\n\nThe user answered your clarifying question with: "${clarificationAnswer}". Now produce the full plan — clarification_needed must be false this time.`;
  try { return { plan: await requestPlanFromClaude(body), fallback: false }; }
  catch (e) { return { plan: fallbackPlan(goal), fallback: true }; }
}

async function planForModification(originalGoal, completedTitles, instruction) {
  const body = `${SCHEMA_PROMPT}\n\nThis is a REPLAN request, not a fresh task. Original goal: "${originalGoal}". Steps already completed and must NOT be repeated: ${completedTitles.join("; ") || "none yet"}. The user just said: "${instruction}". Generate ONLY the new/updated remaining steps needed to incorporate this change and finish the task (typically 3-7 steps), keeping prior constraints unless the instruction overrides them. clarification_needed should be false unless the instruction is genuinely ambiguous.`;
  try { return { plan: await requestPlanFromClaude(body), fallback: false }; }
  catch (e) { return { plan: fallbackPlan(originalGoal + " " + instruction), fallback: true }; }
}

/* ---- local fallback planner (used only if the API call fails) ---- */
function fallbackPlan(goal) {
  const g = goal.toLowerCase();
  const budgetMatch = goal.match(/₹\s?[\d,]+|\$\s?[\d,]+|rs\.?\s?[\d,]+/i);
  const budget = budgetMatch ? budgetMatch[0] : null;
  const peopleMatch = goal.match(/(\d+)\s?(people|guests|persons|pax)/i);
  const people = peopleMatch ? peopleMatch[0] : null;

  let category = "research";
  if (/trip|vacation|flight|hotel|travel|holiday/.test(g)) category = "travel";
  else if (/laptop|phone|buy|gadget|product|shop/.test(g)) category = "shopping";
  else if (/party|birthday|event|organi[sz]e.*(party|event)/.test(g)) category = "event planning";
  else if (/study|exam|syllabus|revision/.test(g)) category = "study";
  else if (/restaurant|dinner|lunch|food|eat/.test(g)) category = "dining";
  else if (/compare|mba|program|college|university/.test(g)) category = "comparison";
  else if (/schedule|my day|calendar|organi[sz]e my/.test(g)) category = "scheduling";

  const banks = {
    travel: [
      { title: "Understand trip requirements", tool: "None", type: "thinking", detail: `Extracted destination, ${budget ? "budget " + budget : "no fixed budget"}, and dates from your goal.` },
      { title: "Search flights & transport", tool: "Flight Search", type: "search", detail: "Found 11 outbound options across 3 carriers for the requested dates." },
      { title: "Search accommodation", tool: "Hotel Search", type: "search", detail: "Found 18 stays matching your budget and star-rating range." },
      { title: "Compare stay options", tool: "None", type: "decision", detail: "Weighed price against location and reviews.", decision_reason: "Chose the higher-rated stay 12% over budget-min because it saves 40 minutes of commute daily.", rejected_option: "Cheapest listed stay, 25 minutes further from key sights." },
      { title: "Hotel booking attempt", tool: "Hotel Search", type: "action", detail: "Attempted to lock in the selected room for your dates." },
      { title: "Booking timeout", tool: "Hotel Search", type: "failure", detail: "Provider did not confirm availability within the expected window." },
      { title: "Retry with alternate source", tool: "Hotel Search", type: "replan", detail: "Re-queried a second inventory source and confirmed the same room." },
      { title: "Ready to book", tool: "None", type: "approval_required", detail: "Flight and hotel selected within budget — awaiting your confirmation to book." },
      { title: "Build itinerary", tool: "Calendar", type: "action", detail: "Drafted a day-by-day itinerary with transit times." },
      { title: "Trip plan ready", tool: "None", type: "success", detail: "Full itinerary compiled and ready for review." },
    ],
    shopping: [
      { title: "Understand requirements", tool: "None", type: "thinking", detail: `Extracted use-case and ${budget ? "budget " + budget : "no fixed budget"} from your goal.` },
      { title: "Search product listings", tool: "Product Search", type: "search", detail: "Found 27 matching listings across 4 retailers." },
      { title: "Check current pricing", tool: "Price Search", type: "search", detail: "Compared live pricing — best offer found across retailers." },
      { title: "Compare top candidates", tool: "None", type: "decision", detail: "Weighed specs against price.", decision_reason: "Chose the option with better battery life for ~6% more, since it suits your stated use-case better.", rejected_option: "Cheaper option with a stronger spec sheet but weaker real-world reviews." },
      { title: "Verify stock", tool: "Product Search", type: "action", detail: "Checked live stock at the top-ranked retailer." },
      { title: "Stock error", tool: "Product Search", type: "failure", detail: "Top-ranked listing was out of stock at checkout." },
      { title: "Re-route to alternate seller", tool: "Product Search", type: "replan", detail: "Found the identical listing in stock at a second retailer." },
      { title: "Ready to purchase", tool: "None", type: "approval_required", detail: "Best available option confirmed in stock — awaiting your confirmation to proceed." },
      { title: "Recommendation ready", tool: "None", type: "success", detail: "Final recommendation compiled with purchase link." },
    ],
    "event planning": [
      { title: "Understand event requirements", tool: "None", type: "thinking", detail: `Captured headcount${people ? " (" + people + ")" : ""} and ${budget ? "budget " + budget : "no fixed budget"}.` },
      { title: "Estimate budget breakdown", tool: "Calculator", type: "action", detail: "Split budget across venue, food, and activities." },
      { title: "Search venues", tool: "Maps/Places", type: "search", detail: "Found 9 venues matching capacity and budget." },
      { title: "Search catering options", tool: "Web Search", type: "search", detail: "Found 6 catering options within budget for the headcount." },
      { title: "Compare venue options", tool: "None", type: "decision", detail: "Weighed cost against capacity and reviews.", decision_reason: "Chose the mid-priced venue since it includes basic decor, saving a separate booking.", rejected_option: "Cheapest venue, but required a separate decor vendor at extra cost." },
      { title: "Venue hold request", tool: "Maps/Places", type: "action", detail: "Requested a hold on the selected date." },
      { title: "Hold request timeout", tool: "Maps/Places", type: "failure", detail: "Venue did not confirm the hold within the expected window." },
      { title: "Retry via alternate contact", tool: "Maps/Places", type: "replan", detail: "Reached the venue through a second contact channel and confirmed." },
      { title: "Ready to confirm", tool: "None", type: "approval_required", detail: "Venue and catering selected within budget — awaiting your confirmation to lock it in." },
      { title: "Event plan ready", tool: "File Generator", type: "success", detail: "Compiled full checklist, timeline, and budget breakdown." },
    ],
    study: [
      { title: "Understand exam scope", tool: "None", type: "thinking", detail: "Identified subjects, exam dates, and available prep days." },
      { title: "Research syllabus weightage", tool: "Web Search", type: "search", detail: "Found topic weightage across past papers." },
      { title: "Allocate study blocks", tool: "Calculator", type: "action", detail: "Distributed available hours across subjects by weightage." },
      { title: "Balance priority topics", tool: "None", type: "decision", detail: "Weighed weak topics against high-weightage topics.", decision_reason: "Prioritized weak-but-high-weightage topics over strong-but-low-weightage ones for better score impact.", rejected_option: "Even time split across all topics regardless of weightage or strength." },
      { title: "Build revision schedule", tool: "Calendar", type: "action", detail: "Created a day-by-day revision block schedule." },
      { title: "Study plan ready", tool: "File Generator", type: "success", detail: "Full schedule compiled with daily targets." },
    ],
    dining: [
      { title: "Understand dining requirements", tool: "None", type: "thinking", detail: `Captured party size${people ? " (" + people + ")" : ""}, time, and cuisine preference.` },
      { title: "Search nearby restaurants", tool: "Restaurant Search", type: "search", detail: "Found 14 matching restaurants nearby." },
      { title: "Check availability tonight", tool: "Restaurant Search", type: "action", detail: "Checked live table availability for the party size." },
      { title: "Compare top picks", tool: "None", type: "decision", detail: "Weighed rating against distance and price.", decision_reason: "Chose the closer option 4★+ rated over a slightly higher-rated spot 15 minutes further.", rejected_option: "Higher-rated restaurant, but a longer wait and further away." },
      { title: "Booking attempt", tool: "Restaurant Search", type: "action", detail: "Attempted to reserve a table for tonight." },
      { title: "No immediate slot", tool: "Restaurant Search", type: "failure", detail: "Preferred time slot was fully booked." },
      { title: "Retry nearby time slot", tool: "Restaurant Search", type: "replan", detail: "Secured a table 20 minutes later at the same restaurant." },
      { title: "Ready to reserve", tool: "None", type: "approval_required", detail: "Table found matching your party size — awaiting your confirmation to book." },
      { title: "Reservation confirmed", tool: "None", type: "success", detail: "Table confirmed, details ready to share." },
    ],
    comparison: [
      { title: "Understand comparison criteria", tool: "None", type: "thinking", detail: "Identified the options to compare and what matters most to you." },
      { title: "Research option details", tool: "General Research", type: "search", detail: "Gathered rankings, costs, and outcomes for each option." },
      { title: "Cross-check reviews", tool: "Web Search", type: "search", detail: "Checked independent reviews and reported outcomes." },
      { title: "Score against your priorities", tool: "None", type: "decision", detail: "Weighed cost against long-term outcome.", decision_reason: "Ranked the option with a stronger placement record highest despite a higher cost, given your stated priorities.", rejected_option: "Cheapest option, weaker on the outcome measure you cared about most." },
      { title: "Comparison ready", tool: "File Generator", type: "success", detail: "Side-by-side comparison compiled with a clear recommendation." },
    ],
    scheduling: [
      { title: "Understand your day", tool: "None", type: "thinking", detail: "Reviewed existing commitments and priorities for the day." },
      { title: "Check calendar conflicts", tool: "Calendar", type: "search", detail: "Found 3 existing commitments to work around." },
      { title: "Sequence tasks by priority", tool: "None", type: "decision", detail: "Weighed urgency against energy levels through the day.", decision_reason: "Placed deep-focus work in the morning block, admin tasks after lunch, based on your usual pattern.", rejected_option: "Chronological ordering with no regard for task type or energy." },
      { title: "Build the schedule", tool: "Calendar", type: "action", detail: "Slotted all tasks into available windows with buffers." },
      { title: "Schedule ready", tool: "None", type: "success", detail: "Full day plan compiled with buffer time included." },
    ],
    research: [
      { title: "Understand the question", tool: "None", type: "thinking", detail: "Broke the goal down into researchable sub-questions." },
      { title: "Gather information", tool: "General Research", type: "search", detail: "Collected relevant information from multiple sources." },
      { title: "Cross-check findings", tool: "Web Search", type: "search", detail: "Verified key facts across independent sources." },
      { title: "Weigh the findings", tool: "None", type: "decision", detail: "Weighed conflicting sources against each other.", decision_reason: "Favored the more recent, primary-source finding over an older secondary summary.", rejected_option: "Older secondary-source claim that conflicted with the primary data." },
      { title: "Research ready", tool: "File Generator", type: "success", detail: "Findings compiled into a clear summary." },
    ],
  };
  const itineraries = {
    travel: { title: "Your trip", items: [{ label: "Flight", detail: "Best-value outbound + return fare found within budget" }, { label: "Stay", detail: "Highest-rated option within budget after fees" }] },
    shopping: { title: "Your pick", items: [{ label: "Recommended item", detail: "Cheapest listing that still clears your requirements" }] },
    "event planning": { title: "Your event", items: [{ label: "Venue", detail: "Best capacity-to-price match, includes basic decor" }, { label: "Catering", detail: "Per-head cost within remaining budget" }] },
    dining: { title: "Your reservation", items: [{ label: "Restaurant", detail: "Closest 4★+ match with an open slot tonight" }] },
    study: { title: null, items: [] },
    comparison: { title: null, items: [] },
    scheduling: { title: null, items: [] },
    research: { title: null, items: [] },
  };
  const it = itineraries[category] || itineraries.research;

  const steps = (banks[category] || banks.research).map((s, i) => ({ id: i + 1, status: "pending", decision_reason: null, rejected_option: null, ...s }));
  return {
    clarification_needed: false, clarification_question: null, objective: goal, category_label: category,
    constraints: { budget, deadline: null, location: null, people, preferences: null },
    steps, approval_needed: it.items.length > 0, approval_summary: it.items.length > 0 ? `Ready to proceed with the itinerary below. Shall I book/confirm everything?` : null,
    approval_cost: budget, itinerary_title: it.title, itinerary: it.items, final_summary: `Completed: ${goal}`,
    important_results: [], recommendations: [], next_steps: [],
    budget_used: budget, timeline: null,
  };
}

function normalizeSteps(rawSteps, startId) {
  return (rawSteps || []).map((s, i) => ({
    id: startId + i, title: s.title || "Untitled step", tool: s.tool || "None", type: s.type || "action",
    detail: s.detail || "", decisionReason: s.decision_reason || null, rejectedOption: s.rejected_option || null,
    status: "pending", startedAt: null, completedAt: null,
  }));
}

/* ============================== ENGINE ============================== */

function useEngine() {
  const [tasks, setTasks] = useState([]);
  const [paused, setPaused] = useState(false);
  const nextId = useRef(1);
  const nextStepId = useRef(1);

  const applyPlan = useCallback((taskId, plan, fallback, appendMode) => {
    setTasks((prev) => prev.map((t) => {
      if (t.id !== taskId) return t;
      if (plan.clarification_needed) {
        return { ...t, status: "clarifying", clarificationQuestion: plan.clarification_question, category: plan.category_label || t.category };
      }
      const newSteps = normalizeSteps(plan.steps, nextStepId.current);
      nextStepId.current += newSteps.length;
      const steps = appendMode ? [...t.steps, ...newSteps] : newSteps;
      return {
        ...t, status: "executing", steps, cursor: appendMode ? t.cursor : 0,
        completedSteps: appendMode ? t.completedSteps : 0, totalSteps: steps.length,
        category: plan.category_label || t.category, constraints: plan.constraints || t.constraints,
        approval: plan.approval_needed ? { summary: plan.approval_summary, cost: plan.approval_cost } : t.approval,
        finalOutput: { summary: plan.final_summary, importantResults: plan.important_results || [], recommendations: plan.recommendations || [], nextSteps: plan.next_steps || [], budgetUsed: plan.budget_used, timeline: plan.timeline, itineraryTitle: plan.itinerary_title || null, itinerary: plan.itinerary || [] },
        usingFallback: fallback || t.usingFallback,
      };
    }));
  }, []);

  const createTask = useCallback((goal) => {
    const id = nextId.current++;
    const task = {
      id, goal, status: "planning", category: null, clarificationQuestion: null,
      steps: [], cursor: 0, completedSteps: 0, totalSteps: 0, approval: null, finalOutput: null,
      constraints: null, usingFallback: false, stats: { retries: 0, startTime: Date.now(), endTime: null },
    };
    setTasks((t) => [task, ...t]);
    planForGoal(goal).then(({ plan, fallback }) => applyPlan(id, plan, fallback, false));
    return id;
  }, [applyPlan]);

  const answerClarification = useCallback((taskId, answer) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: "planning" } : t)));
    const task = tasks.find((t) => t.id === taskId);
    planForGoal(task ? task.goal : "", answer).then(({ plan, fallback }) => applyPlan(taskId, plan, fallback, false));
  }, [tasks, applyPlan]);

  const modifyGoal = useCallback((taskId, instruction) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: "replanning", goal: `${t.goal} — update: ${instruction}` } : t)));
    const task = tasks.find((t) => t.id === taskId);
    const completedTitles = task ? task.steps.filter((s) => s.status === "done").map((s) => s.title) : [];
    planForModification(task ? task.goal : "", completedTitles, instruction).then(({ plan, fallback }) => applyPlan(taskId, plan, fallback, true));
  }, [tasks, applyPlan]);

  useEffect(() => {
    const iv = setInterval(() => {
      if (paused) return;
      setTasks((prev) => prev.map((task) => {
        if (!["executing"].includes(task.status)) return task;
        if (task.cursor >= task.steps.length) {
          return { ...task, status: "completed", stats: { ...task.stats, endTime: Date.now() } };
        }
        const steps = task.steps.slice();
        const step = { ...steps[task.cursor] };
        if (step.status === "pending") {
          step.status = "running"; step.startedAt = Date.now(); steps[task.cursor] = step;
          return { ...task, steps };
        }
        if (step.type === "approval_required") {
          step.status = "running"; step.startedAt = step.startedAt || Date.now(); steps[task.cursor] = step;
          return { ...task, steps, status: "awaiting_approval" };
        }
        step.status = step.type === "failure" ? "failed" : "done";
        step.completedAt = Date.now();
        steps[task.cursor] = step;
        const newCursor = task.cursor + 1;
        const completedSteps = task.completedSteps + 1;
        const done = newCursor >= steps.length;
        const retries = task.stats.retries + (step.type === "replan" ? 1 : 0);
        return { ...task, steps, cursor: newCursor, completedSteps, status: done ? "completed" : "executing", stats: { ...task.stats, retries, endTime: done ? Date.now() : null } };
      }));
    }, 1000);
    return () => clearInterval(iv);
  }, [paused]);

  const respondApproval = useCallback((taskId, approved) => {
    setTasks((prev) => prev.map((task) => {
      if (task.id !== taskId) return task;
      const steps = task.steps.slice();
      const step = { ...steps[task.cursor] };
      if (approved) {
        step.status = "done"; step.completedAt = Date.now(); steps[task.cursor] = step;
        return { ...task, steps, cursor: task.cursor + 1, completedSteps: task.completedSteps + 1, status: "executing" };
      }
      step.status = "failed"; step.completedAt = Date.now(); steps[task.cursor] = step;
      return { ...task, steps, status: "cancelled", stats: { ...task.stats, endTime: Date.now() } };
    }));
  }, []);

  const stopTask = useCallback((taskId) => setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: "cancelled", stats: { ...t.stats, endTime: Date.now() } } : t))), []);

  const retryTask = useCallback((taskId) => {
    setTasks((prev) => prev.map((t) => {
      if (t.id !== taskId) return t;
      const steps = t.steps.map((s) => ({ ...s, status: "pending" }));
      return { ...t, steps, cursor: 0, completedSteps: 0, status: "executing", stats: { ...t.stats, retries: t.stats.retries + 1, endTime: null } };
    }));
  }, []);

  const stats = useMemo(() => {
    const total = tasks.length;
    const active = tasks.filter((t) => ["planning", "clarifying", "executing", "awaiting_approval", "replanning"].includes(t.status)).length;
    const finished = tasks.filter((t) => ["completed", "failed", "cancelled"].includes(t.status));
    const won = tasks.filter((t) => t.status === "completed").length;
    const successRate = finished.length ? won / finished.length : 0.96;
    return { total, active, successRate };
  }, [tasks]);

  return { tasks, stats, paused, setPaused, createTask, answerClarification, modifyGoal, respondApproval, stopTask, retryTask };
}

/* ============================== SCROLL SYSTEM ============================== */

function useScrollY(ref) {
  const [state, setState] = useState({ y: 0, progress: 0 });
  useEffect(() => {
    const el = ref.current; if (!el) return;
    let raf = null;
    const compute = () => {
      const max = Math.max(1, el.scrollHeight - el.clientHeight);
      setState({ y: el.scrollTop, progress: Math.min(1, el.scrollTop / max) });
      raf = null;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(compute); };
    compute();
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", onScroll); ro.disconnect(); };
  }, [ref]);
  return state;
}

function useReveal() {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } }, { threshold: 0.2, rootMargin: "0px 0px -60px 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}
function Reveal({ children, spin, delay = 0, style }) {
  const [ref, inView] = useReveal();
  return <div ref={ref} className={`${spin ? "reveal-spin" : "reveal"} ${inView ? "in" : ""}`} style={{ transitionDelay: `${delay}ms`, ...style }}>{children}</div>;
}

/* ============================== PROCEDURAL ORB ============================== */

function ProceduralOrb({ size = 190, thinking = false }) {
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `1px solid ${C.peach}`, animation: `ripple 3.2s ease-out infinite`, animationDelay: `${i * 1.05}s` }} />
      ))}
      <div style={{ position: "absolute", inset: size * 0.14, borderRadius: "50%", background: `radial-gradient(circle at 35% 30%, #FFFDF9 0%, #FBD9C4 35%, ${C.peach} 62%, ${C.pink} 100%)`, boxShadow: `0 25px 60px -18px rgba(232,68,122,0.45)`, animation: "breathe 4.5s ease-in-out infinite" }} />
      <div style={{ position: "absolute", inset: size * 0.14, borderRadius: "50%", background: `radial-gradient(circle at 65% 70%, rgba(139,124,246,0.55), transparent 60%)`, animation: "hueDrift 5s ease-in-out infinite", mixBlendMode: "overlay" }} />
      {thinking && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
          {[0, 1, 2].map((i) => <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", animation: "dotBounce 1.2s ease-in-out infinite", animationDelay: `${i * 0.15}s` }} />)}
        </div>
      )}
    </div>
  );
}

/* ============================== SHARED UI ============================== */

function Pill({ children, style }) { return <span className="font-body" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 999, background: C.card, border: `1px solid ${C.cardBorder}`, fontSize: 12.5, fontWeight: 600, color: C.text, boxShadow: "0 6px 18px -12px rgba(24,22,17,0.25)", ...style }}>{children}</span>; }

function Ring({ pct, color, size = 118, sub }) {
  const stroke = 10, r = (size - stroke) / 2, circ = 2 * Math.PI * r, offset = circ - (pct / 100) * circ;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(24,22,17,0.08)" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s cubic-bezier(.2,.8,.2,1)" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span className="font-display" style={{ fontSize: 24, fontWeight: 700, color: C.text }}>{Math.round(pct)}%</span>
        <span className="font-body" style={{ fontSize: 9, fontWeight: 700, color: C.mutedSoft, letterSpacing: 0.8 }}>{sub}</span>
      </div>
    </div>
  );
}

function Badge({ variant = "outline", children }) {
  const map = {
    outline: { bg: "transparent", fg: C.muted, bd: C.cardBorder },
    success: { bg: C.greenSoft, fg: C.green, bd: C.green + "55" },
    destructive: { bg: C.redSoft, fg: C.red, bd: C.red + "55" },
    warning: { bg: C.amberSoft, fg: C.amber, bd: C.amber + "55" },
    running: { bg: C.blueSoft, fg: C.blue, bd: C.blue + "55" },
  };
  const s = map[variant] || map.outline;
  return <span className="font-body" style={{ display: "inline-flex", alignItems: "center", borderRadius: 999, padding: "3px 10px", fontSize: 10.5, fontWeight: 700, background: s.bg, color: s.fg, border: `1px solid ${s.bd}` }}>{children}</span>;
}

const STATUS_LABEL = { planning: "PLANNING", clarifying: "WAITING FOR YOU", executing: "EXECUTING", awaiting_approval: "WAITING FOR YOU", replanning: "REPLANNING", completed: "COMPLETED", failed: "FAILED", cancelled: "STOPPED" };
function StatusBadge({ status }) {
  if (status === "completed") return <Badge variant="success">Completed</Badge>;
  if (status === "failed" || status === "cancelled") return <Badge variant="destructive">{STATUS_LABEL[status]}</Badge>;
  if (status === "awaiting_approval" || status === "clarifying") return <Badge variant="warning">Waiting for you</Badge>;
  if (status === "executing" || status === "planning" || status === "replanning") return <Badge variant="running">{STATUS_LABEL[status]}</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

/* ============================== BACKDROP ============================== */

function Backdrop({ scrollY }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none", background: `linear-gradient(150deg, ${C.bg1}, ${C.bg2})` }}>
      <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "34%", minWidth: 260, transform: `translateY(${scrollY * -0.06}px)`, backgroundImage: `repeating-linear-gradient(90deg, #C9A876 0px, #C9A876 3px, #B8934F 3px, #B8934F 6px, transparent 6px, transparent 13px)`, opacity: 0.35, maskImage: "linear-gradient(90deg, transparent, black 30%)", WebkitMaskImage: "linear-gradient(90deg, transparent, black 30%)" }} />
      <div style={{ position: "absolute", top: "12%", left: "6%", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle, #F4A97B, transparent 70%)", opacity: 0.18, filter: "blur(100px)", transform: `translateY(${scrollY * 0.08}px)` }} />
      <div style={{ position: "absolute", bottom: "-6%", left: "38%", width: 480, height: 480, borderRadius: "50%", background: "radial-gradient(circle, #E8447A, transparent 70%)", opacity: 0.1, filter: "blur(120px)", transform: `translateY(${scrollY * -0.05}px)` }} />
    </div>
  );
}

/* ============================== HEADER ============================== */

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const iv = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(iv); }, []);
  return now;
}

function Header({ view, setView, scrollY = 0 }) {
  const now = useClock();
  const date = now.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
  const time = now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  const shrink = Math.min(1, scrollY / 160);
  return (
    <header style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", padding: `${24 - shrink * 8}px 36px 0`, flexShrink: 0, transition: "padding .15s ease" }}>
      <span className="font-display" style={{ fontWeight: 700, fontSize: 19 - shrink * 3, color: C.text, letterSpacing: -0.3, transition: "font-size .15s ease", transform: `scale(${1 - shrink * 0.05})`, transformOrigin: "left center" }}>nexus</span>
      <div style={{ position: "absolute", left: "50%", transform: `translateX(-50%) scale(${1 - shrink * 0.08})`, opacity: 1 - shrink * 0.35, transition: "transform .15s ease, opacity .15s ease" }}>
        <Pill><Clock size={13} color={C.muted} />{date} · {time}</Pill>
      </div>
      <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
        <button title="Toggle theme" style={{ width: 38 - shrink * 4, height: 38 - shrink * 4, borderRadius: "50%", background: C.card, border: `1px solid ${C.cardBorder}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.text, boxShadow: "0 6px 18px -12px rgba(24,22,17,0.3)", transform: `rotate(${scrollY * 0.4}deg)`, transition: "width .15s ease, height .15s ease" }}><Moon size={14} /></button>
        <button title={view === "home" ? "All directives" : "Command Center"} onClick={() => setView(view === "home" ? "tasks" : "home")} style={{ width: 38 - shrink * 4, height: 38 - shrink * 4, borderRadius: "50%", background: C.card, border: `1px solid ${C.cardBorder}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.text, boxShadow: "0 6px 18px -12px rgba(24,22,17,0.3)", transform: `rotate(${-scrollY * 0.4}deg)`, transition: "width .15s ease, height .15s ease" }}>
          {view === "home" ? <ListTodo size={14} /> : <Sparkles size={14} />}
        </button>
      </div>
    </header>
  );
}

/* ============================== HOME VIEW ============================== */

function HomeView({ tasks, stats, paused, setPaused, onLaunch, openTask, scrollY }) {
  const [goal, setGoal] = useState("");
  const activeTasks = tasks.filter((t) => ["planning", "clarifying", "executing", "awaiting_approval", "replanning"].includes(t.status)).slice(0, 4);
  const activeForRing = tasks.find((t) => t.status === "executing" || t.status === "awaiting_approval");
  const ringPct = activeForRing ? (activeForRing.completedSteps / Math.max(1, activeForRing.totalSteps)) * 100 : 0;
  const thinking = !!activeForRing && activeForRing.status === "executing";

  const submit = (e) => { e.preventDefault(); if (!goal.trim()) return; onLaunch(goal.trim()); setGoal(""); };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  return (
    <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
      <section style={{ padding: "48px 32px 10px", textAlign: "center", position: "relative" }}>
        <h1 className="font-display" style={{ fontSize: "clamp(24px,3.6vw,34px)", fontWeight: 600, color: C.text, margin: 0, lineHeight: 1.3, transform: `translateY(${scrollY * 0.35}px) scale(${1 - Math.min(scrollY, 200) * 0.0007})`, opacity: 1 - Math.min(scrollY, 260) / 260, transition: "opacity .05s linear" }}>
          {greeting}, {USER_NAME}!<br />What would you like me to accomplish?
        </h1>

        <form onSubmit={submit} style={{ marginTop: 26, maxWidth: 660, margin: "26px auto 0", transform: `translateY(${scrollY * 0.2}px)`, opacity: 1 - Math.min(scrollY, 320) / 320 }}>
          <div style={{ display: "flex", alignItems: "center", background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 999, boxShadow: "0 24px 55px -26px rgba(24,22,17,0.4)", padding: "6px 6px 6px 24px" }}>
            <input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Describe any real-world task, in your own words…"
              className="font-body" style={{ flex: 1, background: "transparent", border: "none", outline: "none", height: 48, fontSize: 13.5, color: C.text }} />
            <button type="submit" style={{ width: 40, height: 40, borderRadius: "50%", border: "none", cursor: "pointer", background: C.black, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Send size={15} />
            </button>
          </div>
        </form>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 16, maxWidth: 720, marginLeft: "auto", marginRight: "auto" }}>
          {EXAMPLE_CHIPS.map((ex) => (
            <button key={ex.label} onClick={() => setGoal(ex.text)} className="font-body" style={{ fontSize: 11.5, background: "rgba(24,22,17,0.04)", border: `1px solid ${C.cardBorder}`, color: C.muted, padding: "6px 13px", borderRadius: 999, cursor: "pointer", fontWeight: 600 }}>
              {ex.icon} {ex.label}
            </button>
          ))}
        </div>
      </section>

      <div style={{ overflow: "hidden", padding: "26px 0", borderTop: `1px solid ${C.cardBorder}`, borderBottom: `1px solid ${C.cardBorder}`, margin: "20px 0" }}>
        <div className="font-display" style={{ display: "flex", gap: 40, whiteSpace: "nowrap", fontSize: 15, fontWeight: 600, color: C.mutedSoft, transform: `translateX(${-scrollY * 0.5}px)`, transition: "transform .05s linear" }}>
          {Array(6).fill("AUTONOMOUS EXECUTION").map((t, i) => (
            <span key={i} style={{ display: "flex", alignItems: "center", gap: 40 }}>{t} <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.pink, display: "inline-block" }} /></span>
          ))}
        </div>
      </div>

      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "0 32px", display: "grid", gridTemplateColumns: "1.1fr 1fr 1fr", gap: 16 }}>
        <Reveal delay={0}>
          <div style={{ borderRadius: 22, background: C.card, border: `1px solid ${C.cardBorder}`, padding: 20, boxShadow: "0 20px 45px -30px rgba(24,22,17,0.3)" }}>
            <div className="font-body" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, fontWeight: 700, color: C.muted, letterSpacing: 0.4, marginBottom: 14 }}><CalendarDays size={14} /> Upcoming</div>
            {activeTasks.length === 0 ? (
              <div className="font-body" style={{ fontSize: 12.5, color: C.mutedSoft, padding: "18px 4px" }}>No active directives — try any task above.</div>
            ) : activeTasks.map((t) => (
              <div key={t.id} onClick={() => openTask(t.id)} style={{ display: "flex", gap: 10, padding: "9px 10px", borderRadius: 12, cursor: "pointer" }}>
                <div style={{ width: 3, borderRadius: 2, background: categoryColor(t.category), flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div className="font-body" style={{ fontWeight: 700, fontSize: 12.5, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.goal}</div>
                  <div className="font-body" style={{ fontSize: 10.5, color: C.mutedSoft, marginTop: 2 }}>{t.completedSteps}/{t.totalSteps || "?"} steps · {STATUS_LABEL[t.status]}</div>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div style={{ borderRadius: 22, background: C.card, border: `1px solid ${C.cardBorder}`, padding: 20, boxShadow: "0 20px 45px -30px rgba(24,22,17,0.3)" }}>
            <div className="font-body" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, fontWeight: 700, color: C.muted, letterSpacing: 0.4, marginBottom: 14 }}><Sparkles size={14} /> AI Insights</div>
            <div className="font-display" style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
              <span style={{ fontSize: 38, fontWeight: 600, color: C.text }}>{(stats.successRate * 100).toFixed(1)}</span>
              <span style={{ fontSize: 16, fontWeight: 600, color: C.mutedSoft }}>%</span>
            </div>
            <div className="font-body" style={{ fontSize: 11.5, color: C.muted, marginTop: 3 }}>Directive success rate this session.</div>
            <div style={{ height: 4, background: "rgba(24,22,17,0.08)", borderRadius: 999, marginTop: 12, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${stats.successRate * 100}%`, background: C.pink, borderRadius: 999 }} />
            </div>
            <div style={{ marginTop: 14, padding: "9px 12px", borderRadius: 12, background: "rgba(24,22,17,0.035)", display: "flex", alignItems: "center", gap: 8 }}>
              <Wrench size={12} color={C.muted} />
              <span className="font-body" style={{ fontSize: 11, color: C.muted }}>{TOOL_REGISTRY.length} tools registered in the agent's toolkit.</span>
            </div>
          </div>
        </Reveal>

        <Reveal spin delay={200}>
          <div style={{ borderRadius: 22, background: C.card, border: `1px solid ${C.cardBorder}`, padding: 20, boxShadow: "0 20px 45px -30px rgba(24,22,17,0.3)", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div className="font-body" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, fontWeight: 700, color: C.muted, letterSpacing: 0.4, marginBottom: 14, alignSelf: "flex-start" }}><BarChart3 size={14} /> Task Analytics</div>
            <Ring pct={ringPct} color={C.pink} sub={activeForRing ? STATUS_LABEL[activeForRing.status] : "READY"} />
          </div>
        </Reveal>
      </section>

      <section style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "44px 24px 30px" }}>
        <div style={{ position: "relative", width: 260, height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width={260} height={260} viewBox="0 0 260 260" style={{ position: "absolute", inset: 0, transform: `rotate(${scrollY * 0.6}deg)`, transition: "transform .05s linear" }}>
            <circle cx="130" cy="130" r="118" fill="none" stroke={C.cardBorder} strokeWidth="1.5" />
            <circle cx="130" cy="130" r="118" fill="none" stroke={C.pink} strokeWidth="2" strokeDasharray="6 14" strokeLinecap="round" opacity="0.55" />
            {[0, 90, 180, 270].map((a) => (
              <circle key={a} cx={130 + 118 * Math.cos((a * Math.PI) / 180)} cy={130 + 118 * Math.sin((a * Math.PI) / 180)} r="3" fill={C.peach} />
            ))}
          </svg>
          <div style={{ transform: `scale(${1 - Math.min(scrollY, 300) * 0.0006}) rotate(${-scrollY * 0.15}deg)`, transition: "transform .05s linear" }}>
            <ProceduralOrb thinking={thinking} />
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 26, width: "100%", maxWidth: 640 }}>
          <button onClick={() => setPaused((p) => !p)} style={{ width: 52, height: 52, borderRadius: "50%", background: C.black, border: "none", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, boxShadow: "0 14px 30px -14px rgba(24,22,17,0.5)" }}>
            {paused ? <Play size={18} fill="#fff" /> : <Pause size={18} fill="#fff" />}
          </button>
          <button style={{ width: 52, height: 52, borderRadius: "50%", background: C.black, border: "none", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, boxShadow: "0 14px 30px -14px rgba(24,22,17,0.5)" }}><VolumeX size={18} /></button>
          <div style={{ flex: 1, height: 44, borderRadius: 999, background: C.card, border: `1px solid ${C.cardBorder}`, overflow: "hidden", position: "relative" }}>
            <div style={{ position: "absolute", inset: 0, width: `${ringPct}%`, background: C.pink, borderRadius: 999, transition: "width .6s ease" }} />
          </div>
        </div>
        <div className="font-body" style={{ fontSize: 11, color: C.mutedSoft, marginTop: 12 }}>
          {activeForRing ? `Executing: ${activeForRing.goal}` : "NEXUS is idle — describe any task above to begin."}
        </div>
      </section>

      <section style={{ padding: "10px 32px 70px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <Reveal><h2 className="font-display" style={{ fontSize: 19, fontWeight: 600, color: C.text, marginBottom: 16 }}>Live executions</h2></Reveal>
          {activeTasks.length === 0 ? (
            <Reveal delay={80}><div style={{ border: `1px dashed ${C.cardBorder}`, borderRadius: 20, padding: 44, textAlign: "center", color: C.mutedSoft, background: C.cardTint }} className="font-body">No active directives yet.</div></Reveal>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px,1fr))", gap: 14 }}>
              {activeTasks.map((t, i) => {
                const col = categoryColor(t.category);
                return (
                  <Reveal key={t.id} delay={i * 90} spin={i % 2 === 1}>
                    <div onClick={() => openTask(t.id)} style={{ cursor: "pointer", borderRadius: 20, background: C.card, border: `1px solid ${C.cardBorder}`, padding: 18, position: "relative", overflow: "hidden" }}>
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: col }} />
                      <Badge variant="outline">{t.category || "planning"}</Badge>
                      <h3 className="font-body" style={{ fontWeight: 700, fontSize: 13, margin: "10px 0 12px", color: C.text }}>{t.goal}</h3>
                      <div style={{ height: 5, background: "rgba(24,22,17,0.08)", borderRadius: 999, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${t.totalSteps ? (t.completedSteps / t.totalSteps) * 100 : 6}%`, background: col }} />
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

/* ============================== TASKS LIST ============================== */

function TasksView({ tasks, openTask }) {
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "32px 32px 56px", position: "relative", zIndex: 1 }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1 className="font-display" style={{ fontSize: 24, fontWeight: 600, color: C.text, margin: "0 0 20px" }}>All directives</h1>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {tasks.length === 0 && <div className="font-body" style={{ border: `1px dashed ${C.cardBorder}`, borderRadius: 18, padding: 40, textAlign: "center", color: C.mutedSoft, background: C.card }}>No task history found.</div>}
          {tasks.map((t) => {
            const col = categoryColor(t.category);
            return (
              <div key={t.id} onClick={() => openTask(t.id)} style={{ display: "flex", alignItems: "center", gap: 16, cursor: "pointer", borderRadius: 18, border: `1px solid ${C.cardBorder}`, background: C.card, padding: "14px 18px" }}>
                <div style={{ width: 6, height: 40, borderRadius: 3, background: col, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="font-body" style={{ fontSize: 10.5, color: C.mutedSoft, fontWeight: 700, textTransform: "uppercase" }}>ID-{t.id} · {t.category || "planning"}</div>
                  <div className="font-body" style={{ fontWeight: 700, fontSize: 13.5, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.goal}</div>
                </div>
                <div style={{ width: 130, flexShrink: 0 }}>
                  <div style={{ height: 5, background: "rgba(24,22,17,0.08)", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${t.totalSteps ? (t.completedSteps / t.totalSteps) * 100 : 6}%`, background: col }} />
                  </div>
                </div>
                <StatusBadge status={t.status} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ============================== TASK DETAIL ============================== */

const STEP_ICON = { thinking: Brain, search: Search, decision: Scale, action: Zap, approval_required: ShieldAlert, success: CheckCircle2, failure: XCircle, replan: RefreshCw };
const STEP_COLOR = (type, status) => {
  if (status === "failed") return { bd: C.red, fg: C.red, dim: C.redSoft };
  switch (type) {
    case "thinking": return { bd: C.purple, fg: C.purple, dim: C.purpleSoft };
    case "search": return { bd: C.blue, fg: C.blue, dim: C.blueSoft };
    case "decision": return { bd: C.amber, fg: C.amber, dim: C.amberSoft };
    case "action": return { bd: C.green, fg: C.green, dim: C.greenSoft };
    case "approval_required": return { bd: C.amber, fg: C.amber, dim: C.amberSoft };
    case "success": return { bd: C.green, fg: C.green, dim: C.greenSoft };
    case "failure": return { bd: C.red, fg: C.red, dim: C.redSoft };
    case "replan": return { bd: C.peach, fg: C.peach, dim: "rgba(244,169,123,0.18)" };
    default: return { bd: C.purple, fg: C.purple, dim: C.purpleSoft };
  }
};

function AgentPlanChecklist({ steps }) {
  return (
    <div style={{ borderRadius: 18, border: `1px solid ${C.cardBorder}`, background: C.card, padding: 16, marginBottom: 18 }}>
      <div className="font-body" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 0.5, marginBottom: 10 }}><Compass size={13} /> AGENT PLAN</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {steps.map((s) => {
          const mark = s.status === "done" ? "✓" : s.status === "failed" ? "✕" : s.status === "running" ? "⟳" : "○";
          const color = s.status === "done" ? C.green : s.status === "failed" ? C.red : s.status === "running" ? C.blue : C.mutedSoft;
          return (
            <div key={s.id} className="font-body" style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 12.5, color: s.status === "pending" ? C.mutedSoft : C.text }}>
              <span style={{ color, fontWeight: 800, width: 14, flexShrink: 0, animation: s.status === "running" ? "spinCW 1.2s linear infinite" : "none", display: "inline-block" }}>{mark}</span>
              {s.title}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MemoryStatePanel({ task }) {
  const c = task.constraints || {};
  const decisions = task.steps.filter((s) => s.type === "decision" && s.status !== "pending");
  const hasConstraints = c.budget || c.deadline || c.location || c.people || c.preferences;
  return (
    <div style={{ borderRadius: 18, border: `1px solid ${C.cardBorder}`, background: C.card, padding: 16, marginBottom: 18 }}>
      <div className="font-body" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 0.5, marginBottom: 12 }}>
        <Brain size={13} /> AGENT MEMORY &amp; STATE
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 8, marginBottom: hasConstraints ? 12 : 0 }}>
        {c.budget && <StateChip label="Budget" value={c.budget} />}
        {c.deadline && <StateChip label="Deadline" value={c.deadline} />}
        {c.location && <StateChip label="Location" value={c.location} />}
        {c.people && <StateChip label="People" value={c.people} />}
        {c.preferences && <StateChip label="Preferences" value={c.preferences} />}
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 11.5 }} className="font-body">
        <span style={{ color: C.muted }}>Steps done: <b style={{ color: C.text }}>{task.completedSteps}/{task.totalSteps}</b></span>
        <span style={{ color: C.muted }}>Retries: <b style={{ color: C.text }}>{task.stats.retries}</b></span>
        <span style={{ color: C.muted }}>Decisions made: <b style={{ color: C.text }}>{decisions.length}</b></span>
      </div>
      {decisions.length > 0 && (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
          {decisions.map((d) => (
            <div key={d.id} className="font-body" style={{ fontSize: 11, color: C.muted, display: "flex", gap: 6 }}>
              <Scale size={11} color={C.amber} style={{ flexShrink: 0, marginTop: 2 }} />
              <span><b style={{ color: C.text }}>{d.title}:</b> {d.decisionReason}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
function StateChip({ label, value }) {
  return (
    <div style={{ background: "rgba(24,22,17,0.035)", borderRadius: 10, padding: "7px 10px" }}>
      <div className="font-body" style={{ fontSize: 8.5, color: C.mutedSoft, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</div>
      <div className="font-body" style={{ fontSize: 11.5, color: C.text, fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function ActivityLog({ steps }) {
  const logEntries = steps.filter((s) => s.status === "done" || s.status === "failed");
  if (logEntries.length === 0) return null;
  const fmt = (ts) => ts ? new Date(ts).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—";
  return (
    <div style={{ borderRadius: 18, border: `1px solid ${C.cardBorder}`, background: C.card, padding: 16, marginBottom: 18 }}>
      <div className="font-body" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 0.5, marginBottom: 10 }}>
        <Zap size={13} /> ACTIVITY LOG
      </div>
      <div className="font-mono" style={{ display: "flex", flexDirection: "column", gap: 5, maxHeight: 180, overflowY: "auto" }}>
        {logEntries.map((s) => (
          <div key={s.id} style={{ display: "flex", gap: 8, fontSize: 11 }}>
            <span style={{ color: C.mutedSoft, flexShrink: 0 }}>{fmt(s.completedAt)}</span>
            <span style={{ color: s.status === "failed" ? C.red : C.text }}>
              {s.status === "failed" ? "⚠ " : s.type === "replan" ? "↻ " : "✓ "}{s.title}{s.detail ? ` — ${s.detail}` : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}


function AgentDetailsToggle({ task }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: 18 }}>
      <button onClick={() => setOpen((o) => !o)} className="font-body" style={{
        display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer",
        color: C.muted, fontSize: 12, fontWeight: 700, padding: 0,
      }}>
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />} {open ? "Hide" : "Show"} agent memory, plan &amp; activity log
      </button>
      {open && (
        <div style={{ marginTop: 14 }}>
          <MemoryStatePanel task={task} />
          <AgentPlanChecklist steps={task.steps} />
          <ActivityLog steps={task.steps} />
        </div>
      )}
    </div>
  );
}


function GraphNode({ step }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = STEP_ICON[step.type] || Brain;
  const color = STEP_COLOR(step.type, step.status);
  const isRunning = step.status === "running", isPending = step.status === "pending", isDecision = step.type === "decision";
  return (
    <div className="reveal in" style={{ display: "flex", gap: 16, opacity: isPending ? 0.35 : 1 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <div style={{ width: 40, height: 40, borderRadius: 13, background: isPending ? C.card : color.dim, border: `1.5px solid ${isPending ? C.cardBorder : color.bd}`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", boxShadow: isRunning ? `0 0 16px ${color.bd}44` : "none" }}>
          <Icon size={17} color={isPending ? C.mutedSoft : color.fg} />
          {isRunning && <div style={{ position: "absolute", inset: -3, borderRadius: 15, border: `1px solid ${color.bd}`, animation: "ping 1.4s cubic-bezier(0,0,0.2,1) infinite" }} />}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0, paddingBottom: 22 }}>
        <div style={{ borderRadius: 16, border: `1px solid ${C.cardBorder}`, background: C.card, padding: 15 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
            <h4 className="font-body" style={{ fontSize: 13.5, fontWeight: 700, color: isPending ? C.mutedSoft : C.text, margin: 0 }}>{step.title}</h4>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              {step.tool && step.tool !== "None" && <Badge variant="outline">{step.tool}</Badge>}
              {isRunning && <Badge variant="running">Running</Badge>}
            </div>
          </div>
          {step.detail && !isPending && <p className="font-body" style={{ color: C.muted, fontSize: 12.5, marginTop: 8, lineHeight: 1.6 }}>{step.detail}</p>}
          {isDecision && step.status !== "pending" && (
            <div style={{ marginTop: 10 }}>
              <button onClick={() => setExpanded((e) => !e)} className="font-body" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: C.amber, background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 700 }}>
                {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />} Why this choice
              </button>
              {expanded && (
                <div style={{ marginTop: 9, padding: 12, background: "rgba(24,22,17,0.035)", borderRadius: 12, border: `1px solid ${C.amber}22`, display: "flex", flexDirection: "column", gap: 10 }}>
                  {step.decisionReason && (
                    <div>
                      <span className="font-body" style={{ fontSize: 9.5, color: C.mutedSoft, textTransform: "uppercase", letterSpacing: 0.6, display: "block", marginBottom: 4, fontWeight: 700 }}>Selected</span>
                      <p className="font-body" style={{ fontSize: 12, color: C.text, margin: 0, lineHeight: 1.6 }}>{step.decisionReason}</p>
                    </div>
                  )}
                  {step.rejectedOption && (
                    <div>
                      <span className="font-body" style={{ fontSize: 9.5, color: C.mutedSoft, textTransform: "uppercase", letterSpacing: 0.6, display: "block", marginBottom: 4, fontWeight: 700 }}>Passed over</span>
                      <p className="font-body" style={{ fontSize: 12, color: C.muted, margin: 0, lineHeight: 1.6 }}>{step.rejectedOption}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ApprovalDialog({ task, onApprove, onReject }) {
  if (!task || task.status !== "awaiting_approval" || !task.approval) return null;
  const itinerary = task.finalOutput && task.finalOutput.itinerary ? task.finalOutput.itinerary : [];
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(24,22,17,0.4)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 460, maxHeight: "88vh", overflowY: "auto", background: C.card, borderRadius: 24, border: `1px solid ${C.cardBorder}`, boxShadow: "0 40px 90px -30px rgba(24,22,17,0.45)", padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{ width: 34, height: 34, borderRadius: 11, background: `linear-gradient(135deg,${C.amber},${C.peach})`, display: "flex", alignItems: "center", justifyContent: "center" }}><ShieldAlert size={17} color="#241701" /></div>
          <span className="font-display" style={{ fontWeight: 600, fontSize: 16, color: C.text }}>{task.finalOutput && task.finalOutput.itineraryTitle ? task.finalOutput.itineraryTitle : "Approval required"}</span>
        </div>
        <p className="font-body" style={{ color: C.muted, fontSize: 12.5, marginTop: 6, marginBottom: 16 }}>{task.approval.summary}</p>

        {itinerary.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {itinerary.map((it, i) => (
              <div key={i} style={{ display: "flex", gap: 10, padding: "10px 12px", borderRadius: 12, background: "rgba(24,22,17,0.035)", border: `1px solid ${C.cardBorder}` }}>
                <CheckCircle2 size={15} color={C.green} style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ minWidth: 0 }}>
                  <div className="font-body" style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>{it.label}</div>
                  <div className="font-body" style={{ fontSize: 11.5, color: C.muted, marginTop: 1 }}>{it.detail}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
          {task.approval.cost && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: C.redSoft, border: `1px solid ${C.red}33`, borderRadius: 14, color: C.red }}>
              <span className="font-body" style={{ fontSize: 12, fontWeight: 600 }}>Estimated cost</span>
              <span className="font-display" style={{ fontWeight: 700, fontSize: 16 }}>{task.approval.cost}</span>
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 9 }}>
          <button onClick={() => onReject(task.id)} className="font-body" style={{ flex: 1, padding: "11px 14px", borderRadius: 13, background: "transparent", border: `1px solid ${C.red}55`, color: C.red, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Decline</button>
          <button onClick={() => onApprove(task.id)} className="font-body" style={{ flex: 1, padding: "11px 14px", borderRadius: 13, background: C.black, border: "none", color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}><Play size={13} fill="#fff" />Yes, book it</button>
        </div>
      </div>
    </div>
  );
}

function ControlsBar({ task, setPaused, paused, stopTask, retryTask, onModifyGoal, back }) {
  const [modifying, setModifying] = useState(false);
  const [instruction, setInstruction] = useState("");
  const active = task.status === "executing" || task.status === "awaiting_approval";
  const stoppable = ["planning", "clarifying", "executing", "awaiting_approval", "replanning"].includes(task.status);
  const failed = task.status === "failed" || task.status === "cancelled";

  return (
    <div style={{ marginTop: 4, marginBottom: 18 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {active && (
          <button onClick={() => setPaused((p) => !p)} className="font-body" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 11, background: C.card, border: `1px solid ${C.cardBorder}`, color: C.text, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            {paused ? <Play size={13} /> : <Pause size={13} />} {paused ? "Resume agent" : "Pause agent"}
          </button>
        )}
        {stoppable && (
          <button onClick={() => stopTask(task.id)} className="font-body" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 11, background: "transparent", border: `1px solid ${C.red}44`, color: C.red, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            <Square size={12} /> Stop agent
          </button>
        )}
        {(task.status === "executing" || task.status === "awaiting_approval") && (
          <button onClick={() => setModifying((m) => !m)} className="font-body" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 11, background: "transparent", border: `1px solid ${C.cardBorder}`, color: C.text, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            <Pencil size={12} /> Modify goal
          </button>
        )}
        {failed && (
          <button onClick={() => retryTask(task.id)} className="font-body" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 11, background: C.black, border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            <RotateCw size={12} /> Retry
          </button>
        )}
        <button onClick={back} className="font-body" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 11, background: "transparent", border: `1px solid ${C.cardBorder}`, color: C.muted, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
          <PlusCircle size={12} /> Start new task
        </button>
      </div>
      {modifying && (
        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
          <input value={instruction} onChange={(e) => setInstruction(e.target.value)} placeholder="e.g. actually make the hotel near the beach…"
            className="font-body" style={{ flex: 1, padding: "10px 14px", borderRadius: 12, border: `1px solid ${C.cardBorder}`, background: C.card, fontSize: 12.5, outline: "none", color: C.text }} />
          <button onClick={() => { if (!instruction.trim()) return; onModifyGoal(task.id, instruction.trim()); setInstruction(""); setModifying(false); }}
            className="font-body" style={{ padding: "10px 16px", borderRadius: 12, background: C.black, border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Apply</button>
        </div>
      )}
    </div>
  );
}

function formatDuration(ms) { const s = Math.round(ms / 1000); return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`; }

function FinalReport({ task }) {
  if (!task.finalOutput) return null;
  const fo = task.finalOutput;
  const toolsUsed = new Set(task.steps.filter((s) => s.tool && s.tool !== "None").map((s) => s.tool)).size;
  const sourcesChecked = task.steps.filter((s) => s.type === "search").length;
  const timeTaken = task.stats.endTime ? formatDuration(task.stats.endTime - task.stats.startTime) : "—";
  return (
    <div className="font-body" style={{ borderRadius: 20, background: C.greenSoft, border: `1px solid ${C.green}44`, padding: 20, marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <CheckCircle2 size={16} color={C.green} />
        <span className="font-display" style={{ fontWeight: 700, fontSize: 15, color: C.text }}>Task completed</span>
      </div>
      <p style={{ fontSize: 12.5, color: C.text, lineHeight: 1.6, margin: "0 0 14px" }}>{fo.summary}</p>

      {fo.itinerary && fo.itinerary.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div className="font-body" style={{ fontSize: 10, color: C.mutedSoft, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{fo.itineraryTitle || "Booked"}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {fo.itinerary.map((it, i) => (
              <div key={i} style={{ display: "flex", gap: 10, padding: "9px 11px", borderRadius: 12, background: "#fff", border: `1px solid ${C.cardBorder}` }}>
                <CheckCircle2 size={14} color={C.green} style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ minWidth: 0 }}>
                  <div className="font-body" style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{it.label}</div>
                  <div className="font-body" style={{ fontSize: 11, color: C.muted }}>{it.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {fo.importantResults.length > 0 && <ReportSection title="Important results" items={fo.importantResults} />}
      {fo.recommendations.length > 0 && <ReportSection title="Recommendations" items={fo.recommendations} />}
      {fo.nextSteps.length > 0 && <ReportSection title="Next steps" items={fo.nextSteps} />}
      {(fo.budgetUsed || fo.timeline) && (
        <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
          {fo.budgetUsed && <Pill style={{ background: "#fff" }}>💰 {fo.budgetUsed}</Pill>}
          {fo.timeline && <Pill style={{ background: "#fff" }}>🗓 {fo.timeline}</Pill>}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: 10, marginTop: 6 }}>
        {[["Tasks completed", task.completedSteps], ["Tools used", toolsUsed], ["Sources checked", sourcesChecked], ["Retries", task.stats.retries], ["Time taken", timeTaken]].map(([label, val]) => (
          <div key={label} style={{ background: "#fff", borderRadius: 12, padding: "10px 12px", border: `1px solid ${C.cardBorder}` }}>
            <div className="font-display" style={{ fontSize: 17, fontWeight: 700, color: C.text }}>{val}</div>
            <div style={{ fontSize: 9.5, color: C.mutedSoft, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
function ReportSection({ title, items }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="font-body" style={{ fontSize: 10, color: C.mutedSoft, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{title}</div>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {items.map((it, i) => <li key={i} className="font-body" style={{ fontSize: 12, color: C.text, lineHeight: 1.6 }}>{it}</li>)}
      </ul>
    </div>
  );
}

function ClarificationPrompt({ task, onAnswer }) {
  const [answer, setAnswer] = useState("");
  return (
    <div style={{ borderRadius: 20, background: C.card, border: `1px solid ${C.amber}44`, padding: 22, maxWidth: 560, margin: "20px auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
        <HelpCircle size={17} color={C.amber} />
        <span className="font-display" style={{ fontWeight: 700, fontSize: 15, color: C.text }}>One quick question</span>
      </div>
      <p className="font-body" style={{ fontSize: 13, color: C.text, lineHeight: 1.6, marginBottom: 16 }}>{task.clarificationQuestion}</p>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Type your answer…" autoFocus
          className="font-body" style={{ flex: 1, padding: "11px 14px", borderRadius: 12, border: `1px solid ${C.cardBorder}`, outline: "none", fontSize: 13 }} />
        <button onClick={() => answer.trim() && onAnswer(task.id, answer.trim())} className="font-body" style={{ padding: "11px 18px", borderRadius: 12, background: C.black, border: "none", color: "#fff", fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>Continue</button>
      </div>
    </div>
  );
}

function TaskDetailView({ task, back, respondApproval, answerClarification, modifyGoal, stopTask, retryTask, paused, setPaused }) {
  if (!task) return <div style={{ padding: 48, color: C.mutedSoft }} className="font-body">Task not found.</div>;
  const col = categoryColor(task.category);
  const planning = task.status === "planning" || task.status === "replanning";

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, position: "relative", zIndex: 1 }}>
      <div style={{ padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
          <button onClick={back} style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 10, cursor: "pointer", color: C.muted, padding: 8, display: "flex" }}><ArrowLeft size={15} /></button>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              {task.category && <span className="font-body" style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 10px", borderRadius: 999, background: col + "22", color: col }}>{task.category}</span>}
              <StatusBadge status={task.status} />
            </div>
            <h2 className="font-display" style={{ fontWeight: 600, fontSize: 16, margin: 0, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 480 }}>{task.goal}</h2>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "10px 32px 40px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          {planning && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "50px 0" }}>
              <ProceduralOrb size={110} thinking />
              <p className="font-body" style={{ marginTop: 18, color: C.muted, fontSize: 13 }}>{task.status === "replanning" ? "Replanning around your update…" : "Understanding your goal and building a plan…"}</p>
            </div>
          )}

          {task.status === "clarifying" && <ClarificationPrompt task={task} onAnswer={answerClarification} />}

          {!planning && task.status !== "clarifying" && (
            <>
              <ControlsBar task={task} setPaused={setPaused} paused={paused} stopTask={stopTask} retryTask={retryTask} onModifyGoal={modifyGoal} back={back} />
              {task.status === "completed" && <FinalReport task={task} />}
              {task.steps.length > 0 && <AgentDetailsToggle task={task} />}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {task.steps.map((step) => <GraphNode key={step.id} step={step} />)}
              </div>
            </>
          )}
        </div>
      </div>
      <ApprovalDialog task={task} onApprove={(id) => respondApproval(id, true)} onReject={(id) => respondApproval(id, false)} />
    </div>
  );
}

/* ============================== APP ============================== */

export default function App() {
  const { tasks, stats, paused, setPaused, createTask, answerClarification, modifyGoal, respondApproval, stopTask, retryTask } = useEngine();
  const [view, setView] = useState("home");
  const [activeTaskId, setActiveTaskId] = useState(null);
  const scrollRef = useRef(null);
  const { y: scrollY, progress: scrollProgress } = useScrollY(scrollRef);

  const openTask = (id) => { setActiveTaskId(id); setView("detail"); };
  const launch = (goal) => { const id = createTask(goal); openTask(id); };
  const activeTask = tasks.find((t) => t.id === activeTaskId);

  return (
    <div className="font-body" style={{ width: "100%", height: "100vh", minHeight: 640, color: C.text, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
      <style>{FONT_CSS}</style>
      <Backdrop scrollY={scrollY} />
      <div style={{ position: "fixed", top: 0, left: 0, height: 3, width: `${scrollProgress * 100}%`, background: `linear-gradient(90deg, ${C.peach}, ${C.pink})`, zIndex: 50, transition: "width .05s linear" }} />
      <Header view={view === "detail" ? "detail" : view} setView={setView} scrollY={scrollY} />
      <div ref={scrollRef} style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column" }}>
        {view === "home" && <HomeView tasks={tasks} stats={stats} paused={paused} setPaused={setPaused} onLaunch={launch} openTask={openTask} scrollY={scrollY} />}
        {view === "tasks" && <TasksView tasks={tasks} openTask={openTask} />}
        {view === "detail" && (
          <TaskDetailView task={activeTask} back={() => setView("tasks")} respondApproval={respondApproval}
            answerClarification={answerClarification} modifyGoal={modifyGoal} stopTask={stopTask} retryTask={retryTask}
            paused={paused} setPaused={setPaused} />
        )}
      </div>
    </div>
  );
}
