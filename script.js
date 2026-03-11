const clock = document.getElementById("clock");
const heroSignalCount = document.getElementById("heroSignalCount");
const headlineCluster = document.getElementById("headlineCluster");
const signalCount = document.getElementById("signalCount");
const clusterCount = document.getElementById("clusterCount");
const panelSignalCount = document.getElementById("panelSignalCount");
const panelClusterCount = document.getElementById("panelClusterCount");
const composerStatus = document.getElementById("composerStatus");
const featuredGrid = document.getElementById("featuredGrid");
const flowList = document.getElementById("flowList");
const activeFilter = document.getElementById("activeFilter");
const clearFilterBtn = document.getElementById("clearFilterBtn");
const cityList = document.getElementById("cityList");
const signalCard = document.getElementById("signalCard");
const cityField = document.getElementById("city");
const countryField = document.getElementById("country");
const contextField = document.getElementById("context");
const messageField = document.getElementById("message");
const submitButton = document.getElementById("submitSignal");
const clearButton = document.getElementById("clearBtn");
const drawWorldBtn = document.getElementById("drawWorldBtn");
const drawAiBtn = document.getElementById("drawAiBtn");
const openReadBtn = document.getElementById("openReadBtn");
const modalMask = document.getElementById("modalMask");
const modalTitle = document.getElementById("modalTitle");
const modalMeta = document.getElementById("modalMeta");
const modalOriginal = document.getElementById("modalOriginal");
const modalAi = document.getElementById("modalAi");
const modalMore = document.getElementById("modalMore");
const closeModalBtn = document.getElementById("closeModalBtn");

let readSignals = [];
let flowFilter = { type: "all", value: "" };

function countryToFlag(countryCode) {
  const normalized = (countryCode || "").toUpperCase();
  if (normalized.length !== 2) {
    return "🌐";
  }
  return String.fromCodePoint(...[...normalized].map((char) => 127397 + char.charCodeAt(0)));
}

function updateClock() {
  const now = new Date();
  clock.textContent = now.toLocaleString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "UTC"
  }) + " 世界标准时";
}

function setComposerStatus(text, live) {
  composerStatus.textContent = text;
  composerStatus.classList.toggle("is-live", Boolean(live));
}

function getSignals() {
  return Array.from(flowList.querySelectorAll(".signal"));
}

function getSignalData(signal) {
  const city = signal.dataset.city || signal.querySelector(".flow-top span:nth-child(2)")?.textContent || "未知地区";
  const country = (signal.dataset.country || signal.querySelector(".flow-flag")?.textContent || "").toUpperCase();
  const cluster = signal.dataset.cluster || "未归类观察";
  const time = signal.querySelector(".flow-top span:nth-child(3)")?.textContent || "世界标准时";
  const message = signal.querySelector(".flow-text")?.textContent || "";
  const original = message;
  const summary = signal.querySelector(".detail-card p")?.textContent || message;
  return { city, country, cluster, time, message, original, summary };
}

function updateCounts() {
  const signals = getSignals();
  const clusters = new Set(signals.map((signal) => signal.dataset.cluster || "未归类观察"));
  const signalText = String(signals.length).padStart(2, "0");
  const clusterText = String(clusters.size).padStart(2, "0");

  signalCount.textContent = signalText;
  clusterCount.textContent = clusterText;
  panelSignalCount.textContent = signalText;
  panelClusterCount.textContent = clusterText;
  heroSignalCount.textContent = "全球信号：" + signalText;
}

function refreshHeadlineCluster() {
  const latestSignal = getSignals()[0];
  const cluster = latestSignal ? latestSignal.dataset.cluster || "未归类观察" : "等待信号";
  headlineCluster.textContent = "当前重点事件：" + cluster;
}

function syncFeaturedCards() {
  const latestSignal = getSignals()[0];
  const activeCluster = latestSignal ? latestSignal.dataset.cluster || "未归类观察" : "";

  featuredGrid.querySelectorAll("[data-cluster-card]").forEach((card) => {
    card.classList.toggle("active", card.dataset.clusterCard === activeCluster);
  });
}

function updateCityList() {
  const cities = [];
  getSignals().forEach((signal) => {
    const city = signal.dataset.city;
    const country = (signal.dataset.country || "").toUpperCase();
    if (city && !cities.some((entry) => entry.city === city)) {
      cities.push({ city, country });
    }
  });

  cityList.innerHTML = "";
  cities.slice(0, 8).forEach((entry) => {
    const tag = document.createElement("span");
    tag.textContent = `${countryToFlag(entry.country)} ${entry.city}`;
    cityList.appendChild(tag);
  });
}

function showSignalCard(data) {
  signalCard.classList.remove("empty");
  const titleWithFlag = `${countryToFlag(data.country)} ${data.city}`;
  signalCard.innerHTML = `
    <div>
      <div class="signal-status">${data.cluster}</div>
      <div class="signal-title">${titleWithFlag}</div>
      <div class="signal-body">${data.message}</div>
    </div>
    <div class="signal-bottom">
      <span class="tag">${data.time}</span>
      <span class="signal-mini">${data.summary}</span>
    </div>
  `;
}

function openModal(data) {
  modalTitle.textContent = `${countryToFlag(data.country)} ${data.city} · ${data.cluster}`;
  modalMeta.textContent = data.time;
  modalOriginal.textContent = data.original;
  modalAi.textContent = data.summary;
  modalMore.textContent = "系统会保留原始信号作为证据，并在需要时合并进更高层级的事件簇。";
  modalMask.classList.add("show");
}

function closeModal() {
  modalMask.classList.remove("show");
}

function buildDetailMarkup(cluster, city, countryCode) {
  return `
    <div class="detail-updating">更新中 • ${countryToFlag(countryCode)} ${city || "全球"}</div>
    <div class="detail-grid">
      <div class="detail-card">
        <h3>关联信号</h3>
        <p>正在等待来自附近区域、可相互印证的 ${cluster} 补充报告。</p>
      </div>
      <div class="detail-card">
        <h3>时间线</h3>
        <p>该记录已写入当前本地原型流，并进入持续更新状态。</p>
      </div>
      <div class="detail-card">
        <h3>附近地点</h3>
        <ul>
          <li>等待更多本地证据</li>
          <li>预留事件簇扩展位</li>
          <li>支持继续行内展开查看</li>
        </ul>
      </div>
    </div>
  `;
}

function createSignalItem(city, country, cluster, message) {
  const article = document.createElement("article");
  const countryCode = country.slice(0, 2).toUpperCase();
  const time = new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC"
  }) + " 世界标准时";

  article.className = "flow-item signal open";
  article.dataset.city = city;
  article.dataset.country = countryCode;
  article.dataset.cluster = cluster || "未归类观察";
  article.innerHTML = `
    <button type="button" class="signal-trigger flow-trigger" aria-expanded="true">
      <div class="flow-top">
        <span class="flow-flag filter-flag" data-filter-country="${countryCode}" tabindex="0" role="button">${countryCode}</span>
        <span class="filter-city" data-filter-city="${city}" tabindex="0" role="button">${countryToFlag(countryCode)} ${city}</span>
        <span>${time}</span>
        <span class="tag">${article.dataset.cluster}</span>
      </div>
      <div class="flow-text"></div>
    </button>
    <div class="signal-details"></div>
  `;

  article.querySelector(".flow-text").textContent = message;
  article.querySelector(".signal-details").innerHTML = buildDetailMarkup(article.dataset.cluster, city, article.dataset.country);
  return article;
}

function updateOrInsertFeaturedCard(city, countryCode, cluster, message) {
  if (!cluster) {
    return;
  }

  let card = featuredGrid.querySelector(`[data-cluster-card="${CSS.escape(cluster)}"]`);
  if (!card) {
    card = document.createElement("article");
    card.className = "featured-card";
    card.dataset.clusterCard = cluster;
    card.innerHTML = `
      <div>
        <div class="featured-flag"></div>
        <div class="featured-title"></div>
      </div>
      <div class="featured-meta"></div>
    `;
    const statCard = featuredGrid.querySelector(".stat-card");
    featuredGrid.insertBefore(card, statCard || null);
  }

  const normalizedCountry = (countryCode || "").toUpperCase();
  card.querySelector(".featured-flag").textContent = normalizedCountry || city.slice(0, 2).toUpperCase();
  card.querySelector(".featured-title").textContent = `${countryToFlag(normalizedCountry)} ${city} ${cluster}`;
  card.querySelector(".featured-meta").textContent = message;

  const cards = Array.from(featuredGrid.querySelectorAll(".featured-card:not(.stat-card)"));
  if (cards.length > 4) {
    cards[cards.length - 1].remove();
  }
}

function bindSignalToggles(root = document) {
  root.querySelectorAll(".signal-trigger").forEach((button) => {
    if (button.dataset.bound === "true") {
      return;
    }

    button.dataset.bound = "true";
    button.addEventListener("click", () => {
      const signal = button.closest(".signal");
      const isOpen = signal.classList.toggle("open");
      button.setAttribute("aria-expanded", String(isOpen));
      if (isOpen) {
        showSignalCard(getSignalData(signal));
      }
    });
  });
}

function applyFlowFilter() {
  const signals = getSignals();
  signals.forEach((signal) => {
    let visible = true;
    if (flowFilter.type === "country") {
      visible = (signal.dataset.country || "").toUpperCase() === flowFilter.value;
    } else if (flowFilter.type === "city") {
      visible = (signal.dataset.city || "") === flowFilter.value;
    }
    signal.style.display = visible ? "" : "none";
  });

  if (!activeFilter) {
    return;
  }
  if (flowFilter.type === "all") {
    activeFilter.textContent = "当前筛选：全部地区";
  } else if (flowFilter.type === "country") {
    activeFilter.textContent = `当前筛选：国家 ${flowFilter.value}`;
  } else {
    activeFilter.textContent = `当前筛选：城市 ${flowFilter.value}`;
  }
}

function setFlowFilter(type, value) {
  if (flowFilter.type === type && flowFilter.value === value) {
    flowFilter = { type: "all", value: "" };
  } else {
    flowFilter = { type, value };
  }
  applyFlowFilter();
}

function bindFlowFilters(root = document) {
  root.querySelectorAll(".filter-flag").forEach((node) => {
    if (node.dataset.filterBound === "true") {
      return;
    }
    node.dataset.filterBound = "true";
    node.addEventListener("click", (event) => {
      event.stopPropagation();
      const code = (node.dataset.filterCountry || node.textContent || "").trim().toUpperCase();
      if (code) {
        setFlowFilter("country", code);
      }
    });
    node.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        node.click();
      }
    });
  });

  root.querySelectorAll(".filter-city").forEach((node) => {
    if (node.dataset.filterBound === "true") {
      return;
    }
    node.dataset.filterBound = "true";
    node.addEventListener("click", (event) => {
      event.stopPropagation();
      const city = (node.dataset.filterCity || node.textContent || "").trim();
      if (city) {
        setFlowFilter("city", city);
      }
    });
    node.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        node.click();
      }
    });
  });
}

function clearFields() {
  cityField.value = "";
  countryField.value = "";
  contextField.value = "";
  messageField.value = "";
}

function submitSignal() {
  const city = cityField.value.trim();
  const country = countryField.value.trim();
  const cluster = contextField.value.trim();
  const message = messageField.value.trim();

  if (!city || !country || !message) {
    setComposerStatus("需要填写城市、国家和观察内容", false);
    return;
  }

  const signal = createSignalItem(city, country, cluster, message);
  flowList.prepend(signal);
  bindSignalToggles(signal);
  bindFlowFilters(signal);
  updateOrInsertFeaturedCard(city, signal.dataset.country, signal.dataset.cluster, message);
  updateCounts();
  refreshHeadlineCluster();
  syncFeaturedCards();
  updateCityList();
  showSignalCard(getSignalData(signal));
  setComposerStatus("信号已发送", true);
  clearFields();
}

function drawWorldSignal() {
  const firstSignal = getSignals()[0];
  if (!firstSignal) {
    signalCard.classList.add("empty");
    signalCard.textContent = "当前本地原型里没有可抽取的信号。";
    return;
  }

  const data = getSignalData(firstSignal);
  readSignals.unshift(data);
  showSignalCard(data);
}

function drawAiSignal() {
  const signals = getSignals();
  if (!signals.length) {
    return;
  }

  const activeHeadline = headlineCluster.textContent.replace("当前重点事件：", "").trim();
  const preferred = signals.find((signal) => signal.dataset.cluster === activeHeadline) || signals[0];
  const data = getSignalData(preferred);
  readSignals.unshift(data);
  showSignalCard(data);
}

function openReadList() {
  if (!readSignals.length) {
    openModal({
      city: "已读信号",
      cluster: "历史",
      time: "本地原型",
      original: "当前还没有已抽取的信号记录。",
      summary: "点击「抽取世界信号」或「查看重点信号」后，这里会显示你看过的信号。",
      message: "暂无已读信号"
    });
    return;
  }

  const latest = readSignals[0];
  openModal({
    city: latest.city,
    cluster: latest.cluster,
    time: latest.time,
    original: readSignals.map((item, index) => `${index + 1}. ${item.city} · ${item.cluster}`).join("；"),
    summary: "这里记录的是当前会话中被抽取查看过的信号。",
    message: latest.message
  });
}

submitButton.addEventListener("click", submitSignal);
clearButton.addEventListener("click", () => {
  clearFields();
  setComposerStatus("已清空输入", false);
});
drawWorldBtn.addEventListener("click", drawWorldSignal);
drawAiBtn.addEventListener("click", drawAiSignal);
openReadBtn.addEventListener("click", openReadList);
if (clearFilterBtn) {
  clearFilterBtn.addEventListener("click", () => {
    flowFilter = { type: "all", value: "" };
    applyFlowFilter();
  });
}
closeModalBtn.addEventListener("click", closeModal);
modalMask.addEventListener("click", (event) => {
  if (event.target === modalMask) {
    closeModal();
  }
});

messageField.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    submitSignal();
  }
});

[cityField, countryField, contextField, messageField].forEach((field) => {
  field.addEventListener("input", () => {
    setComposerStatus("正在记录输入", true);
  });
});

getSignals().forEach((signal) => {
  signal.addEventListener("dblclick", () => {
    openModal(getSignalData(signal));
  });
});

updateClock();
updateCounts();
refreshHeadlineCluster();
syncFeaturedCards();
updateCityList();
bindSignalToggles();
bindFlowFilters();
applyFlowFilter();
showSignalCard(getSignalData(getSignals()[0]));
setComposerStatus("等待输入", false);
setInterval(updateClock, 1000);