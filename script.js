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

function updateClock() {
  const now = new Date();
  clock.textContent = now.toLocaleString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "UTC"
  }) + " UTC";
}

function setComposerStatus(text, live) {
  composerStatus.textContent = text;
  composerStatus.classList.toggle("is-live", Boolean(live));
}

function getSignals() {
  return Array.from(flowList.querySelectorAll(".signal"));
}

function getSignalData(signal) {
  const city = signal.dataset.city || signal.querySelector(".flow-top span:nth-child(2)")?.textContent || "Unknown";
  const cluster = signal.dataset.cluster || "Unclustered observation";
  const time = signal.querySelector(".flow-top span:nth-child(3)")?.textContent || "UTC";
  const message = signal.querySelector(".flow-text")?.textContent || "";
  const original = message;
  const summary = signal.querySelector(".detail-card p")?.textContent || message;
  return { city, cluster, time, message, original, summary };
}

function updateCounts() {
  const signals = getSignals();
  const clusters = new Set(signals.map((signal) => signal.dataset.cluster || "Unclustered observation"));
  const signalText = String(signals.length).padStart(2, "0");
  const clusterText = String(clusters.size).padStart(2, "0");

  signalCount.textContent = signalText;
  clusterCount.textContent = clusterText;
  panelSignalCount.textContent = signalText;
  panelClusterCount.textContent = clusterText;
  heroSignalCount.textContent = "Global Signals: " + signalText;
}

function refreshHeadlineCluster() {
  const latestSignal = getSignals()[0];
  const cluster = latestSignal ? latestSignal.dataset.cluster || "Unclustered observation" : "Waiting for signal";
  headlineCluster.textContent = "当前重点事件：" + cluster;
}

function syncFeaturedCards() {
  const latestSignal = getSignals()[0];
  const activeCluster = latestSignal ? latestSignal.dataset.cluster || "Unclustered observation" : "";

  featuredGrid.querySelectorAll("[data-cluster-card]").forEach((card) => {
    card.classList.toggle("active", card.dataset.clusterCard === activeCluster);
  });
}

function updateCityList() {
  const cities = [];
  getSignals().forEach((signal) => {
    const city = signal.dataset.city;
    if (city && !cities.includes(city)) {
      cities.push(city);
    }
  });

  cityList.innerHTML = "";
  cities.slice(0, 8).forEach((city) => {
    const tag = document.createElement("span");
    tag.textContent = city;
    cityList.appendChild(tag);
  });
}

function showSignalCard(data) {
  signalCard.classList.remove("empty");
  signalCard.innerHTML = `
    <div>
      <div class="signal-status">${data.cluster}</div>
      <div class="signal-title">${data.city}</div>
      <div class="signal-body">${data.message}</div>
    </div>
    <div class="signal-bottom">
      <span class="tag">${data.time}</span>
      <span class="signal-mini">${data.summary}</span>
    </div>
  `;
}

function openModal(data) {
  modalTitle.textContent = data.city + " · " + data.cluster;
  modalMeta.textContent = data.time;
  modalOriginal.textContent = data.original;
  modalAi.textContent = data.summary;
  modalMore.textContent = "系统会保留原始 signal 作为证据，并在需要时合并进更高层级的事件簇。";
  modalMask.classList.add("show");
}

function closeModal() {
  modalMask.classList.remove("show");
}

function buildDetailMarkup(cluster) {
  return `
    <div class="detail-grid">
      <div class="detail-card">
        <h3>Related signals</h3>
        <p>Waiting for corroborating reports from nearby locations for ${cluster}.</p>
      </div>
      <div class="detail-card">
        <h3>Timeline</h3>
        <p>Recorded just now and inserted into the local prototype stream.</p>
      </div>
      <div class="detail-card">
        <h3>Nearby locations</h3>
        <ul>
          <li>Additional local evidence pending</li>
          <li>Cluster expansion placeholder</li>
          <li>Inline detail remains available</li>
        </ul>
      </div>
    </div>
  `;
}

function createSignalItem(city, country, cluster, message) {
  const article = document.createElement("article");
  const time = new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC"
  }) + " UTC";

  article.className = "flow-item signal open";
  article.dataset.city = city;
  article.dataset.cluster = cluster || "Unclustered observation";
  article.innerHTML = `
    <button type="button" class="signal-trigger flow-trigger" aria-expanded="true">
      <div class="flow-top">
        <span class="flow-flag">${country.slice(0, 2).toUpperCase()}</span>
        <span>${city}</span>
        <span>${time}</span>
        <span class="tag">${article.dataset.cluster}</span>
      </div>
      <div class="flow-text"></div>
    </button>
    <div class="signal-details"></div>
  `;

  article.querySelector(".flow-text").textContent = message;
  article.querySelector(".signal-details").innerHTML = buildDetailMarkup(article.dataset.cluster);
  return article;
}

function updateOrInsertFeaturedCard(city, cluster, message) {
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

  card.querySelector(".featured-flag").textContent = city.slice(0, 2).toUpperCase();
  card.querySelector(".featured-title").textContent = city + " " + cluster;
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
  updateOrInsertFeaturedCard(city, signal.dataset.cluster, message);
  updateCounts();
  refreshHeadlineCluster();
  syncFeaturedCards();
  updateCityList();
  showSignalCard(getSignalData(signal));
  setComposerStatus("Signal 已发送", true);
  clearFields();
}

function drawWorldSignal() {
  const firstSignal = getSignals()[0];
  if (!firstSignal) {
    signalCard.classList.add("empty");
    signalCard.textContent = "当前本地原型里没有可抽取的 signal。";
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
      city: "Read signals",
      cluster: "History",
      time: "Local prototype",
      original: "当前还没有已抽取的信号记录。",
      summary: "点击「抽取世界信号」或「查看重点信号」后，这里会显示你看过的 signal。",
      message: "暂无已读 signal"
    });
    return;
  }

  const latest = readSignals[0];
  openModal({
    city: latest.city,
    cluster: latest.cluster,
    time: latest.time,
    original: readSignals.map((item, index) => `${index + 1}. ${item.city} · ${item.cluster}`).join("；"),
    summary: "这里记录的是当前会话中被抽取查看过的 signal。",
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
showSignalCard(getSignalData(getSignals()[0]));
setComposerStatus("等待输入", false);
setInterval(updateClock, 1000);