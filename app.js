
    const STORAGE_KEY = "spinrobin_fair_v6";

    let state = {
      category: "singles", // 'singles' or 'doubles'
      activeView: "matchups", // 'matchups' | 'standings' | 'crosstable' | 'fairness'
      filterStatus: "all", // 'all' | 'pending' | 'completed'
      filterPlayerId: "",
      searchQuery: "",
      editingEntryId: null,
      tradingMatchId: null,
      tradingSlot: 1, // 1 for p1, 2 for p2
      theme: "dark",
      density: "compact", // 'compact' | 'comfy'
      avoidImmediateRematch: true,

      singles: {
        entries: [], // [{ id, name, waitSeq, addedAt, lastFinishedAt, isResting }]
        matches: [], // [{ id, p1Id, p2Id, score1, score2, winnerId, isCompleted, matchNum, queueOrder, isPreview, completedAt }]
        waitCounter: 0,
        matchCounter: 0,
        targetMatches: "full" // retained for schema compatibility
      },
      doubles: {
        entries: [], // [{ id, name, playerA, playerB, waitSeq, addedAt, lastFinishedAt, isResting }]
        matches: [], // [{ id, p1Id, p2Id, score1, score2, winnerId, isCompleted, matchNum, queueOrder, isPreview, completedAt }]
        waitCounter: 0,
        matchCounter: 0,
        targetMatches: "full" // retained for schema compatibility
      }
    };

    // --- DOM CACHE ---
    const dom = {
      themeToggleBtn: document.getElementById("themeToggleBtn"),
      themeIcon: document.getElementById("themeIcon"),
      printBtn: document.getElementById("printBtn"),
      resetTournamentBtn: document.getElementById("resetTournamentBtn"),
      resetSessionBtn: document.getElementById("resetSessionBtn"),
      btnResetSessionManager: document.getElementById("btnResetSessionManager"),
      btnCatSingles: document.getElementById("btnCatSingles"),
      btnCatDoubles: document.getElementById("btnCatDoubles"),
      tabMatchups: document.getElementById("tabMatchups"),
      tabStandings: document.getElementById("tabStandings"),
      tabCrosstable: document.getElementById("tabCrosstable"),
      tabFairness: document.getElementById("tabFairness"),
      viewMatchups: document.getElementById("viewMatchups"),
      viewStandings: document.getElementById("viewStandings"),
      viewCrosstable: document.getElementById("viewCrosstable"),
      viewFairness: document.getElementById("viewFairness"),
      fairnessSummaryText: document.getElementById("fairnessSummaryText"),
      fairnessSubText: document.getElementById("fairnessSubText"),
      formAddSingles: document.getElementById("formAddSingles"),
      formAddDoubles: document.getElementById("formAddDoubles"),
      newPlayerInput: document.getElementById("newPlayerInput"),
      newPartnerAInput: document.getElementById("newPartnerAInput"),
      newPartnerBInput: document.getElementById("newPartnerBInput"),
      quotaSelectLabel: document.getElementById("quotaSelectLabel"),
      targetMatchesSelect: document.getElementById("targetMatchesSelect"),
      statRosterTypeLabel: document.getElementById("statRosterTypeLabel"),
      statPlayerCount: document.getElementById("statPlayerCount"),
      statCompletedMatches: document.getElementById("statCompletedMatches"),
      statTotalMatches: document.getElementById("statTotalMatches"),
      progressBarFill: document.getElementById("progressBarFill"),
      statProgressPercent: document.getElementById("statProgressPercent"),
      rosterTitle: document.getElementById("rosterTitle"),
      rosterChipsContainer: document.getElementById("rosterChipsContainer"),
      playerFilterSelect: document.getElementById("playerFilterSelect"),
      searchMatchInput: document.getElementById("searchMatchInput"),
      toggleAvoidRematch: document.getElementById("toggleAvoidRematch"),
      matchesContainer: document.getElementById("matchesContainer"),
      standingsCategoryTitle: document.getElementById("standingsCategoryTitle"),
      thParticipantHeader: document.getElementById("thParticipantHeader"),
      standingsTableBody: document.getElementById("standingsTableBody"),
      crosstableCategoryTitle: document.getElementById("crosstableCategoryTitle"),
      crosstableMatrix: document.getElementById("crosstableMatrix"),
      fairnessMonitorSubtitle: document.getElementById("fairnessMonitorSubtitle"),
      fairnessGrid: document.getElementById("fairnessGrid"),
      editModal: document.getElementById("editModal"),
      modalTitle: document.getElementById("modalTitle"),
      modalSinglesFields: document.getElementById("modalSinglesFields"),
      modalDoublesFields: document.getElementById("modalDoublesFields"),
      editPlayerNameInput: document.getElementById("editPlayerNameInput"),
      editPartnerAInput: document.getElementById("editPartnerAInput"),
      editPartnerBInput: document.getElementById("editPartnerBInput"),
      btnModalSwapPartners: document.getElementById("btnModalSwapPartners"),
      modalSwapPlayerPick: document.getElementById("modalSwapPlayerPick"),
      modalSwapTargetTeam: document.getElementById("modalSwapTargetTeam"),
      modalSwapTargetPartner: document.getElementById("modalSwapTargetPartner"),
      btnExecuteTeamSwap: document.getElementById("btnExecuteTeamSwap"),
      closeEditModalBtn: document.getElementById("closeEditModalBtn"),
      cancelEditModalBtn: document.getElementById("cancelEditModalBtn"),
      saveEditModalBtn: document.getElementById("saveEditModalBtn"),
      tradeModal: document.getElementById("tradeModal"),
      tradeModalTitle: document.getElementById("tradeModalTitle"),
      tradeTargetSelectorGroup: document.getElementById("tradeTargetSelectorGroup"),
      tradeCandidatesContainer: document.getElementById("tradeCandidatesContainer"),
      tradeManualSelect: document.getElementById("tradeManualSelect"),
      btnExecuteManualTrade: document.getElementById("btnExecuteManualTrade"),
      closeTradeModalBtn: document.getElementById("closeTradeModalBtn"),
      cancelTradeModalBtn: document.getElementById("cancelTradeModalBtn"),
      toastContainer: document.getElementById("toastContainer"),
      confirmModal: document.getElementById("confirmModal"),
      confirmModalTitle: document.getElementById("confirmModalTitle"),
      confirmModalBody: document.getElementById("confirmModalBody"),
      cancelConfirmModalBtn: document.getElementById("cancelConfirmModalBtn"),
      acceptConfirmModalBtn: document.getElementById("acceptConfirmModalBtn"),
      closeConfirmModalBtn: document.getElementById("closeConfirmModalBtn"),
      a11yLiveRegion: document.getElementById("a11yLiveRegion")
    };

    // --- UI HELPER: STATUS BADGE ---
    function badgeHTML(text, type = "pending") {
      const cls = type === "completed" ? "status-completed" : "status-pending";
      return `<span class="status-badge ${cls}">${text}</span>`;
    }

    // --- STATE HELPERS ---
    function getActiveData() {
      return state[state.category];
    }

    function getEntries() {
      return getActiveData().entries;
    }

    function getMatches() {
      return getActiveData().matches;
    }

    function getEntry(id) {
      return getEntries().find(e => e.id === id);
    }

    function isDoubles() {
      return state.category === "doubles";
    }

    function getQuotaNumber() {
      return 0; // Legacy stub
    }

    // --- TIME DISPLAY HELPER ---
    function formatWaitDuration(timestamp) {
      if (!timestamp) return "Just now";
      const diffMs = Date.now() - timestamp;
      if (diffMs < 60000) return "< 1 min";
      const mins = Math.floor(diffMs / 60000);
      if (mins < 60) return `${mins} min`;
      const hrs = Math.floor(mins / 60);
      const remMins = mins % 60;
      return `${hrs}h ${remMins}m`;
    }

    // --- SCREEN WAKE LOCK API ---
    let wakeLock = null;

    async function requestWakeLock() {
      if ('wakeLock' in navigator && state.activeView === 'matchups' && !document.hidden) {
        try {
          wakeLock = await navigator.wakeLock.request('screen');
          wakeLock.addEventListener('release', () => { wakeLock = null; });
        } catch (e) {
          // Graceful fallback if wakeLock is denied or not supported
        }
      }
    }

    function releaseWakeLock() {
      if (wakeLock) {
        try { wakeLock.release().catch(() => {}); } catch (e) {}
        wakeLock = null;
      }
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        releaseWakeLock();
      } else if (state.activeView === 'matchups') {
        requestWakeLock();
      }
    });

    // --- ACCESSIBILITY ANNOUNCER ---
    function announceA11y(msg) {
      const el = dom.a11yLiveRegion || document.getElementById("a11yLiveRegion");
      if (el) {
        el.textContent = "";
        setTimeout(() => { el.textContent = msg; }, 50);
      }
    }

    // --- CONFIRM DESTRUCTIVE MODAL HELPER ---
    let confirmModalCallback = null;

    function showConfirmDialog({ title, message, confirmText = "Confirm", isDanger = false, onConfirm }) {
      const modal = dom.confirmModal || document.getElementById("confirmModal");
      const titleEl = dom.confirmModalTitle || document.getElementById("confirmModalTitle");
      const bodyEl = dom.confirmModalBody || document.getElementById("confirmModalBody");
      const acceptBtn = dom.acceptConfirmModalBtn || document.getElementById("acceptConfirmModalBtn");
      if (!modal || !titleEl || !bodyEl || !acceptBtn) {
        if (confirm(message)) onConfirm();
        return;
      }
      titleEl.textContent = title;
      bodyEl.textContent = message;
      acceptBtn.textContent = confirmText;
      acceptBtn.className = isDanger ? "btn btn-danger" : "btn btn-primary";
      confirmModalCallback = onConfirm;
      modal.style.display = "flex";
      acceptBtn.focus();
    }

    function closeConfirmDialog() {
      const modal = dom.confirmModal || document.getElementById("confirmModal");
      if (modal) modal.style.display = "none";
      confirmModalCallback = null;
    }

    // --- TOAST NOTIFICATIONS (WITH 6-SEC UNDO CAPABILITY) ---
    function showToast(message, icon = "🏓", options = {}) {
      const duration = options.duration || (options.undoAction ? 6000 : 2600);
      const toast = document.createElement("div");
      toast.className = "toast";

      const contentWrap = document.createElement("div");
      contentWrap.style.display = "flex";
      contentWrap.style.alignItems = "center";
      contentWrap.style.gap = "6px";
      contentWrap.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
      toast.appendChild(contentWrap);

      if (options.undoAction) {
        const undoBtn = document.createElement("button");
        undoBtn.type = "button";
        undoBtn.className = "toast-undo-btn";
        undoBtn.textContent = "Undo";
        undoBtn.setAttribute("aria-label", "Undo this action");
        undoBtn.addEventListener("click", () => {
          toast.remove();
          options.undoAction();
        });
        toast.appendChild(undoBtn);
      }

      dom.toastContainer.appendChild(toast);

      setTimeout(() => {
        toast.style.transition = "opacity 0.25s ease, transform 0.25s ease";
        toast.style.opacity = "0";
        toast.style.transform = "translateY(15px)";
        setTimeout(() => toast.remove(), 250);
      }, duration);
    }

    // --- THEME ---
    function initTheme() {
      const saved = localStorage.getItem("spinrobin_theme");
      if (saved) {
        setTheme(saved);
      } else {
        const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
        setTheme(prefersDark ? "dark" : "light");
      }
      dom.themeToggleBtn.addEventListener("click", () => {
        const next = state.theme === "dark" ? "light" : "dark";
        setTheme(next);
      });
    }

    function setTheme(theme) {
      state.theme = theme;
      document.body.setAttribute("data-theme", theme);
      localStorage.setItem("spinrobin_theme", theme);
      dom.themeIcon.textContent = theme === "dark" ? "☀️" : "🌙";
    }

    // --- DENSITY (COMPACT VS COMFY) ---
    function initDensity() {
      const saved = localStorage.getItem("spinrobin_density") || "compact";
      setDensity(saved);
      const btn = document.getElementById("densityToggleBtn");
      if (btn) {
        btn.addEventListener("click", () => {
          const next = state.density === "compact" ? "comfy" : "compact";
          setDensity(next);
          showToast(`Switched to ${next} view`, "📐");
        });
      }
    }

    function setDensity(density) {
      state.density = density;
      document.body.setAttribute("data-density", density);
      localStorage.setItem("spinrobin_density", density);
      const icon = document.getElementById("densityIcon");
      if (icon) {
        icon.textContent = density === "compact" ? "⊟" : "⊞";
      }
      const btn = document.getElementById("densityToggleBtn");
      if (btn) {
        btn.title = density === "compact" ? "Density: Compact (click for Comfy)" : "Density: Comfy (click for Compact)";
      }
    }

    // --- INITIALIZATION ---
    function init() {
      initTheme();
      initDensity();
      bindEvents();

      // Clean older test keys
      try {
        localStorage.removeItem("spinrobin_fair_v5");
        localStorage.removeItem("spinrobin_fair_v4");
        localStorage.removeItem("spinrobin_fair_v3");
      } catch (e) {}

      loadState();

      syncQueue();
      updateCategoryUI();
      renderAll();
    }

    function bindEvents() {
      // Category Switching (Singles vs Doubles)
      dom.btnCatSingles.addEventListener("click", () => setCategory("singles"));
      dom.btnCatDoubles.addEventListener("click", () => setCategory("doubles"));

      // Views Tab Switching
      dom.tabMatchups.addEventListener("click", () => switchView("matchups"));
      dom.tabStandings.addEventListener("click", () => switchView("standings"));
      dom.tabCrosstable.addEventListener("click", () => switchView("crosstable"));
      dom.tabFairness.addEventListener("click", () => switchView("fairness"));

      // Reset Session Buttons (Clear matches, keep roster)
      if (dom.resetSessionBtn) {
        dom.resetSessionBtn.addEventListener("click", handleResetSession);
      }
      if (dom.btnResetSessionManager) {
        dom.btnResetSessionManager.addEventListener("click", handleResetSession);
      }

      // Confirm Modal Dialog Listeners
      if (dom.closeConfirmModalBtn) dom.closeConfirmModalBtn.addEventListener("click", closeConfirmDialog);
      if (dom.cancelConfirmModalBtn) dom.cancelConfirmModalBtn.addEventListener("click", closeConfirmDialog);
      if (dom.acceptConfirmModalBtn) {
        dom.acceptConfirmModalBtn.addEventListener("click", () => {
          const cb = confirmModalCallback;
          closeConfirmDialog();
          if (cb) cb();
        });
      }
      if (dom.confirmModal) {
        dom.confirmModal.addEventListener("click", (e) => {
          if (e.target === dom.confirmModal) closeConfirmDialog();
        });
      }

      // Reset Full Tournament (Clear all with modal & Undo)
      dom.resetTournamentBtn.addEventListener("click", () => {
        const catName = isDoubles() ? "Doubles" : "Singles";
        showConfirmDialog({
          title: "Reset Tournament",
          message: `Reset entire ${catName} tournament and clear all participants & match records?`,
          confirmText: "Reset All",
          isDanger: true,
          onConfirm: () => {
            const snapshot = JSON.stringify(state);
            const data = getActiveData();
            data.entries = [];
            data.matches = [];
            data.waitCounter = 0;
            data.matchCounter = 0;
            saveState();
            renderAll();
            showToast(`Cleared ${catName} tournament! Ready for new participants.`, "🔄", {
              undoAction: () => {
                state = JSON.parse(snapshot);
                saveState();
                renderAll();
                showToast("Tournament reset undone", "↩️");
              },
              duration: 6000
            });
          }
        });
      });

      // Print
      dom.printBtn.addEventListener("click", () => window.print());

      // Filter by Status
      document.querySelectorAll(".filter-btn[data-filter]").forEach(btn => {
        btn.addEventListener("click", (e) => {
          document.querySelectorAll(".filter-btn[data-filter]").forEach(b => b.classList.remove("active"));
          e.currentTarget.classList.add("active");
          state.filterStatus = e.currentTarget.dataset.filter;
          renderMatchups();
        });
      });

      // Filter Dropdown & Search
      dom.playerFilterSelect.addEventListener("change", (e) => {
        state.filterPlayerId = e.target.value;
        renderMatchups();
      });

      dom.searchMatchInput.addEventListener("input", (e) => {
        state.searchQuery = e.target.value.trim().toLowerCase();
        renderMatchups();
      });

      // Rematch Guard Toggle
      if (dom.toggleAvoidRematch) {
        dom.toggleAvoidRematch.checked = state.avoidImmediateRematch;
        dom.toggleAvoidRematch.addEventListener("change", (e) => {
          state.avoidImmediateRematch = e.target.checked;
          syncQueue();
          saveState();
          renderMatchups();
          showToast(state.avoidImmediateRematch ? "Rematch guard: ON" : "Rematch guard: OFF", "🚫");
        });
      }

      // Edit Modal Events
      dom.closeEditModalBtn.addEventListener("click", closeEditModal);
      dom.cancelEditModalBtn.addEventListener("click", closeEditModal);
      dom.saveEditModalBtn.addEventListener("click", handleSaveParticipantEdit);
      dom.btnModalSwapPartners.addEventListener("click", handleModalSwapPartnersInTeam);
      dom.btnExecuteTeamSwap.addEventListener("click", handleModalExecuteTeamSwap);

      dom.editPlayerNameInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") handleSaveParticipantEdit();
        if (e.key === "Escape") closeEditModal();
      });

      dom.editModal.addEventListener("click", (e) => {
        if (e.target === dom.editModal) closeEditModal();
      });

      // Add Player & Add Team Forms
      if (dom.formAddSingles) {
        dom.formAddSingles.addEventListener("submit", (e) => {
          e.preventDefault();
          handleAddSinglesPlayer();
        });
      }
      if (dom.formAddDoubles) {
        dom.formAddDoubles.addEventListener("submit", (e) => {
          e.preventDefault();
          handleAddDoublesTeam();
        });
      }

      // Trade Modal Events
      dom.closeTradeModalBtn.addEventListener("click", closeTradeModal);
      dom.cancelTradeModalBtn.addEventListener("click", closeTradeModal);
      dom.btnExecuteManualTrade.addEventListener("click", handleExecuteManualTrade);
      dom.tradeModal.addEventListener("click", (e) => {
        if (e.target === dom.tradeModal) closeTradeModal();
      });
    }

    // --- CATEGORY & VIEW CONTROLS ---
    function setCategory(cat) {
      if (state.category === cat) return;
      state.category = cat;
      state.filterPlayerId = "";
      state.searchQuery = "";
      dom.searchMatchInput.value = "";

      syncQueue();
      updateCategoryUI();
      saveState();
      renderAll();
      showToast(`Switched to ${cat === "doubles" ? "Doubles" : "Singles"} category!`, "🔄");
    }

    function updateCategoryUI() {
      const doublesMode = isDoubles();
      dom.btnCatSingles.classList.toggle("active", !doublesMode);
      dom.btnCatDoubles.classList.toggle("active", doublesMode);
      dom.btnCatSingles.setAttribute("aria-selected", !doublesMode);
      dom.btnCatDoubles.setAttribute("aria-selected", doublesMode);

      dom.formAddSingles.style.display = doublesMode ? "none" : "flex";
      dom.formAddDoubles.style.display = doublesMode ? "flex" : "none";

      dom.statRosterTypeLabel.textContent = doublesMode ? "Teams" : "Players";
      dom.rosterTitle.textContent = doublesMode ? "Active Roster (Teams):" : "Active Roster (Players):";
      dom.searchMatchInput.placeholder = "🔍 Search...";
      dom.standingsCategoryTitle.textContent = doublesMode ? "Doubles Teams Leaderboard" : "Singles Leaderboard";
      dom.thParticipantHeader.textContent = doublesMode ? "Team" : "Player";
      dom.crosstableCategoryTitle.textContent = doublesMode ? "Doubles Head-to-Head Cross Table" : "Singles Head-to-Head Cross Table";
    }

    function switchView(viewName) {
      state.activeView = viewName;
      if (viewName === "matchups") {
        requestWakeLock();
      } else {
        releaseWakeLock();
      }
      dom.tabMatchups.classList.toggle("active", viewName === "matchups");
      dom.tabStandings.classList.toggle("active", viewName === "standings");
      dom.tabCrosstable.classList.toggle("active", viewName === "crosstable");
      dom.tabFairness.classList.toggle("active", viewName === "fairness");

      dom.tabMatchups.setAttribute("aria-selected", viewName === "matchups");
      dom.tabStandings.setAttribute("aria-selected", viewName === "standings");
      dom.tabCrosstable.setAttribute("aria-selected", viewName === "crosstable");
      dom.tabFairness.setAttribute("aria-selected", viewName === "fairness");

      const views = [dom.viewMatchups, dom.viewStandings, dom.viewCrosstable, dom.viewFairness];
      views.forEach(v => {
        v.style.display = "none";
        v.classList.remove("view-fade-in");
      });

      let targetEl = null;
      if (viewName === "matchups") {
        targetEl = dom.viewMatchups;
        renderMatchups();
      } else if (viewName === "standings") {
        targetEl = dom.viewStandings;
        renderStandings();
      } else if (viewName === "crosstable") {
        targetEl = dom.viewCrosstable;
        renderCrosstable();
      } else if (viewName === "fairness") {
        targetEl = dom.viewFairness;
        renderFairness();
      }

      if (targetEl) {
        targetEl.style.display = "block";
        void targetEl.offsetWidth; // reflow to trigger animation
        targetEl.classList.add("view-fade-in");
      }
    }

    /**
     * =========================================================================
     * PURE SCHEDULER: pickNextMatch(entries, matches, options)
     * =========================================================================
     * Pure function that deterministically selects the next two entries to play
     * under the Infinite Longest-Wait-First algorithm.
     *
     * Rules & Tie-breakers (in exact priority order):
     * 1. Rest Filter: Skip any participant where isResting === true.
     * 2. Minimum Active: If fewer than 2 active non-resting entries exist, return null.
     * 3. Ordering (Longest Wait First):
     *    - Primary Key: Lowest sequence counter (waitSeq) ASC. (Waited longest).
     *    - Tie-breaker 1: Fewer total games played (matchesPlayed) ASC.
     *    - Tie-breaker 2: Joined earlier (addedAt timestamp) ASC.
     *    - Tie-breaker 3: Stable ID comparison (deterministic fallback).
     * 4. Rematch Guard (options.avoidImmediateRematch):
     *    - Candidate A is the #1 longest-waited entry in the sorted queue.
     *    - If rematch guard is enabled, check who Candidate A played in their most
     *      recent completed match.
     *    - If Candidate B (sorted[1]) was that immediate opponent and other active
     *      candidates exist (sorted.length > 2), select the first alternative candidate
     *      who was not Candidate A's last opponent.
     *    - If only 2 active players exist, allow the immediate rematch.
     *
     * @param {Array<Object>} entries - All participant entries in category
     * @param {Array<Object>} matches - Match history (completed matches)
     * @param {Object} options - { avoidImmediateRematch: boolean }
     * @returns {Array<Object>|null} [entryA, entryB] or null if insufficient active
     */
    function pickNextMatch(entries, matches = [], options = { avoidImmediateRematch: true }) {
      if (!entries || !Array.isArray(entries)) return null;

      // Rule 1: Skip resting entries
      const activeEntries = entries.filter(e => !e.isResting);
      if (activeEntries.length < 2) return null;

      // Count completed matches played per active entry
      const matchCountMap = new Map();
      activeEntries.forEach(e => matchCountMap.set(e.id, 0));
      matches.forEach(m => {
        if (m.isCompleted) {
          if (matchCountMap.has(m.p1Id)) matchCountMap.set(m.p1Id, matchCountMap.get(m.p1Id) + 1);
          if (matchCountMap.has(m.p2Id)) matchCountMap.set(m.p2Id, matchCountMap.get(m.p2Id) + 1);
        }
      });

      // Rule 3: Sort by wait ticket sequence and tie-breakers
      const sorted = [...activeEntries].sort((a, b) => {
        const seqA = Number.isFinite(a.waitSeq) ? a.waitSeq : 0;
        const seqB = Number.isFinite(b.waitSeq) ? b.waitSeq : 0;
        if (seqA !== seqB) return seqA - seqB; // Lowest waitSeq = waited longest

        const countA = matchCountMap.get(a.id) || 0;
        const countB = matchCountMap.get(b.id) || 0;
        if (countA !== countB) return countA - countB; // Fewer games played

        const timeA = a.addedAt || 0;
        const timeB = b.addedAt || 0;
        if (timeA !== timeB) return timeA - timeB; // Joined earlier

        return (a.id || "").localeCompare(b.id || ""); // Deterministic fallback
      });

      const entryA = sorted[0];

      // Rule 4: Rematch guard check
      let lastOpponentIdOfA = null;
      if (options.avoidImmediateRematch && matches.length > 0) {
        for (let i = matches.length - 1; i >= 0; i--) {
          const m = matches[i];
          if (m.isCompleted && (m.p1Id === entryA.id || m.p2Id === entryA.id)) {
            lastOpponentIdOfA = (m.p1Id === entryA.id) ? m.p2Id : m.p1Id;
            break;
          }
        }
      }

      let entryB = sorted[1];
      if (options.avoidImmediateRematch && lastOpponentIdOfA && sorted.length > 2) {
        if (entryB.id === lastOpponentIdOfA) {
          const alternative = sorted.slice(2).find(cand => cand.id !== lastOpponentIdOfA);
          if (alternative) {
            entryB = alternative;
          }
        }
      }

      return [entryA, entryB];
    }

    /**
     * =========================================================================
     * QUEUE SYNCHRONIZER: syncQueue()
     * =========================================================================
     * Ensures Table 1 always has:
     * 1. A current live match (Playing).
     * 2. An upcoming preview line-up (next 6-10 matches) computed live from
     *    simulating match conclusions under Longest-Wait-First.
     */
    function syncQueue() {
      const data = getActiveData();
      const entries = data.entries;
      const activeEntries = entries.filter(e => !e.isResting);

      // Separate completed matches from pending
      const completed = data.matches.filter(m => m.isCompleted);

      if (activeEntries.length < 2) {
        data.matches = completed;
        return;
      }

      // Check existing live match (first uncompleted match)
      let liveMatch = data.matches.find(m => !m.isCompleted);
      if (liveMatch) {
        // Validate that both participants are still in active roster
        const p1 = entries.find(e => e.id === liveMatch.p1Id && !e.isResting);
        const p2 = entries.find(e => e.id === liveMatch.p2Id && !e.isResting);
        if (!p1 || !p2 || p1.id === p2.id) {
          liveMatch = null; // Re-schedule if player was removed or rested
        }
      }

      if (!liveMatch) {
        const pair = pickNextMatch(entries, completed, { avoidImmediateRematch: state.avoidImmediateRematch });
        if (!pair) {
          data.matches = completed;
          return;
        }
        data.matchCounter = (data.matchCounter || completed.length) + 1;
        liveMatch = {
          id: `m_${pair[0].id}_${pair[1].id}_${Date.now()}`,
          matchNum: data.matchCounter,
          p1Id: pair[0].id,
          p2Id: pair[1].id,
          score1: 0,
          score2: 0,
          winnerId: null,
          isCompleted: false,
          queueOrder: 1
        };
      } else {
        liveMatch.queueOrder = 1;
      }

      // Compute upcoming line-up preview (next 8 matches)
      const simEntries = entries.map(e => ({
        id: e.id,
        name: e.name,
        waitSeq: e.waitSeq,
        addedAt: e.addedAt,
        isResting: e.isResting
      }));
      const simMatches = [...completed];

      let simWaitCounter = Math.max(...entries.map(e => e.waitSeq || 0), entries.length);

      // Simulate live match concluding: both players move to back of queue
      const p1Sim = simEntries.find(e => e.id === liveMatch.p1Id);
      const p2Sim = simEntries.find(e => e.id === liveMatch.p2Id);
      if (p1Sim) p1Sim.waitSeq = ++simWaitCounter;
      if (p2Sim) p2Sim.waitSeq = ++simWaitCounter;
      simMatches.push(liveMatch);

      const previewMatches = [];
      const PREVIEW_COUNT = 8;
      let nextMatchNum = liveMatch.matchNum + 1;

      for (let i = 0; i < PREVIEW_COUNT; i++) {
        const nextPair = pickNextMatch(simEntries, simMatches, { avoidImmediateRematch: state.avoidImmediateRematch });
        if (!nextPair) break;

        const pm = {
          id: `prev_${nextPair[0].id}_${nextPair[1].id}_${i}`,
          matchNum: nextMatchNum++,
          p1Id: nextPair[0].id,
          p2Id: nextPair[1].id,
          score1: 0,
          score2: 0,
          winnerId: null,
          isCompleted: false,
          queueOrder: i + 2,
          isPreview: true
        };
        previewMatches.push(pm);

        // Simulate preview match completion
        const sA = simEntries.find(e => e.id === nextPair[0].id);
        const sB = simEntries.find(e => e.id === nextPair[1].id);
        if (sA) sA.waitSeq = ++simWaitCounter;
        if (sB) sB.waitSeq = ++simWaitCounter;
        simMatches.push(pm);
      }

      data.matches = [...completed, liveMatch, ...previewMatches];
    }

    // --- ADD ENTRIES (SINGLES & DOUBLES) ---
    function handleAddSinglesPlayer() {
      const name = dom.newPlayerInput.value.trim();
      if (!name) return;

      const entries = state.singles.entries;
      const exists = entries.some(p => p.name.toLowerCase() === name.toLowerCase());
      if (exists) {
        showToast(`Player "${name}" is already registered!`, "⚠️");
        return;
      }

      const maxWait = entries.length > 0 ? Math.max(...entries.map(e => e.waitSeq || 0)) : 0;
      const now = Date.now();
      const newPlayer = {
        id: "p_" + now + "_" + Math.random().toString(36).substr(2, 4),
        name: name,
        waitSeq: maxWait + 1,
        addedAt: now,
        lastFinishedAt: now,
        isResting: false
      };

      entries.push(newPlayer);
      state.singles.waitCounter = newPlayer.waitSeq;

      dom.newPlayerInput.value = "";
      dom.newPlayerInput.focus();

      syncQueue();
      saveState();
      renderAll();

      showToast(`Added "${newPlayer.name}"! Joined at back of line (#${newPlayer.waitSeq}).`, "✨");
    }

    function handleAddDoublesTeam() {
      let partnerA = dom.newPartnerAInput.value.trim();
      let partnerB = dom.newPartnerBInput.value.trim();

      if (partnerA && !partnerB && (partnerA.includes("/") || partnerA.includes("&") || partnerA.includes("+"))) {
        const parts = partnerA.split(/[/&+]/);
        partnerA = parts[0].trim();
        partnerB = parts.slice(1).join("/").trim();
      }

      if (!partnerA || !partnerB) {
        showToast("Please enter both Partner A & Partner B names!", "⚠️");
        return;
      }

      const teamName = `${partnerA} / ${partnerB}`;
      const entries = state.doubles.entries;
      const exists = entries.some(t => t.name.toLowerCase() === teamName.toLowerCase());
      if (exists) {
        showToast(`Team "${teamName}" is already registered!`, "⚠️");
        return;
      }

      const maxWait = entries.length > 0 ? Math.max(...entries.map(e => e.waitSeq || 0)) : 0;
      const now = Date.now();
      const newTeam = {
        id: "t_" + now + "_" + Math.random().toString(36).substr(2, 4),
        name: teamName,
        playerA: partnerA,
        playerB: partnerB,
        waitSeq: maxWait + 1,
        addedAt: now,
        lastFinishedAt: now,
        isResting: false
      };

      entries.push(newTeam);
      state.doubles.waitCounter = newTeam.waitSeq;

      dom.newPartnerAInput.value = "";
      dom.newPartnerBInput.value = "";
      dom.newPartnerAInput.focus();

      syncQueue();
      saveState();
      renderAll();

      showToast(`Added Team "${teamName}"! Joined at back of line (#${newTeam.waitSeq}).`, "✨");
    }

    function removeEntry(entryId) {
      const data = getActiveData();
      const entry = data.entries.find(e => e.id === entryId);
      if (!entry) return;

      const completedCount = data.matches.filter(m => (m.p1Id === entryId || m.p2Id === entryId) && m.isCompleted).length;
      let msg = `Remove "${entry.name}"?`;
      if (completedCount > 0) {
        msg = `"${entry.name}" has completed ${completedCount} match(es). Removing will delete those match scores. Continue?`;
      }

      showConfirmDialog({
        title: isDoubles() ? "Remove Team" : "Remove Player",
        message: msg,
        confirmText: "Remove",
        isDanger: true,
        onConfirm: () => {
          const snapshot = JSON.stringify(state);
          const entryName = entry.name;
          data.entries = data.entries.filter(e => e.id !== entryId);
          data.matches = data.matches.filter(m => m.p1Id !== entryId && m.p2Id !== entryId);
          syncQueue();
          saveState();
          renderAll();
          showToast(`Removed "${entryName}"`, "🗑️", {
            undoAction: () => {
              state = JSON.parse(snapshot);
              saveState();
              renderAll();
              showToast(`Restored "${entryName}"`, "↩️");
            },
            duration: 6000
          });
        }
      });
    }

    function togglePlayerRest(entryId) {
      const data = getActiveData();
      const entry = data.entries.find(e => e.id === entryId);
      if (!entry) return;

      entry.isResting = !entry.isResting;
      if (!entry.isResting) {
        // Returning from rest: joins at the back of the line
        const maxWait = Math.max(...data.entries.map(e => e.waitSeq || 0), 0);
        entry.waitSeq = maxWait + 1;
        entry.lastFinishedAt = Date.now();
        data.waitCounter = entry.waitSeq;
        showToast(`"${entry.name}" is back from rest! Joined at back of queue.`, "⚡");
      } else {
        showToast(`"${entry.name}" is now resting. Skipped in queue.`, "😴");
      }

      syncQueue();
      saveState();
      renderAll();
    }

    function handleResetSession() {
      const catName = isDoubles() ? "Doubles" : "Singles";
      showConfirmDialog({
        title: "Reset Session",
        message: `Reset ${catName} session? This will clear all match records and restart the queue, keeping your player roster intact.`,
        confirmText: "Reset Session",
        isDanger: true,
        onConfirm: () => {
          const snapshot = JSON.stringify(state);
          const data = getActiveData();
          data.matches = [];
          data.matchCounter = 0;
          data.waitCounter = data.entries.length;
          const now = Date.now();
          data.entries.forEach((e, idx) => {
            e.waitSeq = idx + 1;
            e.lastFinishedAt = now;
          });

          syncQueue();
          saveState();
          renderAll();
          showToast(`Session reset! Match history cleared, roster kept.`, "🧹", {
            undoAction: () => {
              state = JSON.parse(snapshot);
              saveState();
              renderAll();
              showToast("Session reset undone", "↩️");
            },
            duration: 6000
          });
        }
      });
    }

    // --- MANUAL QUEUE & BUMP CONTROLS ---
    function handleBumpPlayer(entryId, direction) {
      const data = getActiveData();
      const active = data.entries.filter(e => !e.isResting).sort((a, b) => (a.waitSeq || 0) - (b.waitSeq || 0));
      const idx = active.findIndex(e => e.id === entryId);
      if (idx === -1) return;

      const targetIdx = idx + direction;
      if (targetIdx < 0 || targetIdx >= active.length) return;

      const current = active[idx];
      const target = active[targetIdx];

      // Swap wait tickets
      const temp = current.waitSeq;
      current.waitSeq = target.waitSeq;
      target.waitSeq = temp;

      syncQueue();
      saveState();
      renderAll();
      showToast(`Bumped "${current.name}" ${direction < 0 ? 'forward' : 'back'} in line!`, "📋");
    }

    function handlePlayFirstEntry(entryId) {
      const data = getActiveData();
      const entry = data.entries.find(e => e.id === entryId);
      if (!entry || entry.isResting) return;

      const minSeq = Math.min(...data.entries.filter(e => !e.isResting).map(e => e.waitSeq || 0), 1);
      entry.waitSeq = minSeq - 1;

      syncQueue();
      saveState();
      renderAll();
      showToast(`"${entry.name}" is now at the front of the queue!`, "⚡");
    }

    function handlePlayFirst(matchId) {
      const data = getActiveData();
      const match = data.matches.find(m => m.id === matchId);
      if (!match) return;

      const p1 = getEntry(match.p1Id);
      const p2 = getEntry(match.p2Id);
      if (!p1 || !p2) return;

      const minSeq = Math.min(...data.entries.filter(e => !e.isResting).map(e => e.waitSeq || 0), 1);
      p1.waitSeq = minSeq - 2;
      p2.waitSeq = minSeq - 1;

      // Invalidate unstarted live match so this match takes over court
      const live = data.matches.find(m => !m.isCompleted);
      if (live && live.score1 === 0 && live.score2 === 0) {
        data.matches = data.matches.filter(m => m.id !== live.id);
      }

      syncQueue();
      saveState();
      renderAll();
      showToast(`${p1.name} vs ${p2.name} is now playing on Table 1!`, "⚡");
    }

    function handleMoveQueue(matchId, direction) {
      const data = getActiveData();
      const pending = data.matches.filter(m => !m.isCompleted);
      const idx = pending.findIndex(m => m.id === matchId);
      if (idx <= 0 && direction < 0) return; // Cannot move above or while playing
      if (idx === -1) return;

      const targetIdx = idx + direction;
      if (targetIdx < 1 || targetIdx >= pending.length) return; // Keep live match at index 0

      const matchA = pending[idx];
      const matchB = pending[targetIdx];

      const pA1 = getEntry(matchA.p1Id);
      const pA2 = getEntry(matchA.p2Id);
      const pB1 = getEntry(matchB.p1Id);
      const pB2 = getEntry(matchB.p2Id);

      if (pA1 && pA2 && pB1 && pB2) {
        const minA = Math.min(pA1.waitSeq, pA2.waitSeq);
        const maxA = Math.max(pA1.waitSeq, pA2.waitSeq);
        const minB = Math.min(pB1.waitSeq, pB2.waitSeq);
        const maxB = Math.max(pB1.waitSeq, pB2.waitSeq);

        pA1.waitSeq = minB;
        pA2.waitSeq = maxB;
        pB1.waitSeq = minA;
        pB2.waitSeq = maxA;

        syncQueue();
        saveState();
        renderMatchups();
        showToast("Reordered Table 1 Queue!", "📋");
      }
    }

    // =========================================================================
    // DRAG-TO-REORDER ENGINE (POINTER EVENTS & ACCESSIBILITY)
    // =========================================================================
    let activeDragSession = null;

    function handleReorderQueue(matchId, newIndex) {
      const snapshot = JSON.stringify(state);
      const data = getActiveData();
      const pending = data.matches.filter(m => !m.isCompleted);
      let curIdx = pending.findIndex(m => String(m.id) === String(matchId));
      if (curIdx === -1) return;

      // Locked slots: 0 is Live Match, 1 is Up Next. Minimum allowed position is 2.
      const targetIdx = Math.max(2, Math.min(newIndex, pending.length - 1));
      if (curIdx === targetIdx) return;

      const curMatch = pending[curIdx];
      const matchNum = curMatch ? curMatch.matchNum : "";

      const step = targetIdx > curIdx ? 1 : -1;
      while (curIdx !== targetIdx) {
        const nextIdx = curIdx + step;
        const matchA = pending[curIdx];
        const matchB = pending[nextIdx];
        const pA1 = getEntry(matchA.p1Id);
        const pA2 = getEntry(matchA.p2Id);
        const pB1 = getEntry(matchB.p1Id);
        const pB2 = getEntry(matchB.p2Id);
        if (pA1 && pA2 && pB1 && pB2) {
          const minA = Math.min(pA1.waitSeq, pA2.waitSeq);
          const maxA = Math.max(pA1.waitSeq, pA2.waitSeq);
          const minB = Math.min(pB1.waitSeq, pB2.waitSeq);
          const maxB = Math.max(pB1.waitSeq, pB2.waitSeq);

          if (pA1.waitSeq <= pA2.waitSeq) {
            pA1.waitSeq = minB;
            pA2.waitSeq = maxB;
          } else {
            pA1.waitSeq = maxB;
            pA2.waitSeq = minB;
          }
          if (pB1.waitSeq <= pB2.waitSeq) {
            pB1.waitSeq = minA;
            pB2.waitSeq = maxA;
          } else {
            pB1.waitSeq = maxA;
            pB2.waitSeq = minA;
          }
        }
        const temp = pending[curIdx];
        pending[curIdx] = pending[nextIdx];
        pending[nextIdx] = temp;
        curIdx = nextIdx;
      }

      syncQueue();
      saveState();
      renderAll();

      showToast(`Moved Match #${matchNum} to position ${targetIdx + 1}`, "📋", {
        undoAction: () => {
          state = JSON.parse(snapshot);
          saveState();
          renderAll();
          showToast("Reorder undone", "↩️");
        },
        duration: 6000
      });
    }

    function handleReorderPlayer(entryId, newIndex) {
      const snapshot = JSON.stringify(state);
      const data = getActiveData();
      const active = data.entries.filter(e => !e.isResting).sort((a, b) => (a.waitSeq || 0) - (b.waitSeq || 0));
      let curIdx = active.findIndex(e => String(e.id) === String(entryId));
      if (curIdx === -1) return;

      const targetIdx = Math.max(0, Math.min(newIndex, active.length - 1));
      if (curIdx === targetIdx) return;

      const movedEntry = active[curIdx];
      const entryName = movedEntry ? movedEntry.name : "";

      const step = targetIdx > curIdx ? 1 : -1;
      while (curIdx !== targetIdx) {
        const nextIdx = curIdx + step;
        const current = active[curIdx];
        const target = active[nextIdx];

        const temp = current.waitSeq;
        current.waitSeq = target.waitSeq;
        target.waitSeq = temp;

        active[curIdx] = target;
        active[nextIdx] = current;
        curIdx = nextIdx;
      }

      syncQueue();
      saveState();
      renderAll();

      showToast(`Moved "${entryName}" to #${targetIdx + 1} in wait line`, "📋", {
        undoAction: () => {
          state = JSON.parse(snapshot);
          saveState();
          renderAll();
          showToast("Roster reorder undone", "↩️");
        },
        duration: 6000
      });
    }

    /**
     * Reusable Drag-to-Reorder Helper using Pointer Events API
     * Supports mouse, touch, pen, and full keyboard accessibility.
     */
    function makeSortable(container, itemSelector, handleSelector, onReorder) {
      if (!container) return;

      const allItems = Array.from(container.querySelectorAll(itemSelector));

      allItems.forEach(item => {
        const handle = item.querySelector(handleSelector);
        if (!handle || item.dataset.locked === "true") return;

        handle.addEventListener("pointerdown", onPointerDown);
        handle.addEventListener("keydown", onKeyDown);
      });

      function onPointerDown(e) {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        const handle = e.currentTarget;
        const item = handle.closest(itemSelector);
        if (!item || item.dataset.locked === "true") return;

        e.preventDefault();
        try { handle.setPointerCapture(e.pointerId); } catch (err) {}

        startPointerDrag(item, handle, e);
      }

      function startPointerDrag(item, handle, startEvent) {
        if (activeDragSession) {
          activeDragSession.cancel();
        }

        try { navigator.vibrate?.(10); } catch (err) {}

        const rect = item.getBoundingClientRect();
        const itemId = item.dataset.id;
        const minTargetIndex = parseInt(container.dataset.minDropIndex || "0", 10);
        const initialItems = Array.from(container.querySelectorAll(itemSelector));
        const initialIndex = initialItems.indexOf(item);
        const nextSibling = item.nextElementSibling;

        // Create floating drag avatar clone
        const avatar = item.cloneNode(true);
        avatar.className = item.className + " drag-avatar";
        avatar.style.left = `${rect.left}px`;
        avatar.style.top = `${rect.top}px`;
        avatar.style.width = `${rect.width}px`;
        avatar.style.height = `${rect.height}px`;
        avatar.style.margin = "0";
        document.body.appendChild(avatar);

        // Mark the in-place item as ghost / placeholder
        item.classList.add("drag-ghost");
        document.body.style.userSelect = "none";
        document.body.style.webkitUserSelect = "none";

        const pointerOffset = {
          x: startEvent.clientX - rect.left,
          y: startEvent.clientY - rect.top
        };

        const session = {
          cancel: () => {
            cleanup();
            avatar.remove();
            item.classList.remove("drag-ghost");
            // Restore to original DOM location if it was moved during drag
            if (nextSibling && nextSibling.parentNode === container) {
              container.insertBefore(item, nextSibling);
            } else {
              container.appendChild(item);
            }
          }
        };
        activeDragSession = session;

        function cleanup() {
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onUp);
          window.removeEventListener("pointercancel", onCancel);
          window.removeEventListener("keydown", onWindowKeyDown);
          document.body.style.userSelect = "";
          document.body.style.webkitUserSelect = "";
          try { handle.releasePointerCapture(startEvent.pointerId); } catch (err) {}
          activeDragSession = null;
        }

        function onMove(e) {
          const left = e.clientX - pointerOffset.x;
          const top = e.clientY - pointerOffset.y;
          avatar.style.left = `${left}px`;
          avatar.style.top = `${top}px`;

          // Auto-scroll near edge
          const edgeThreshold = 60;
          const speed = 12;
          if (e.clientY < edgeThreshold) {
            window.scrollBy({ top: -speed, behavior: "instant" });
          } else if (e.clientY > window.innerHeight - edgeThreshold) {
            window.scrollBy({ top: speed, behavior: "instant" });
          }
          if (container.scrollWidth > container.clientWidth) {
            const cRect = container.getBoundingClientRect();
            if (e.clientX < cRect.left + 40) {
              container.scrollLeft -= speed;
            } else if (e.clientX > cRect.right - 40) {
              container.scrollLeft += speed;
            }
          }

          // Hit-test against valid candidate sibling cards
          const allCurrent = Array.from(container.querySelectorAll(itemSelector));
          const candidateCards = allCurrent.filter((c, idx) => {
            return c !== item && !c.classList.contains("drag-ghost") && c.dataset.locked !== "true" && idx >= minTargetIndex;
          });

          if (candidateCards.length === 0) return;

          let closestCard = null;
          let minDistance = Infinity;
          const ptrX = e.clientX;
          const ptrY = e.clientY;

          candidateCards.forEach(c => {
            const cr = c.getBoundingClientRect();
            const cx = cr.left + cr.width / 2;
            const cy = cr.top + cr.height / 2;
            const dist = Math.hypot(ptrX - cx, ptrY - cy);
            if (dist < minDistance) {
              minDistance = dist;
              closestCard = c;
            }
          });

          if (closestCard) {
            const cr = closestCard.getBoundingClientRect();
            const isHorizontal = container.classList.contains("roster-chips-container") || container.scrollWidth > container.clientWidth;
            const isAfter = isHorizontal
              ? (ptrX > cr.left + cr.width / 2)
              : (ptrY > cr.top + cr.height / 2);

            if (isAfter) {
              closestCard.after(item);
            } else {
              closestCard.before(item);
            }
          }
        }

        function onUp(e) {
          cleanup();
          try { navigator.vibrate?.(10); } catch (err) {}
          avatar.remove();
          item.classList.remove("drag-ghost");

          if (!localStorage.getItem("spinrobin_drag_hint_dismissed")) {
            localStorage.setItem("spinrobin_drag_hint_dismissed", "1");
            document.getElementById("dragHintBanner")?.remove();
          }

          const finalItems = Array.from(container.querySelectorAll(itemSelector));
          const finalIndex = finalItems.indexOf(item);

          if (finalIndex !== initialIndex && finalIndex >= minTargetIndex) {
            onReorder(itemId, initialIndex, finalIndex);
          }
        }

        function onCancel() {
          session.cancel();
        }

        function onWindowKeyDown(e) {
          if (e.key === "Escape") {
            e.preventDefault();
            session.cancel();
          }
        }

        window.addEventListener("pointermove", onMove, { passive: true });
        window.addEventListener("pointerup", onUp);
        window.addEventListener("pointercancel", onCancel);
        window.addEventListener("keydown", onWindowKeyDown);
      }

      function onKeyDown(e) {
        const handle = e.currentTarget;
        const item = handle.closest(itemSelector);
        if (!item || item.dataset.locked === "true") return;

        const minTargetIndex = parseInt(container.dataset.minDropIndex || "0", 10);
        const items = Array.from(container.querySelectorAll(itemSelector));
        const curIdx = items.indexOf(item);
        const label = handle.getAttribute("aria-label") || "Item";

        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          if (!item.classList.contains("is-keyboard-grabbed")) {
            items.forEach(el => el.classList.remove("is-keyboard-grabbed"));
            item.classList.add("is-keyboard-grabbed");
            item.dataset.initialKeyboardIndex = curIdx;
            try { navigator.vibrate?.(10); } catch (err) {}
            announceA11y(`Picked up ${label}. Position ${curIdx + 1} of ${items.length}. Use arrow keys to reorder, Space to drop, Escape to cancel.`);
          } else {
            item.classList.remove("is-keyboard-grabbed");
            try { navigator.vibrate?.(10); } catch (err) {}
            announceA11y(`Dropped ${label} at position ${curIdx + 1} of ${items.length}.`);
            const fromIdx = parseInt(item.dataset.initialKeyboardIndex || `${curIdx}`, 10);
            if (fromIdx !== curIdx) {
              onReorder(item.dataset.id, fromIdx, curIdx);
            }
          }
        } else if (item.classList.contains("is-keyboard-grabbed")) {
          if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
            e.preventDefault();
            const targetIdx = Math.max(minTargetIndex, curIdx - 1);
            if (targetIdx !== curIdx) {
              const targetItem = items[targetIdx];
              targetItem.before(item);
              handle.focus();
              try { navigator.vibrate?.(10); } catch (err) {}
              announceA11y(`Moved to position ${targetIdx + 1} of ${items.length}.`);
            }
          } else if (e.key === "ArrowDown" || e.key === "ArrowRight") {
            e.preventDefault();
            const targetIdx = Math.min(items.length - 1, curIdx + 1);
            if (targetIdx !== curIdx) {
              const targetItem = items[targetIdx];
              targetItem.after(item);
              handle.focus();
              try { navigator.vibrate?.(10); } catch (err) {}
              announceA11y(`Moved to position ${targetIdx + 1} of ${items.length}.`);
            }
          } else if (e.key === "Escape") {
            e.preventDefault();
            item.classList.remove("is-keyboard-grabbed");
            announceA11y(`Reorder cancelled.`);
            renderAll();
          }
        }
      }
    }

    function handleShuffleQueue() {
      const data = getActiveData();
      const live = data.matches.find(m => !m.isCompleted);
      const liveP1Id = live ? live.p1Id : null;
      const liveP2Id = live ? live.p2Id : null;

      const waiting = data.entries.filter(e => !e.isResting && e.id !== liveP1Id && e.id !== liveP2Id);
      if (waiting.length < 2) {
        showToast("Not enough waiting players to shuffle!", "ℹ️");
        return;
      }

      const seqs = waiting.map(e => e.waitSeq).sort((a, b) => a - b);
      for (let i = seqs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [seqs[i], seqs[j]] = [seqs[j], seqs[i]];
      }

      waiting.forEach((e, idx) => {
        e.waitSeq = seqs[idx];
      });

      syncQueue();
      saveState();
      renderAll();
      showToast("Shuffled waiting line order!", "🎲");
    }

    function handleSwapSides(matchId) {
      const data = getActiveData();
      const match = data.matches.find(m => m.id === matchId);
      if (!match) return;

      const tempP1 = match.p1Id;
      match.p1Id = match.p2Id;
      match.p2Id = tempP1;

      const tempScore = match.score1;
      match.score1 = match.score2;
      match.score2 = tempScore;

      saveState();
      renderMatchups();
      showToast("Swapped Table Side A and B!", "⇄");
    }

    function handleSwapPartnersInTeam(teamId) {
      const team = state.doubles.entries.find(t => t.id === teamId);
      if (!team) return;

      const temp = team.playerA;
      team.playerA = team.playerB;
      team.playerB = temp;
      team.name = `${team.playerA} / ${team.playerB}`;

      saveState();
      renderAll();
      showToast(`Swapped partners! Now: "${team.name}"`, "⇄");
    }

    // --- MATCH REBALANCING & PLAYER SWAPPING ---
    function tradePlayerInMatch(sourceMatchId, playerToReplaceId, targetPlayerId) {
      const data = getActiveData();
      const sourceMatch = data.matches.find(m => m.id === sourceMatchId);
      if (!sourceMatch) return false;

      const oldPlayer = getEntry(playerToReplaceId);
      const targetPlayer = getEntry(targetPlayerId);
      if (!oldPlayer || !targetPlayer) return false;

      // Find if targetPlayer is currently in another uncompleted match
      const otherMatch = data.matches.find(m => !m.isCompleted && m.id !== sourceMatchId && (m.p1Id === targetPlayerId || m.p2Id === targetPlayerId));

      if (otherMatch) {
        // Two-way trade between sourceMatch and otherMatch
        if (sourceMatch.p1Id === playerToReplaceId) {
          sourceMatch.p1Id = targetPlayerId;
        } else {
          sourceMatch.p2Id = targetPlayerId;
        }

        if (otherMatch.p1Id === targetPlayerId) {
          otherMatch.p1Id = playerToReplaceId;
        } else {
          otherMatch.p2Id = playerToReplaceId;
        }

        sourceMatch.score1 = 0; sourceMatch.score2 = 0; sourceMatch.isCompleted = false; sourceMatch.winnerId = null;
        otherMatch.score1 = 0; otherMatch.score2 = 0; otherMatch.isCompleted = false; otherMatch.winnerId = null;
      } else {
        // Target player is in queue waiting / resting: swap into sourceMatch
        if (sourceMatch.p1Id === playerToReplaceId) {
          sourceMatch.p1Id = targetPlayerId;
        } else {
          sourceMatch.p2Id = targetPlayerId;
        }
        sourceMatch.score1 = 0; sourceMatch.score2 = 0; sourceMatch.isCompleted = false; sourceMatch.winnerId = null;
      }

      // Swap wait tickets to keep queue order balanced
      const tempSeq = oldPlayer.waitSeq;
      oldPlayer.waitSeq = targetPlayer.waitSeq;
      targetPlayer.waitSeq = tempSeq;

      saveState();
      renderAll();

      const newP1 = getEntry(sourceMatch.p1Id);
      const newP2 = getEntry(sourceMatch.p2Id);
      showToast(`Swapped "${oldPlayer.name}" with "${targetPlayer.name}"! Match is now ${newP1?.name} vs ${newP2?.name}`, "✨");
      return true;
    }

    function openTradeModal(matchId, preselectSlot = 2) {
      const data = getActiveData();
      const match = data.matches.find(m => m.id === matchId);
      if (!match) return;

      if (match.isCompleted) {
        showToast("Cannot swap players in a completed match. Clear result first.", "⚠️");
        return;
      }

      state.tradingMatchId = matchId;
      state.tradingSlot = preselectSlot;

      const p1 = getEntry(match.p1Id);
      const p2 = getEntry(match.p2Id);

      dom.tradeModalTitle.textContent = `⇄ Rebalance Match #${match.matchNum}`;

      dom.tradeTargetSelectorGroup.innerHTML = `
        <button type="button" class="btn btn-sm ${state.tradingSlot === 1 ? 'btn-primary' : ''} flex-1" id="btnSelectReplaceP1">
          Replace ${escapeHtml(p1?.name || 'Player 1')}
        </button>
        <button type="button" class="btn btn-sm ${state.tradingSlot === 2 ? 'btn-primary' : ''} flex-1" id="btnSelectReplaceP2">
          Replace ${escapeHtml(p2?.name || 'Player 2')}
        </button>
      `;

      dom.tradeTargetSelectorGroup.querySelector("#btnSelectReplaceP1").addEventListener("click", () => {
        state.tradingSlot = 1;
        updateTradeSelectorHighlight();
        renderTradeModalCandidates();
      });

      dom.tradeTargetSelectorGroup.querySelector("#btnSelectReplaceP2").addEventListener("click", () => {
        state.tradingSlot = 2;
        updateTradeSelectorHighlight();
        renderTradeModalCandidates();
      });

      renderTradeModalCandidates();
      dom.tradeModal.style.display = "flex";
    }

    function updateTradeSelectorHighlight() {
      const b1 = dom.tradeTargetSelectorGroup.querySelector("#btnSelectReplaceP1");
      const b2 = dom.tradeTargetSelectorGroup.querySelector("#btnSelectReplaceP2");
      if (b1) b1.classList.toggle("btn-primary", state.tradingSlot === 1);
      if (b2) b2.classList.toggle("btn-primary", state.tradingSlot === 2);
    }

    function renderTradeModalCandidates() {
      const data = getActiveData();
      const match = data.matches.find(m => m.id === state.tradingMatchId);
      if (!match) return;

      const playerToReplaceId = state.tradingSlot === 1 ? match.p1Id : match.p2Id;
      const stayPlayerId = state.tradingSlot === 1 ? match.p2Id : match.p1Id;

      const container = dom.tradeCandidatesContainer;
      container.innerHTML = "";

      // Eligible candidates are all entries in roster except the 2 currently in this match
      const eligibleCandidates = data.entries.filter(e => e.id !== playerToReplaceId && e.id !== stayPlayerId);

      if (eligibleCandidates.length === 0) {
        container.innerHTML = `<div class="font-xs text-muted" style="padding: 8px;">No other participants in roster to trade with. Add more players above.</div>`;
      } else {
        eligibleCandidates.forEach(cand => {
          // Determine candidate's current status (e.g. playing in live match, queued in match #X, waiting, or resting)
          const inMatch = data.matches.find(m => !m.isCompleted && m.id !== match.id && (m.p1Id === cand.id || m.p2Id === cand.id));
          let statusLabel = "";
          if (cand.isResting) {
            statusLabel = "😴 Resting";
          } else if (inMatch) {
            statusLabel = `In Match #${inMatch.matchNum}`;
          } else {
            statusLabel = `Waiting in queue`;
          }

          const card = document.createElement("div");
          card.className = "trade-match-candidate";

          card.innerHTML = `
            <div class="flex-row justify-between" style="justify-content:space-between; align-items:center;">
              <span class="font-bold font-sm">${escapeHtml(cand.name)}</span>
              <span class="font-xs text-muted">${statusLabel}</span>
            </div>
            <button type="button" class="trade-candidate-btn flex-1 margin-top-1" data-target="${cand.id}" style="width:100%; display:flex; justify-content:space-between; align-items:center;">
              <span>⇄ Trade with <strong>${escapeHtml(cand.name)}</strong></span>
              <span>➔</span>
            </button>
          `;

          card.querySelector(".trade-candidate-btn").addEventListener("click", () => {
            tradePlayerInMatch(match.id, playerToReplaceId, cand.id);
            closeTradeModal();
          });

          container.appendChild(card);
        });
      }

      // Populate manual select dropdown
      dom.tradeManualSelect.innerHTML = "";
      eligibleCandidates.forEach(e => {
        const opt = document.createElement("option");
        opt.value = e.id;
        opt.textContent = `${e.name} ${e.isResting ? '(Resting)' : ''}`;
        dom.tradeManualSelect.appendChild(opt);
      });
    }

    function handleExecuteManualTrade() {
      if (!state.tradingMatchId) return;
      const data = getActiveData();
      const match = data.matches.find(m => m.id === state.tradingMatchId);
      if (!match) return;

      const playerToReplaceId = state.tradingSlot === 1 ? match.p1Id : match.p2Id;
      const targetId = dom.tradeManualSelect.value;
      if (!targetId) return;

      tradePlayerInMatch(match.id, playerToReplaceId, targetId);
      closeTradeModal();
    }

    function closeTradeModal() {
      dom.tradeModal.style.display = "none";
      state.tradingMatchId = null;
    }
    // --- EDIT PARTICIPANT MODAL ---
    function openEditModal(entryId) {
      const data = getActiveData();
      const entry = data.entries.find(e => e.id === entryId);
      if (!entry) return;

      state.editingEntryId = entryId;
      const doublesMode = isDoubles();

      dom.modalTitle.textContent = doublesMode ? "✏️ Edit / Switch Doubles Team" : "✏️ Edit Player Name";
      dom.modalSinglesFields.style.display = doublesMode ? "none" : "block";
      dom.modalDoublesFields.style.display = doublesMode ? "flex" : "none";

      if (!doublesMode) {
        dom.editPlayerNameInput.value = entry.name;
        dom.editModal.style.display = "flex";
        dom.editPlayerNameInput.focus();
        dom.editPlayerNameInput.select();
      } else {
        dom.editPartnerAInput.value = entry.playerA || "";
        dom.editPartnerBInput.value = entry.playerB || "";

        dom.modalSwapTargetTeam.innerHTML = "";
        const otherTeams = data.entries.filter(t => t.id !== entryId);
        if (otherTeams.length === 0) {
          dom.modalSwapTargetTeam.innerHTML = '<option value="">No other teams</option>';
          dom.btnExecuteTeamSwap.disabled = true;
        } else {
          dom.btnExecuteTeamSwap.disabled = false;
          otherTeams.forEach(t => {
            const opt = document.createElement("option");
            opt.value = t.id;
            opt.textContent = t.name;
            dom.modalSwapTargetTeam.appendChild(opt);
          });
        }

        dom.editModal.style.display = "flex";
        dom.editPartnerAInput.focus();
      }
    }

    function closeEditModal() {
      dom.editModal.style.display = "none";
      state.editingEntryId = null;
    }

    function handleSaveParticipantEdit() {
      if (!state.editingEntryId) return;
      const data = getActiveData();
      const entry = data.entries.find(e => e.id === state.editingEntryId);
      if (!entry) return;

      if (!isDoubles()) {
        const newName = dom.editPlayerNameInput.value.trim();
        if (!newName) return;
        const exists = data.entries.some(p => p.id !== entry.id && p.name.toLowerCase() === newName.toLowerCase());
        if (exists) {
          showToast(`Another player is already named "${newName}"!`, "⚠️");
          return;
        }
        const oldName = entry.name;
        entry.name = newName;
        closeEditModal();
        saveState();
        renderAll();
        showToast(`Renamed "${oldName}" ➔ "${newName}"`, "✏️");
      } else {
        const pA = dom.editPartnerAInput.value.trim();
        const pB = dom.editPartnerBInput.value.trim();
        if (!pA || !pB) {
          showToast("Both Partner A & B must have names!", "⚠️");
          return;
        }
        const newTeamName = `${pA} / ${pB}`;
        const exists = data.entries.some(t => t.id !== entry.id && t.name.toLowerCase() === newTeamName.toLowerCase());
        if (exists) {
          showToast(`Another team is already named "${newTeamName}"!`, "⚠️");
          return;
        }
        const oldName = entry.name;
        entry.playerA = pA;
        entry.playerB = pB;
        entry.name = newTeamName;
        closeEditModal();
        saveState();
        renderAll();
        showToast(`Updated Team: "${oldName}" ➔ "${newTeamName}"`, "✏️");
      }
    }

    function handleModalSwapPartnersInTeam() {
      const a = dom.editPartnerAInput.value.trim();
      const b = dom.editPartnerBInput.value.trim();
      dom.editPartnerAInput.value = b;
      dom.editPartnerBInput.value = a;
      showToast("Flipped Partner A and Partner B!", "⇄");
    }

    function handleModalExecuteTeamSwap() {
      if (!state.editingEntryId) return;
      const targetTeamId = dom.modalSwapTargetTeam.value;
      if (!targetTeamId) return;

      const team1 = state.doubles.entries.find(t => t.id === state.editingEntryId);
      const team2 = state.doubles.entries.find(t => t.id === targetTeamId);
      if (!team1 || !team2) return;

      const pick1 = dom.modalSwapPlayerPick.value;
      const pick2 = dom.modalSwapTargetPartner.value;

      const playerFromTeam1 = pick1 === "A" ? team1.playerA : team1.playerB;
      const playerFromTeam2 = pick2 === "A" ? team2.playerA : team2.playerB;

      if (pick1 === "A") team1.playerA = playerFromTeam2;
      else team1.playerB = playerFromTeam2;

      if (pick2 === "A") team2.playerA = playerFromTeam1;
      else team2.playerB = playerFromTeam1;

      team1.name = `${team1.playerA} / ${team1.playerB}`;
      team2.name = `${team2.playerA} / ${team2.playerB}`;

      closeEditModal();
      saveState();
      renderAll();
      showToast(`Swapped "${playerFromTeam1}" with "${playerFromTeam2}"!`, "⇄");
    }

    // --- MATCH SCORING (ENDLESS TABLE 1 QUEUE) ---
    function recordScore(matchId, p1Score, p2Score, explicitWinnerId = null) {
      const data = getActiveData();
      const match = data.matches.find(m => String(m.id) === String(matchId));
      if (!match) return;

      const snapshot = JSON.stringify(state);

      if (explicitWinnerId) {
        match.winnerId = explicitWinnerId;
        match.isCompleted = true;
        match.completedAt = Date.now();

        let s1 = Math.max(0, parseInt(p1Score !== undefined && p1Score !== null ? p1Score : match.score1, 10) || 0);
        let s2 = Math.max(0, parseInt(p2Score !== undefined && p2Score !== null ? p2Score : match.score2, 10) || 0);

        // If winner's score is not higher than opponent's, set to opponent's score + 1
        if (explicitWinnerId === match.p1Id) {
          if (s1 <= s2) s1 = s2 + 1;
        } else {
          if (s2 <= s1) s2 = s1 + 1;
        }

        match.score1 = s1;
        match.score2 = s2;

        // Push BOTH players to the back of the queue
        data.waitCounter = Math.max(...data.entries.map(e => e.waitSeq || 0), data.entries.length);
        const p1 = getEntry(match.p1Id);
        const p2 = getEntry(match.p2Id);
        const now = Date.now();
        if (p1) {
          p1.waitSeq = ++data.waitCounter;
          p1.lastFinishedAt = now;
        }
        if (p2) {
          p2.waitSeq = ++data.waitCounter;
          p2.lastFinishedAt = now;
        }

        syncQueue();
        saveState();
        renderAll();

        // Soft highlight feedback on live match card
        const liveCard = document.querySelector(".court-banner-live");
        if (liveCard) {
          liveCard.classList.remove("score-flash");
          void liveCard.offsetWidth;
          liveCard.classList.add("score-flash");
        }

        const winner = getEntry(explicitWinnerId);
        const winnerName = winner ? winner.name : "Winner";
        const winningScore = explicitWinnerId === match.p1Id ? s1 : s2;
        const losingScore = explicitWinnerId === match.p1Id ? s2 : s1;

        const nextLive = data.matches.find(m => !m.isCompleted);
        let nextText = "";
        if (nextLive) {
          const nP1 = getEntry(nextLive.p1Id);
          const nP2 = getEntry(nextLive.p2Id);
          if (nP1 && nP2) {
            nextText = ` · Next: ${nP1.name} vs ${nP2.name}`;
          }
        }

        showToast(`${winnerName} won ${winningScore}–${losingScore}${nextText}`, "🏆", {
          undoAction: () => {
            state = JSON.parse(snapshot);
            syncQueue();
            saveState();
            renderAll();
            showToast("Match result undone", "↩️");
          },
          duration: 6000
        });

      } else {
        // Live score counter update (+, -, typing): ONLY saves live score
        const s1 = Math.max(0, parseInt(p1Score, 10) || 0);
        const s2 = Math.max(0, parseInt(p2Score, 10) || 0);
        match.score1 = s1;
        match.score2 = s2;
        match.winnerId = null;
        match.isCompleted = false;

        saveState();
      }
    }

    function clearMatchScore(matchId) {
      const data = getActiveData();
      const match = data.matches.find(m => m.id === matchId);
      if (!match) return;

      const snapshot = JSON.stringify(state);

      match.winnerId = null;
      match.score1 = 0;
      match.score2 = 0;
      match.isCompleted = false;

      syncQueue();
      saveState();
      renderAll();
      showToast(`Cleared result for Match #${match.matchNum}`, "🔄", {
        undoAction: () => {
          state = JSON.parse(snapshot);
          saveState();
          renderAll();
          showToast("Match score restored", "↩️");
        },
        duration: 6000
      });
    }

    // --- STREAK HELPER ---
    function calculateStreak(entryId, matches) {
      const completed = matches.filter(m => m.isCompleted && (m.p1Id === entryId || m.p2Id === entryId));
      if (completed.length === 0) return { text: "—", cls: "streak-neutral" };

      let currentStreakType = null;
      let count = 0;

      for (let i = completed.length - 1; i >= 0; i--) {
        const m = completed[i];
        const isWin = (m.winnerId === entryId);
        const type = isWin ? "W" : "L";

        if (currentStreakType === null) {
          currentStreakType = type;
          count = 1;
        } else if (currentStreakType === type) {
          count++;
        } else {
          break;
        }
      }

      if (currentStreakType === "W") {
        return {
          text: count >= 2 ? `🔥 ${count}W` : `${count}W`,
          cls: count >= 2 ? "streak-fire" : "text-win"
        };
      } else {
        return {
          text: `${count}L`,
          cls: "streak-cold"
        };
      }
    }

    // --- RENDERING ALL VIEWS ---
    function renderAll() {
      if (activeDragSession) {
        activeDragSession.cancel();
      }
      renderStats();
      renderRosterChips();
      populateFilterSelect();
      renderMatchups();
      renderStandings();
      renderCrosstable();
      renderFairness();
    }

    function renderStats() {
      const data = getActiveData();
      const totalEntries = data.entries.length;
      const activeEntries = data.entries.filter(e => !e.isResting).length;
      const completedMatches = data.matches.filter(m => m.isCompleted).length;
      const pendingCount = data.matches.filter(m => !m.isCompleted).length;

      dom.statPlayerCount.textContent = totalEntries === activeEntries ? `${totalEntries}` : `${activeEntries}/${totalEntries}`;
      dom.statCompletedMatches.textContent = completedMatches;
      dom.statTotalMatches.textContent = completedMatches + pendingCount;

      const activePercent = totalEntries > 0 ? Math.round((activeEntries / totalEntries) * 100) : 100;
      dom.progressBarFill.style.width = `${activePercent}%`;
      dom.statProgressPercent.textContent = `${activePercent}%`;

      const typeLabel = isDoubles() ? "team" : "player";

      if (activeEntries < 2) {
        dom.fairnessSummaryText.innerHTML = `
          <span>⏱️</span> Endless Table 1 Queue: Enter ${isDoubles() ? 'teams' : 'names'} above to start.
        `;
        dom.fairnessSubText.textContent = "Longest-Wait-First order · Winner and loser go to back of line.";
      } else {
        dom.fairnessSummaryText.innerHTML = `
          <span>⏱️</span> Endless Queue: <strong>Longest-Wait-First</strong> (${activeEntries} active ${typeLabel}s &bull; ${completedMatches} completed).
        `;
        dom.fairnessSubText.textContent = "Winner & loser go to back of line · 🚫 Rematch guard active.";
      }
    }

    function renderRosterChips() {
      dom.rosterChipsContainer.innerHTML = '';
      dom.rosterChipsContainer.appendChild(dom.rosterTitle);

      const data = getActiveData();
      const entries = [...data.entries].sort((a, b) => {
        if (a.isResting !== b.isResting) return a.isResting ? 1 : -1;
        return (a.waitSeq || 0) - (b.waitSeq || 0);
      });
      const doublesMode = isDoubles();

      if (entries.length === 0) {
        const span = document.createElement("span");
        span.className = "font-xs text-muted";
        span.textContent = doublesMode ? "No teams added yet. Add team pairs above." : "No players added yet. Enter names above.";
        dom.rosterChipsContainer.appendChild(span);
        return;
      }

      entries.forEach((entry, idx) => {
        const chip = document.createElement("div");
        chip.className = `player-chip ${entry.isResting ? 'is-resting' : ''}`;
        chip.dataset.id = entry.id;
        if (entry.isResting) chip.dataset.locked = "true";

        const handleHtml = !entry.isResting
          ? `<span class="chip-drag-handle drag-handle" role="button" tabindex="0" aria-label="Reorder ${escapeHtml(entry.name)}" title="Hold ⠿ to drag · Space to pick up">⠿</span>`
          : '';

        if (!doublesMode) {
          chip.innerHTML = `
            ${handleHtml}
            <span class="chip-name" title="Click to rename player">#${idx + 1} ${escapeHtml(entry.name)}</span>
            <button type="button" class="chip-rest-btn" title="${entry.isResting ? 'Return from rest' : 'Put on break / rest'}" aria-label="Toggle rest">
              ${entry.isResting ? '😴' : '🟢'}
            </button>
            <span class="chip-edit-icon" title="Edit name" aria-label="Edit name">✏️</span>
            <button type="button" class="chip-remove-btn" title="Remove player" aria-label="Remove player">&times;</button>
          `;
          chip.querySelector(".chip-name").addEventListener("click", () => openEditModal(entry.id));
          chip.querySelector(".chip-edit-icon").addEventListener("click", () => openEditModal(entry.id));
          chip.querySelector(".chip-rest-btn").addEventListener("click", (e) => {
            e.stopPropagation();
            togglePlayerRest(entry.id);
          });
        } else {
          chip.innerHTML = `
            ${handleHtml}
            <span class="chip-name" title="Click to edit team">#${idx + 1} 👥 ${escapeHtml(entry.name)}</span>
            <button type="button" class="chip-swap-btn" title="Swap Partner A &amp; Partner B" aria-label="Swap partners">⇄</button>
            <button type="button" class="chip-rest-btn" title="${entry.isResting ? 'Return team from rest' : 'Rest team'}" aria-label="Toggle rest">
              ${entry.isResting ? '😴' : '🟢'}
            </button>
            <span class="chip-edit-icon" title="Edit team / switch players" aria-label="Edit team">✏️</span>
            <button type="button" class="chip-remove-btn" title="Remove team" aria-label="Remove team">&times;</button>
          `;
          chip.querySelector(".chip-name").addEventListener("click", () => openEditModal(entry.id));
          chip.querySelector(".chip-edit-icon").addEventListener("click", () => openEditModal(entry.id));
          chip.querySelector(".chip-swap-btn").addEventListener("click", (e) => {
            e.stopPropagation();
            handleSwapPartnersInTeam(entry.id);
          });
          chip.querySelector(".chip-rest-btn").addEventListener("click", (e) => {
            e.stopPropagation();
            togglePlayerRest(entry.id);
          });
        }

        chip.querySelector(".chip-remove-btn").addEventListener("click", (e) => {
          e.stopPropagation();
          removeEntry(entry.id);
        });

        dom.rosterChipsContainer.appendChild(chip);
      });

      makeSortable(dom.rosterChipsContainer, ".player-chip", ".chip-drag-handle", (entryId, fromIdx, toIdx) => {
        handleReorderPlayer(entryId, toIdx);
      });
    }

    function populateFilterSelect() {
      const sel = dom.playerFilterSelect;
      const data = getActiveData();
      const current = state.filterPlayerId;
      sel.innerHTML = `<option value="">All ${isDoubles() ? 'Teams' : 'Players'}</option>`;

      data.entries.forEach(e => {
        const opt = document.createElement("option");
        opt.value = e.id;
        opt.textContent = e.name;
        if (e.id === current) opt.selected = true;
        sel.appendChild(opt);
      });
    }

    // --- DEDICATED 1-TABLE COURT VIEW ---
    function renderMatchups() {
      const container = dom.matchesContainer;
      container.innerHTML = "";
      const data = getActiveData();
      const entries = data.entries;
      const activeEntries = entries.filter(e => !e.isResting);

      if (activeEntries.length < 2) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">🏓</div>
            <h3>Add at least 2 players to start</h3>
            <p class="font-xs text-muted margin-top-1">Enter names above to start the Table 1 endless queue.</p>
          </div>
        `;
        return;
      }

      // Filter matches
      let filtered = [...data.matches];

      if (state.filterStatus === "pending") {
        filtered = filtered.filter(m => !m.isCompleted);
      } else if (state.filterStatus === "completed") {
        filtered = filtered.filter(m => m.isCompleted);
      }

      if (state.filterPlayerId) {
        filtered = filtered.filter(m => m.p1Id === state.filterPlayerId || m.p2Id === state.filterPlayerId);
      }

      if (state.searchQuery) {
        filtered = filtered.filter(m => {
          const p1 = getEntry(m.p1Id)?.name.toLowerCase() || "";
          const p2 = getEntry(m.p2Id)?.name.toLowerCase() || "";
          return p1.includes(state.searchQuery) || p2.includes(state.searchQuery);
        });
      }

      if (filtered.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <p class="font-xs text-muted">No matches match the selected filter.</p>
          </div>
        `;
        return;
      }

      const pendingMatches = filtered.filter(m => !m.isCompleted);
      const completedMatches = filtered.filter(m => m.isCompleted);

      // Two-pane grid layout: leftPane (Live + On Deck + Completed) & rightPane (Queue Grid)
      const gridLayout = document.createElement("div");
      gridLayout.className = "court-grid-layout";

      const leftPane = document.createElement("div");
      leftPane.className = "court-left-pane";

      const rightPane = document.createElement("div");
      rightPane.className = "court-right-pane";

      // Section 1: LIVE ON TABLE 1 (STAR CARD, CAPPED AT ~380px)
      if (pendingMatches.length > 0) {
        const liveMatch = pendingMatches[0];
        const p1 = getEntry(liveMatch.p1Id);
        const p2 = getEntry(liveMatch.p2Id);

        const liveCard = document.createElement("div");
        liveCard.className = "court-banner-live";

        liveCard.innerHTML = `
          <div class="court-banner-header">
            <div class="flex-row gap-1">
              <span class="court-status-tag tag-live">Playing</span>
              <span class="text-secondary font-xs font-bold">Table 1 &bull; Match #${liveMatch.matchNum}</span>
            </div>
            <div class="flex-row gap-1">
              <button type="button" class="btn-action-pill" id="btnLiveTradeMatch" title="Switch / Trade opponent">
                ⇄ Trade
              </button>
              <button type="button" class="btn-action-pill" id="btnLiveSwapSides" title="Switch table sides">
                🔀 Sides
              </button>
              <button type="button" class="btn-action-pill" id="btnMidTradeMatch" style="display:none;" title="Trade opponent">⇄</button>
            </div>
          </div>

          <div class="live-match-box">
            <!-- Player / Team 1 Card -->
            <div class="live-player-card ${liveMatch.winnerId === p1?.id ? 'is-winner' : ''}" id="liveCardP1">
              <div class="live-player-info">
                <span class="side-chip" title="Table Side A">A</span>
                <span class="live-player-name">${escapeHtml(p1?.name || 'TBD')}</span>
              </div>
              <div class="flex-row gap-1">
                <div class="score-stepper">
                  <button type="button" class="btn-step" id="btnMinusP1" aria-label="Minus score">−</button>
                  <input type="number" class="player-score-input" id="liveScore1" value="${liveMatch.score1 || 0}" min="0" max="99" inputmode="numeric" aria-label="Player 1 Score">
                  <button type="button" class="btn-step" id="btnPlusP1" aria-label="Plus score">+</button>
                </div>
                <button type="button" class="btn btn-emerald btn-sm btn-win-compact" id="btnLiveWin1" title="Declare Win 1-0">
                  🏆 Win
                </button>
              </div>
            </div>

            <!-- Player / Team 2 Card -->
            <div class="live-player-card ${liveMatch.winnerId === p2?.id ? 'is-winner' : ''}" id="liveCardP2">
              <div class="live-player-info">
                <span class="side-chip" title="Table Side B">B</span>
                <span class="live-player-name">${escapeHtml(p2?.name || 'TBD')}</span>
              </div>
              <div class="flex-row gap-1">
                <div class="score-stepper">
                  <button type="button" class="btn-step" id="btnMinusP2" aria-label="Minus score">−</button>
                  <input type="number" class="player-score-input" id="liveScore2" value="${liveMatch.score2 || 0}" min="0" max="99" inputmode="numeric" aria-label="Player 2 Score">
                  <button type="button" class="btn-step" id="btnPlusP2" aria-label="Plus score">+</button>
                </div>
                <button type="button" class="btn btn-emerald btn-sm btn-win-compact" id="btnLiveWin2" title="Declare Win 1-0">
                  🏆 Win
                </button>
              </div>
            </div>
          </div>

          <div class="live-hint-row">
            <span>Tap + to add points. Tap 🏆 Win to finish the game.</span>
          </div>
        `;

        // Live Event Listeners
        liveCard.querySelector("#btnLiveSwapSides").addEventListener("click", () => handleSwapSides(liveMatch.id));
        liveCard.querySelector("#btnLiveTradeMatch").addEventListener("click", () => openTradeModal(liveMatch.id, 2));
        liveCard.querySelector("#btnMidTradeMatch").addEventListener("click", () => openTradeModal(liveMatch.id, 2));

        const inp1 = liveCard.querySelector("#liveScore1");
        const inp2 = liveCard.querySelector("#liveScore2");
        const btnWin1 = liveCard.querySelector("#btnLiveWin1");
        const btnWin2 = liveCard.querySelector("#btnLiveWin2");

        const updateScoreHighlights = () => {
          const s1 = parseInt(inp1.value, 10) || 0;
          const s2 = parseInt(inp2.value, 10) || 0;
          if (s1 > s2) {
            inp1.classList.add("score-leading");
            inp2.classList.remove("score-leading");
          } else if (s2 > s1) {
            inp2.classList.add("score-leading");
            inp1.classList.remove("score-leading");
          } else {
            inp1.classList.remove("score-leading");
            inp2.classList.remove("score-leading");
          }
        };

        const pulseInput = (inputEl) => {
          if (!inputEl) return;
          inputEl.classList.remove("score-pulse");
          void inputEl.offsetWidth;
          inputEl.classList.add("score-pulse");
        };

        updateScoreHighlights();

        let isWinProcessing = false;
        const triggerLiveWin = (btn, pId) => {
          if (isWinProcessing) return;
          isWinProcessing = true;
          if (btnWin1) btnWin1.disabled = true;
          if (btnWin2) btnWin2.disabled = true;

          // Mis-tap protection: disable the Win buttons for 400ms after a tap
          setTimeout(() => {
            isWinProcessing = false;
            if (btnWin1) btnWin1.disabled = false;
            if (btnWin2) btnWin2.disabled = false;
          }, 400);

          recordScore(liveMatch.id, inp1.value, inp2.value, pId);
        };

        btnWin1.addEventListener("click", (e) => triggerLiveWin(e.currentTarget, liveMatch.p1Id));
        btnWin2.addEventListener("click", (e) => triggerLiveWin(e.currentTarget, liveMatch.p2Id));

        liveCard.querySelector("#btnMinusP1").addEventListener("click", () => {
          const val = Math.max(0, (parseInt(inp1.value, 10) || 0) - 1);
          inp1.value = val;
          recordScore(liveMatch.id, val, inp2.value);
          updateScoreHighlights();
        });

        liveCard.querySelector("#btnPlusP1").addEventListener("click", () => {
          const val = (parseInt(inp1.value, 10) || 0) + 1;
          inp1.value = val;
          recordScore(liveMatch.id, val, inp2.value);
          updateScoreHighlights();
          pulseInput(inp1);
        });

        liveCard.querySelector("#btnMinusP2").addEventListener("click", () => {
          const val = Math.max(0, (parseInt(inp2.value, 10) || 0) - 1);
          inp2.value = val;
          recordScore(liveMatch.id, inp1.value, val);
          updateScoreHighlights();
        });

        liveCard.querySelector("#btnPlusP2").addEventListener("click", () => {
          const val = (parseInt(inp2.value, 10) || 0) + 1;
          inp2.value = val;
          recordScore(liveMatch.id, inp1.value, val);
          updateScoreHighlights();
          pulseInput(inp2);
        });

        const handleScoreInput = () => {
          const s1 = Math.max(0, parseInt(inp1.value, 10) || 0);
          const s2 = Math.max(0, parseInt(inp2.value, 10) || 0);
          recordScore(liveMatch.id, s1, s2);
          updateScoreHighlights();
        };

        inp1.addEventListener("input", handleScoreInput);
        inp1.addEventListener("change", handleScoreInput);
        inp2.addEventListener("input", handleScoreInput);
        inp2.addEventListener("change", handleScoreInput);

        leftPane.appendChild(liveCard);
      }

      // Section 2: ON DECK / UP NEXT
      if (pendingMatches.length > 1) {
        const deckMatch = pendingMatches[1];
        const p1 = getEntry(deckMatch.p1Id);
        const p2 = getEntry(deckMatch.p2Id);

        const deckCard = document.createElement("div");
        deckCard.className = "court-on-deck";
        deckCard.innerHTML = `
          <div class="deck-top-row">
            <span class="court-status-tag tag-deck">Up next</span>
            <span class="font-xs text-muted">Match #${deckMatch.matchNum}</span>
          </div>
          <div class="deck-matchup-title">
            <span>${escapeHtml(p1?.name || '')}</span>
            <span class="font-xs text-muted" style="margin: 0 3px;">vs</span>
            <span>${escapeHtml(p2?.name || '')}</span>
          </div>
          <div class="deck-actions-row">
            <button type="button" class="btn btn-sm btn-primary" id="btnDeckPlayNow" title="Promote to Table 1 immediately">
              ▶ Play
            </button>
            <button type="button" class="btn btn-sm" id="btnDeckTradeMatch" title="Switch / Trade opponent">
              ⇄
            </button>
            <button type="button" class="btn btn-sm" id="btnDeckSwapSides" title="Swap sides">
              🔀
            </button>
          </div>
        `;

        deckCard.querySelector("#btnDeckPlayNow").addEventListener("click", () => handlePlayFirst(deckMatch.id));
        deckCard.querySelector("#btnDeckTradeMatch").addEventListener("click", () => openTradeModal(deckMatch.id, 2));
        deckCard.querySelector("#btnDeckSwapSides").addEventListener("click", () => handleSwapSides(deckMatch.id));

        leftPane.appendChild(deckCard);
      }


      // Section 4: TABLE 1 UPCOMING QUEUE PREVIEW (RESPONSIVE GRID WITH DRAG-TO-REORDER)
      const queueSec = document.createElement("div");
      queueSec.className = "court-queue-section";

      const queueHeader = document.createElement("div");
      queueHeader.className = "queue-header";
      queueHeader.innerHTML = `
        <div>
          <h3>
            <span>Table 1 Queue</span>
            <span class="font-xs text-muted font-normal">(${pendingMatches.length} pending)</span>
          </h3>
        </div>
        <button type="button" class="btn btn-sm" id="btnShuffleQueue" title="Randomize waiting line order" aria-label="Shuffle queue">
          🎲 <span class="header-btn-label">Shuffle</span>
        </button>
      `;
      queueSec.appendChild(queueHeader);
      queueHeader.querySelector("#btnShuffleQueue").addEventListener("click", handleShuffleQueue);

      // First-use drag hint (remembers dismissal in localStorage)
      if (pendingMatches.length > 2 && !localStorage.getItem("spinrobin_drag_hint_dismissed")) {
        const hintBanner = document.createElement("div");
        hintBanner.className = "drag-hint-banner";
        hintBanner.id = "dragHintBanner";
        hintBanner.innerHTML = `
          <div class="drag-hint-text">
            <span class="drag-hint-icon">⠿</span> Hold and drag to reorder queue
          </div>
          <button type="button" class="btn-dismiss-hint" id="btnDismissDragHint" title="Dismiss tip" aria-label="Dismiss tip">&times;</button>
        `;
        hintBanner.querySelector("#btnDismissDragHint").addEventListener("click", () => {
          localStorage.setItem("spinrobin_drag_hint_dismissed", "1");
          hintBanner.remove();
        });
        queueSec.appendChild(hintBanner);
      }

      const queueList = document.createElement("div");
      queueList.className = "queue-list";
      queueList.dataset.minDropIndex = "2"; // Locked slots: 0 (Live) and 1 (Up Next)

      if (pendingMatches.length === 0) {
        queueList.innerHTML = `<div class="empty-state-card" style="grid-column: 1 / -1;">All scheduled matches for Table 1 have completed!</div>`;
      } else {
        pendingMatches.forEach((m, idx) => {
          const p1 = getEntry(m.p1Id);
          const p2 = getEntry(m.p2Id);
          if (!p1 || !p2) return;

          const card = document.createElement("div");
          card.className = "queue-card";
          card.dataset.id = m.id;
          card.dataset.matchId = m.id;

          const isDraggable = (idx >= 2);
          if (!isDraggable) {
            card.dataset.locked = "true";
          }

          const statusText = idx === 0 ? "Playing" : idx === 1 ? "Up next" : `#${idx + 1} In Line`;
          const dotClass = idx === 0 ? "dot-live" : idx === 1 ? "dot-next" : "dot-pending";

          const handleHtml = isDraggable
            ? `<button type="button" class="drag-handle queue-drag-handle" role="button" tabindex="0" aria-label="Reorder Match #${m.matchNum}" title="Hold ⠿ to drag · Space to pick up">⠿</button>`
            : `<span class="queue-drag-spacer"></span>`;

          card.innerHTML = `
            <div class="queue-card-header">
              <div class="queue-card-left">
                ${handleHtml}
                <div class="queue-card-meta">
                  <span class="status-dot ${dotClass}" title="${statusText}"></span>
                  <span class="queue-num">Match #${m.matchNum}</span>
                </div>
              </div>
              <div class="queue-card-names" title="${escapeHtml(p1.name)} vs ${escapeHtml(p2.name)}">
                <span class="player-name-truncate">${escapeHtml(p1.name)}</span>
                <span class="font-xs text-muted">vs</span>
                <span class="player-name-truncate">${escapeHtml(p2.name)}</span>
              </div>
            </div>

            <div class="queue-card-actions">
              <button type="button" class="btn-play-first" title="Send this match to play first on Table 1" aria-label="Play now">
                ▶ Play
              </button>
              <button type="button" class="btn-action-icon btn-trade-item" title="Trade / Change opponent" aria-label="Trade player">
                ⇄ Trade
              </button>
              <button type="button" class="btn-action-icon btn-swap-item" title="Swap sides" aria-label="Swap sides">
                🔀 Sides
              </button>
              <div class="quick-win-group">
                <button type="button" class="btn-quick-win-sm btn-quick-p1" title="Record win for ${escapeHtml(p1.name)}" aria-label="Win for ${escapeHtml(p1.name)}">✓ ${escapeHtml(p1.name.split(' ')[0])}</button>
                <button type="button" class="btn-quick-win-sm btn-quick-p2" title="Record win for ${escapeHtml(p2.name)}" aria-label="Win for ${escapeHtml(p2.name)}">✓ ${escapeHtml(p2.name.split(' ')[0])}</button>
              </div>
            </div>
          `;

          // Win button click feedback helper
          const triggerWin = (btn, playerWinId) => {
            if (btn) {
              const origText = btn.innerHTML;
              btn.innerHTML = "✓ Saved";
              btn.classList.add("btn-saved-flash");
              setTimeout(() => {
                try {
                  btn.innerHTML = origText;
                  btn.classList.remove("btn-saved-flash");
                } catch(e) {}
              }, 1000);
            }
            recordScore(m.id, 0, 0, playerWinId);
          };

          // Event Listeners
          card.querySelector(".btn-play-first").addEventListener("click", () => handlePlayFirst(m.id));
          card.querySelector(".btn-trade-item").addEventListener("click", () => openTradeModal(m.id, 2));
          card.querySelector(".btn-swap-item").addEventListener("click", () => handleSwapSides(m.id));
          card.querySelector(".btn-quick-p1").addEventListener("click", (e) => triggerWin(e.currentTarget, p1.id));
          card.querySelector(".btn-quick-p2").addEventListener("click", (e) => triggerWin(e.currentTarget, p2.id));

          queueList.appendChild(card);
        });
      }

      queueSec.appendChild(queueList);
      rightPane.appendChild(queueSec);

      gridLayout.appendChild(leftPane);
      gridLayout.appendChild(rightPane);
      container.appendChild(gridLayout);

      // Initialize drag-to-reorder on queue cards after DOM attachment
      if (pendingMatches.length > 2) {
        makeSortable(queueList, ".queue-card", ".queue-drag-handle", (matchId, fromIdx, toIdx) => {
          handleReorderQueue(matchId, toIdx);
        });
      }
    }

    // --- STANDINGS (ALL-TIME LIVE LEADERBOARD) ---
    function renderStandings() {
      const tbody = dom.standingsTableBody;
      tbody.innerHTML = "";
      const data = getActiveData();
      const entries = data.entries;

      if (entries.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" class="empty-table-cell">🏓 No ${isDoubles() ? 'teams' : 'players'} yet. Add some to start.</td></tr>`;
        return;
      }

      const statsMap = new Map();
      entries.forEach(p => {
        statsMap.set(p.id, {
          entry: p,
          played: 0,
          won: 0,
          lost: 0,
          pointsWon: 0,
          pointsLost: 0,
          diff: 0,
          winRate: 0,
          form: []
        });
      });

      data.matches.forEach(m => {
        if (!m.isCompleted) return;
        const p1Stats = statsMap.get(m.p1Id);
        const p2Stats = statsMap.get(m.p2Id);
        if (!p1Stats || !p2Stats) return;

        p1Stats.played++;
        p2Stats.played++;

        p1Stats.pointsWon += m.score1;
        p1Stats.pointsLost += m.score2;
        p2Stats.pointsWon += m.score2;
        p2Stats.pointsLost += m.score1;

        if (m.winnerId === m.p1Id) {
          p1Stats.won++;
          p1Stats.form.push("W");
          p2Stats.lost++;
          p2Stats.form.push("L");
        } else if (m.winnerId === m.p2Id) {
          p2Stats.won++;
          p2Stats.form.push("W");
          p1Stats.lost++;
          p1Stats.form.push("L");
        }
      });

      const statsList = Array.from(statsMap.values());
      statsList.forEach(s => {
        s.diff = s.pointsWon - s.pointsLost;
        s.winRate = s.played > 0 ? Math.round((s.won / s.played) * 100) : 0;
      });

      // All-Time Leaderboard sorting: Wins > Win% > Diff > Points > Name
      statsList.sort((a, b) => {
        if (b.won !== a.won) return b.won - a.won;
        if (b.winRate !== a.winRate) return b.winRate - a.winRate;
        if (b.diff !== a.diff) return b.diff - a.diff;
        if (b.pointsWon !== a.pointsWon) return b.pointsWon - a.pointsWon;
        return a.entry.name.localeCompare(b.entry.name);
      });

      statsList.forEach((stat, index) => {
        const rank = index + 1;
        const tr = document.createElement("tr");

        let rankClass = "";
        if (rank === 1) rankClass = "rank-1";
        else if (rank === 2) rankClass = "rank-2";
        else if (rank === 3) rankClass = "rank-3";

        const formBadges = stat.form.slice(-5).map(f => {
          const cls = f === "W" ? "form-w" : "form-l";
          return `<span class="${cls}">${f}</span>`;
        }).join("") || '<span class="text-muted">—</span>';

        const streak = calculateStreak(stat.entry.id, data.matches);

        tr.innerHTML = `
          <td><span class="rank-badge ${rankClass}">${rank}</span></td>
          <td class="font-bold">
            <span class="cursor-pointer" title="Click to edit">${escapeHtml(stat.entry.name)} ${stat.entry.isResting ? '<span class="font-xs text-muted">(😴)</span>' : ''} ✏️</span>
          </td>
          <td>${stat.played}</td>
          <td class="text-win">${stat.won}</td>
          <td class="text-loss">${stat.lost}</td>
          <td><strong>${stat.winRate}%</strong></td>
          <td class="${stat.diff > 0 ? 'text-win' : stat.diff < 0 ? 'text-loss' : 'text-muted'} font-bold">
            ${stat.diff > 0 ? '+' + stat.diff : stat.diff}
          </td>
          <td class="${streak.cls} font-bold">${streak.text}</td>
          <td>${stat.pointsWon}-${stat.pointsLost}</td>
          <td>${formBadges}</td>
        `;

        tr.querySelector(".cursor-pointer").addEventListener("click", () => openEditModal(stat.entry.id));
        tbody.appendChild(tr);
      });
    }

    // --- CROSS TABLE (GAMES ACTUALLY PLAYED ONLY) ---
    function renderCrosstable() {
      const table = dom.crosstableMatrix;
      table.innerHTML = "";
      const data = getActiveData();
      const entries = data.entries;

      if (entries.length === 0) {
        table.innerHTML = `<tr><td class="empty-table-cell">🏓 No ${isDoubles() ? 'teams' : 'players'} yet. Add some to start.</td></tr>`;
        return;
      }

      // Collect completed matches between pairs
      const matchLookup = new Map();
      data.matches.forEach(m => {
        if (!m.isCompleted) return; // Only games actually played
        const key = `${m.p1Id}_${m.p2Id}`;
        if (!matchLookup.has(key)) matchLookup.set(key, []);
        matchLookup.get(key).push(m);

        const revKey = `${m.p2Id}_${m.p1Id}`;
        if (!matchLookup.has(revKey)) matchLookup.set(revKey, []);
        matchLookup.get(revKey).push(m);
      });

      const thead = document.createElement("thead");
      const headRow = document.createElement("tr");

      headRow.innerHTML = `<th style="text-align:left;">${isDoubles() ? 'Team' : 'Player'}</th>`;
      entries.forEach((p, idx) => {
        const th = document.createElement("th");
        th.textContent = `#${idx + 1} ${p.name.length > 8 ? p.name.substring(0, 6) + '…' : p.name}`;
        th.title = p.name;
        headRow.appendChild(th);
      });
      headRow.innerHTML += `<th>Record</th>`;
      thead.appendChild(headRow);
      table.appendChild(thead);

      const tbody = document.createElement("tbody");

      entries.forEach((rowEntry, rIdx) => {
        const tr = document.createElement("tr");
        const nameTd = document.createElement("td");
        nameTd.style.textAlign = "left";
        nameTd.className = "font-bold";
        nameTd.innerHTML = `<span class="cursor-pointer" title="Click to edit name">#${rIdx + 1} ${escapeHtml(rowEntry.name)} ✏️</span>`;
        nameTd.querySelector("span").addEventListener("click", () => openEditModal(rowEntry.id));
        tr.appendChild(nameTd);

        let rowWins = 0;
        let rowLosses = 0;

        entries.forEach((colEntry) => {
          const td = document.createElement("td");

          if (rowEntry.id === colEntry.id) {
            td.className = "diag-cell";
            td.textContent = "—";
          } else {
            const matchesList = matchLookup.get(`${rowEntry.id}_${colEntry.id}`);
            if (!matchesList || matchesList.length === 0) {
              td.textContent = "—"; // Clean, no scheduled empty cells
            } else {
              let wCount = 0;
              let lCount = 0;

              matchesList.forEach(m => {
                const won = (m.winnerId === rowEntry.id);
                if (won) {
                  rowWins++;
                  wCount++;
                } else {
                  rowLosses++;
                  lCount++;
                }
              });

              if (matchesList.length === 1) {
                const m = matchesList[0];
                const isP1 = (m.p1Id === rowEntry.id);
                const myScore = isP1 ? m.score1 : m.score2;
                const oppScore = isP1 ? m.score2 : m.score1;
                const won = (m.winnerId === rowEntry.id);
                const cls = won ? "cross-win" : "cross-loss";
                const res = won ? "W" : "L";
                td.innerHTML = `<span class="${cls}" title="${res} ${myScore}-${oppScore} vs ${escapeHtml(colEntry.name)}">${res} ${myScore}-${oppScore}</span>`;
              } else {
                const cls = wCount >= lCount ? "cross-win" : "cross-loss";
                td.innerHTML = `<span class="${cls}" title="${wCount}W - ${lCount}L in ${matchesList.length} matches">${wCount}W - ${lCount}L</span>`;
              }
            }
          }
          tr.appendChild(td);
        });

        const recordTd = document.createElement("td");
        recordTd.innerHTML = `<strong>${rowWins}</strong> - ${rowLosses}`;
        tr.appendChild(recordTd);

        tbody.appendChild(tr);
      });

      table.appendChild(tbody);
    }

    // --- ⏱️ WAIT BOARD (REPLACES FAIRNESS MONITOR) ---
    function renderFairness() {
      const container = dom.fairnessGrid;
      container.innerHTML = "";
      const data = getActiveData();
      const entries = data.entries;

      if (entries.length === 0) {
        container.innerHTML = `<div class="empty-grid-cell">🏓 No ${isDoubles() ? 'teams' : 'players'} yet. Add some to start.</div>`;
        return;
      }

      const pendingMatches = data.matches.filter(m => !m.isCompleted);
      const liveMatch = pendingMatches.length > 0 ? pendingMatches[0] : null;
      const deckMatch = pendingMatches.length > 1 ? pendingMatches[1] : null;

      const statsMap = new Map();
      entries.forEach(e => {
        statsMap.set(e.id, { played: 0, won: 0, lost: 0 });
      });
      data.matches.forEach(m => {
        if (!m.isCompleted) return;
        const s1 = statsMap.get(m.p1Id);
        const s2 = statsMap.get(m.p2Id);
        if (s1) {
          s1.played++;
          if (m.winnerId === m.p1Id) s1.won++;
          else if (m.winnerId === m.p2Id) s1.lost++;
        }
        if (s2) {
          s2.played++;
          if (m.winnerId === m.p2Id) s2.won++;
          else if (m.winnerId === m.p1Id) s2.lost++;
        }
      });

      // Sort entries by wait order: active first by waitSeq, then resting
      const sorted = [...entries].sort((a, b) => {
        if (a.isResting !== b.isResting) return a.isResting ? 1 : -1;
        return (a.waitSeq || 0) - (b.waitSeq || 0);
      });

      sorted.forEach((entry, idx) => {
        const stats = statsMap.get(entry.id) || { played: 0, won: 0, lost: 0 };
        const isPlaying = liveMatch && (liveMatch.p1Id === entry.id || liveMatch.p2Id === entry.id);
        const isDeck = !isPlaying && deckMatch && (deckMatch.p1Id === entry.id || deckMatch.p2Id === entry.id);

        let statusTag = "";
        let cardCls = "fairness-card wait-board-card";
        if (entry.isResting) {
          cardCls += " is-resting-card";
          statusTag = `<span class="wait-tag-resting">😴 Resting</span>`;
        } else if (isPlaying) {
          cardCls += " is-playing";
          statusTag = `<span class="wait-tag-playing">🟢 Playing</span>`;
        } else if (isDeck) {
          cardCls += " is-deck";
          statusTag = `<span class="wait-tag-deck">🟡 Up Next</span>`;
        } else {
          statusTag = `<span class="wait-tag-queue">#${idx + 1} In Line</span>`;
        }

        const waitDurationText = formatWaitDuration(entry.lastFinishedAt || entry.addedAt);

        const card = document.createElement("div");
        card.className = cardCls;

        card.innerHTML = `
          <div class="wait-board-header">
            <span class="font-bold cursor-pointer" style="font-size: 15px;" title="Click to edit">${escapeHtml(entry.name)} ✏️</span>
            ${statusTag}
          </div>
          <div class="wait-board-stats">
            <span>Played: <strong>${stats.played}</strong> (${stats.won}W - ${stats.lost}L)</span>
            <span>Ticket: <strong>#${entry.waitSeq || 0}</strong></span>
          </div>
          <div class="font-xs text-muted" style="margin-top: -2px;">
            ⏱️ Waiting for: <strong>${waitDurationText}</strong>
          </div>
          <div class="wait-board-actions">
            <button type="button" class="btn btn-sm flex-1 btn-bump-up" title="Bump forward in line" ${idx === 0 || entry.isResting ? 'disabled' : ''}>
              ▲ Up
            </button>
            <button type="button" class="btn btn-sm flex-1 btn-bump-down" title="Bump back in line" ${idx === sorted.length - 1 || entry.isResting ? 'disabled' : ''}>
              ▼ Down
            </button>
            <button type="button" class="btn btn-sm flex-1 btn-play-next" title="Promote to play next" ${isPlaying || entry.isResting ? 'disabled' : ''}>
              ▶ Next
            </button>
            <button type="button" class="btn btn-sm flex-1 btn-toggle-rest" title="${entry.isResting ? 'Return to queue' : 'Take a break'}">
              ${entry.isResting ? '⚡ Active' : '😴 Rest'}
            </button>
          </div>
        `;

        card.querySelector(".cursor-pointer").addEventListener("click", () => openEditModal(entry.id));
        card.querySelector(".btn-bump-up").addEventListener("click", () => handleBumpPlayer(entry.id, -1));
        card.querySelector(".btn-bump-down").addEventListener("click", () => handleBumpPlayer(entry.id, 1));
        card.querySelector(".btn-play-next").addEventListener("click", () => handlePlayFirstEntry(entry.id));
        card.querySelector(".btn-toggle-rest").addEventListener("click", () => togglePlayerRest(entry.id));

        container.appendChild(card);
      });
    }

    // --- STORAGE & BACKWARD COMPATIBILITY ---
    function saveState() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        console.warn("Could not save to localStorage", e);
      }
    }

    function loadState() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return false;
        const parsed = JSON.parse(raw);
        if (!parsed) return false;

        if (parsed.singles) state.singles = parsed.singles;
        if (parsed.doubles) state.doubles = parsed.doubles;
        if (parsed.category) state.category = parsed.category;
        if (parsed.avoidImmediateRematch !== undefined) state.avoidImmediateRematch = parsed.avoidImmediateRematch;

        // Backward compatibility migration for older saved tournaments
        ["singles", "doubles"].forEach(cat => {
          const data = state[cat];
          if (!data) return;
          if (!Array.isArray(data.entries)) data.entries = [];
          if (!Array.isArray(data.matches)) data.matches = [];

          let maxSeq = 0;
          const now = Date.now();
          data.entries.forEach((e, idx) => {
            if (!Number.isFinite(e.waitSeq)) e.waitSeq = idx + 1;
            if (!e.addedAt) e.addedAt = now - (data.entries.length - idx) * 60000;
            if (!e.lastFinishedAt) e.lastFinishedAt = e.addedAt;
            if (e.isResting === undefined) e.isResting = false;
            if (e.waitSeq > maxSeq) maxSeq = e.waitSeq;
          });

          if (!data.waitCounter) data.waitCounter = maxSeq;
          if (!data.matchCounter) data.matchCounter = data.matches.filter(m => m.isCompleted).length;
        });

        return true;
      } catch (e) {
        console.warn("Could not load localStorage", e);
        return false;
      }
    }

    function escapeHtml(str) {
      if (!str) return "";
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    // Start on DOM ready
    window.addEventListener("DOMContentLoaded", init);
