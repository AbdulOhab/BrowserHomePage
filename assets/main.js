/*
 * OpenSearch — search-only browser homepage.
 * Plain-JS port of OpenBookmarks' search logic
 * Loaded as type="module" from index.html.
 */

// Search engines configuration (mirrors OpenBookmarks src/search.ts).
const searchEngines = [
  { name: "Google",       url: "https://www.google.com/search",         parameter: "q", aliases: ["google", "g"] },
  { name: "DuckDuckGo",   url: "https://duckduckgo.com",                parameter: "q", aliases: ["ddg", "duck", "duckduckgo"] },
  { name: "Brave",        url: "https://search.brave.com/search",       parameter: "q", aliases: ["brave", "br"] },
  { name: "QuackQuackGo", url: "https://quackquackgo.net/",             parameter: "q", aliases: ["quack", "qq", "q"] },
  { name: "Startpage",    url: "https://www.startpage.com/search",      parameter: "query", aliases: ["startpage", "sp"] },
  { name: "YouTube",      url: "https://www.youtube.com/results",       parameter: "search_query", aliases: ["youtube", "yt"] },
  { name: "Yandex",       url: "https://yandex.com/search",             parameter: "text", aliases: ["yandex", "ya"] },
  { name: "Wikipedia",    url: "https://en.wikipedia.org/wiki/Special:Search", parameter: "search", aliases: ["wiki", "w"] },
];

// Map every alias (@ddg, @google, …) to its engine, for prefix searches.
const aliasToEngine = new Map(
  searchEngines.flatMap((engine) => engine.aliases.map((alias) => [alias, engine]))
);

// Engine used for a plain Enter (matches the UI hint: "Enter to search DuckDuckGo").
const DEFAULT_ENGINE = "DuckDuckGo";

const searchInput = document.getElementById("searchInput");

/* ----------------------------- helpers ----------------------------- */

// True if the string looks like a URL we should open directly instead of searching.
function isValidURL(string) {
  try {
    if (string.startsWith("http://") || string.startsWith("https://")) {
      new URL(string);
      return true;
    }
    // Bare domain like "example.com" or "example.com/path"
    if (
      string.includes(".") &&
      /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/.test(string)
    ) {
      new URL(`https://${string}`);
      return true;
    }
    return false;
  } catch (_) {
    return false;
  }
}

function getQuery() {
  return searchInput.value.trim();
}

// Detect a leading "@alias" (e.g. "@ddg shibir") that forces a specific engine.
// Returns { engine, text } — engine is null when there is no / unknown prefix.
function parseEnginePrefix(query) {
  const match = query.match(/^@([a-zA-Z0-9]+)(?:\s+([\s\S]*))?$/);
  if (!match) return { engine: null, text: query };
  const engine = aliasToEngine.get(match[1].toLowerCase());
  if (!engine) return { engine: null, text: query };
  return { engine, text: (match[2] || "").trim() };
}

// Auto-grow the textarea to fit its content (LLM-box feel).
function autoResize() {
  if (!searchInput) return;
  searchInput.style.height = "auto";
  searchInput.style.height = searchInput.scrollHeight + "px";
}

function buildSearchUrl(engine, query) {
  return `${engine.url}?${engine.parameter}=${encodeURIComponent(query)}`;
}

function openUrl(url) {
  window.open(url, "_blank", "noopener");
}

function findEngine(name) {
  return searchEngines.find((e) => e.name === name);
}

// Escape user text before injecting into innerHTML (used by the modal).
function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

/* --------------------------- search actions --------------------------- */

// Search a single engine with the current query.
function searchInEngine(query, engine) {
  if (!query) {
    alert("Please enter a search query.");
    return;
  }
  openUrl(buildSearchUrl(engine, query));
}

// Plain Enter: a leading @engine forces that engine; otherwise open as URL if
// it is one, or search the default engine.
function searchOrNavigate(query) {
  if (!query) return;
  const { engine: prefixEngine, text } = parseEnginePrefix(query);
  if (prefixEngine) {
    if (!text) {
      alert("Please enter a search query.");
      return;
    }
    searchInEngine(text, prefixEngine);
    return;
  }
  if (isValidURL(query)) {
    const finalUrl = query.startsWith("http") ? query : `https://${query}`;
    openUrl(finalUrl);
  } else {
    const engine = findEngine(DEFAULT_ENGINE) || searchEngines[0];
    searchInEngine(query, engine);
  }
}

// "All engines": show a picker, then open each chosen engine in its own tab.
function searchInAllEngines(query) {
  if (!query) {
    alert("Please enter a search query.");
    return;
  }
  showEngineSelector(query).then((selected) => {
    if (!selected || selected.length === 0) return;
    // Stagger the opens so popup blockers don't eat them.
    selected.forEach((engine, index) => {
      setTimeout(() => {
        const url = buildSearchUrl(engine, query);
        const w = window.open(url, "_blank");
        if (!w || w.closed || typeof w.closed === "undefined") {
          console.warn(`Popup blocked: ${engine.name}`);
        }
      }, index * 300);
    });
  });
}

// Modal that lets the user pick which engines "All Engines" should open.
function showEngineSelector(query) {
  return new Promise((resolve) => {
    const modal = document.createElement("div");
    modal.className = "fixed inset-0 z-50 flex items-center justify-center p-4";
    modal.style.background = "rgba(0, 0, 0, 0.7)";
    modal.innerHTML = `
      <div class="bg-nord-1 border border-nord-2 rounded-xl p-6 max-w-md w-full shadow-2xl">
        <h3 class="text-xl font-semibold text-nord-8 mb-3 flex items-center gap-2">
          🔍 Select Search Engines
        </h3>
        <p class="text-sm text-nord-4 opacity-80 mb-4">
          Query: <strong class="text-nord-6">${escapeHtml(query)}</strong>
        </p>
        <div class="max-h-60 overflow-y-auto border border-nord-2 rounded-lg p-3 mb-5">
          ${searchEngines
            .map(
              (engine, i) => `
            <label class="flex items-center py-2 px-1 cursor-pointer hover:bg-nord-2 rounded-md transition-colors">
              <input type="checkbox" checked data-index="${i}" class="mr-3 w-4 h-4">
              <span class="text-nord-6 font-medium">${engine.name}</span>
            </label>
          `
            )
            .join("")}
        </div>
        <div class="flex gap-3 justify-end">
          <button id="os-cancel" class="px-4 py-2 bg-nord-2 hover:bg-nord-3 text-nord-4 font-medium rounded-lg transition-colors">
            Cancel
          </button>
          <button id="os-search" class="px-4 py-2 bg-nord-8 hover:bg-nord-7 text-nord-0 font-medium rounded-lg transition-colors">
            Search
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    function close(result) {
      modal.remove();
      document.removeEventListener("keydown", escHandler);
      resolve(result);
    }
    function escHandler(e) {
      if (e.key === "Escape") close(null);
    }

    modal.querySelector("#os-cancel").addEventListener("click", () => close(null));
    modal.querySelector("#os-search").addEventListener("click", () => {
      const selected = [];
      modal
        .querySelectorAll('input[type="checkbox"]:checked')
        .forEach((cb) => {
          const idx = parseInt(cb.dataset.index || "0", 10);
          if (searchEngines[idx]) selected.push(searchEngines[idx]);
        });
      close(selected);
    });
    // Click on the backdrop (not the panel) cancels.
    modal.addEventListener("click", (e) => {
      if (e.target === modal) close(null);
    });
    document.addEventListener("keydown", escHandler);
  });
}

// Help modal — explains every shortcut / feature (opened from the footer link).
function showHelp() {
  const modal = document.createElement("div");
  modal.className = "fixed inset-0 z-50 flex items-center justify-center p-4";
  modal.style.background = "rgba(0, 0, 0, 0.7)";

  const aliasRows = searchEngines
    .map(
      (engine) => `
        <div class="flex items-center justify-between py-1">
          <span class="text-nord-6">${engine.name}</span>
          <code>${engine.aliases.map((a) => "@" + a).join(" · ")}</code>
        </div>`
    )
    .join("");

  modal.innerHTML = `
    <div class="os-modal bg-nord-1 border border-nord-2 rounded-xl p-6 max-w-lg w-full shadow-2xl max-h-[85vh] overflow-y-auto">
      <h3 class="text-xl font-semibold text-nord-8 mb-4">✦ OpenSearch — How it works</h3>
      <div class="text-sm text-nord-4 space-y-4">
        <section>
          <p class="text-nord-6 font-medium mb-1">Searching</p>
          <ul class="space-y-1 opacity-90">
            <li><kbd>Enter</kbd> — search the default engine (DuckDuckGo)</li>
            <li><kbd>Ctrl</kbd>/<kbd>Cmd</kbd> + <kbd>Enter</kbd> — open across all engines</li>
            <li><kbd>Esc</kbd> — clear the box</li>
            <li>Type a web address (e.g. <code>github.com</code>) + <kbd>Enter</kbd> — open it directly</li>
          </ul>
        </section>
        <section>
          <p class="text-nord-6 font-medium mb-1">Pick an engine with <code>@alias</code></p>
          <p class="opacity-90 mb-2">Start a query with an alias to force that engine (the address shortcut above is skipped):</p>
          <div class="border border-nord-2 rounded-lg px-3 py-1 bg-nord-0">${aliasRows}</div>
          <p class="opacity-70 mt-2 text-xs">e.g. <code>@yt lofi music</code> searches YouTube.</p>
        </section>
        <section>
          <p class="text-nord-6 font-medium mb-1">Engines &amp; links</p>
          <ul class="space-y-1 opacity-90">
            <li>Click an engine chip under the box to search it.</li>
            <li>Quick links open popular sites in a new tab.</li>
          </ul>
        </section>
      </div>
      <div class="flex justify-end mt-5">
        <button id="os-help-close" class="px-4 py-2 bg-nord-8 hover:bg-nord-7 text-nord-0 font-medium rounded-lg transition-colors">Close</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  function close() {
    modal.remove();
    document.removeEventListener("keydown", escHandler);
  }
  function escHandler(e) {
    if (e.key === "Escape") close();
  }
  modal.querySelector("#os-help-close").addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });
  document.addEventListener("keydown", escHandler);
}

/* ------------------------------- wiring ------------------------------- */

function setupSearchEngineListeners() {
  // Individual engine buttons (have a data-engine attribute).
  document.querySelectorAll(".search-engine-btn").forEach((btn) => {
    const engineName = btn.getAttribute("data-engine");
    const engine = engineName && findEngine(engineName);
    // Tooltip shows this engine's @alias shortcuts (e.g. "Google — @google / @g").
    if (engine) {
      btn.title = `${engine.name} — ${engine.aliases.map((a) => "@" + a).join(" / ")}`;
    }
    btn.addEventListener("click", () => {
      const query = getQuery();
      // Empty box (or a bare @alias with no text) → drop this engine's alias in
      // so the user can type a query, instead of showing an alert.
      if (!parseEnginePrefix(query).text) {
        if (engine) {
          searchInput.value = "@" + engine.aliases[0] + " ";
          autoResize();
          searchInput.focus();
          searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
        }
        return;
      }
      if (engine) openUrl(buildSearchUrl(engine, query));
    });
  });

  // "All Engines" button.
  const allBtn = document.getElementById("searchAllEngines");
  if (allBtn) {
    allBtn.addEventListener("click", () => {
      const query = getQuery();
      if (!parseEnginePrefix(query).text) {
        searchInput.focus();
        return;
      }
      allBtn.setAttribute("disabled", "true");
      searchInAllEngines(query);
      // Re-enable after a short cooldown.
      setTimeout(() => allBtn.removeAttribute("disabled"), 3000);
    });
  }
}

// Keyboard handling while focus is inside the search box.
function handleSearchKeydown(e) {
  switch (e.key) {
    case "Enter": {
      // Shift+Enter inserts a newline; plain Enter searches.
      if (e.shiftKey) break;
      e.preventDefault();
      const query = getQuery();
      if (!query) break;
      // An explicit @engine prefix always wins — even over Ctrl+Enter "all".
      const { engine: prefixEngine, text } = parseEnginePrefix(query);
      if (prefixEngine) {
        searchInEngine(text, prefixEngine);
        break;
      }
      if (e.ctrlKey || e.metaKey) {
        // Ctrl/Cmd+Enter → search across engines.
        searchInAllEngines(query);
      } else {
        searchOrNavigate(query);
      }
      break;
    }
    case "Escape":
      e.preventDefault();
      searchInput.value = "";
      autoResize();
      searchInput.focus();
      break;
  }
}

// Global shortcuts that work from anywhere on the page.
function handleGlobalKeydown(e) {
  // Ignore keystrokes that happen inside the search box (handled above).
  if (e.target === searchInput) return;

  // Don't refocus while a modal (engine picker / help) is open.
  if (document.querySelector(".fixed.inset-0.z-50")) return;

  // Typing a printable character (or Backspace) anywhere refocuses the box.
  if (e.key.length === 1 || e.key === "Backspace") {
    searchInput.focus();
  }
}

function init() {
  if (!searchInput) {
    console.error("OpenSearch: #searchInput not found");
    return;
  }
  searchInput.addEventListener("keydown", handleSearchKeydown);
  searchInput.addEventListener("input", autoResize);
  document.addEventListener("keydown", handleGlobalKeydown);
  setupSearchEngineListeners();

  // Send button acts like a plain Enter (default engine / URL).
  const submitBtn = document.getElementById("searchSubmit");
  if (submitBtn) {
    submitBtn.addEventListener("click", () => searchOrNavigate(getQuery()));
  }

  // Left search-icon button focuses the input.
  const iconBtn = document.querySelector(".search-icon-btn");
  if (iconBtn) iconBtn.addEventListener("click", () => searchInput.focus());

  // Footer "Help" link opens the feature-guide modal.
  const helpLink = document.getElementById("osHelp");
  if (helpLink) {
    helpLink.addEventListener("click", (e) => {
      e.preventDefault();
      showHelp();
    });
  }

  autoResize();
  searchInput.focus();
}

init();
