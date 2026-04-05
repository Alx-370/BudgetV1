const STORAGE_KEY = "budget_mobile_first_v1";

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
    color: "#efafd1",
    subcategories: [
      { name: "Loyer / crédit", type: "expense", amount: 0 },
      { name: "Électricité", type: "expense", amount: 0 },
      { name: "Eau", type: "expense", amount: 0 }
    ]
  },
  {
    name: "Loisirs",
    color: "#5f0a87",
    subcategories: [
      { name: "Sorties", type: "expense", amount: 0 },
      { name: "Abonnements", type: "expense", amount: 0 }
    ]
  },
  {
    name: "Voiture",
    color: "#1f1824",
    subcategories: [
      { name: "Essence", type: "expense", amount: 0 },
      { name: "Assurance", type: "expense", amount: 0 }
    ]
  },
  {
    name: "École",
    color: "#8f14b0",
    subcategories: [
      { name: "Cantine", type: "expense", amount: 0 },
      { name: "Fournitures", type: "expense", amount: 0 }
    ]
  },
  {
    name: "Rentrée d'argent",
    color: "#efafd1",
    subcategories: [
      { name: "Salaire", type: "income", amount: 0 },
      { name: "Aides", type: "income", amount: 0 }
    ]
  }
];

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
  resetCurrentMonthBtn: document.getElementById("resetCurrentMonthBtn")
};

function uid() {
  if (window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.months && parsed.activeMonthId) {
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
      [monthId]: {
        id: monthId,
        label: formatMonthLabel(monthId),
        categories: createDefaultCategories()
      }
    }
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

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

function buildMonthId(year, monthIndex) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

function parseMonthId(monthId) {
  const [year, month] = monthId.split("-").map(Number);
  return { year, monthIndex: month - 1 };
}

function formatMonthLabel(monthId) {
  const { year, monthIndex } = parseMonthId(monthId);
  return `${monthNames[monthIndex]} ${year}`;
}

function getSortedMonthIds() {
  return Object.keys(state.months).sort();
}

function getActiveMonth() {
  return state.months[state.activeMonthId];
}

function cloneData(data) {
  return JSON.parse(JSON.stringify(data));
}

function ensureMonthExists(monthId, copyFromMonthId = null) {
  if (state.months[monthId]) {
    return;
  }

  const categories =
    copyFromMonthId && state.months[copyFromMonthId]
      ? cloneData(state.months[copyFromMonthId].categories)
      : createDefaultCategories();

  state.months[monthId] = {
    id: monthId,
    label: formatMonthLabel(monthId),
    categories
  };
}

function getNextMonthId(monthId) {
  const { year, monthIndex } = parseMonthId(monthId);
  const date = new Date(year, monthIndex + 1, 1);
  return buildMonthId(date.getFullYear(), date.getMonth());
}

function getPreviousMonthId(monthId) {
  const { year, monthIndex } = parseMonthId(monthId);
  const date = new Date(year, monthIndex - 1, 1);
  return buildMonthId(date.getFullYear(), date.getMonth());
}

function formatAmount(value) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR"
  }).format(Number(value || 0));
}

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

function getCategoryTotal(category) {
  return category.subcategories.reduce((total, sub) => total + (Number(sub.amount) || 0), 0);
}

function buildLastSixMonths(activeMonthId) {
  const ids = [];
  const { year, monthIndex } = parseMonthId(activeMonthId);

  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(year, monthIndex - offset, 1);
    ids.push(buildMonthId(date.getFullYear(), date.getMonth()));
  }

  return ids;
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
            <strong>${category.name}</strong><br>
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

    return {
      monthId,
      shortLabel: monthNames[parseMonthId(monthId).monthIndex].slice(0, 3),
      ...getMonthTotals(month)
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
            <div class="trend-bar trend-bar--income" style="height:${incomeHeight}%"></div>
            <div class="trend-bar trend-bar--expense" style="height:${expenseHeight}%"></div>
          </div>
          <div class="trend-value">${formatAmount(item.balance)}</div>
        </div>
      `;
    })
    .join("");

  trendMonths.innerHTML = items.map((item) => `<div>${item.shortLabel}</div>`).join("");
}

function renderCharts() {
  renderComparisonChart();
  renderDonutChart();
  renderTrendChart();
}

function renderCategorySelect() {
  const month = getActiveMonth();
  refs.categorySelect.innerHTML = month.categories
    .map((category) => `<option value="${category.id}">${category.name}</option>`)
    .join("");
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
        <article class="category-card">
          <div class="category-head">
            <div class="category-name-row">
              <div class="category-name">
                <span class="category-dot" style="background:${category.color}"></span>
                <strong>${category.name}</strong>
              </div>
              <span class="amount-chip">${formatAmount(getCategoryTotal(category))}</span>
            </div>
            <button class="btn-danger" type="button" onclick="removeCategory('${category.id}')">
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
                              <strong>${sub.name}</strong>
                              <span class="type-pill ${
                                sub.type === "income" ? "type-income" : "type-expense"
                              }">${sub.type === "income" ? "Rentrée d'argent" : "Dépense"}</span>
                            </div>
                            <button
                              class="btn-danger"
                              type="button"
                              onclick="removeSubcategory('${category.id}', '${sub.id}')"
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
                              oninput="updateSubcategoryAmount('${category.id}', '${sub.id}', this.value)"
                            />
                          </label>
                        </div>
                      `
                    )
                    .join("")
                : '<div class="empty-state">Aucune sous-catégorie. Ajoute-en une juste au-dessus.</div>'
            }
          </div>
        </article>
      `
    )
    .join("");
}

function updateSubcategoryAmount(categoryId, subcategoryId, value) {
  const month = getActiveMonth();
  const category = month.categories.find((item) => item.id === categoryId);
  const subcategory = category?.subcategories.find((item) => item.id === subcategoryId);

  if (!subcategory) {
    return;
  }

  subcategory.amount = Number(value) || 0;
  render();
}

function removeSubcategory(categoryId, subcategoryId) {
  const month = getActiveMonth();
  const category = month.categories.find((item) => item.id === categoryId);

  if (!category) {
    return;
  }

  category.subcategories = category.subcategories.filter((item) => item.id !== subcategoryId);
  render();
}

function removeCategory(categoryId) {
  const month = getActiveMonth();
  month.categories = month.categories.filter((item) => item.id !== categoryId);
  render();
}

function goToMonth(monthId, copyFrom = state.activeMonthId) {
  ensureMonthExists(monthId, copyFrom);
  state.activeMonthId = monthId;
  render();
}

function render() {
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

refs.duplicateMonthBtn.addEventListener("click", () => {
  const nextMonthId = getNextMonthId(state.activeMonthId);

  state.months[nextMonthId] = {
    id: nextMonthId,
    label: formatMonthLabel(nextMonthId),
    categories: cloneData(getActiveMonth().categories)
  };

  state.activeMonthId = nextMonthId;
  render();
});

refs.resetCurrentMonthBtn.addEventListener("click", () => {
  const month = getActiveMonth();

  month.categories.forEach((category) => {
    category.subcategories.forEach((sub) => {
      sub.amount = 0;
    });
  });

  render();
});

refs.subcategoryForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const month = getActiveMonth();
  const category = month.categories.find((item) => item.id === refs.categorySelect.value);

  if (!category) {
    return;
  }

  category.subcategories.push({
    id: uid(),
    name: refs.subcategoryNameInput.value.trim(),
    type: refs.subcategoryTypeSelect.value,
    amount: Number(refs.subcategoryAmountInput.value) || 0
  });

  refs.subcategoryForm.reset();
  refs.subcategoryTypeSelect.value = "expense";
  render();
});

refs.categoryForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const month = getActiveMonth();
  month.categories.push({
    id: uid(),
    name: refs.categoryNameInput.value.trim(),
    color: refs.categoryColorInput.value,
    subcategories: []
  });

  refs.categoryForm.reset();
  refs.categoryColorInput.value = "#8f14b0";
  render();
});

window.updateSubcategoryAmount = updateSubcategoryAmount;
window.removeSubcategory = removeSubcategory;
window.removeCategory = removeCategory;

render();
