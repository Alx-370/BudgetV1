/**
 * @typedef {"income" | "expense"} SubcategoryType
 */

/**
 * @typedef {Object} Subcategory
 * @property {string} id
 * @property {string} name
 * @property {SubcategoryType} type
 * @property {number} amount
 */

/**
 * @typedef {Object} Category
 * @property {string} id
 * @property {string} name
 * @property {string} color
 * @property {Subcategory[]} subcategories
 */

/**
 * @typedef {Object} MonthData
 * @property {string} id
 * @property {string} label
 * @property {Category[]} categories
 * @property {string[]} expandedCategoryIds
 */

/**
 * @typedef {Object} AppState
 * @property {string} activeMonthId
 * @property {Record<string, MonthData>} months
 */

const STORAGE_KEY = "Blynk_save";
const THEME_KEY = "Blynk_theme";

const monthNames = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre"
];

const colorOptions = [
  { label: "Bleu", value: "#0A71C2" },
  { label: "Bleu nuit", value: "#123C69" },
  { label: "Bleu ciel", value: "#4DA8DA" },
  { label: "Turquoise", value: "#1BA098" },
  { label: "Vert sauge", value: "#5D8C7B" },
  { label: "Vert", value: "#2E8B57" },
  { label: "Jaune doré", value: "#D8A31A" },
  { label: "Orange", value: "#E67E22" },
  { label: "Brun", value: "#8A5700" },
  { label: "Rouge", value: "#C0392B" },
  { label: "Rose", value: "#E56B9F" },
  { label: "Violet", value: "#8f14b0" },
  { label: "Violet foncé", value: "#5f0a87" },
  { label: "Prune", value: "#6C3483" },
  { label: "Gris", value: "#B0B5B8" },
  { label: "Anthracite", value: "#2D3436" }
];

const defaultCategoryDefs = [
  {
    name: "Banque",
    color: "#8f14b0",
    subcategories: [
      { name: "Découvert", type: "expense", amount: 0 },
      { name: "Frais bancaires", type: "expense", amount: 0 }
    ]
  },
  {
    name: "Maison",
    color: "#E56B9F",
    subcategories: [
      { name: "Loyer / crédit", type: "expense", amount: 0 },
      { name: "Électricité", type: "expense", amount: 0 },
      { name: "Eau", type: "expense", amount: 0 }
    ]
  },
  {
    name: "Loisirs",
    color: "#0A71C2",
    subcategories: [
      { name: "Sorties", type: "expense", amount: 0 },
      { name: "Abonnements", type: "expense", amount: 0 }
    ]
  },
  {
    name: "Voiture",
    color: "#8A5700",
    subcategories: [
      { name: "Essence", type: "expense", amount: 0 },
      { name: "Assurance", type: "expense", amount: 0 }
    ]
  },
  {
    name: "École",
    color: "#B0B5B8",
    subcategories: [
      { name: "Cantine", type: "expense", amount: 0 },
      { name: "Fournitures", type: "expense", amount: 0 }
    ]
  },
  {
    name: "Rentrée d'argent",
    color: "#2E8B57",
    subcategories: [
      { name: "Salaire", type: "income", amount: 0 },
      { name: "Aides", type: "income", amount: 0 }
    ]
  }
];

/** @type {AppState} */
const state = loadState();

const refs = {
  activeMonthLabel: document.getElementById("activeMonthLabel"),
  monthSelect: document.getElementById("monthSelect"),
  summaryGrid: document.getElementById("summaryGrid"),
  categoryList: document.getElementById("categoryList"),
  categorySelect: document.getElementById("categorySelect"),
  subcategoryForm: document.getElementById("subcategoryForm"),
  subcategoryNameInput: document.getElementById("subcategoryNameInput"),
  subcategoryTypeSelect: document.getElementById("subcategoryTypeSelect"),
  subcategoryAmountInput: document.getElementById("subcategoryAmountInput"),
  categoryForm: document.getElementById("categoryForm"),
  categoryNameInput: document.getElementById("categoryNameInput"),
  categoryColorInput: document.getElementById("categoryColorInput"),
  prevMonthBtn: document.getElementById("prevMonthBtn"),
  nextMonthBtn: document.getElementById("nextMonthBtn"),
  duplicateMonthBtn: document.getElementById("duplicateMonthBtn"),
  resetCurrentMonthBtn: document.getElementById("resetCurrentMonthBtn"),
  themeToggleBtn: document.getElementById("themeToggleBtn")
};

function uid() {
  if (window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

/**
 * @returns {AppState}
 */
function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (saved) {
    try {
      /** @type {AppState} */
      const parsed = JSON.parse(saved);

      if (parsed && parsed.months && parsed.activeMonthId) {
        Object.values(parsed.months).forEach((month) => {
          if (!Array.isArray(month.expandedCategoryIds)) {
            month.expandedCategoryIds = (month.categories || []).map((category) => category.id);
          }
        });

        return parsed;
      }
    } catch (error) {
      console.error("Erreur de lecture localStorage", error);
    }
  }

  const currentDate = new Date();
  const monthId = buildMonthId(currentDate.getFullYear(), currentDate.getMonth());

  return {
    activeMonthId: monthId,
    months: {
      [monthId]: createMonth(monthId, createDefaultCategories())
    }
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/**
 * @returns {Category[]}
 */
function createDefaultCategories() {
  return defaultCategoryDefs.map((category) => ({
    id: uid(),
    name: category.name,
    color: category.color,
    subcategories: category.subcategories.map((sub) => ({
      id: uid(),
      name: sub.name,
      type: sub.type,
      amount: sub.amount
    }))
  }));
}

/**
 * @param {string} monthId
 * @param {Category[]} categories
 * @returns {MonthData}
 */
function createMonth(monthId, categories) {
  return {
    id: monthId,
    label: formatMonthLabel(monthId),
    categories,
    expandedCategoryIds: categories.map((category) => category.id)
  };
}

/**
 * @param {number} year
 * @param {number} monthIndex
 * @returns {string}
 */
function buildMonthId(year, monthIndex) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

/**
 * @param {string} monthId
 * @returns {{ year: number, monthIndex: number }}
 */
function parseMonthId(monthId) {
  const [year, month] = monthId.split("-").map(Number);
  return { year, monthIndex: month - 1 };
}

/**
 * @param {string} monthId
 * @returns {string}
 */
function formatMonthLabel(monthId) {
  const { year, monthIndex } = parseMonthId(monthId);
  return `${monthNames[monthIndex]} ${year}`;
}

/**
 * @returns {string[]}
 */
function getSortedMonthIds() {
  return Object.keys(state.months).sort();
}

/**
 * @returns {MonthData}
 */
function getActiveMonth() {
  return state.months[state.activeMonthId];
}

/**
 * @template T
 * @param {T} data
 * @returns {T}
 */
function cloneData(data) {
  return JSON.parse(JSON.stringify(data));
}
/**
 * @param {Category[]} categories
 * @returns {Category[]}
 */
function normalizeCategoryIds(categories) {
  return categories.map((category) => ({
    id: uid(),
    name: category.name,
    color: category.color,
    subcategories: (category.subcategories || []).map((sub) => ({
      id: uid(),
      name: sub.name,
      type: sub.type,
      amount: Number(sub.amount) || 0
    }))
  }));
}

/**
 * @param {string} monthId
 * @param {string | null} [copyFromMonthId=null]
 */
function ensureMonthExists(monthId, copyFromMonthId = null) {
  if (state.months[monthId]) {
    return;
  }

  const categories =
      copyFromMonthId && state.months[copyFromMonthId]
          ? normalizeCategoryIds(cloneData(state.months[copyFromMonthId].categories))
          : createDefaultCategories();

  state.months[monthId] = createMonth(monthId, categories);
}

/**
 * @param {string} monthId
 * @returns {string}
 */
function getNextMonthId(monthId) {
  const { year, monthIndex } = parseMonthId(monthId);
  const date = new Date(year, monthIndex + 1, 1);
  return buildMonthId(date.getFullYear(), date.getMonth());
}

/**
 * @param {string} monthId
 * @returns {string}
 */
function getPreviousMonthId(monthId) {
  const { year, monthIndex } = parseMonthId(monthId);
  const date = new Date(year, monthIndex - 1, 1);
  return buildMonthId(date.getFullYear(), date.getMonth());
}

/**
 * @param {number | string} value
 * @returns {string}
 */
function formatAmount(value) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR"
  }).format(Number(value || 0));
}

/**
 * @param {MonthData} month
 * @returns {{ income: number, expense: number, balance: number }}
 */
function getMonthTotals(month) {
  let income = 0;
  let expense = 0;

  month.categories.forEach((category) => {
    category.subcategories.forEach((sub) => {
      const amount = Number(sub.amount) || 0;

      if (sub.type === "income") {
        income += amount;
      } else {
        expense += amount;
      }
    });
  });

  return {
    income,
    expense,
    balance: income - expense
  };
}

/**
 * @param {Category} category
 * @returns {number}
 */
function getCategoryTotal(category) {
  return category.subcategories.reduce((total, sub) => total + (Number(sub.amount) || 0), 0);
}

/**
 * @param {string} activeMonthId
 * @returns {string[]}
 */
function buildLastSixMonths(activeMonthId) {
  const ids = [];
  const { year, monthIndex } = parseMonthId(activeMonthId);

  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(year, monthIndex - offset, 1);
    ids.push(buildMonthId(date.getFullYear(), date.getMonth()));
  }

  return ids;
}

/**
 * @param {string} value
 * @returns {string}
 */
function escapeHtml(value) {
  return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
}

function renderColorOptions() {
  refs.categoryColorInput.innerHTML = colorOptions
      .map(
          (option) =>
              `<option value="${option.value}" ${option.value === "#8f14b0" ? "selected" : ""}>${option.label}</option>`
      )
      .join("");
}

function renderMonthOptions() {
  const existingIds = new Set(getSortedMonthIds());
  const active = parseMonthId(state.activeMonthId);

  for (let offset = -6; offset <= 6; offset += 1) {
    const date = new Date(active.year, active.monthIndex + offset, 1);
    existingIds.add(buildMonthId(date.getFullYear(), date.getMonth()));
  }

  const options = Array.from(existingIds).sort();

  refs.monthSelect.innerHTML = options
      .map((monthId) => `<option value="${monthId}">${formatMonthLabel(monthId)}</option>`)
      .join("");

  refs.monthSelect.value = state.activeMonthId;
  refs.activeMonthLabel.textContent = formatMonthLabel(state.activeMonthId);
}

function renderSummary() {
  const totals = getMonthTotals(getActiveMonth());

  refs.summaryGrid.innerHTML = `
    <article class="summary-box summary-box--income">
      <span>Rentrées d'argent</span>
      <strong>${formatAmount(totals.income)}</strong>
    </article>
    <article class="summary-box summary-box--expense">
      <span>Total dépenses</span>
      <strong>${formatAmount(totals.expense)}</strong>
    </article>
    <article class="summary-box summary-box--balance">
      <span>Reste du mois</span>
      <strong>${formatAmount(totals.balance)}</strong>
    </article>
  `;
}

function renderComparisonChart() {
  const month = getActiveMonth();
  const totals = getMonthTotals(month);
  const maxValue = Math.max(totals.income, totals.expense, 1);
  const chart = document.getElementById("comparisonChart");

  chart.innerHTML = [
    { label: "Revenus", value: totals.income, className: "bar-fill--income" },
    { label: "Dépenses", value: totals.expense, className: "bar-fill--expense" }
  ]
      .map((item) => {
        const height = Math.max((item.value / maxValue) * 100, item.value > 0 ? 8 : 0);

        return `
        <div class="bar-col">
          <div class="bar-track">
            <div class="bar-fill ${item.className}" style="height:${height}%"></div>
          </div>
          <div class="bar-label">${item.label}</div>
          <div class="bar-value">${formatAmount(item.value)}</div>
        </div>
      `;
      })
      .join("");
}

function renderDonutChart() {
  const month = getActiveMonth();

  const categories = month.categories
      .map((category) => ({
        name: category.name,
        color: category.color,
        total: getCategoryTotal(category)
      }))
      .filter((category) => category.total > 0);

  const donutChart = document.getElementById("donutChart");
  const donutCenter = document.getElementById("donutCenter");
  const legendList = document.getElementById("legendList");

  if (!categories.length) {
    donutChart.style.background = "rgba(31, 24, 36, 0.08)";
    donutCenter.innerHTML = "<div><strong>0 €</strong>Aucune donnée pour ce mois</div>";
    legendList.innerHTML =
        '<div class="empty-state">Ajoute des montants pour afficher la répartition par catégorie.</div>';
    return;
  }

  const total = categories.reduce((sum, category) => sum + category.total, 0);
  let currentAngle = 0;

  const segments = categories.map((category) => {
    const slice = (category.total / total) * 360;
    const start = currentAngle;
    const end = currentAngle + slice;
    currentAngle = end;
    return `${category.color} ${start}deg ${end}deg`;
  });

  donutChart.style.background = `conic-gradient(${segments.join(", ")})`;
  donutCenter.innerHTML = `<div><strong>${formatAmount(total)}</strong>Total catégories</div>`;

  legendList.innerHTML = categories
      .map((category) => {
        const percent = ((category.total / total) * 100).toFixed(0);

        return `
        <div class="legend-item">
          <span class="legend-dot" style="background:${category.color}"></span>
          <div>
            <strong>${escapeHtml(category.name)}</strong><br>
            <span>${percent}% du mois</span>
          </div>
          <strong>${formatAmount(category.total)}</strong>
        </div>
      `;
      })
      .join("");
}

function renderTrendChart() {
  const trendChart = document.getElementById("trendChart");
  const trendMonths = document.getElementById("trendMonths");
  const months = buildLastSixMonths(state.activeMonthId);

  const items = months.map((monthId) => {
    ensureMonthExists(monthId, getPreviousMonthId(monthId));
    const month = state.months[monthId];
    const totals = getMonthTotals(month);

    return {
      monthId,
      shortLabel: monthNames[parseMonthId(monthId).monthIndex].slice(0, 3),
      income: totals.income,
      expense: totals.expense
    };
  });

  const maxValue = Math.max(...items.flatMap((item) => [item.income, item.expense]), 1);

  trendChart.innerHTML = items
      .map((item) => {
        const incomeHeight = Math.max((item.income / maxValue) * 100, item.income > 0 ? 8 : 0);
        const expenseHeight = Math.max((item.expense / maxValue) * 100, item.expense > 0 ? 8 : 0);

        return `
        <div class="trend-col">
          <div class="trend-bars">
            <div
              class="trend-bar trend-bar--income"
              style="height:${incomeHeight}%"
              title="Revenus : ${formatAmount(item.income)}"
            ></div>
            <div
              class="trend-bar trend-bar--expense"
              style="height:${expenseHeight}%"
              title="Dépenses : ${formatAmount(item.expense)}"
            ></div>
          </div>
        </div>
      `;
      })
      .join("");

  trendMonths.innerHTML = items
      .map((item) => `<div class="trend-month">${item.shortLabel}</div>`)
      .join("");
}

function renderCharts() {
  renderComparisonChart();
  renderDonutChart();
  renderTrendChart();
}

function renderCategorySelect() {
  const month = getActiveMonth();

  refs.categorySelect.innerHTML = month.categories
      .map((category) => `<option value="${category.id}">${escapeHtml(category.name)}</option>`)
      .join("");
}

/**
 * @param {MonthData} month
 * @param {string} categoryId
 * @returns {boolean}
 */
function isCategoryExpanded(month, categoryId) {
  return (month.expandedCategoryIds || []).includes(categoryId);
}

function renderCategories() {
  const month = getActiveMonth();

  if (!month.categories.length) {
    refs.categoryList.innerHTML = '<div class="empty-state">Aucune catégorie pour ce mois.</div>';
    return;
  }

  refs.categoryList.innerHTML = month.categories
      .map(
          (category) => `
      <details class="category-card" data-category-id="${category.id}" ${
              isCategoryExpanded(month, category.id) ? "open" : ""
          }>
        <summary class="category-summary">
          <div class="category-summary__left">
            <span class="category-dot" style="background:${category.color}"></span>
            <div>
              <strong>${escapeHtml(category.name)}</strong>
              <span class="category-summary__count">${category.subcategories.length} sous-catégorie${
              category.subcategories.length > 1 ? "s" : ""
          }</span>
            </div>
          </div>
          <div class="category-summary__right">
            <span class="amount-chip js-category-total" data-total-for="${category.id}">${formatAmount(
              getCategoryTotal(category)
          )}</span>
            <span class="accordion-icon" aria-hidden="true"></span>
          </div>
        </summary>

        <div class="category-content">
          <div class="category-head-actions">
            <button class="btn-danger" type="button" data-action="remove-category" data-category-id="${category.id}">
              Supprimer la catégorie
            </button>
          </div>

          <div class="subcategory-list">
            ${
              category.subcategories.length
                  ? category.subcategories
                      .map(
                          (sub) => `
                        <div class="subcategory-row">
                          <div class="subcategory-top">
                            <div class="subcategory-meta">
                              <strong>${escapeHtml(sub.name)}</strong>
                              <span class="type-pill ${
                              sub.type === "income" ? "type-income" : "type-expense"
                          }">${sub.type === "income" ? "Rentrée d'argent" : "Dépense"}</span>
                            </div>
                            <button
                              class="btn-danger"
                              type="button"
                              data-action="remove-subcategory"
                              data-category-id="${category.id}"
                              data-subcategory-id="${sub.id}"
                            >
                              Supprimer
                            </button>
                          </div>
                          <label class="amount-input-wrap">
                            Montant
                            <input
                              type="number"
                              inputmode="decimal"
                              step="0.01"
                              value="${Number(sub.amount) || 0}"
                              data-input="amount"
                              data-category-id="${category.id}"
                              data-subcategory-id="${sub.id}"
                            />
                          </label>
                        </div>
                      `
                      )
                      .join("")
                  : '<div class="empty-state">Aucune sous-catégorie. Ajoute-en une juste au-dessus.</div>'
          }
          </div>
        </div>
      </details>
    `
      )
      .join("");
}

function refreshComputedUI() {
  renderSummary();
  renderCharts();

  const month = getActiveMonth();

  month.categories.forEach((category) => {
    const totalNode = document.querySelector(`[data-total-for="${category.id}"]`);

    if (totalNode) {
      totalNode.textContent = formatAmount(getCategoryTotal(category));
    }
  });

  saveState();
}

/**
 * @param {string} categoryId
 * @param {string} subcategoryId
 * @param {string} value
 */
function updateSubcategoryAmount(categoryId, subcategoryId, value) {
  const month = getActiveMonth();
  const category = month.categories.find((item) => item.id === categoryId);
  const subcategory = category?.subcategories.find((item) => item.id === subcategoryId);

  if (!subcategory) {
    return;
  }

  subcategory.amount = value === "" ? 0 : Number(value) || 0;
  refreshComputedUI();
}

/**
 * @param {string} categoryId
 * @param {string} subcategoryId
 */
function removeSubcategory(categoryId, subcategoryId) {
  const month = getActiveMonth();
  const category = month.categories.find((item) => item.id === categoryId);

  if (!category) {
    return;
  }

  category.subcategories = category.subcategories.filter((item) => item.id !== subcategoryId);
  render();
}

/**
 * @param {string} categoryId
 */
function removeCategory(categoryId) {
  const month = getActiveMonth();
  month.categories = month.categories.filter((item) => item.id !== categoryId);
  month.expandedCategoryIds = (month.expandedCategoryIds || []).filter((id) => id !== categoryId);
  render();
}

/**
 * @param {string} categoryId
 * @param {boolean} isOpen
 */
function toggleCategoryAccordion(categoryId, isOpen) {
  const month = getActiveMonth();
  const currentIds = new Set(month.expandedCategoryIds || []);

  if (isOpen) {
    currentIds.add(categoryId);
  } else {
    currentIds.delete(categoryId);
  }

  month.expandedCategoryIds = Array.from(currentIds);
  saveState();
}

/**
 * @param {string} monthId
 * @param {string} [copyFrom=state.activeMonthId]
 */
function goToMonth(monthId, copyFrom = state.activeMonthId) {
  ensureMonthExists(monthId, copyFrom);
  state.activeMonthId = monthId;
  render();
}

function duplicateToNextMonth() {
  const nextMonthId = getNextMonthId(state.activeMonthId);
  const activeMonth = getActiveMonth();

  state.months[nextMonthId] = createMonth(
      nextMonthId,
      normalizeCategoryIds(cloneData(activeMonth.categories))
  );

  state.activeMonthId = nextMonthId;
  render();
}

function resetCurrentMonth() {
  const month = getActiveMonth();

  month.categories.forEach((category) => {
    category.subcategories.forEach((sub) => {
      sub.amount = 0;
    });
  });

  render();
}

/**
 * @param {"light" | "dark"} theme
 */
function applyTheme(theme) {
  document.body.dataset.theme = theme;
  localStorage.setItem(THEME_KEY, theme);

  const isDark = theme === "dark";
  refs.themeToggleBtn.querySelector(".theme-toggle__icon").textContent = isDark ? "☀️" : "🌙";
  refs.themeToggleBtn.querySelector(".theme-toggle__text").textContent = isDark ? "Mode clair" : "Mode sombre";
}

function toggleTheme() {
  const current = document.body.dataset.theme === "dark" ? "dark" : "light";
  applyTheme(current === "dark" ? "light" : "dark");
}

function render() {
  renderColorOptions();
  renderMonthOptions();
  renderSummary();
  renderCharts();
  renderCategorySelect();
  renderCategories();
  saveState();
}

refs.monthSelect.addEventListener("change", (event) => {
  goToMonth(event.target.value, getPreviousMonthId(event.target.value));
});

refs.prevMonthBtn.addEventListener("click", () => {
  goToMonth(getPreviousMonthId(state.activeMonthId), state.activeMonthId);
});

refs.nextMonthBtn.addEventListener("click", () => {
  goToMonth(getNextMonthId(state.activeMonthId), state.activeMonthId);
});

refs.duplicateMonthBtn.addEventListener("click", duplicateToNextMonth);
refs.resetCurrentMonthBtn.addEventListener("click", resetCurrentMonth);
refs.themeToggleBtn.addEventListener("click", toggleTheme);

refs.subcategoryForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const month = getActiveMonth();
  const category = month.categories.find((item) => item.id === refs.categorySelect.value);
  const name = refs.subcategoryNameInput.value.trim();

  if (!category || !name) {
    return;
  }

  category.subcategories.push({
    id: uid(),
    name,
    type: refs.subcategoryTypeSelect.value,
    amount: Number(refs.subcategoryAmountInput.value) || 0
  });

  if (!month.expandedCategoryIds.includes(category.id)) {
    month.expandedCategoryIds.push(category.id);
  }

  refs.subcategoryForm.reset();
  refs.subcategoryTypeSelect.value = "expense";
  render();
});

refs.categoryForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const month = getActiveMonth();
  const name = refs.categoryNameInput.value.trim();

  if (!name) {
    return;
  }

  /** @type {Category} */
  const category = {
    id: uid(),
    name,
    color: refs.categoryColorInput.value,
    subcategories: []
  };

  month.categories.push(category);
  month.expandedCategoryIds.push(category.id);

  refs.categoryForm.reset();
  refs.categoryColorInput.value = "#8f14b0";
  render();
});

refs.categoryList.addEventListener("input", (event) => {
  const input = event.target.closest('[data-input="amount"]');

  if (!input) {
    return;
  }

  updateSubcategoryAmount(input.dataset.categoryId, input.dataset.subcategoryId, input.value);
});

refs.categoryList.addEventListener("click", (event) => {
  const actionButton = event.target.closest("[data-action]");

  if (!actionButton) {
    return;
  }

  const { action, categoryId, subcategoryId } = actionButton.dataset;

  if (action === "remove-category") {
    removeCategory(categoryId);
  }

  if (action === "remove-subcategory") {
    removeSubcategory(categoryId, subcategoryId);
  }
});

refs.categoryList.addEventListener(
    "toggle",
    (event) => {
      const details = event.target.closest("details[data-category-id]");

      if (!details) {
        return;
      }

      toggleCategoryAccordion(details.dataset.categoryId, details.open);
    },
    true
);

applyTheme(localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light");
render();