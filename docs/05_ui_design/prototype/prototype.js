/*
 * hound-db low-fidelity prototype - behavior and rendering.
 *
 * The file is English-only. All user-facing copy and synthetic fixture text
 * come from copy.zh.js, which is the single localization file for this
 * prototype. This is a static design artifact, not application code.
 */

(() => {
  "use strict";

  const C = window.PROTO_COPY;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const ESCAPE = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ESCAPE[character]);
  const attr = (value) => esc(value).replace(/\n/g, "&#10;");
  const t = (path) => path.split(".").reduce((node, key) => (node == null ? undefined : node[key]), C);

  const ICONS = {
    close: '<path d="M6 6l12 12M18 6L6 18"></path>',
    copy: '<rect x="9" y="9" width="10" height="10" rx="2"></rect><path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3"></path>',
    check: '<path d="M20 6L9 17l-5-5"></path>',
    alert: '<path d="M12 9v4"></path><path d="M12 17h.01"></path><path d="M10.3 3.9L2.4 17a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"></path>',
    thumbsUp: '<path d="M7 22V11"></path><path d="M4 11h3v11H4z"></path><path d="M7 11l4-7a2 2 0 0 1 2-2c1.1 0 2 .9 2 2v4h4a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 18 21H7"></path>',
    thumbsDown: '<path d="M17 2v11"></path><path d="M20 13h-3V2h3z"></path><path d="M17 13l-4 7a2 2 0 0 1-2 2c-1.1 0-2-.9-2-2v-4H5a2 2 0 0 1-2-2.3l1.2-7A2 2 0 0 1 6 3h11"></path>',
    history: '<circle cx="12" cy="12" r="8"></circle><path d="M12 8v4l3 2"></path>',
  };

  const icon = (name, className = "icon") =>
    `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ""}</svg>`;

  const badge = (kind, text) => `<span class="badge badge--${kind}">${esc(text)}</span>`;

  const state = {
    surface: "chat",
    chatState: "answered",
    chatFocus: false,
    chatChartData: false,
    chatTraceOpen: false,
    chatSteps: [],
    chatQuestion: C.mock.chat.question,
    historyQuery: "",
    historySelected: 0,
    historyItems: C.mock.history.map((item) => ({ ...item })),
    graphState: "graph",
    graphView: window.matchMedia("(max-width: 767px)").matches ? "table" : "graph",
    graphSelected: "orders",
    graphQuery: "",
    graphVerifiedOnly: false,
    graphHotOnly: false,
    graphFilterOpen: false,
    graphDetailOpen: false,
    adminState: "clean",
    adminType: "joins",
    adminSelected: "join-orders-customers",
    adminDirty: false,
    adminDraft: null,
    adminError: null,
    adminSaved: false,
    adminEmptyType: false,
    adminQuery: "",
    adminEditorOpen: false,
    evalState: "pass",
    evalRun: "pass",
    evalCase: null,
    evalTrendData: false,
    evalRunTimer: null,
    modalOpen: false,
    modalPending: null,
    modalTrigger: null,
    caseTrigger: null,
    traceTrigger: null,
  };

  /* ------------------------------------------------------------------ */
  /* Shared helpers                                                      */
  /* ------------------------------------------------------------------ */

  function hydrateCopy() {
    $$("[data-copy]").forEach((element) => {
      const value = t(element.dataset.copy);
      if (typeof value === "string") element.textContent = value;
    });
    $$("[data-copy-placeholder]").forEach((element) => {
      const value = t(element.dataset.copyPlaceholder);
      if (typeof value === "string") element.placeholder = value;
    });
    $$("[data-copy-label]").forEach((element) => {
      const value = t(element.dataset.copyLabel);
      if (typeof value === "string") element.setAttribute("aria-label", value);
    });
    document.title = `${C.meta.title} · Prototype`;
  }

  function announce(message, assertive = false) {
    const region = assertive ? $("#alert-region") : $("#live-region");
    if (!region) return;
    region.textContent = "";
    window.setTimeout(() => {
      region.textContent = message;
    }, 20);
  }

  function toast(message) {
    const element = document.createElement("div");
    element.className = "toast";
    element.textContent = message;
    document.body.appendChild(element);
    window.setTimeout(() => element.remove(), 2200);
  }

  function fallbackCopy(text) {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    try {
      document.execCommand("copy");
    } catch {
      /* The prototype degrades silently when the clipboard is unavailable. */
    }
    area.remove();
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    }
    fallbackCopy(text);
    return Promise.resolve();
  }

  function nowTime() {
    return new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }

  function banner(kind, title, body, code) {
    return `<div class="banner banner--${kind}"><div class="banner__title">${esc(title)}</div><div class="banner__body">${esc(body)}</div><div class="banner__code">${esc(code)}</div></div>`;
  }

  /* ------------------------------------------------------------------ */
  /* Shell                                                               */
  /* ------------------------------------------------------------------ */

  function renderHistory() {
    const list = $("#history-list");
    if (!list) return;
    const query = state.historyQuery.trim().toLowerCase();
    const items = state.historyItems
      .map((item, index) => ({ ...item, index }))
      .filter((item) => !query || item.question.toLowerCase().includes(query));
    const groups = [
      { label: C.history.today, items: items.filter((item) => item.day !== "yesterday") },
      { label: C.history.yesterday, items: items.filter((item) => item.day === "yesterday") },
    ].filter((group) => group.items.length);
    if (!groups.length) {
      list.innerHTML = `<li><p class="t-caption" style="padding:8px 12px">${esc(C.history.empty)}</p></li>`;
      return;
    }
    list.innerHTML = groups
      .map(
        (group) => `<li>
          <div class="history-group">${esc(group.label)}</div>
          ${group.items
            .map(
              (item) => `<button class="history-item${item.index === state.historySelected ? " is-active" : ""}" type="button" data-history="${item.index}">
                <span class="history-item__question">${esc(item.question)}</span>
                <span class="history-item__meta">
                  ${item.route === "fastPath" ? badge("fast", C.badges.fastPath) : badge("agent", C.badges.agent)}
                  ${item.status === "verified" ? badge("verified", C.badges.verified) : ""}
                  <span>${esc(item.time)}</span>
                </span>
              </button>`,
            )
            .join("")}
        </li>`,
      )
      .join("");
  }

  function openHistory() {
    $("#history-rail").classList.add("is-open");
    $("#rail-scrim").classList.add("is-open");
    $("#history-toggle").setAttribute("aria-expanded", "true");
    const close = $("#history-close");
    if (close) close.focus();
  }

  function closeHistory() {
    $("#history-rail").classList.remove("is-open");
    $("#rail-scrim").classList.remove("is-open");
    $("#history-toggle").setAttribute("aria-expanded", "false");
  }

  function selectHistoryItem(index) {
    const item = state.historyItems[index];
    if (!item) return;
    state.historySelected = index;
    state.chatQuestion = item.question;
    state.chatState = item.route === "fastPath" ? "fast" : item.status === "verified" ? "verified" : "answered";
    state.composerValue = "";
    $("#question-input").value = "";
    setSurface("chat");
    renderHistory();
    renderChat();
    closeHistory();
  }

  const STATE_OPTIONS = {
    chat: [
      ["empty", "empty"],
      ["loading", "loading"],
      ["streaming", "streaming"],
      ["fast", "fast path"],
      ["verified", "verified"],
      ["answered", "answered"],
      ["clarification", "clarification"],
      ["rejected", "rejected"],
      ["abstain", "abstain"],
      ["degraded", "degraded"],
      ["stale", "stale"],
      ["clamped", "row clamped"],
      ["chart-pending", "chart pending"],
      ["chart-unavailable", "chart unavailable"],
    ],
    graph: [
      ["graph", "graph"],
      ["table", "table view"],
      ["degraded", "degraded"],
      ["empty", "empty"],
    ],
    admin: [
      ["clean", "clean"],
      ["dirty", "dirty"],
      ["saved", "saved"],
      ["error", "validation error"],
      ["degraded", "degraded"],
      ["stale", "stale schema"],
      ["projection", "projection pending"],
      ["empty", "no selection"],
      ["empty-type", "empty type"],
    ],
    eval: [
      ["pass", "pass"],
      ["blocked", "release blocked"],
      ["degraded", "degraded"],
      ["stale", "stale schema"],
      ["running", "running"],
      ["empty", "empty"],
      ["loading", "loading"],
    ],
  };

  function updateStateSelect() {
    const select = $("#state-select");
    if (!select) return;
    const options = STATE_OPTIONS[state.surface] || [];
    select.innerHTML = options.map(([value, label]) => `<option value="${value}">${esc(label)}</option>`).join("");
    const current =
      state.surface === "chat"
        ? state.chatState
        : state.surface === "graph"
          ? state.graphState
          : state.surface === "admin"
            ? state.adminState
            : state.evalState;
    select.value = options.some(([value]) => value === current) ? current : options[0] ? options[0][0] : "";
  }

  function setSurface(name, options = {}) {
    if (!["chat", "graph", "admin", "eval"].includes(name)) name = "chat";
    state.surface = name;
    $$(".surface").forEach((element) => element.classList.toggle("is-active", element.dataset.surface === name));
    $$("[data-surface-tab]").forEach((element) =>
      element.setAttribute("aria-pressed", String(element.dataset.surfaceTab === name)),
    );
    $("#main").className = `main-region${name === "eval" ? "" : " main-region--fill"}`;
    closeHistory();
    closeOverlays();
    updateStateSelect();
    if (name === "chat") renderChat();
    if (name === "graph") renderGraph();
    if (name === "admin") renderAdmin();
    if (name === "eval") renderEval();
    if (options.updateHash !== false && location.hash !== `#${name}`) {
      window.history.replaceState(null, "", `#${name}`);
    }
  }

  function closeOverlays() {
    state.chatTraceOpen = false;
    state.evalCase = null;
    state.modalOpen = false;
    state.modalPending = null;
    state.graphDetailOpen = false;
    state.graphFilterOpen = false;
    const root = $("#overlay-root");
    if (root) root.innerHTML = "";
    const detail = $("#graph-detail");
    if (detail) detail.classList.remove("is-open");
    const filters = $("#graph-filters");
    if (filters) filters.classList.remove("is-open");
  }

  function setPrototypeState(value) {
    if (state.surface === "chat") {
      state.chatState = value;
      state.chatFocus = value === "clarification" || value === "rejected";
      if (value === "empty") {
        $("#question-input").value = "";
      }
      if (value === "rejected") {
        $("#question-input").value = state.chatQuestion;
      }
      renderChat();
      updateStateSelect();
      if (value === "rejected") announce(C.chat.rejectedTitle, true);
      return;
    }
    if (state.surface === "graph") {
      state.graphState = value;
      state.graphQuery = value === "empty" ? "zzzz" : "";
      state.graphView = value === "graph" ? "graph" : "table";
      state.graphFilterOpen = false;
      state.graphDetailOpen = false;
      renderGraph();
      return;
    }
    if (state.surface === "admin") {
      applyAdminState(value);
      return;
    }
    applyEvalState(value);
  }

  /* ------------------------------------------------------------------ */
  /* Chat                                                                */
  /* ------------------------------------------------------------------ */

  function updateComposer() {
    const input = $("#question-input");
    const button = $("#ask-button");
    const status = $("#composer-status");
    if (!input || !button || !status) return;
    const busy = state.chatState === "loading" || state.chatState === "streaming";
    const empty = input.value.trim() === "";
    button.disabled = busy || empty;
    button.setAttribute("aria-disabled", String(button.disabled));
    if (busy) {
      status.hidden = false;
      status.textContent = C.chat.askDisabledActive;
    } else {
      status.hidden = true;
      status.textContent = "";
    }
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 129)}px`;
  }

  function askQuestion() {
    const input = $("#question-input");
    const question = input.value.trim();
    if (!question) return;
    if (state.chatState === "loading" || state.chatState === "streaming") return;
    state.chatQuestion = question;
    state.historyItems.unshift({ question, route: "agent", status: null, time: nowTime(), day: "today" });
    state.historySelected = 0;
    state.chatState = "loading";
    input.value = "";
    renderHistory();
    renderChat();
    updateStateSelect();
    announce(C.chat.routing);
    window.setTimeout(() => {
      if (state.chatState !== "loading") return;
      state.chatState = "streaming";
      renderChat();
      updateStateSelect();
    }, 900);
    window.setTimeout(() => {
      if (state.chatState !== "streaming") return;
      state.chatState = "answered";
      renderChat();
      updateStateSelect();
      announce(C.chat.answerReady);
    }, 2200);
  }

  function routeRow(route, latency, model, extra = "") {
    const routeBadge =
      route === "verified"
        ? badge("verified", C.badges.verified)
        : route === "fastPath"
          ? badge("fast", C.badges.fastPath)
          : badge("agent", C.badges.agent);
    return `<div class="answer-card__route">${routeBadge}<span class="t-caption">${esc(C.chat.routeRow(latency, model))}</span>${extra}</div>`;
  }

  function renderResultTable(headers, rows, caption, options = {}) {
    const head = headers.map((header) => `<th scope="col">${esc(header)}</th>`).join("");
    const body = rows
      .map(
        (row) => `<tr>${row
          .map((cell, index) => {
            const content =
              cell === null || cell === undefined ? '<span class="null">NULL</span>' : esc(cell);
            if (index === 0) return `<th scope="row">${content}</th>`;
            const numeric = typeof cell === "string" && /^[\d,.%\s]+$/.test(cell) && /\d/.test(cell);
            return `<td class="${numeric ? "num" : ""}">${content}</td>`;
          })
          .join("")}</tr>`,
      )
      .join("");
    return `<div class="table-wrap${options.clamp ? " table-scroll-50" : ""}" role="region" aria-label="${attr(caption)}" tabindex="0">
      <table class="table table--dense${options.compact ? " table--compact" : ""}">
        <caption>${esc(caption)}</caption>
        <thead><tr>${head}</tr></thead>
        <tbody>${body}</tbody>
      </table>
    </div>`;
  }

  function highlightSql(sql) {
    const pattern =
      /(--[^\n]*)|('(?:[^']|'')*')|\b(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|ON|AND|OR|GROUP|BY|ORDER|LIMIT|AS|COUNT|SUM|ROUND|DISTINCT|OVER|INTERVAL|NOT|NULL|IS|IN|CASE|WHEN|THEN|ELSE|END|WITH|DESC|ASC)\b|\b(\d+(?:\.\d+)?)\b/g;
    let output = "";
    let last = 0;
    for (const match of sql.matchAll(pattern)) {
      output += esc(sql.slice(last, match.index));
      const [text, comment, string, keyword] = match;
      const className = comment ? "sql-comment" : string ? "sql-string" : keyword ? "sql-keyword" : "sql-number";
      output += `<span class="${className}">${esc(text)}</span>`;
      last = match.index + text.length;
    }
    output += esc(sql.slice(last));
    return output;
  }

  function renderSqlBlock(sql, options = {}) {
    const label = options.label || C.chat.sqlLabel;
    return `<div class="sql-block${options.rejected ? " sql-block--rejected" : ""}">
      <div class="sql-block__head">
        <span class="t-caption">${esc(label)}</span>
        <button class="btn btn--tertiary" type="button" data-action="copy-sql" data-sql="${attr(sql)}">${esc(C.chat.copySql)}</button>
      </div>
      <pre>${highlightSql(sql)}</pre>
    </div>`;
  }

  function renderTablesUsed(tables) {
    return `<div class="stack-8"><h3 class="t-label">${esc(C.chat.tablesUsed)}</h3><div class="chip-row">${tables
      .map((table) => `<span class="chip">${esc(table)}</span>`)
      .join("")}<span class="t-caption">${esc(C.common.schemaVersion)}</span></div></div>`;
  }

  function renderAssumptions(text, confidence, reason) {
    return `<div class="stack-8"><h3 class="t-label">${esc(C.chat.assumptionsTitle)}</h3><p class="t-caption">${esc(text)}</p><p class="t-caption">${esc(C.chat.confidenceLabel)}：${esc(confidence)} · ${esc(reason)}</p></div>`;
  }

  function renderActions(options = {}) {
    const save = options.save !== false;
    const sql = options.sql || "";
    return `<div class="actions-row">
      ${save ? `<button class="btn btn--secondary" type="button" data-action="save-verified">${esc(C.chat.saveVerified)}</button>` : ""}
      <button class="btn btn--icon" type="button" data-action="feedback-up" aria-label="${esc(C.chat.helpful)}" title="${esc(C.chat.helpful)}">${icon("thumbsUp")}</button>
      <button class="btn btn--icon" type="button" data-action="feedback-down" aria-label="${esc(C.chat.notHelpful)}" title="${esc(C.chat.notHelpful)}">${icon("thumbsDown")}</button>
      <button class="btn btn--tertiary" type="button" data-action="copy-sql" data-sql="${attr(sql)}">${esc(C.chat.copySql)}</button>
    </div>`;
  }

  function renderTraceRow(stepCount, latency) {
    return `<div class="trace-row"><span class="t-caption">${esc(C.chat.trace)} · ${esc(C.chat.traceSteps(stepCount))} · ${esc(latency)}</span><button class="btn btn--tertiary" type="button" data-action="open-trace">${esc(C.chat.traceExpand)}</button></div>`;
  }

  function renderTrace(steps, options = {}) {
    const routeBadge = options.hideHeaderRoute
      ? ""
      : options.route === "verified"
        ? badge("verified", C.badges.verified)
        : options.route === "fastPath"
          ? badge("fast", C.badges.fastPath)
          : badge("agent", C.badges.agent);
    const warningBadge = options.degraded
      ? badge("warning", C.badges.degraded)
      : options.warning
        ? badge("warning", options.warning)
        : "";
    const header = options.hideHeader
      ? ""
      : `<div class="trace__header">
          <div class="row-8"><h2 class="t-title-sm">${esc(C.chat.traceTitle)}</h2>${routeBadge}${warningBadge}</div>
          <div class="trace__meta"><span class="t-num">${esc(options.latency || "—")}</span><span class="t-num">${esc(options.tokens || "—")} tokens</span><span class="t-mono">${esc(options.model || "—")}</span></div>
          <div class="trace__meta"><span class="t-mono">${esc(options.runId || "—")}</span><span>prompt v3 · graph v2 · schema v12</span></div>
        </div>`;
    if (!steps.length) {
      return `<div class="trace">${header}<p class="t-caption">${esc(options.emptyText || C.chat.noRun)}</p></div>`;
    }
    const idBase = options.id || "trace";
    const list = `<ol class="trace__steps">${steps
      .map((step, index) => {
        const failed = step.status === "failed";
        const pending = step.status === "pending";
        const payloadId = `${idBase}-payload-${index}`;
        const hasPayload = step.payload !== undefined && step.payload !== null;
        const meta = `<span class="trace__step-name">${esc(step.name)}</span>
          <span class="trace__step-meta">
            ${step.kind === "llm" ? badge("llm", C.badges.llm) : badge("deterministic", C.badges.deterministic)}
            ${failed ? badge("danger", C.badges.failed) : ""}
            ${pending ? `<span>${esc(C.chat.traceStatus.pending)}</span>` : ""}
            <span class="t-mono">${esc(step.latency || "—")}</span>
            ${step.tokens ? `<span class="t-num">${esc(String(step.tokens))} tokens</span>` : ""}
            ${step.reason ? `<code>${esc(step.reason)}</code>` : ""}
          </span>
          ${step.error ? `<span class="trace__error">${esc(step.error)}</span>` : ""}`;
        const control = hasPayload
          ? `<button class="trace__step-btn" type="button" data-action="toggle-step" aria-expanded="false" aria-controls="${payloadId}">${meta}</button>
             <div class="trace__payload" id="${payloadId}" hidden><pre>${esc(typeof step.payload === "string" ? step.payload : JSON.stringify(step.payload, null, 2))}</pre></div>`
          : `<div class="trace__step-btn">${meta}</div>`;
        return `<li class="trace__step${failed ? " trace__step--failed" : ""}${pending ? " trace__step--pending" : ""}">
          <span class="trace__dot" aria-hidden="true"></span>
          ${control}
        </li>`;
      })
      .join("")}</ol>`;
    return `<div class="trace">${header}${list}</div>`;
  }

  function baseChatSteps() {
    return [
      {
        key: "route",
        name: C.chat.traceStepsNames.route,
        kind: "deterministic",
        status: "done",
        latency: "0.1 s",
        tokens: 0,
        payload: { route: "agent", fast_path: false, confidence: 0.91 },
      },
      {
        key: "knowledge",
        name: C.chat.traceStepsNames.knowledge,
        kind: "llm",
        status: "done",
        latency: "1.2 s",
        tokens: 820,
        payload: { tables: ["orders", "channels", "payments", "refunds"], terms: ["gmv"], schema_version: 12 },
      },
      {
        key: "sqlWriter",
        name: C.chat.traceStepsNames.sqlWriter,
        kind: "llm",
        status: "done",
        latency: "1.9 s",
        tokens: 1240,
        payload: { sql: C.mock.chat.sql },
      },
      {
        key: "validation",
        name: C.chat.traceStepsNames.validation,
        kind: "deterministic",
        status: "done",
        latency: "0.2 s",
        tokens: 0,
        payload: { rules: ["single_statement", "select_only", "known_tables", "row_cap"], passed: true },
      },
      {
        key: "execution",
        name: C.chat.traceStepsNames.execution,
        kind: "deterministic",
        status: "done",
        latency: "0.6 s",
        tokens: 0,
        payload: { rows: 5, limit: 1000, clamped: false, elapsed_ms: 612 },
      },
      {
        key: "answer",
        name: C.chat.traceStepsNames.answer,
        kind: "llm",
        status: "done",
        latency: "0.2 s",
        tokens: 210,
        payload: { confidence: "high", assumptions: 3 },
      },
    ];
  }

  function chatTraceOptions(chatState) {
    const m = C.mock.chat;
    if (chatState === "empty") {
      return { id: "rail", hideHeader: true, emptyText: C.history.noRun };
    }
    if (chatState === "loading") {
      return {
        id: "rail",
        hideHeaderRoute: true,
        emptyText: C.chat.waitingFirstStep,
        runId: m.runId,
        latency: "—",
        tokens: "—",
        model: "gpt-4.1",
      };
    }
    if (chatState === "streaming") {
      return { id: "rail", runId: m.runId, latency: "—", tokens: "820", model: "gpt-4.1" };
    }
    if (chatState === "fast") {
      return {
        id: "rail",
        runId: m.runId,
        route: "fastPath",
        latency: m.fast.latency,
        tokens: "0",
        model: m.fast.model,
      };
    }
    if (chatState === "verified") {
      return {
        id: "rail",
        runId: m.runId,
        route: "verified",
        latency: m.verified.latency,
        tokens: "210",
        model: m.verified.model,
      };
    }
    if (chatState === "rejected") {
      return { id: "rail", runId: m.runId, latency: "3.2 s", tokens: "2,060", model: "gpt-4.1" };
    }
    if (chatState === "clarification") {
      return { id: "rail", runId: m.runId, latency: "3.4 s", tokens: "2,060", model: "gpt-4.1" };
    }
    if (chatState === "abstain") {
      return { id: "rail", runId: m.runId, latency: "7.9 s", tokens: "2,700", model: "gpt-4.1" };
    }
    if (chatState === "degraded") {
      return {
        id: "rail",
        runId: m.runId,
        latency: "4.2 s",
        tokens: "2,270",
        model: "gpt-4.1",
        degraded: true,
      };
    }
    if (chatState === "stale") {
      return {
        id: "rail",
        runId: m.runId,
        latency: "4.2 s",
        tokens: "2,270",
        model: "gpt-4.1",
        warning: C.badges.stale,
      };
    }
    return { id: "rail", runId: m.runId, latency: "4.2 s", tokens: "2,270", model: "gpt-4.1" };
  }

  function emptyAnswer() {
    return `<div class="card card--signature on-dark">
      <h2 class="t-display-lg">${esc(C.chat.emptyTitle)}</h2>
      <p class="t-body">${esc(C.chat.emptyBody)}</p>
      <div><button class="btn btn--inverse" type="button" data-action="focus-composer">${esc(C.chat.emptyButton)}</button></div>
    </div>`;
  }

  function barChartFigure() {
    const rows = C.mock.chat.chartRows;
    const width = 640;
    const height = 240;
    const margin = { top: 24, right: 16, bottom: 36, left: 56 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const max = 500000;
    const y = (value) => margin.top + innerHeight - (value / max) * innerHeight;
    const barWidth = 56;
    const gap = (innerWidth - rows.length * barWidth) / (rows.length + 1);
    const colors = [
      "--color-link",
      "--color-signature-coral",
      "--color-link-active",
      "--color-signature-mustard",
      "--color-muted",
    ];
    const ticks = [0, 100000, 200000, 300000, 400000, 500000];
    const grid = ticks
      .map(
        (tick) => `<line x1="${margin.left}" x2="${width - margin.right}" y1="${y(tick)}" y2="${y(tick)}" stroke="var(--color-hairline)" stroke-width="1"></line><text x="${margin.left - 8}" y="${y(tick) + 4}" text-anchor="end">${tick / 1000}k</text>`,
      )
      .join("");
    const bars = rows
      .map((row, index) => {
        const x = margin.left + gap + index * (barWidth + gap);
        const barHeight = (row.value / max) * innerHeight;
        return `<rect x="${x}" y="${y(row.value)}" width="${barWidth}" height="${barHeight}" rx="2" fill="var(${colors[index]})"></rect>
          <text class="chart-value" x="${x + barWidth / 2}" y="${y(row.value) - 6}" text-anchor="middle">${Math.round(row.value / 1000)}k</text>
          <text x="${x + barWidth / 2}" y="${height - 12}" text-anchor="middle">${esc(row.label)}</text>`;
      })
      .join("");
    const svg = `<svg class="chart__svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${attr(C.chat.chart.title)}"><title>${esc(C.chat.chart.title)}</title>${grid}<line x1="${margin.left}" x2="${width - margin.right}" y1="${height - margin.bottom}" y2="${height - margin.bottom}" stroke="var(--color-border-strong)" stroke-width="1"></line>${bars}</svg>`;
    const dataTable = state.chatChartData
      ? renderResultTable(
          [C.chat.table.channel, C.chat.table.gmv],
          rows.map((row) => [row.label, row.value.toLocaleString("en-US")]),
          C.chat.chart.title,
        )
      : "";
    return `<figure class="chart">
      <div class="chart__head">
        <div><h3 class="chart__title">${esc(C.chat.chart.title)}</h3><p class="chart__subtitle">${esc(C.chat.chart.subtitle)}</p></div>
        <button class="btn btn--tertiary" type="button" data-action="toggle-chart-data">${esc(state.chatChartData ? C.common.hideData : C.common.viewData)}</button>
      </div>
      ${svg}
      <ul class="chart__legend"><li><span class="chart__swatch" style="background:var(--color-link)"></span>${esc(C.chat.chart.series)}</li></ul>
      ${dataTable}
    </figure>`;
  }

  function renderChatChart() {
    if (state.chatState === "chart-pending") {
      return `<div class="chart"><p class="t-caption">${esc(C.chat.chart.preparing)}</p></div>`;
    }
    if (state.chatState === "chart-unavailable") {
      return `<div class="chart"><p class="t-caption">${esc(C.chat.chart.unavailable)}</p></div>`;
    }
    return barChartFigure();
  }

  function chatViewData(chatState) {
    const m = C.mock.chat;
    const base = baseChatSteps();
    if (chatState === "empty") {
      return { answer: emptyAnswer(), steps: [] };
    }
    if (chatState === "loading") {
      const stages = ["route", "knowledge", "sql", "validation", "execution"];
      const list = stages
        .map(
          (stage, index) =>
            `<li class="stage${index === 0 ? " stage--current" : ""}"><span class="stage__dot" aria-hidden="true"></span>${esc(C.chat.stages[stage])}</li>`,
        )
        .join("");
      return {
        answer: `<article class="answer-card"><div class="answer-card__route"><span class="t-caption">${esc(C.chat.routing)}</span></div><ol class="stage-list">${list}</ol><p class="t-caption">${esc(C.chat.stepOf(1, 5))}</p></article>`,
        steps: [],
      };
    }
    if (chatState === "streaming") {
      const stages = [
        ["route", "done"],
        ["knowledge", "done"],
        ["sql", "current"],
        ["validation", ""],
        ["execution", ""],
      ];
      const list = stages
        .map(
          ([stage, status]) =>
            `<li class="stage${status ? ` stage--${status}` : ""}"><span class="stage__dot" aria-hidden="true"></span>${esc(C.chat.stages[stage])}</li>`,
        )
        .join("");
      const steps = base.slice(0, 2).concat([
        {
          key: "sqlWriter",
          name: C.chat.traceStepsNames.sqlWriter,
          kind: "llm",
          status: "pending",
          latency: "—",
          tokens: 0,
        },
      ]);
      return {
        answer: `<article class="answer-card"><div class="answer-card__route"><span class="t-caption">${esc(C.chat.streaming)}</span></div><ol class="stage-list">${list}</ol><p class="t-caption">${esc(C.chat.stepOf(3, 5))}</p></article>`,
        steps,
      };
    }
    if (chatState === "fast") {
      const fast = m.fast;
      const steps = [
        {
          key: "route",
          name: C.chat.traceStepsNames.route,
          kind: "deterministic",
          status: "done",
          latency: "0.1 s",
          tokens: 0,
          payload: { route: "fast_path", pattern: "primary_key_lookup", confidence: 0.99 },
        },
        {
          key: "execution",
          name: C.chat.traceStepsNames.execution,
          kind: "deterministic",
          status: "done",
          latency: "0.3 s",
          tokens: 0,
          payload: { rows: 1, limit: 1000, clamped: false, elapsed_ms: 312 },
        },
      ];
      return {
        answer: `<article class="answer-card">
          ${routeRow("fastPath", fast.latency, fast.model)}
          <div class="stack-8"><h2 class="t-title-lg answer-card__headline">${esc(fast.headline)}</h2><p class="answer-card__body">${esc(fast.body)}</p></div>
          <div class="kpi-result"><span class="kpi-result__value">${esc(fast.kpiValue)}</span><span class="kpi-result__unit">${esc(fast.kpiUnit)}</span></div>
          ${renderSqlBlock(fast.sql)}
          ${renderTablesUsed(fast.tables)}
          ${renderAssumptions(fast.assumptions, fast.confidence, fast.confidenceReason)}
          ${renderActions({ save: true, sql: fast.sql })}
          ${renderTraceRow(2, fast.latency)}
        </article>`,
        steps,
      };
    }
    if (chatState === "verified") {
      const verified = m.verified;
      const steps = [
        {
          key: "route",
          name: C.chat.traceStepsNames.route,
          kind: "deterministic",
          status: "done",
          latency: "0.1 s",
          tokens: 0,
          payload: { route: "verified", similarity: 0.94, threshold: 0.88 },
        },
        {
          key: "execution",
          name: C.chat.traceStepsNames.execution,
          kind: "deterministic",
          status: "done",
          latency: "0.5 s",
          tokens: 0,
          payload: { rows: 5, limit: 1000, clamped: false, elapsed_ms: 512 },
        },
        {
          key: "answer",
          name: C.chat.traceStepsNames.answer,
          kind: "llm",
          status: "done",
          latency: "0.2 s",
          tokens: 210,
          payload: { verified_answer_id: "va_2026_11_18_01", sql_rewritten: false },
        },
      ];
      return {
        answer: `<article class="answer-card">
          ${routeRow("verified", verified.latency, verified.model)}
          <div class="stack-8"><h2 class="t-title-lg answer-card__headline">${esc(verified.headline)}</h2><p class="answer-card__body">${esc(verified.body)}</p></div>
          ${renderResultTable(verified.headers, verified.rows, C.chat.resultCaption(5, m.runId))}
          ${renderSqlBlock(verified.sql)}
          ${renderTablesUsed(verified.tables)}
          ${renderAssumptions(verified.assumptions, verified.confidence, verified.confidenceReason)}
          ${renderActions({ save: false, sql: verified.sql })}
          ${renderTraceRow(3, verified.latency)}
        </article>`,
        steps,
      };
    }
    if (chatState === "clarification") {
      const candidate = (title, sql, previewRow) => `<div class="clarify-card">
        <h3 class="clarify-card__title" tabindex="-1"${title === C.chat.candidateOneTitle ? " data-focus-target" : ""}>${esc(title)}</h3>
        ${renderSqlBlock(sql)}
        ${renderResultTable([C.chat.table.orders, C.chat.table.gmv], [[previewRow[1], previewRow[2]]], C.chat.previewCaption, { compact: true })}
        <button class="btn btn--primary" type="button" data-action="choose-candidate">${esc(C.chat.useThis)}</button>
      </div>`;
      return {
        answer: `<article class="answer-card">
          <div class="stack-8"><h2 class="t-title-lg answer-card__headline">${esc(m.question)}</h2><p class="t-caption">${esc(C.chat.clarificationTitle)}。${esc(C.chat.clarificationBody)}</p></div>
          <div class="clarify-grid">${candidate(C.chat.candidateOneTitle, m.candidateOneSql, m.candidatePreview[0])}${candidate(C.chat.candidateTwoTitle, m.candidateTwoSql, m.candidatePreview[1])}</div>
        </article>`,
        steps: base.slice(0, 4),
      };
    }
    if (chatState === "rejected") {
      const steps = [
        base[0],
        base[1],
        { ...base[2], payload: { sql: m.rejectedSql } },
        {
          key: "validation",
          name: C.chat.traceStepsNames.validation,
          kind: "deterministic",
          status: "failed",
          latency: "0.1 s",
          tokens: 0,
          payload: { rules: ["single_statement", "select_only"], passed: false, reason: "WRITE_STATEMENT" },
          reason: "WRITE_STATEMENT",
          error: "Statement root is DROP, not SELECT.",
        },
      ];
      return {
        answer: `<article class="answer-card">
          <div class="banner banner--rejected">
            <div class="banner__title" tabindex="-1" data-focus-target>${esc(C.chat.rejectedTitle)}</div>
            <div class="banner__body">${esc(C.chat.rejectedBody)}</div>
            <div class="banner__code">WRITE_STATEMENT</div>
            <div class="banner__body">${esc(C.chat.noSqlExecuted)}</div>
          </div>
          <div class="stack-8"><span class="t-caption">${esc(C.chat.offendingSql)}</span><div class="row-8">${badge("danger", C.badges.danger)}</div>${renderSqlBlock(m.rejectedSql, { rejected: true })}</div>
          <p class="t-caption">${esc(C.chat.noSqlExecuted)}</p>
        </article>`,
        steps,
      };
    }
    if (chatState === "abstain") {
      const steps = base.slice(0, 4).concat([
        {
          key: "repair",
          name: C.chat.traceStepsNames.repair,
          kind: "llm",
          status: "failed",
          latency: "2.4 s",
          tokens: 640,
          payload: { attempt: 1, error: "term_not_found" },
          reason: "REPAIR_FAILED",
          error: "No trusted definition for the term.",
        },
      ]);
      return {
        answer: `<article class="answer-card">
          <div class="banner banner--abstain">
            <div class="banner__title">${esc(C.chat.abstainTitle)}</div>
            <div class="banner__body">${esc(C.chat.abstainReason)}</div>
            <div class="banner__code">REPAIR_FAILED</div>
          </div>
          <div class="stack-8"><span class="t-caption">${esc(C.chat.closestSql)}</span>${renderSqlBlock(m.abstainSql)}</div>
          <p class="t-caption">${esc(C.chat.notExecuted)}</p>
          <div class="actions-row"><button class="btn btn--tertiary" type="button" data-action="copy-sql" data-sql="${attr(m.abstainSql)}">${esc(C.chat.copySql)}</button></div>
        </article>`,
        steps,
      };
    }

    const banners =
      chatState === "degraded" ? banner("degraded", C.chat.degradedTitle, C.chat.degradedBody, "NEO4J_UNAVAILABLE") : "";
    const staleBanner =
      chatState === "stale" ? banner("stale", C.chat.staleTitle, C.chat.staleBody, "SCHEMA_DRIFT") : "";
    const clampBanner =
      chatState === "clamped" ? banner("stale", C.chat.clampTitle, C.chat.clampBody, C.chat.clampCode) : "";
    const steps = base.slice();
    if (chatState === "chart-pending") {
      steps.push({
        key: "chart",
        name: C.chat.traceStepsNames.chart,
        kind: "llm",
        status: "pending",
        latency: "—",
        tokens: 0,
      });
    }
    if (chatState === "chart-unavailable") {
      steps.push({
        key: "chart",
        name: C.chat.traceStepsNames.chart,
        kind: "llm",
        status: "failed",
        latency: "1.1 s",
        tokens: 180,
        payload: { error: "no_compatible_chart" },
        reason: "CHART_PLAN_FAILED",
        error: "Chart planner returned no compatible encoding.",
      });
    }
    if (chatState === "clamped") {
      steps[4] = {
        ...steps[4],
        payload: { rows: 1000, limit: 1000, clamped: true, elapsed_ms: 612 },
      };
    }
    const tableCaption =
      chatState === "clamped"
        ? `${C.chat.resultCaption(1000, m.runId)} · ${C.badges.warning}`
        : C.chat.resultCaption(5, m.runId);
    const result = `${clampBanner}${renderResultTable(Object.values(C.chat.table), m.tableRows, tableCaption, { clamp: chatState === "clamped" })}`;
    const answer = `<article class="answer-card">
      ${banners}${staleBanner}
      ${routeRow("agent", "4.2 s", "gpt-4.1", chatState === "degraded" ? badge("warning", C.badges.degraded) : "")}
      <div class="stack-8"><h2 class="t-title-lg answer-card__headline">${esc(m.headline)}</h2><p class="answer-card__body">${esc(m.body)}</p></div>
      ${result}
      ${renderChatChart()}
      ${renderSqlBlock(m.sql)}
      ${renderTablesUsed(m.tablesUsed)}
      ${renderAssumptions(C.chat.assumptions, C.chat.confidence, C.chat.confidenceReason)}
      ${renderActions({ save: true, sql: m.sql })}
      ${renderTraceRow(steps.length, "4.2 s")}
    </article>`;
    return { answer, steps };
  }

  function renderChat() {
    const conversation = $("#chat-conversation");
    const traceRail = $("#chat-trace");
    if (!conversation || !traceRail) return;
    const data = chatViewData(state.chatState);
    state.chatSteps = data.steps;
    conversation.innerHTML = data.answer;
    traceRail.innerHTML = renderTrace(data.steps, chatTraceOptions(state.chatState));
    if (state.chatTraceOpen) renderTraceSheet(false);
    updateComposer();
    if (state.chatFocus) {
      state.chatFocus = false;
      const target = conversation.querySelector("[data-focus-target]");
      if (target) target.focus();
    }
  }

  function renderTraceSheet(focus) {
    const root = $("#overlay-root");
    if (!root) return;
    const existing = $("#trace-sheet");
    const html = `<div class="sheet" id="trace-sheet" role="dialog" aria-modal="false" aria-labelledby="trace-sheet-title">
      <div class="drawer__head">
        <h2 class="t-title-sm" id="trace-sheet-title" tabindex="-1">${esc(C.chat.traceTitle)}</h2>
        <button class="btn btn--icon" type="button" data-action="close-trace" aria-label="${esc(C.common.close)}">${icon("close")}</button>
      </div>
      <div style="padding-top:12px">${renderTrace(state.chatSteps, { ...chatTraceOptions(state.chatState), id: "sheet" })}</div>
    </div>`;
    if (existing) {
      existing.outerHTML = html;
    } else {
      root.insertAdjacentHTML("beforeend", html);
    }
    if (focus && !existing) {
      const title = $("#trace-sheet-title");
      if (title) title.focus();
    }
  }

  function openTraceSheet() {
    state.chatTraceOpen = true;
    state.traceTrigger = document.activeElement;
    renderTraceSheet(true);
  }

  function closeTraceSheet() {
    state.chatTraceOpen = false;
    const sheet = $("#trace-sheet");
    if (sheet) sheet.remove();
    if (state.traceTrigger && document.contains(state.traceTrigger)) state.traceTrigger.focus();
    state.traceTrigger = null;
  }

  /* ------------------------------------------------------------------ */
  /* Schema graph                                                        */
  /* ------------------------------------------------------------------ */

  function nodeById(id) {
    return C.mock.graph.nodes.find((node) => node.id === id) || null;
  }

  function filteredNodes() {
    const query = state.graphQuery.trim().toLowerCase();
    return C.mock.graph.nodes.filter((node) => {
      if (query && !node.name.toLowerCase().includes(query) && !node.description.toLowerCase().includes(query)) {
        return false;
      }
      if (state.graphVerifiedOnly && !node.verified) return false;
      if (state.graphHotOnly && !node.hot) return false;
      return true;
    });
  }

  function renderGraph() {
    const nodes = filteredNodes();
    renderGraphFilters(nodes);
    renderGraphToolbar();
    renderGraphView(nodes);
    renderGraphDetail();
    const filters = $("#graph-filters");
    if (filters) filters.classList.toggle("is-open", state.graphFilterOpen);
    const detail = $("#graph-detail");
    if (detail) detail.classList.toggle("is-open", state.graphDetailOpen);
    updateStateSelect();
  }

  function renderGraphFilters(nodes) {
    const rail = $("#graph-filters");
    if (!rail) return;
    rail.innerHTML = `<div class="row-8" style="justify-content:space-between">
        <span class="t-label">${esc(C.graph.filterLabel)}</span>
        <button class="btn btn--icon filter-rail__close" type="button" data-action="close-filters" aria-label="${esc(C.common.close)}">${icon("close")}</button>
      </div>
      <div class="field">
        <label class="sr-only" for="graph-search">${esc(C.graph.filterLabel)}</label>
        <input class="input" id="graph-search" type="search" placeholder="${attr(C.graph.filterPlaceholder)}" value="${attr(state.graphQuery)}">
      </div>
      <label class="row-8 t-caption"><input type="checkbox" id="graph-verified" ${state.graphVerifiedOnly ? "checked" : ""}> ${esc(C.graph.verifiedToggle)}</label>
      <label class="row-8 t-caption"><input type="checkbox" id="graph-hot" ${state.graphHotOnly ? "checked" : ""}> ${esc(C.graph.hotToggle)}</label>
      <hr class="divider">
      <div class="filter-rail__list" id="graph-filter-list"></div>`;
    renderGraphFilterList(nodes);
  }

  function renderGraphFilterList(nodes = filteredNodes()) {
    const list = $("#graph-filter-list");
    if (!list) return;
    if (!nodes.length) {
      list.innerHTML = `<p class="t-caption">${esc(C.graph.noResults)}</p>`;
      return;
    }
    list.innerHTML = nodes
      .map(
        (node) => `<button class="filter-item${node.id === state.graphSelected ? " is-active" : ""}" type="button" data-node="${node.id}">
          <span class="filter-item__name">${esc(node.name)}</span>
          ${node.verified ? badge("verified", C.badges.verified) : badge("neutral", C.badges.unverified)}
        </button>`,
      )
      .join("");
  }

  function renderGraphToolbar() {
    const degraded = state.graphState === "degraded";
    const toolbar = $("#graph-toolbar");
    if (!toolbar) return;
    toolbar.innerHTML = `<div class="row-8">
        <button class="btn btn--sm ${state.graphView === "graph" ? "btn--primary" : "btn--secondary"}" type="button" data-action="graph-view" data-view="graph" aria-pressed="${state.graphView === "graph"}"${degraded ? ' aria-disabled="true"' : ""}>${esc(C.graph.viewGraph)}</button>
        <button class="btn btn--sm ${state.graphView === "table" ? "btn--primary" : "btn--secondary"}" type="button" data-action="graph-view" data-view="table" aria-pressed="${state.graphView === "table"}">${esc(C.graph.viewTable)}</button>
      </div>
      <span class="t-caption">${esc(C.graph.tableCaption)}</span>`;
  }

  function renderGraphView(nodes = filteredNodes()) {
    const view = $("#graph-view");
    if (!view) return;
    if (state.graphState === "empty" || !nodes.length) {
      view.innerHTML = `<div class="card"><h2 class="t-title-md">${esc(C.graph.noResults)}</h2><p class="t-caption">${esc(C.graph.emptyBody)}</p></div>`;
      return;
    }
    if (state.graphState === "degraded") {
      view.innerHTML = `${banner("degraded", C.graph.degradedTitle, C.graph.degradedBody, "NEO4J_UNAVAILABLE")}${renderGraphTable(nodes)}${renderGraphLegend()}`;
      return;
    }
    if (state.graphView === "table") {
      view.innerHTML = `${renderGraphTable(nodes)}${renderGraphLegend()}`;
      return;
    }
    view.innerHTML = `${renderGraphCanvas(nodes)}${renderGraphLegend()}`;
  }

  function renderGraphCanvas(nodes) {
    const ids = new Set(nodes.map((node) => node.id));
    const edges = C.mock.graph.joins.filter((join) => ids.has(join.from) && ids.has(join.to));
    const edgeLines = edges
      .map((join) => {
        const from = nodeById(join.from);
        const to = nodeById(join.to);
        return `<line class="graph-edge" x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}"></line>`;
      })
      .join("");
    const edgeLabels = edges
      .map((join) => {
        const from = nodeById(join.from);
        const to = nodeById(join.to);
        return `<span class="graph-edge-label-html" style="left:${(from.x + to.x) / 2}%; top:${(from.y + to.y) / 2}%">${esc(join.cardinality)}</span>`;
      })
      .join("");
    const nodeButtons = nodes
      .map((node) => {
        const classes = ["graph-node", node.verified ? "graph-node--verified" : "graph-node--unverified"];
        if (node.id === state.graphSelected) classes.push("graph-node--selected");
        const meta = node.verified
          ? esc(C.graph.columnCount(node.columns))
          : `${esc(C.graph.unverified)} · ${esc(C.graph.columnCount(node.columns))}`;
        return `<button class="${classes.join(" ")}" type="button" data-node="${node.id}" style="left:${node.x}%; top:${node.y}%" aria-pressed="${node.id === state.graphSelected}" aria-label="${attr(`${node.name}, ${node.verified ? C.badges.verified : C.badges.unverified}, ${C.graph.columnCount(node.columns)}`)}">
          <span class="graph-node__name">${esc(node.name)}</span>
          <span class="graph-node__meta">${meta}</span>
        </button>`;
      })
      .join("");
    return `<div class="graph-canvas">
      <svg class="graph-edges" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${edgeLines}</svg>
      ${edgeLabels}
      ${nodeButtons}
    </div>`;
  }

  function renderGraphLegend() {
    return `<div class="graph-legend">
      <span class="graph-legend__item"><span class="legend-node legend-node--verified"></span>${esc(C.graph.legend.verified)}</span>
      <span class="graph-legend__item"><span class="legend-node"></span>${esc(C.graph.legend.unverified)}</span>
      <span class="graph-legend__item"><span class="legend-node legend-node--selected"></span>${esc(C.graph.legend.selected)}</span>
      <span class="graph-legend__item"><span class="legend-line"></span>${esc(C.graph.legend.edge)}</span>
    </div>`;
  }

  function renderGraphTable(nodes) {
    const tableRows = nodes
      .map(
        (node) => `<tr><th scope="row" class="mono">${esc(node.name)}</th><td>${node.verified ? "true" : "false"}</td><td>${node.hot ? "true" : "false"}</td><td class="num">${node.columns}</td></tr>`,
      )
      .join("");
    const joinRows = C.mock.graph.joins
      .map(
        (join) => `<tr><th scope="row" class="mono">${esc(join.from)}</th><td class="mono">${esc(join.to)}</td><td>${esc(join.cardinality)}</td><td class="mono">${esc(join.condition)}</td></tr>`,
      )
      .join("");
    return `<div class="graph-table-view">
      <div class="card"><div class="table-wrap"><table class="table table--dense"><caption>${esc(C.graph.tableCaption)}</caption><thead><tr><th scope="col">${esc(C.graph.tableHeaders.table)}</th><th scope="col">${esc(C.graph.tableHeaders.verified)}</th><th scope="col">${esc(C.graph.tableHeaders.hot)}</th><th scope="col" class="num">${esc(C.graph.tableHeaders.columns)}</th></tr></thead><tbody>${tableRows}</tbody></table></div></div>
      <div class="card"><div class="table-wrap"><table class="table table--dense"><caption>${esc(C.graph.joinCaption)}</caption><thead><tr><th scope="col">${esc(C.graph.joinHeaders.from)}</th><th scope="col">${esc(C.graph.joinHeaders.to)}</th><th scope="col">${esc(C.graph.joinHeaders.cardinality)}</th><th scope="col">${esc(C.graph.joinHeaders.condition)}</th></tr></thead><tbody>${joinRows}</tbody></table></div></div>
    </div>`;
  }

  function renderGraphDetail() {
    const panel = $("#graph-detail");
    if (!panel) return;
    const node = nodeById(state.graphSelected);
    if (!node) {
      panel.innerHTML = `<p class="t-caption">${esc(C.graph.noResults)}</p>`;
      return;
    }
    const columns = node.columnsDetail
      .map(
        ([name, type, nullable, key]) => `<tr><th scope="row" class="mono">${esc(name)}${key ? ` <span class="t-caption t-mono">${esc(key)}</span>` : ""}</th><td class="mono">${esc(type)}</td><td>${esc(nullable)}</td></tr>`,
      )
      .join("");
    panel.innerHTML = `<div class="drawer__head">
        <h2 class="t-title-sm" tabindex="-1">${esc(node.name)}</h2>
        <button class="btn btn--icon detail-close" type="button" data-action="close-detail" aria-label="${esc(C.common.close)}">${icon("close")}</button>
      </div>
      <div class="stack-16" style="padding-top:16px">
        <div class="row-8">${node.verified ? badge("verified", C.badges.verified) : badge("neutral", C.badges.unverified)}${node.hot ? badge("neutral", C.graph.hotBadge) : ""}</div>
        <p class="t-body">${esc(node.description)}</p>
        <div class="stack-8"><h3 class="t-label">${esc(C.graph.columns)}</h3><div class="table-wrap"><table class="table table--dense table--compact table--detail"><caption>${esc(node.name)}</caption><colgroup><col style="width:40%"><col style="width:42%"><col style="width:18%"></colgroup><thead><tr><th scope="col">${esc(C.graph.columnHeaders.name)}</th><th scope="col">${esc(C.graph.columnHeaders.type)}</th><th scope="col">${esc(C.graph.columnHeaders.nullable)}</th></tr></thead><tbody>${columns}</tbody></table></div></div>
        <div class="editor__meta"><span>${esc(C.common.owner)} <strong>${esc(node.owner)}</strong></span><span>schema <strong>v${node.schema}</strong></span></div>
        <button class="btn btn--secondary" type="button" data-action="edit-asset" data-asset="table-${attr(node.id)}">${esc(C.graph.edit)}</button>
      </div>`;
  }

  function selectGraphNode(id) {
    state.graphSelected = id;
    state.graphDetailOpen = true;
    state.graphFilterOpen = false;
    renderGraph();
    if (window.innerWidth < 1280) {
      const detail = $("#graph-detail");
      const title = detail ? detail.querySelector("h2") : null;
      if (title) title.focus();
    }
  }

  function setGraphView(view) {
    if (state.graphState === "degraded" && view === "graph") return;
    state.graphView = view;
    state.graphState = view === "table" ? "table" : "graph";
    renderGraph();
  }

  /* ------------------------------------------------------------------ */
  /* Semantic admin                                                      */
  /* ------------------------------------------------------------------ */

  function adminAssets(type = state.adminType) {
    return C.mock.admin.assets[type] || [];
  }

  function getAdminAsset() {
    if (!state.adminSelected) return null;
    return adminAssets().find((asset) => asset.id === state.adminSelected) || null;
  }

  function startAdminDraft(asset) {
    state.adminDraft = asset ? JSON.parse(JSON.stringify(asset)) : null;
    state.adminDirty = false;
    state.adminError = null;
    state.adminSaved = false;
  }

  function renderAdmin() {
    const asset = getAdminAsset();
    if (asset && (!state.adminDraft || state.adminDraft.id !== asset.id)) {
      startAdminDraft(asset);
      state.adminState = "clean";
    }
    if (!asset) state.adminDraft = null;
    renderAdminRail(asset);
    renderAdminEditor(asset);
    const surface = $("#surface-admin");
    if (surface) surface.classList.toggle("is-editor-open", state.adminEditorOpen);
    updateStateSelect();
  }

  function renderAdminRail(asset) {
    const rail = $("#admin-rail");
    if (!rail) return;
    const types = ["tables", "columns", "enums", "terms", "joins"];
    const typeRows = types
      .map((type) => {
        const count = state.adminEmptyType && type === state.adminType ? 0 : adminAssets(type).length;
        return `<button class="asset-type" type="button" data-asset-type="${type}"${type === state.adminType ? ' aria-current="page"' : ""}><span>${esc(C.admin.assetTypes[type])}</span><span class="asset-type__count">${count}</span></button>`;
      })
      .join("");
    const typeSelect = `<label class="field asset-type-select"><span class="t-caption">${esc(C.admin.assetTypeLabel)}</span><select class="select" id="admin-type-select">${types.map((type) => `<option value="${type}"${type === state.adminType ? " selected" : ""}>${esc(C.admin.assetTypes[type])}</option>`).join("")}</select></label>`;
    rail.innerHTML = `<div class="asset-types">${typeRows}</div>
      ${typeSelect}
      <div class="field"><label class="t-caption" for="admin-filter">${esc(C.admin.filterLabel)}</label><input class="input" id="admin-filter" type="search" placeholder="${attr(C.admin.filterPlaceholder)}" value="${attr(state.adminQuery)}"></div>
      <hr class="divider">
      <div class="asset-list" id="admin-asset-list"></div>`;
    renderAdminAssetList(asset);
  }

  function renderAdminAssetList(asset = getAdminAsset()) {
    const list = $("#admin-asset-list");
    if (!list) return;
    if (state.adminEmptyType) {
      list.innerHTML = `<div class="stack-8"><p class="t-body t-ink">${esc(C.admin.emptyType)}</p><p class="t-caption">${esc(C.admin.emptyTypeBody)}</p></div>`;
      return;
    }
    const query = state.adminQuery.trim().toLowerCase();
    const assets = adminAssets().filter(
      (item) =>
        !query ||
        item.name.toLowerCase().includes(query) ||
        (item.description || "").toLowerCase().includes(query),
    );
    if (!assets.length) {
      list.innerHTML = `<div class="stack-8"><p class="t-body t-ink">${esc(C.admin.noAssets)}</p><p class="t-caption">${esc(C.admin.noAssetsBody)}</p></div>`;
      return;
    }
    list.innerHTML = assets
      .map((item) => {
        const stale = item.schema < C.mock.admin.currentSchema;
        const mono = state.adminType === "tables" || state.adminType === "columns";
        const parent =
          state.adminType === "columns" && item.parent
            ? `<span>${esc(C.admin.parentTable)} ${esc(item.parent)}</span>`
            : "";
        return `<button class="asset-item${item.id === state.adminSelected ? " is-active" : ""}" type="button" data-asset="${item.id}">
          <span class="asset-item__name${mono ? " asset-item__name--mono" : ""}">${esc(item.name)}</span>
          <span class="asset-item__meta">${parent}${item.verified ? badge("verified", C.badges.verified) : badge("neutral", C.badges.unverified)}${stale ? badge("warning", C.badges.stale) : ""}</span>
        </button>`;
      })
      .join("");
  }

  function renderAdminFields(asset) {
    const draft = state.adminDraft;
    const error = state.adminError;
    if (state.adminType === "joins") {
      return `<div class="row-16">
          <div class="field" style="flex:1"><span class="field__label">${esc(C.graph.joinHeaders.from)}</span><p class="t-mono">${esc(draft.from)}</p></div>
          <div class="field" style="flex:1"><span class="field__label">${esc(C.graph.joinHeaders.to)}</span><p class="t-mono">${esc(draft.to)}</p></div>
        </div>
        <div class="field">
          <label class="field__label" for="join-condition">${esc(C.admin.joinCondition)} <span class="t-caption">${esc(C.admin.required)}</span></label>
          <textarea class="textarea textarea--mono${error ? " textarea--error" : ""}" id="join-condition" rows="6"${error ? ' aria-invalid="true" aria-describedby="join-condition-error"' : ""}>${esc(draft.condition)}</textarea>
          ${error ? `<p class="field__error" id="join-condition-error">${icon("alert", "icon icon--sm")} ${esc(C.admin.joinConditionEmpty)} <code>${esc(C.admin.codeJoin)}</code></p>` : ""}
        </div>
        <div class="field">
          <label class="field__label" for="cardinality">${esc(C.admin.cardinality)}</label>
          <select class="select" id="cardinality">${["1:1", "1:N", "N:1", "N:M"].map((value) => `<option value="${value}"${draft.cardinality === value ? " selected" : ""}>${value}</option>`).join("")}</select>
        </div>
        <div class="field">
          <label class="field__label" for="join-note">${esc(C.admin.note)}</label>
          <textarea class="textarea" id="join-note" rows="3">${esc(draft.note)}</textarea>
        </div>`;
    }
    if (state.adminType === "tables") {
      return `<div class="field"><label class="field__label" for="admin-description">${esc(C.admin.description)}</label><textarea class="textarea" id="admin-description" rows="6" style="max-width:72ch">${esc(draft.description)}</textarea></div>
        <div class="stack-8"><h3 class="t-label">${esc(C.admin.columnsInTable)}</h3><div class="table-wrap"><table class="table table--dense"><caption>${esc(asset.name)}</caption><thead><tr><th scope="col">${esc(C.graph.columnHeaders.name)}</th></tr></thead><tbody>${draft.columns.map((column) => `<tr><th scope="row" class="mono">${esc(column)}</th></tr>`).join("")}</tbody></table></div></div>`;
    }
    if (state.adminType === "columns") {
      return `<p class="t-caption">${esc(C.admin.parentTable)} <span class="t-mono">${esc(asset.parent)}</span></p>
        <div class="field"><label class="field__label" for="admin-description">${esc(C.admin.description)}</label><textarea class="textarea" id="admin-description" rows="6" style="max-width:72ch">${esc(draft.description)}</textarea></div>
        <div class="editor__meta"><span>${esc(C.admin.dataType)} <strong class="t-mono">${esc(asset.dataType)}</strong></span><span>${esc(C.admin.nullable)} <strong>${asset.nullable ? "true" : "false"}</strong></span></div>`;
    }
    if (state.adminType === "enums") {
      const rows = draft.values
        .map(
          (pair, index) => `<tr><th scope="row"><input class="input" data-enum-index="${index}" data-enum-field="value" value="${attr(pair[0])}" aria-label="${attr(`${C.admin.value} ${index + 1}`)}"></th><td><input class="input" data-enum-index="${index}" data-enum-field="label" value="${attr(pair[1])}" aria-label="${attr(`${C.admin.label} ${index + 1}`)}"></td></tr>`,
        )
        .join("");
      return `<div class="field"><span class="field__label">${esc(C.admin.enumValues)}</span><div class="table-wrap"><table class="table"><thead><tr><th scope="col">${esc(C.admin.value)}</th><th scope="col">${esc(C.admin.label)}</th></tr></thead><tbody>${rows}</tbody></table></div></div>
        <div class="field"><label class="field__label" for="admin-description">${esc(C.admin.description)}</label><textarea class="textarea" id="admin-description" rows="6" style="max-width:72ch">${esc(draft.description)}</textarea></div>`;
    }
    if (state.adminType === "terms") {
      return `<div class="field"><label class="field__label" for="admin-definition">${esc(C.admin.definition)}</label><textarea class="textarea" id="admin-definition" rows="6" style="max-width:72ch">${esc(draft.description)}</textarea></div>
        <div class="field"><label class="field__label" for="admin-synonyms">${esc(C.admin.synonyms)}</label><input class="input" id="admin-synonyms" value="${attr(draft.synonyms)}"><p class="field__hint">${esc(C.admin.synonymsHelp)}</p></div>`;
    }
    return "";
  }

  function renderAdminEditor(asset) {
    const editor = $("#admin-editor");
    if (!editor) return;
    if (!asset) {
      editor.innerHTML = `<div class="empty-editor"><h2 class="t-title-md">${esc(C.admin.emptyTitle)}</h2><p class="t-caption">${esc(C.admin.emptyBody)}</p></div>`;
      return;
    }
    const draft = state.adminDraft;
    const current = C.mock.admin.currentSchema;
    const stale = asset.schema < current;
    const degraded = state.adminState === "degraded" || state.adminState === "projection";
    const error = state.adminError;
    editor.innerHTML = `
      ${degraded ? banner("degraded", C.admin.degradedTitle, C.admin.degradedBody, "NEO4J_UNAVAILABLE") : ""}
      <div class="editor__header">
        <button class="btn btn--tertiary mobile-back" type="button" data-action="admin-back">‹ ${esc(C.admin.back)}</button>
        <h2 class="t-title-sm">${esc(asset.name)}</h2>
        <div class="switch-row">
          <input class="switch" type="checkbox" id="verified-switch"${draft.verified ? " checked" : ""} aria-describedby="verified-help">
          <div><label class="t-label" for="verified-switch">${esc(C.admin.verified)}</label><p class="t-caption" id="verified-help">${esc(C.admin.verifiedHelp)}</p></div>
        </div>
        <div class="editor__meta">
          <span>schema <strong>v${asset.schema}</strong> ${stale ? badge("warning", C.admin.stale) : ""}</span>
          <span>${esc(C.common.owner)} <strong>${esc(asset.owner)}</strong></span>
          <span>${esc(C.common.updatedAt)} <strong class="t-mono">${esc(asset.updatedAt)}</strong></span>
        </div>
        ${stale ? `<p class="t-caption">${esc(C.admin.staleBody(asset.schema, current))}</p>` : ""}
      </div>
      <div class="editor__body">
        ${error ? `<div class="error-summary" id="error-summary" role="alert"><div class="error-summary__title">${esc(C.admin.errorSummary)}</div><ul><li><a href="#join-condition" data-action="focus-field" data-field="join-condition">${esc(C.admin.joinConditionEmpty)} <code>${esc(C.admin.codeJoin)}</code></a></li></ul></div>` : ""}
        ${renderAdminFields(asset)}
        <div class="audit-strip">
          <h3 class="t-label">${esc(C.admin.auditTitle)}</h3>
          <div class="table-wrap"><table class="table table--dense table--compact table--audit"><caption>${esc(C.admin.auditCaption(C.mock.admin.audit.length))}</caption><colgroup><col style="width:34%"><col style="width:10%"><col style="width:22%"><col style="width:34%"></colgroup><thead><tr><th scope="col">${esc(C.admin.auditHeaders.timestamp)}</th><th scope="col">${esc(C.admin.auditHeaders.owner)}</th><th scope="col">${esc(C.admin.auditHeaders.field)}</th><th scope="col">${esc(C.admin.auditHeaders.change)}</th></tr></thead><tbody>${C.mock.admin.audit.slice(0, 5).map((row) => `<tr><th scope="row" class="mono">${esc(row[0])}</th><td>${esc(row[1])}</td><td class="mono">${esc(row[2])}</td><td>${esc(row[3])}</td></tr>`).join("")}</tbody></table></div>
        </div>
      </div>
      <div class="save-bar" id="save-bar"></div>`;
    updateAdminSaveBar();
  }

  function updateAdminSaveBar() {
    const bar = $("#save-bar");
    if (!bar) return;
    const asset = getAdminAsset();
    if (!asset) {
      bar.innerHTML = "";
      return;
    }
    const adminState = state.adminState;
    const code = state.adminError ? state.adminError.code : "";
    let status = "";
    let saveDisabled = false;
    let showDiscard = false;
    if (adminState === "saving") {
      status = `<span>${esc(C.admin.saving)}</span>`;
      saveDisabled = true;
      showDiscard = true;
    } else if (adminState === "error") {
      status = `<span><strong>${esc(C.admin.notSaved)}</strong> <code>${esc(code)}</code></span>`;
      showDiscard = true;
    } else if (adminState === "saved" || adminState === "projection") {
      status = `<span>${esc(C.admin.savedMessage("lin", asset.updatedAt, asset.schema))}</span>${badge("positive", C.admin.savedBadge)}${adminState === "projection" ? `<span>${esc(C.admin.projectionPending)}</span>` : ""}`;
      saveDisabled = true;
    } else if (state.adminDirty) {
      status = `<strong>${esc(C.admin.dirty)}</strong>`;
      showDiscard = true;
    } else {
      status = `<span>${esc(C.admin.clean)}</span>`;
      saveDisabled = true;
    }
    bar.innerHTML = `<div class="save-bar__status" aria-live="polite">${status}</div><div class="save-bar__actions">${showDiscard ? `<button class="btn btn--secondary" type="button" data-action="admin-discard">${esc(C.admin.discard)}</button>` : ""}<button class="btn btn--primary" type="button" data-action="admin-save" aria-disabled="${saveDisabled}">${esc(C.admin.save)}</button></div>`;
  }

  function markAdminDirty() {
    const wasDirty = state.adminDirty;
    state.adminDirty = true;
    if (state.adminState !== "degraded") state.adminState = "dirty";
    state.adminError = null;
    const editor = $("#admin-editor");
    if (editor) {
      $$(".field__error", editor).forEach((element) => element.remove());
      $$(".textarea--error, .input--error", editor).forEach((element) => {
        element.classList.remove("textarea--error", "input--error");
        element.removeAttribute("aria-invalid");
        element.removeAttribute("aria-describedby");
      });
      const summary = $("#error-summary");
      if (summary) summary.remove();
    }
    updateAdminSaveBar();
    if (!wasDirty) updateStateSelect();
  }

  function onAdminInput(event) {
    const element = event.target;
    if (!state.adminDraft) return;
    let changed = false;
    if (element.id === "verified-switch") {
      state.adminDraft.verified = element.checked;
      changed = true;
    } else if (element.id === "join-condition") {
      state.adminDraft.condition = element.value;
      changed = true;
    } else if (element.id === "join-note") {
      state.adminDraft.note = element.value;
      changed = true;
    } else if (element.id === "cardinality") {
      state.adminDraft.cardinality = element.value;
      changed = true;
    } else if (element.id === "admin-description" || element.id === "admin-definition") {
      state.adminDraft.description = element.value;
      changed = true;
    } else if (element.id === "admin-synonyms") {
      state.adminDraft.synonyms = element.value;
      changed = true;
    } else if (element.dataset.enumIndex !== undefined) {
      const index = Number(element.dataset.enumIndex);
      if (state.adminDraft.values && state.adminDraft.values[index]) {
        state.adminDraft.values[index][element.dataset.enumField === "label" ? 1 : 0] = element.value;
        changed = true;
      }
    }
    if (changed) markAdminDirty();
  }

  function requestAdminNavigation(action) {
    if (state.adminDirty) {
      openUnsavedModal(action);
    } else {
      action();
    }
  }

  function selectAdminAsset(id) {
    const asset = adminAssets().find((item) => item.id === id);
    if (!asset) return;
    requestAdminNavigation(() => {
      state.adminSelected = id;
      state.adminEditorOpen = true;
      state.adminEmptyType = false;
      startAdminDraft(asset);
      state.adminState = "clean";
      renderAdmin();
    });
  }

  function selectAdminType(type) {
    requestAdminNavigation(() => {
      state.adminType = type;
      state.adminEmptyType = false;
      state.adminQuery = "";
      const first = adminAssets(type)[0];
      state.adminSelected = first ? first.id : null;
      state.adminEditorOpen = false;
      startAdminDraft(first || null);
      state.adminState = "clean";
      renderAdmin();
    });
  }

  function saveAdmin() {
    if (state.adminState === "saving" || state.adminState === "saved" || state.adminState === "projection") return;
    const asset = getAdminAsset();
    if (!asset || !state.adminDraft) return;
    if (state.adminType === "joins" && !state.adminDraft.condition.trim()) {
      state.adminError = { code: C.admin.codeJoin, field: "join-condition", message: C.admin.joinConditionEmpty };
      state.adminState = "error";
      renderAdminEditor(asset);
      updateStateSelect();
      const field = $("#join-condition");
      if (field) field.focus();
      announce(C.admin.notSaved, true);
      return;
    }
    const projection = state.adminState === "degraded" || state.adminState === "projection";
    state.adminState = "saving";
    updateAdminSaveBar();
    updateStateSelect();
    window.setTimeout(() => {
      Object.assign(asset, state.adminDraft, {
        owner: "lin",
        updatedAt: "2026-11-23T10:42:18+08:00",
        schema: C.mock.admin.currentSchema,
      });
      C.mock.admin.audit.unshift([
        asset.updatedAt,
        "lin",
        state.adminType === "joins" ? "join_condition" : "description",
        C.admin.auditChange,
      ]);
      state.adminDirty = false;
      state.adminSaved = true;
      state.adminState = projection ? "projection" : "saved";
      renderAdmin();
      announce(C.admin.savedBadge);
    }, 450);
  }

  function discardAdmin() {
    const asset = getAdminAsset();
    if (!asset) return;
    startAdminDraft(asset);
    state.adminState = "clean";
    renderAdmin();
    announce(C.admin.clean);
  }

  function applyAdminState(value) {
    state.adminEmptyType = false;
    state.adminError = null;
    state.adminDirty = false;
    state.adminSaved = false;
    if (value === "empty") {
      state.adminSelected = null;
      state.adminEditorOpen = false;
      startAdminDraft(null);
      state.adminState = "clean";
    } else if (value === "empty-type") {
      state.adminType = "enums";
      state.adminSelected = null;
      state.adminEmptyType = true;
      state.adminEditorOpen = false;
      startAdminDraft(null);
      state.adminState = "clean";
    } else if (value === "stale") {
      state.adminType = "tables";
      state.adminSelected = "table-products";
      state.adminEditorOpen = true;
      startAdminDraft(getAdminAsset());
      state.adminState = "stale";
    } else if (value === "error") {
      state.adminType = "joins";
      state.adminSelected = "join-orders-customers";
      state.adminEditorOpen = true;
      startAdminDraft(getAdminAsset());
      state.adminDraft.condition = "";
      state.adminError = { code: C.admin.codeJoin, field: "join-condition", message: C.admin.joinConditionEmpty };
      state.adminState = "error";
    } else if (value === "clean") {
      if (!state.adminSelected) {
        state.adminType = "joins";
        state.adminSelected = "join-orders-customers";
      }
      startAdminDraft(getAdminAsset());
      state.adminState = "clean";
    } else {
      if (!state.adminSelected) {
        state.adminType = "joins";
        state.adminSelected = "join-orders-customers";
      }
      if (!state.adminDraft || state.adminDraft.id !== state.adminSelected) {
        startAdminDraft(getAdminAsset());
      }
      state.adminState = value;
      state.adminDirty = value === "dirty";
      if (value === "saved" || value === "projection") {
        const asset = getAdminAsset();
        if (asset) {
          asset.updatedAt = "2026-11-23T10:42:18+08:00";
          asset.owner = "lin";
          asset.schema = C.mock.admin.currentSchema;
        }
        if (state.adminDraft) {
          state.adminDraft.updatedAt = "2026-11-23T10:42:18+08:00";
          state.adminDraft.owner = "lin";
          state.adminDraft.schema = C.mock.admin.currentSchema;
        }
        state.adminSaved = true;
      }
    }
    renderAdmin();
  }

  function editAssetFromGraph(assetId) {
    const asset = adminAssets("tables").find((item) => item.id === assetId) || null;
    state.adminType = "tables";
    state.adminSelected = asset ? asset.id : null;
    state.adminEmptyType = false;
    state.adminEditorOpen = true;
    startAdminDraft(asset);
    state.adminState = "clean";
    setSurface("admin");
  }

  function openUnsavedModal(action) {
    state.modalOpen = true;
    state.modalPending = action;
    state.modalTrigger = document.activeElement;
    const root = $("#overlay-root");
    if (!root) return;
    root.insertAdjacentHTML(
      "beforeend",
      `<div class="modal-scrim" id="unsaved-modal"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><h2 class="t-title-sm" id="modal-title">${esc(C.admin.modalTitle)}</h2><p class="t-body">${esc(C.admin.modalBody)}</p><div class="row-8" style="justify-content:flex-end; margin-top:24px"><button class="btn btn--primary" type="button" id="modal-keep">${esc(C.admin.keepEditing)}</button><button class="btn btn--secondary" type="button" data-action="modal-discard">${esc(C.admin.discardChanges)}</button></div></div></div>`,
    );
    const modal = $("#unsaved-modal");
    if (modal) modal.addEventListener("keydown", trapFocus);
    const keep = $("#modal-keep");
    if (keep) {
      keep.addEventListener("click", () => closeModal());
      keep.focus();
    }
  }

  function trapFocus(event) {
    if (event.key !== "Tab") return;
    const modal = event.currentTarget;
    const focusable = $$(
      "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
      modal,
    ).filter((element) => !element.disabled && element.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function closeModal(options = {}) {
    const modal = $("#unsaved-modal");
    if (modal) modal.remove();
    state.modalOpen = false;
    state.modalPending = null;
    if (options.restoreFocus !== false && state.modalTrigger && document.contains(state.modalTrigger)) {
      state.modalTrigger.focus();
    }
    state.modalTrigger = null;
  }

  function discardModal() {
    const action = state.modalPending;
    closeModal({ restoreFocus: false });
    if (action) action();
  }

  /* ------------------------------------------------------------------ */
  /* Evaluation dashboard                                                */
  /* ------------------------------------------------------------------ */

  function evalRunData() {
    if (state.evalState === "blocked") return C.mock.eval.runs.blocked;
    if (state.evalState === "stale") return { ...C.mock.eval.runs.pass, schemaVersion: 11 };
    return C.mock.eval.runs.pass;
  }

  function renderEval() {
    const content = $("#eval-content");
    if (!content) return;
    if (state.evalState === "empty") {
      content.innerHTML = `${renderEvalHeader(null, false, false)}<div class="card"><h2 class="t-title-lg">${esc(C.eval.emptyTitle)}</h2><p class="t-body">${esc(C.eval.emptyBody)}</p><div style="margin-top:16px"><button class="btn btn--primary" type="button" data-action="run-eval">${esc(C.eval.runEval)}</button></div></div>`;
      updateStateSelect();
      return;
    }
    if (state.evalState === "loading") {
      content.innerHTML = `${renderEvalHeader(null, false, true)}<p class="t-caption">${esc(C.eval.loading)}</p>`;
      updateStateSelect();
      return;
    }
    const run = evalRunData();
    const running = state.evalState === "running";
    let html = renderEvalHeader(run, running, true);
    if (state.evalState === "blocked") html += releaseBlockedBanner(run);
    if (state.evalState === "degraded") {
      html += banner("degraded", C.eval.degradedTitle, C.eval.degradedBody, "NEO4J_UNAVAILABLE");
    }
    if (state.evalState === "stale") {
      html += banner(
        "stale",
        C.eval.staleTitle,
        C.eval.staleBody(run.schemaVersion, C.mock.admin.currentSchema),
        "SCHEMA_DRIFT",
      );
    }
    html += `<section class="band">${renderKpiBand(run, running)}<p class="t-caption" style="margin:0">${esc(C.eval.runIdentity(run.id, run.timestamp, run.schemaVersion))}</p></section>`;
    if (running) {
      html += renderCases(run, true);
    } else {
      html += renderSecondaryStrip(run);
      html += renderTaxonomy(run);
      html += renderTrend();
      html += renderAblation();
      html += renderCases(run, false);
    }
    content.innerHTML = html;
    updateStateSelect();
  }

  function renderEvalHeader(run, running, selectorEnabled) {
    const selector = `<label class="eval-header__selector"><span class="t-caption">${esc(C.eval.runLabel)}</span><select class="select" id="run-select"${selectorEnabled ? "" : " disabled"}><option value="pass"${state.evalRun === "pass" ? " selected" : ""}>run_2026_11_22_a · 2026-11-22 18:40</option><option value="blocked"${state.evalRun === "blocked" ? " selected" : ""}>run_2026_11_21_b · 2026-11-21 19:05</option></select></label>`;
    if (!run) {
      return `<header class="eval-header"><div class="eval-header__row">${selector}<button class="btn btn--secondary" type="button" data-action="copy-report">${esc(C.eval.copyReport)}</button></div></header>`;
    }
    return `<header class="eval-header">
      <div class="eval-header__row">${selector}<button class="btn btn--secondary" type="button" data-action="copy-report">${esc(C.eval.copyReport)}</button></div>
      <div class="eval-meta">
        <span>${esc(C.eval.metadata.model)} <strong>${esc(run.model)}</strong></span>
        <span>${esc(C.eval.metadata.temperature)} <strong>${esc(run.temperature)}</strong></span>
        <span>${esc(C.eval.metadata.prompt)} <strong>${esc(run.promptVersion)}</strong></span>
        <span>${esc(C.eval.metadata.graph)} <strong>${esc(run.graphVersion)}</strong></span>
        <span>${esc(C.eval.metadata.schema)} <strong>v${run.schemaVersion}</strong></span>
        <span>${esc(C.eval.metadata.timestamp)} <strong class="t-mono">${esc(run.timestamp)}</strong></span>
        <span>${esc(C.eval.metadata.duration)} <strong>${running ? "—" : esc(run.duration)}</strong></span>
        ${running ? `<span><strong>${esc(C.eval.running)}</strong> ${esc(C.eval.elapsed("00:42"))}</span>` : ""}
      </div>
    </header>`;
  }

  function renderKpiBand(run, running) {
    const cards = [
      {
        label: C.eval.kpi.overall,
        value: `${run.overall.value}%`,
        gate: C.eval.gate(90),
        status: run.overall.value >= 90 ? "pass" : "fail",
      },
      { label: C.eval.kpi.verified, value: `${run.verified.value}%`, gate: "", status: "reported" },
      { label: C.eval.kpi.generation, value: `${run.generation.value}%`, gate: "", status: "reported" },
      {
        label: C.eval.kpi.heldOut,
        value: `${run.heldOut.value}%`,
        gate: C.eval.gate(80),
        status: run.heldOut.value >= 80 ? "pass" : "fail",
      },
      {
        label: C.eval.kpi.safetyFn,
        value: String(run.safetyFn.value),
        gate: C.eval.gateZero,
        status: run.safetyFn.value === 0 ? "pass" : "fail",
      },
      {
        label: C.eval.kpi.p95,
        value: `${run.p95.value.toFixed(1)} s`,
        gate: C.eval.gateP95,
        status: run.p95.value < 10 ? "pass" : "fail",
      },
    ];
    return `<dl class="kpi-band">${cards
      .map((card) => {
        if (running) {
          return `<div class="kpi-card"><dt class="kpi-card__label">${esc(card.label)}</dt><dd class="kpi-card__value">—</dd><p class="kpi-card__gate">${esc(C.eval.pendingRun)}</p></div>`;
        }
        const fail = card.status === "fail";
        const statusText = card.status === "pass" ? C.eval.pass : fail ? C.eval.fail : C.eval.reported;
        const kind = card.status === "pass" ? "positive" : fail ? "danger" : "neutral";
        return `<div class="kpi-card${fail ? " kpi-card--fail" : ""}"><dt class="kpi-card__label">${esc(card.label)}</dt><dd class="kpi-card__value">${esc(card.value)}</dd>${card.gate ? `<p class="kpi-card__gate">${esc(card.gate)}</p>` : ""}${badge(kind, statusText)}</div>`;
      })
      .join("")}</dl>`;
  }

  function renderSecondaryStrip(run) {
    const items = [
      [C.eval.clarify, run.clarify],
      [C.eval.abstain, run.abstain],
      [C.eval.tokens, run.tokens],
      [C.eval.cost, run.cost],
      [C.eval.failures, String(run.failures)],
    ];
    return `<div class="secondary-strip">${items
      .map(
        ([label, value]) => `<div><span class="secondary-strip__label">${esc(label)}</span><span class="secondary-strip__value">${esc(value)}</span></div>`,
      )
      .join("")}</div>`;
  }

  function renderTaxonomy(run) {
    if (!run.failureRows.length) {
      return `<section class="band"><h2 class="band__title">${esc(C.eval.taxonomyTitle)}</h2><div class="card"><div class="row-8">${badge("positive", C.badges.noFailures)}</div><p class="t-body">${esc(C.eval.noFailuresBody)}</p></div></section>`;
    }
    const rows = run.failureRows
      .map(
        ([code, count, definition]) => `<tr><th scope="row" class="mono">${esc(code)}</th><td class="num">${count}</td><td>${esc(definition)}</td></tr>`,
      )
      .join("");
    return `<section class="band"><h2 class="band__title">${esc(C.eval.taxonomyTitle)}</h2><div class="table-wrap"><table class="table table--dense"><caption>${esc(C.eval.runIdentity(run.id, run.timestamp, run.schemaVersion))}</caption><thead><tr><th scope="col">${esc(C.eval.taxonomyHeaders.code)}</th><th scope="col" class="num">${esc(C.eval.taxonomyHeaders.count)}</th><th scope="col">${esc(C.eval.taxonomyHeaders.definition)}</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
  }

  function lineChartFigure() {
    const points = C.mock.eval.trend;
    const width = 1000;
    const height = 240;
    const margin = { top: 16, right: 64, bottom: 32, left: 48 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const minY = 60;
    const maxY = 100;
    const x = (index) => margin.left + (index / (points.length - 1)) * innerWidth;
    const y = (value) => margin.top + innerHeight - ((value - minY) / (maxY - minY)) * innerHeight;
    const line = (key) =>
      points.map((point, index) => `${index === 0 ? "M" : "L"}${x(index)},${y(point[key])}`).join(" ");
    const ticks = [60, 70, 80, 90, 100]
      .map(
        (tick) => `<line x1="${margin.left}" x2="${width - margin.right}" y1="${y(tick)}" y2="${y(tick)}" stroke="var(--color-hairline)" stroke-width="1"></line><text x="${margin.left - 8}" y="${y(tick) + 4}" text-anchor="end">${tick}%</text>`,
      )
      .join("");
    const gates = [90, 80]
      .map(
        (gate) => `<line x1="${margin.left}" x2="${width - margin.right}" y1="${y(gate)}" y2="${y(gate)}" stroke="var(--color-muted)" stroke-width="1" stroke-dasharray="4 4"></line>`,
      )
      .join("");
    const overallPoints = points
      .map(
        (point, index) => `<circle cx="${x(index)}" cy="${y(point.overall)}" r="3.5" fill="var(--color-link)"></circle>`,
      )
      .join("");
    const heldOutPoints = points
      .map(
        (point, index) => `<circle cx="${x(index)}" cy="${y(point.heldOut)}" r="3.5" fill="var(--color-link-active)"></circle>`,
      )
      .join("");
    const lastIndex = points.length - 1;
    const lastAcceptedIndex = points.reduce((last, point, index) => (point.accepted ? index : last), -1);
    const labels = `<text class="chart-value" x="${x(lastIndex) + 8}" y="${y(points[lastIndex].overall) - 6}">${points[lastIndex].overall}%</text><text class="chart-value" x="${x(lastIndex) + 8}" y="${y(points[lastIndex].heldOut) + 14}">${points[lastIndex].heldOut}%</text>`;
    const acceptedMarker =
      lastAcceptedIndex >= 0
        ? `<circle cx="${x(lastAcceptedIndex)}" cy="${y(points[lastAcceptedIndex].overall)}" r="7" fill="none" stroke="var(--color-ink)" stroke-width="2"></circle>`
        : "";
    const xLabels = points
      .map((point, index) => `<text x="${x(index)}" y="${height - 10}" text-anchor="middle">${esc(point.run)}</text>`)
      .join("");
    const svg = `<svg class="chart__svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${attr(C.eval.trendTitle)}"><title>${esc(C.eval.trendTitle)}</title>${ticks}${gates}<path d="${line("overall")}" fill="none" stroke="var(--color-link)" stroke-width="2"></path><path d="${line("heldOut")}" fill="none" stroke="var(--color-link-active)" stroke-width="2"></path>${overallPoints}${heldOutPoints}${acceptedMarker}${labels}${xLabels}</svg>`;
    const dataTable = state.evalTrendData
      ? `<div class="table-wrap"><table class="table table--dense"><thead><tr><th scope="col">${esc(C.eval.trendHeaders.run)}</th><th scope="col" class="num">${esc(C.eval.trendHeaders.overall)}</th><th scope="col" class="num">${esc(C.eval.trendHeaders.heldOut)}</th><th scope="col">${esc(C.eval.trendHeaders.accepted)}</th></tr></thead><tbody>${points
          .map(
            (point) => `<tr><th scope="row" class="mono">${esc(point.run)}</th><td class="num">${point.overall}%</td><td class="num">${point.heldOut}%</td><td>${point.accepted ? esc(C.badges.pass) : esc(C.badges.fail)}</td></tr>`,
          )
          .join("")}</tbody></table></div>`
      : "";
    const lastAccepted = points[lastAcceptedIndex] ? points[lastAcceptedIndex].run : "—";
    return `<figure class="chart">
      <div class="chart__head">
        <div><p class="chart__subtitle">${esc(C.eval.trendSubtitle(points.length, points.length))} · ${esc(C.eval.lastAccepted)} ${esc(lastAccepted)} · ${esc(C.eval.trendGates)}</p></div>
        <button class="btn btn--tertiary" type="button" data-action="toggle-trend-data">${esc(state.evalTrendData ? C.common.hideData : C.common.viewData)}</button>
      </div>
      ${svg}
      <ul class="chart__legend"><li><span class="chart__swatch" style="background:var(--color-link)"></span>${esc(C.eval.overall)}</li><li><span class="chart__swatch" style="background:var(--color-link-active)"></span>${esc(C.eval.heldOut)}</li></ul>
      ${dataTable}
    </figure>`;
  }

  function renderTrend() {
    return `<section class="band"><h2 class="band__title">${esc(C.eval.trendTitle)}</h2>${lineChartFigure()}</section>`;
  }

  function renderAblation() {
    const ablation = C.mock.eval.ablation;
    const rows = [
      [C.eval.accuracy, ablation.accuracy[0], ablation.accuracy[1]],
      [C.eval.tokens, ablation.tokens[0], ablation.tokens[1]],
      [C.eval.latency, ablation.latency[0], ablation.latency[1]],
    ];
    return `<section class="band"><h2 class="band__title">${esc(C.eval.ablationTitle)}</h2><div class="table-wrap"><table class="table table--dense"><thead><tr><th scope="col">${esc(C.eval.ablationHeaders.metric)}</th><th scope="col">${esc(C.eval.ablationHeaders.full)}</th><th scope="col">${esc(C.eval.ablationHeaders.pruned)}</th></tr></thead><tbody>${rows
      .map(
        ([metric, full, pruned]) => `<tr><th scope="row">${esc(metric)}</th><td class="num">${esc(full)}</td><td class="num">${esc(pruned)}</td></tr>`,
      )
      .join("")}</tbody></table></div><p class="t-body">${esc(C.eval.ablationInterpretation)}</p></section>`;
  }

  function splitBadge(split) {
    if (split === "verified") {
      return `<span class="badge badge--outline-success">${esc(C.badges.verifiedSplit)}</span>`;
    }
    if (split === "heldOut") {
      return `<span class="badge badge--outline-ink">${esc(C.badges.heldOutSplit)}</span>`;
    }
    return `<span class="badge badge--outline-strong">${esc(C.badges.fewShotSplit)}</span>`;
  }

  function outcomeHtml(outcome) {
    if (outcome === "fail") return `<span>${esc(C.badges.fail)}</span> ${badge("danger", C.badges.failed)}`;
    if (outcome === "abstain") return `<span>${esc(C.badges.abstain)}</span> ${badge("neutral", C.badges.abstain)}`;
    return `<span>${esc(C.eval.passed)}</span>`;
  }

  function routeBadge(route) {
    if (route === "fastPath") return badge("fast", C.badges.fastPath);
    if (route === "verified") return badge("verified", C.badges.verified);
    return badge("agent", C.badges.agent);
  }

  function renderCases(run, running) {
    const rows = running ? run.cases.slice(0, 4) : run.cases;
    const caption = running
      ? C.eval.casesComplete(4, 30)
      : C.eval.casesCaption(rows.length, 30, run.id, run.schemaVersion);
    const body = rows
      .map((row, index) => {
        const [id, split, question, outcome, route, failure, latency, tokens] = row;
        return `<tr data-case-row="${index}"><th scope="row"><button class="btn btn--tertiary" type="button" data-case="${index}" aria-label="${attr(`${id}: ${question}`)}">${esc(id)}</button></th><td>${splitBadge(split)}</td><td class="wrap" title="${attr(question)}">${esc(question)}</td><td>${outcomeHtml(outcome)}</td><td>${routeBadge(route)}</td><td class="mono">${failure ? esc(failure) : '<span class="null">—</span>'}</td><td class="num">${esc(latency)}</td><td class="num">${esc(tokens)}</td></tr>`;
      })
      .join("");
    return `<section class="band"><h2 class="band__title">${esc(C.eval.casesTitle)}</h2><div class="table-wrap" role="region" aria-label="${attr(caption)}" tabindex="0"><table class="table table--dense table--fixed"><caption>${esc(caption)}</caption><colgroup><col style="width:8.33%"><col style="width:8.33%"><col style="width:33.33%"><col style="width:8.33%"><col style="width:8.33%"><col style="width:16.67%"><col style="width:8.33%"><col style="width:8.33%"></colgroup><thead><tr><th scope="col">${esc(C.eval.caseHeaders.id)}</th><th scope="col">${esc(C.eval.caseHeaders.split)}</th><th scope="col">${esc(C.eval.caseHeaders.question)}</th><th scope="col">${esc(C.eval.caseHeaders.outcome)}</th><th scope="col">${esc(C.eval.caseHeaders.route)}</th><th scope="col">${esc(C.eval.caseHeaders.failure)}</th><th scope="col" class="num">${esc(C.eval.caseHeaders.latency)}</th><th scope="col" class="num">${esc(C.eval.caseHeaders.tokens)}</th></tr></thead><tbody>${body}</tbody></table></div></section>`;
  }

  function releaseBlockedBanner(run) {
    const failures = [];
    if (run.overall.value < 90) failures.push(`${C.eval.kpi.overall}: ${run.overall.value}% · ${C.eval.gate(90)}`);
    if (run.heldOut.value < 80) failures.push(`${C.eval.kpi.heldOut}: ${run.heldOut.value}% · ${C.eval.gate(80)}`);
    if (run.safetyFn.value !== 0) failures.push(`${C.eval.kpi.safetyFn}: ${run.safetyFn.value} · ${C.eval.gateZero}`);
    if (run.p95.value >= 10) failures.push(`${C.eval.kpi.p95}: ${run.p95.value.toFixed(1)} s · ${C.eval.gateP95}`);
    return `<div class="banner banner--blocked"><div class="banner__title">${esc(C.eval.releaseBlockedTitle)}</div><div class="banner__body">${esc(C.eval.releaseBlockedBody)}</div><ul>${failures.map((item) => `<li>${esc(item)}</li>`).join("")}</ul><div class="banner__body">${esc(C.eval.noRelease)}</div></div>`;
  }

  function caseTraceSteps() {
    return C.mock.eval.caseTrace.map((step) => ({
      key: step.name,
      name: C.chat.traceStepsNames[step.name],
      kind: step.kind,
      status: step.status,
      latency: step.latency,
      tokens: step.tokens,
      payload: { node: step.name, status: step.status },
    }));
  }

  function openCasePanel(index) {
    const run = evalRunData();
    const row = run.cases[index];
    if (!row) return;
    const [id, split, question, outcome, route, failure, latency, tokens] = row;
    state.evalCase = index;
    state.caseTrigger = document.activeElement;
    const existing = $("#case-panel");
    if (existing) existing.remove();
    const root = $("#overlay-root");
    if (!root) return;
    root.insertAdjacentHTML(
      "beforeend",
      `<aside class="case-panel is-open" id="case-panel" role="complementary" aria-label="${esc(C.eval.casePanelTitle)}">
        <div class="case-panel__head"><h2 class="t-title-sm" id="case-panel-title" tabindex="-1">${esc(id)}</h2><button class="btn btn--icon" type="button" data-action="close-case" aria-label="${esc(C.common.close)}">${icon("close")}</button></div>
        <div class="stack-24" style="padding-top:16px">
          <div class="stack-8"><span class="t-caption">${esc(C.eval.caseQuestion)}</span><p class="t-body t-ink" style="margin:0">${esc(question)}</p></div>
          <div class="row-8">${splitBadge(split)} ${outcomeHtml(outcome)} ${routeBadge(route)}</div>
          <div class="stack-8"><span class="t-caption">${esc(C.eval.caseFailure)}</span><p class="t-mono" style="margin:0">${failure ? esc(failure) : "—"}</p></div>
          ${renderSqlBlock(C.mock.eval.caseSql, { label: C.eval.caseSql })}
          <div class="stack-8"><span class="t-caption">${esc(C.eval.caseHash)}</span><p class="t-mono" style="margin:0">sha256:9f2c…a41d</p></div>
          <div class="row-16"><span class="t-caption">${esc(C.eval.caseLatency)} <strong>${esc(latency)}</strong></span><span class="t-caption">${esc(C.eval.caseTokens)} <strong>${esc(tokens)}</strong></span></div>
          <div class="stack-8"><span class="t-caption">${esc(C.eval.caseTrace)}</span>${renderTrace(caseTraceSteps(), { id: "case", hideHeader: true })}</div>
          <div><button class="btn btn--tertiary" type="button" data-action="copy-case-id" data-case-id="${attr(id)}">${esc(C.eval.copyCaseId)}</button></div>
        </div>
      </aside>`,
    );
    const title = $("#case-panel-title");
    if (title) title.focus();
  }

  function closeCasePanel(restoreFocus = true) {
    const panel = $("#case-panel");
    if (panel) panel.remove();
    state.evalCase = null;
    if (restoreFocus && state.caseTrigger && document.contains(state.caseTrigger)) {
      state.caseTrigger.focus();
    }
    state.caseTrigger = null;
  }

  function copyReport() {
    if (state.evalState === "empty" || state.evalState === "loading") return;
    const run = evalRunData();
    copyText(C.eval.reportTemplate(run)).then(() => {
      toast(C.eval.reportCopied);
      announce(C.eval.reportCopied);
    });
  }

  function startEvalRun() {
    state.evalState = "running";
    renderEval();
    window.clearTimeout(state.evalRunTimer);
    state.evalRunTimer = window.setTimeout(() => {
      if (state.evalState !== "running") return;
      state.evalState = "pass";
      renderEval();
      announce(C.eval.runComplete);
    }, 2500);
  }

  function applyEvalState(value) {
    closeCasePanel(false);
    state.evalState = value;
    if (value === "blocked") {
      state.evalRun = "blocked";
    } else if (["pass", "degraded", "stale", "running", "empty", "loading"].includes(value)) {
      state.evalRun = "pass";
    }
    renderEval();
    if (value === "running") {
      window.clearTimeout(state.evalRunTimer);
      state.evalRunTimer = window.setTimeout(() => {
        if (state.evalState !== "running") return;
        state.evalState = "pass";
        renderEval();
        announce(C.eval.runComplete);
      }, 2500);
    }
  }

  function onRunSelect(value) {
    closeCasePanel(false);
    state.evalRun = value;
    state.evalState = value === "blocked" ? "blocked" : "pass";
    renderEval();
  }

  /* ------------------------------------------------------------------ */
  /* Event handling                                                      */
  /* ------------------------------------------------------------------ */

  function handleAction(action, element, event) {
    switch (action) {
      case "toggle-step": {
        const expanded = element.getAttribute("aria-expanded") === "true";
        element.setAttribute("aria-expanded", String(!expanded));
        const payload = document.getElementById(element.getAttribute("aria-controls"));
        if (payload) payload.hidden = expanded;
        break;
      }
      case "copy-sql":
        copyText(element.dataset.sql || "").then(() => {
          toast(C.chat.sqlCopied);
          announce(C.chat.sqlCopied);
        });
        break;
      case "copy-case-id":
        copyText(element.dataset.caseId || "").then(() => {
          toast(C.eval.caseIdCopied);
          announce(C.eval.caseIdCopied);
        });
        break;
      case "copy-report":
        copyReport();
        break;
      case "save-verified":
        toast(C.chat.savedVerified);
        announce(C.chat.savedVerified);
        break;
      case "feedback-up":
      case "feedback-down":
        toast(C.chat.feedbackThanks);
        announce(C.chat.feedbackThanks);
        break;
      case "focus-composer": {
        const input = $("#question-input");
        if (input) input.focus();
        break;
      }
      case "open-trace":
        openTraceSheet();
        break;
      case "close-trace":
        closeTraceSheet();
        break;
      case "close-detail":
        state.graphDetailOpen = false;
        $("#graph-detail").classList.remove("is-open");
        break;
      case "close-filters":
        state.graphFilterOpen = false;
        $("#graph-filters").classList.remove("is-open");
        break;
      case "graph-view":
        setGraphView(element.dataset.view);
        break;
      case "choose-candidate":
        state.chatState = "answered";
        renderChat();
        updateStateSelect();
        toast(C.chat.candidateChosen);
        announce(C.chat.candidateChosen);
        break;
      case "close-case":
        closeCasePanel();
        break;
      case "admin-save":
        saveAdmin();
        break;
      case "admin-discard":
        discardAdmin();
        break;
      case "admin-back":
        state.adminEditorOpen = false;
        $("#surface-admin").classList.remove("is-editor-open");
        break;
      case "edit-asset":
        editAssetFromGraph(element.dataset.asset);
        break;
      case "modal-discard":
        discardModal();
        break;
      case "focus-field": {
        if (event) event.preventDefault();
        const field = document.getElementById(element.dataset.field);
        if (field) field.focus();
        break;
      }
      case "run-eval":
        startEvalRun();
        break;
      case "toggle-chart-data":
        state.chatChartData = !state.chatChartData;
        renderChat();
        break;
      case "toggle-trend-data":
        state.evalTrendData = !state.evalTrendData;
        renderEval();
        break;
      default:
        break;
    }
  }

  function onClick(event) {
    const target = event.target;
    if (target.id === "unsaved-modal") {
      closeModal();
      return;
    }
    const tab = target.closest("[data-surface-tab]");
    if (tab) {
      setSurface(tab.dataset.surfaceTab);
      return;
    }
    const action = target.closest("[data-action]");
    if (action) {
      if (action.tagName === "A") event.preventDefault();
      handleAction(action.dataset.action, action, event);
      return;
    }
    const historyItem = target.closest("[data-history]");
    if (historyItem) {
      selectHistoryItem(Number(historyItem.dataset.history));
      return;
    }
    const node = target.closest("[data-node]");
    if (node) {
      selectGraphNode(node.dataset.node);
      return;
    }
    const assetType = target.closest("[data-asset-type]");
    if (assetType) {
      selectAdminType(assetType.dataset.assetType);
      return;
    }
    const asset = target.closest("[data-asset]");
    if (asset) {
      selectAdminAsset(asset.dataset.asset);
      return;
    }
    const caseButton = target.closest("[data-case]");
    if (caseButton) {
      openCasePanel(Number(caseButton.dataset.case));
      return;
    }
    const caseRow = target.closest("[data-case-row]");
    if (caseRow) {
      openCasePanel(Number(caseRow.dataset.caseRow));
    }
  }

  function onInput(event) {
    const element = event.target;
    if (element.id === "question-input") {
      updateComposer();
      return;
    }
    if (element.id === "history-filter") {
      state.historyQuery = element.value;
      renderHistory();
      return;
    }
    if (element.id === "graph-search") {
      state.graphQuery = element.value;
      state.graphState = "graph";
      renderGraphFilterList();
      renderGraphView();
      updateStateSelect();
      return;
    }
    if (element.id === "admin-filter") {
      state.adminQuery = element.value;
      renderAdminAssetList();
    }
  }

  function onChange(event) {
    const element = event.target;
    if (element.id === "graph-verified") {
      state.graphVerifiedOnly = element.checked;
      renderGraphFilterList();
      renderGraphView();
      return;
    }
    if (element.id === "graph-hot") {
      state.graphHotOnly = element.checked;
      renderGraphFilterList();
      renderGraphView();
      return;
    }
    if (element.id === "run-select") {
      onRunSelect(element.value);
      return;
    }
    if (element.id === "admin-type-select") {
      selectAdminType(element.value);
    }
  }

  function onKeyDown(event) {
    if (event.key !== "Escape") return;
    if (state.modalOpen) {
      closeModal();
      return;
    }
    if (state.chatTraceOpen) {
      closeTraceSheet();
      return;
    }
    if ($("#case-panel")) {
      closeCasePanel();
      return;
    }
    if (state.graphDetailOpen) {
      state.graphDetailOpen = false;
      const detail = $("#graph-detail");
      if (detail) detail.classList.remove("is-open");
      return;
    }
    if (state.graphFilterOpen) {
      state.graphFilterOpen = false;
      const filters = $("#graph-filters");
      if (filters) filters.classList.remove("is-open");
      return;
    }
    closeHistory();
  }

  function onHashChange() {
    const name = location.hash.slice(1);
    if (["chat", "graph", "admin", "eval"].includes(name) && name !== state.surface) {
      setSurface(name, { updateHash: false });
    }
  }

  function onResize() {
    if (window.innerWidth >= 1024) closeHistory();
  }

  function bindEvents() {
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("input", onInput);
    document.addEventListener("change", onChange);
    window.addEventListener("hashchange", onHashChange);
    window.addEventListener("resize", onResize);

    const composer = $("#composer");
    if (composer) {
      composer.addEventListener("submit", (event) => {
        event.preventDefault();
        askQuestion();
      });
    }
    const questionInput = $("#question-input");
    if (questionInput) {
      questionInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          askQuestion();
        }
      });
    }
    const historyToggle = $("#history-toggle");
    if (historyToggle) historyToggle.addEventListener("click", openHistory);
    const historyClose = $("#history-close");
    if (historyClose) historyClose.addEventListener("click", closeHistory);
    const railScrim = $("#rail-scrim");
    if (railScrim) railScrim.addEventListener("click", closeHistory);
    const graphFilterToggle = $("#graph-filter-toggle");
    if (graphFilterToggle) {
      graphFilterToggle.addEventListener("click", () => {
        state.graphFilterOpen = true;
        const filters = $("#graph-filters");
        if (filters) filters.classList.add("is-open");
      });
    }
    const hideProto = $("#hide-proto");
    if (hideProto) hideProto.addEventListener("click", () => document.body.classList.add("proto-hidden"));
    const showProto = $("#show-proto");
    if (showProto) showProto.addEventListener("click", () => document.body.classList.remove("proto-hidden"));
    const stateSelect = $("#state-select");
    if (stateSelect) stateSelect.addEventListener("change", (event) => setPrototypeState(event.target.value));
    $$("[data-surface-tab]").forEach((tab) =>
      tab.addEventListener("click", () => setSurface(tab.dataset.surfaceTab)),
    );
    const adminEditor = $("#admin-editor");
    if (adminEditor) {
      adminEditor.addEventListener("input", onAdminInput);
      adminEditor.addEventListener("change", onAdminInput);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Init                                                                */
  /* ------------------------------------------------------------------ */

  hydrateCopy();
  bindEvents();
  renderHistory();
  const params = new URLSearchParams(location.search);
  const hashSurface = location.hash.slice(1);
  const initialSurface = params.get("surface") || (["chat", "graph", "admin", "eval"].includes(hashSurface) ? hashSurface : "chat");
  setSurface(initialSurface, { updateHash: false });
  const initialState = params.get("state");
  if (initialState) setPrototypeState(initialState);
  updateComposer();
})();
