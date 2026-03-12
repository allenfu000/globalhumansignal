const clock = document.getElementById("clock");
const heroStatus = document.getElementById("heroStatus");
const flowList = document.getElementById("flowList");
const poolGrid = document.getElementById("poolGrid");
const poolCount = document.getElementById("poolCount");
const messageField = document.getElementById("message");
const submitButton = document.getElementById("submitSignal");
const featuredCards = document.querySelectorAll("[data-featured-card]");
const accountEntry = document.querySelector("[data-account-entry]");

const COUNTRY_CODE_TO_FLAG = {
  AR: "🇦🇷",
  AU: "🇦🇺",
  BR: "🇧🇷",
  CA: "🇨🇦",
  CN: "🇨🇳",
  DE: "🇩🇪",
  ES: "🇪🇸",
  FI: "🇫🇮",
  FR: "🇫🇷",
  IN: "🇮🇳",
  IT: "🇮🇹",
  JP: "🇯🇵",
  KR: "🇰🇷",
  RU: "🇷🇺",
  SG: "🇸🇬",
  UK: "🇬🇧",
  US: "🇺🇸"
};

const FLAG_EMOJI_TO_CODE = Object.fromEntries(
  Object.entries(COUNTRY_CODE_TO_FLAG).map(([code, emoji]) => [emoji, code.toLowerCase()])
);

const liveSignals = [
  {
    flag: "🇯🇵",
    country: "日本",
    city: "东京",
    time: "21:14",
    text: "东京地铁延误正在扩大",
    tag: "#交通"
  },
  {
    flag: "🇫🇮",
    country: "芬兰",
    city: "赫尔辛基",
    time: "20:48",
    text: "主干道积雪增厚导致车速下降",
    tag: "#天气"
  },
  {
    flag: "🇦🇷",
    country: "阿根廷",
    city: "布宜诺斯艾利斯",
    time: "20:06",
    text: "多个路口停电后交通灯暂时失效",
    tag: "#停电"
  },
  {
    flag: "🇫🇷",
    country: "法国",
    city: "巴黎",
    time: "19:42",
    text: "议会周边人流增加，街区通行变慢",
    tag: "#集会"
  }
];

function countryCodeToFlag(code) {
  const normalized = String(code || "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) {
    return "";
  }

  if (COUNTRY_CODE_TO_FLAG[normalized]) {
    return COUNTRY_CODE_TO_FLAG[normalized];
  }

  return String.fromCodePoint(
    127397 + normalized.charCodeAt(0),
    127397 + normalized.charCodeAt(1)
  );
}

function normalizeFlagToken(token) {
  const raw = String(token || "").trim();
  if (!raw) {
    return "";
  }
  const fromCode = countryCodeToFlag(raw);
  return fromCode || raw;
}

function resolveFlagCode(token) {
  const normalized = String(token || "").trim();
  if (!normalized) {
    return "";
  }
  if (/^[a-zA-Z]{2}$/.test(normalized)) {
    return normalized.toLowerCase();
  }
  return FLAG_EMOJI_TO_CODE[normalized] || "";
}

function applyFlagRendering(scope) {
  const root = scope || document;
  const flagNodes = root.querySelectorAll(".inline-flag, .live-flag, .pool-flag, .featured-meta-flag");
  const preferEmoji = supportsFlagEmoji();
  flagNodes.forEach((node) => {
    if (node.dataset.flagEnhanced === "true") {
      return;
    }
    const token = (node.textContent || "").trim();
    const normalizedFlag = normalizeFlagToken(token);
    const flagCode = resolveFlagCode(normalizedFlag);
    if (!flagCode) {
      return;
    }
    if (preferEmoji) {
      node.textContent = normalizedFlag;
    } else {
      const flagDataUri = buildLocalFlagDataUri(flagCode);
      if (flagDataUri) {
        node.innerHTML = `<img class="flag-img" src="${flagDataUri}" alt="${normalizedFlag}" loading="lazy" decoding="async" />`;
      } else {
        node.textContent = normalizedFlag;
      }
    }
    node.dataset.flagEnhanced = "true";
  });
}

function supportsFlagEmoji() {
  // Windows 桌面环境普遍不支持国家旗帜 emoji（常显示为字母），直接走图片回退。
  if (/Windows/i.test(navigator.userAgent)) {
    return false;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 32;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return false;
  }

  ctx.textBaseline = "top";
  ctx.font = '24px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';

  const getSignature = (text) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#000";
    ctx.fillText(text, 0, 0);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let hash = 0;
    for (let i = 0; i < data.length; i += 16) {
      hash = (hash * 33 + data[i] + data[i + 1] + data[i + 2] + data[i + 3]) >>> 0;
    }
    return hash;
  };

  const flagSig = getSignature("🇯🇵");
  const asciiSig = getSignature("JP");

  return flagSig !== asciiSig;
}

function svgToDataUri(svg) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function buildLocalFlagDataUri(code) {
  const svgMap = {
    jp: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 24"><rect width="36" height="24" fill="#fff"/><circle cx="18" cy="12" r="6.2" fill="#bc002d"/></svg>`,
    fi: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 24"><rect width="36" height="24" fill="#fff"/><rect x="9" width="5" height="24" fill="#003580"/><rect y="9" width="36" height="5" fill="#003580"/></svg>`,
    ar: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 24"><rect width="36" height="24" fill="#fff"/><rect width="36" height="8" fill="#75aadb"/><rect y="16" width="36" height="8" fill="#75aadb"/><circle cx="18" cy="12" r="2" fill="#f6b40e"/></svg>`,
    fr: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 24"><rect width="12" height="24" fill="#0055a4"/><rect x="12" width="12" height="24" fill="#fff"/><rect x="24" width="12" height="24" fill="#ef4135"/></svg>`,
    sg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 24"><rect width="36" height="12" fill="#ef3340"/><rect y="12" width="36" height="12" fill="#fff"/><circle cx="8.5" cy="6.5" r="4.1" fill="#fff"/><circle cx="9.8" cy="6.5" r="3.3" fill="#ef3340"/></svg>`,
    us: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 38 24"><rect width="38" height="24" fill="#fff"/><rect width="38" height="1.85" y="0" fill="#b22234"/><rect width="38" height="1.85" y="3.7" fill="#b22234"/><rect width="38" height="1.85" y="7.4" fill="#b22234"/><rect width="38" height="1.85" y="11.1" fill="#b22234"/><rect width="38" height="1.85" y="14.8" fill="#b22234"/><rect width="38" height="1.85" y="18.5" fill="#b22234"/><rect width="38" height="1.85" y="22.15" fill="#b22234"/><rect width="15.2" height="10.2" fill="#3c3b6e"/></svg>`,
    cn: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 24"><rect width="36" height="24" fill="#de2910"/><polygon points="7,3.2 7.9,5.8 10.6,5.8 8.4,7.4 9.2,10 7,8.4 4.8,10 5.6,7.4 3.4,5.8 6.1,5.8" fill="#ffde00"/></svg>`
  };

  const svg = svgMap[code];
  if (!svg) {
    return "";
  }
  return svgToDataUri(svg);
}

function formatCollapsedLocationWithFlag(locationText) {
  const normalized = (locationText || "").replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "";
  }

  const tokens = normalized.split(" ").filter(Boolean);
  const firstToken = tokens[0] || "";
  const normalizedFlag = normalizeFlagToken(firstToken);
  const hasFlag = Boolean(resolveFlagCode(normalizedFlag));
  if (!hasFlag) {
    return normalized;
  }

  const restText = normalized.slice(firstToken.length).trim();
  if (!restText) {
    return `<span class="inline-flag">${normalizedFlag}</span>`;
  }

  const parts = restText.split("·").map((part) => part.trim()).filter(Boolean);
  const country = parts[0] || "";
  const city = parts[1] || "";
  if (!country) {
    return `<span class="inline-flag">${normalizedFlag}</span> ${restText}`;
  }

  if (!city) {
    return `<span class="inline-flag">${normalizedFlag}</span> <span class="featured-country-name">${country}</span>`;
  }

  return `<span class="inline-flag">${normalizedFlag}</span> <span class="featured-country-name">${country}</span> <span class="featured-location-sep">·</span> <span class="featured-city-name">${city}</span>`;
}

function updateClock() {
  const now = new Date();
  clock.textContent = now.toLocaleString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "UTC"
  }) + " 世界标准时间";
}

function updateHeroAndPoolCount() {
  const countText = String(liveSignals.length).padStart(2, "0");
  const heroCount = heroStatus.querySelector(".hero-count");
  if (heroCount) {
    heroCount.textContent = countText;
  }
  poolCount.textContent = `可见信号 ${countText}`;
}

function createSignalElement(signal) {
  const article = document.createElement("article");
  article.className = "live-item signal";
  const displayFlag = normalizeFlagToken(signal.flag);
  article.innerHTML = `
    <button type="button" class="signal-trigger" aria-expanded="false">
      <div class="live-meta">
        <span class="live-flag">${displayFlag}</span>
        <span class="live-location">${signal.country} · ${signal.city}</span>
        <span class="live-time">· ${signal.time}</span>
        <span class="live-tag">${signal.tag}</span>
      </div>
      <p class="live-text">${signal.text}</p>
    </button>
    <div class="signal-details">
      <p>△ 时间线：正在持续写入本地原始记录。</p>
      <p>△ 关联信号：附近区域出现相似关键词。</p>
      <p>△ 附近地点：可在展开面板继续查看。</p>
    </div>
  `;

  const trigger = article.querySelector(".signal-trigger");
  trigger.addEventListener("click", () => {
    const isOpen = article.classList.toggle("open");
    trigger.setAttribute("aria-expanded", String(isOpen));
  });
  return article;
}

function renderLiveFeed() {
  flowList.innerHTML = "";
  liveSignals.forEach((signal) => {
    flowList.appendChild(createSignalElement(signal));
  });
  applyFlagRendering(flowList);
}

function renderPool() {
  poolGrid.innerHTML = "";
  liveSignals.concat(liveSignals).forEach((signal, index) => {
    const item = document.createElement("article");
    item.className = "pool-item";
    const displayFlag = normalizeFlagToken(signal.flag);
    item.innerHTML = `
      <div class="pool-row"><span class="pool-flag">${displayFlag}</span> ${signal.country} · ${signal.city} · ${signal.time}</div>
      <div class="pool-main">${signal.text}</div>
      <div class="pool-row">${signal.tag} · 原始信号 #${index + 1}</div>
    `;
    poolGrid.appendChild(item);
  });
  applyFlagRendering(poolGrid);
}

function submitSignal() {
  const text = messageField.value.trim();
  if (!text) {
    return;
  }

  const now = new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC"
  });

  liveSignals.unshift({
    flag: "🇨🇳",
    country: "中国",
    city: "用户提交",
    time: now,
    text,
    tag: "#现场"
  });

  messageField.value = "";
  renderLiveFeed();
  renderPool();
  updateHeroAndPoolCount();
}

let featuredPopover = null;
let featuredPopoverCloseBtn = null;
let featuredPopoverBody = null;
let activeFeaturedCard = null;
let hidePopoverTimer = null;
let switchPopoverTimer = null;

let accountPopover = null;
let accountPopoverCloseBtn = null;
let accountPopoverBody = null;
let isAccountPopoverOpen = false;
let hideAccountPopoverTimer = null;

function truncateWithAsciiEllipsis(text, maxChars) {
  const normalized = (text || "").trim();
  if (normalized.length <= maxChars) {
    return normalized;
  }
  return `${normalized.slice(0, maxChars).trim()}...`;
}

function normalizeChineseColon(text) {
  return String(text || "").replace(/:/g, "：");
}

function extractSignalNumber(originText) {
  const normalized = String(originText || "").trim();
  const match = normalized.match(/GS#\s*([A-Za-z0-9]+)/i);
  return match ? match[1] : "";
}

function formatCollapsedOriginLine(originText) {
  const normalized = normalizeChineseColon(originText).replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "";
  }

  let rest = normalized;
  let flagMarkup = "";
  const leadingEmoji = Object.values(COUNTRY_CODE_TO_FLAG).find((emoji) => rest.startsWith(emoji));
  if (leadingEmoji) {
    flagMarkup = `<span class="inline-flag">${leadingEmoji}</span>`;
    rest = rest.slice(leadingEmoji.length).trim();
  } else {
    const leadingCodeMatch = rest.match(/^([A-Za-z]{2})(?=GS#|\s|：|:)/);
    if (leadingCodeMatch) {
      const normalizedFlag = normalizeFlagToken(leadingCodeMatch[1]);
      if (resolveFlagCode(normalizedFlag)) {
        flagMarkup = `<span class="inline-flag">${normalizedFlag}</span>`;
        rest = rest.slice(leadingCodeMatch[1].length).trim();
      }
    }
  }

  const gsMatch = rest.match(/^(GS#[A-Za-z0-9#-]+)\s*[：]?\s*(.*)$/i);
  if (!gsMatch) {
    const fallback = truncateWithAsciiEllipsis(rest, 38);
    return `${flagMarkup}${fallback}`;
  }

  const gsId = gsMatch[1];
  const body = truncateWithAsciiEllipsis(gsMatch[2], 28);
  return `${flagMarkup}<span class="featured-origin-id">${gsId}</span>：${body}`;
}

function formatCollapsedAiLine(aiText) {
  const normalized = normalizeChineseColon(aiText).replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "";
  }

  const content = normalized.replace(/^AI\s*[：]?\s*/i, "");
  const summary = truncateWithAsciiEllipsis(content, 40);
  return `<span class="featured-ai-label">AI</span>：${summary}`;
}

function buildCompactEventSummary(eventText) {
  const normalized = (eventText || "").replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "";
  }

  const predefined = [
    { keyword: "东京地铁", summary: "东京地铁延误正在扩大。" },
    { keyword: "降雪增强", summary: "港区方向能见度持续下降。" },
    { keyword: "停电扩散", summary: "城区停电影响仍在扩散。" },
    { keyword: "公共集会", summary: "核心街区通行速度变慢。" },
    { keyword: "港口拥堵", summary: "货运通道排队持续拉长。" },
    { keyword: "高架封控", summary: "跨区通勤出现连续延迟。" }
  ];
  const matched = predefined.find((item) => normalized.includes(item.keyword));
  if (matched) {
    return matched.summary;
  }

  const firstSentence = normalized
    .split(/[。！？.!?]/)
    .map((part) => part.trim())
    .filter(Boolean)[0] || normalized;

  const compact = firstSentence.slice(0, 20).trim();
  if (!compact) {
    return "事件正在持续发展。";
  }
  return /[。！？.!?]$/.test(compact) ? compact : `${compact}。`;
}

function getCollapsedFeaturedLocation(locationText) {
  const normalized = (locationText || "").replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "";
  }
  const parts = normalized.split("·").map((part) => part.trim()).filter(Boolean);
  if (parts.length <= 2) {
    return normalized;
  }
  return `${parts[0]} · ${parts[1]}`;
}

function applyFeaturedCompactPreview() {
  const rules = [
    { selector: ".featured-time", maxChars: 18 },
    { selector: ".featured-location", maxChars: 0 },
    { selector: ".featured-event", maxChars: 32 },
    { selector: ".featured-origin", maxChars: 42 },
    { selector: ".featured-translate", maxChars: 50 },
    { selector: ".featured-ai", maxChars: 46 }
  ];

  featuredCards.forEach((card) => {
    rules.forEach((rule) => {
      const node = card.querySelector(rule.selector);
      if (!node) {
        return;
      }
      if (!node.dataset.fullText) {
        node.dataset.fullText = node.textContent || "";
      }
      if (rule.selector === ".featured-time") {
        const originNode = card.querySelector(".featured-origin");
        const originSource = originNode
          ? (originNode.dataset.fullText || originNode.textContent || "")
          : "";
        const signalNumber = extractSignalNumber(originSource);
        node.innerHTML = `
          <span class="featured-time-main">${node.dataset.fullText}</span>
          ${signalNumber ? `<span class="featured-time-signal">信号#${signalNumber}</span>` : ""}
        `;
      } else if (rule.selector === ".featured-location") {
        const collapsedLocation = getCollapsedFeaturedLocation(node.dataset.fullText);
        node.innerHTML = formatCollapsedLocationWithFlag(collapsedLocation);
      } else if (rule.selector === ".featured-event") {
        node.textContent = buildCompactEventSummary(node.dataset.fullText);
      } else if (rule.selector === ".featured-origin") {
        node.innerHTML = formatCollapsedOriginLine(node.dataset.fullText);
      } else if (rule.selector === ".featured-ai") {
        node.innerHTML = formatCollapsedAiLine(node.dataset.fullText);
      } else {
        node.textContent = truncateWithAsciiEllipsis(node.dataset.fullText, rule.maxChars);
      }
    });
  });
  const featuredGrid = document.getElementById("featuredGrid");
  if (featuredGrid) {
    applyFlagRendering(featuredGrid);
  }
}

function ensureFeaturedPopover() {
  if (featuredPopover) {
    return;
  }

  featuredPopover = document.createElement("div");
  featuredPopover.className = "featured-popover";
  featuredPopover.setAttribute("aria-hidden", "true");
  featuredPopover.innerHTML = `
    <button type="button" class="featured-popover-close">关闭</button>
    <div class="featured-popover-body"></div>
  `;

  document.body.appendChild(featuredPopover);
  featuredPopoverCloseBtn = featuredPopover.querySelector(".featured-popover-close");
  featuredPopoverBody = featuredPopover.querySelector(".featured-popover-body");

  featuredPopoverCloseBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    closeFeaturedPopover();
  });

  featuredPopoverBody.addEventListener("click", (event) => {
    event.stopPropagation();
    closeFeaturedPopover();
  });
}

function ensureAccountPopover() {
  if (accountPopover) {
    return;
  }

  accountPopover = document.createElement("div");
  accountPopover.className = "featured-popover";
  accountPopover.setAttribute("aria-hidden", "true");
  accountPopover.innerHTML = `
    <button type="button" class="featured-popover-close">关闭</button>
    <div class="featured-popover-body account-popover-body">
      <label class="account-popover-row">
        <span>账号：</span>
        <input type="text" placeholder="请输入账号" autocomplete="username" />
      </label>
      <label class="account-popover-row">
        <span>密码：</span>
        <input type="password" placeholder="请输入密码" autocomplete="current-password" />
      </label>
    </div>
  `;

  document.body.appendChild(accountPopover);
  accountPopoverCloseBtn = accountPopover.querySelector(".featured-popover-close");
  accountPopoverBody = accountPopover.querySelector(".account-popover-body");

  accountPopoverCloseBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    closeAccountPopover();
  });

  accountPopoverBody.addEventListener("click", (event) => {
    event.stopPropagation();
  });
}

function getFeaturedCardData(card) {
  const readText = (selector) => {
    const node = card.querySelector(selector);
    if (!node) {
      return "";
    }
    return node.dataset.fullText || node.textContent || "";
  };

  return {
    time: readText(".featured-time"),
    location: readText(".featured-location"),
    event: readText(".featured-event"),
    origin: readText(".featured-origin"),
    translate: readText(".featured-translate"),
    ai: readText(".featured-ai")
  };
}

function parseFeaturedLocation(locationText) {
  const normalized = (locationText || "").replace(/\s+/g, " ").trim();
  const parts = normalized.split("·").map((part) => part.trim()).filter(Boolean);
  const left = parts[0] || "";
  const city = parts[1] || "";
  const leftTokens = left.split(/\s+/).filter(Boolean);

  let flag = "";
  let country = "";
  if (leftTokens.length >= 2) {
    flag = normalizeFlagToken(leftTokens[0]);
    country = leftTokens.slice(1).join(" ");
  } else if (leftTokens.length === 1) {
    country = leftTokens[0];
  }

  if (!country) {
    country = normalized;
  }

  return { flag, country, city };
}

function maskWordWithBlocks(word) {
  const charCount = Array.from(word).length;
  if (charCount <= 0) {
    return "";
  }
  return "█".repeat(charCount);
}

function redactAddressDetail(detailText) {
  if (!detailText) {
    return "";
  }

  const suffixes = ["区", "县", "郡", "街", "路", "巷", "道", "镇", "乡", "村", "里"];
  return detailText.replace(/([\u4e00-\u9fff]{1,8})(区|县|郡|街|路|巷|道|镇|乡|村|里)/g, (full, stem, suffix) => {
    if (!suffixes.includes(suffix)) {
      return full;
    }
    return `${maskWordWithBlocks(stem)}${suffix}`;
  });
}

function buildFeaturedLocationMarkup(locationText) {
  const parsedLocation = parseFeaturedLocation(locationText);
  const normalized = (locationText || "").replace(/\s+/g, " ").trim();
  const parts = normalized.split("·").map((part) => part.trim()).filter(Boolean);
  const detail = parts.slice(2).join(" · ");
  const redactedDetail = redactAddressDetail(detail);
  const detailMarkup = redactedDetail ? `<span class="featured-meta-detail">${redactedDetail}</span>` : "";

  return {
    markup: `
      ${parsedLocation.flag ? `<span class="featured-meta-flag">${parsedLocation.flag}</span>` : ""}
      ${parsedLocation.country ? `<span class="featured-meta-country">${parsedLocation.country}</span>` : ""}
      ${parsedLocation.city ? `<span class="featured-meta-city">${parsedLocation.city}</span>` : ""}
      ${detailMarkup}
    `,
    hasDetail: Boolean(redactedDetail)
  };
}

function parseFeaturedTime(timeText) {
  const normalized = (timeText || "").trim();
  if (!normalized) {
    return "";
  }
  const matchedTime = normalized.match(/(\d{1,2}:\d{2})/);
  if (matchedTime) {
    return matchedTime[1];
  }
  return normalized.replace(/^.*[：:]\s*/, "").trim();
}

function isCompactViewport() {
  return window.matchMedia("(max-width: 768px)").matches;
}

function positionFeaturedPopover(card) {
  if (!featuredPopover) {
    return;
  }

  if (isCompactViewport()) {
    const popoverWidth = Math.min(window.innerWidth - 12, 560);
    const left = Math.round((window.innerWidth - popoverWidth) / 2);
    const top = 6;

    featuredPopover.classList.remove("placement-bottom");
    featuredPopover.classList.add("is-mobile-layout");
    featuredPopover.style.width = `${popoverWidth}px`;
    featuredPopover.style.left = `${Math.max(6, left)}px`;
    featuredPopover.style.top = `${top}px`;
    return;
  }

  featuredPopover.classList.remove("is-mobile-layout");

  const rect = card.getBoundingClientRect();
  const desiredWidth = Math.max(rect.width + 220, 700);
  const popoverWidth = Math.min(desiredWidth, window.innerWidth - 24);
  featuredPopover.style.width = `${popoverWidth}px`;

  featuredPopover.classList.remove("placement-bottom");
  featuredPopover.style.visibility = "hidden";
  featuredPopover.classList.add("is-open");
  const popoverHeight = featuredPopover.offsetHeight;
  featuredPopover.classList.remove("is-open");
  featuredPopover.style.visibility = "";

  let left = rect.left + (rect.width - popoverWidth) / 2;
  left = Math.max(12, Math.min(left, window.innerWidth - popoverWidth - 12));
  left = Math.round(left);

  const topAsAbove = rect.top - 24;
  const showBelow = topAsAbove < 12;
  const maxTop = window.innerHeight - popoverHeight - 12;
  const top = showBelow
    ? Math.min(maxTop, rect.bottom - rect.height * 0.2)
    : Math.min(maxTop, topAsAbove);

  featuredPopover.style.left = `${left}px`;
  featuredPopover.style.top = `${Math.round(top)}px`;
  featuredPopover.classList.toggle("placement-bottom", showBelow);
}

function openFeaturedPopover(card) {
  ensureFeaturedPopover();

  if (hidePopoverTimer) {
    clearTimeout(hidePopoverTimer);
    hidePopoverTimer = null;
  }
  if (isAccountPopoverOpen) {
    closeAccountPopover({ immediate: true });
  }
  if (switchPopoverTimer) {
    clearTimeout(switchPopoverTimer);
    switchPopoverTimer = null;
  }

  const data = getFeaturedCardData(card);
  const shouldAnimateSwitch = Boolean(
    activeFeaturedCard &&
    activeFeaturedCard !== card &&
    featuredPopover.classList.contains("is-open")
  );

  if (activeFeaturedCard && activeFeaturedCard !== card) {
    activeFeaturedCard.classList.remove("is-source-active");
    activeFeaturedCard.setAttribute("aria-expanded", "false");
  }

  activeFeaturedCard = card;
  card.classList.add("is-source-active");
  card.setAttribute("aria-expanded", "true");

  const renderAndOpen = () => {
    const locationResult = buildFeaturedLocationMarkup(data.location);
    const parsedTime = parseFeaturedTime(data.time);

    featuredPopoverBody.innerHTML = `
      <div class="featured-popover-meta">
        <p class="featured-meta-location ${locationResult.hasDetail ? "has-detail" : ""}">${locationResult.markup}</p>
        <p class="featured-meta-time">
          <span class="featured-meta-time-label">当前时间</span>
          <span class="featured-meta-time-value">${parsedTime || data.time}</span>
        </p>
      </div>
      <p class="featured-event">${data.event}</p>
      <p class="featured-origin">${data.origin}</p>
      <p class="featured-translate">${data.translate || ""}</p>
      <p class="featured-ai">${data.ai}</p>
    `;
    applyFlagRendering(featuredPopoverBody);

    positionFeaturedPopover(card);
    featuredPopover.setAttribute("aria-hidden", "false");
    requestAnimationFrame(() => {
      featuredPopover.classList.add("is-open");
    });
  };

  if (shouldAnimateSwitch) {
    featuredPopover.classList.remove("is-open");
    switchPopoverTimer = setTimeout(() => {
      switchPopoverTimer = null;
      if (activeFeaturedCard !== card) {
        return;
      }
      renderAndOpen();
    }, 180);
    return;
  }

  renderAndOpen();
}

function closeFeaturedPopover(options = {}) {
  const immediate = Boolean(options.immediate);
  if (!featuredPopover || !activeFeaturedCard) {
    return;
  }
  if (switchPopoverTimer) {
    clearTimeout(switchPopoverTimer);
    switchPopoverTimer = null;
  }

  if (immediate) {
    featuredPopover.classList.add("no-motion");
  }

  featuredPopover.classList.remove("is-open");
  featuredPopover.setAttribute("aria-hidden", "true");

  activeFeaturedCard.classList.remove("is-source-active");
  activeFeaturedCard.setAttribute("aria-expanded", "false");
  activeFeaturedCard = null;

  if (immediate) {
    featuredPopover.style.left = "-9999px";
    featuredPopover.style.top = "-9999px";
    requestAnimationFrame(() => {
      if (featuredPopover) {
        featuredPopover.classList.remove("no-motion");
      }
    });
    return;
  }

  hidePopoverTimer = setTimeout(() => {
    if (featuredPopover) {
      featuredPopover.style.left = "-9999px";
      featuredPopover.style.top = "-9999px";
    }
  }, 260);
}

function positionAccountPopover() {
  if (!accountPopover || !accountEntry) {
    return;
  }

  const rect = accountEntry.getBoundingClientRect();
  const desiredWidth = Math.max(rect.width + 220, 420);
  const popoverWidth = Math.min(desiredWidth, window.innerWidth - 24);
  accountPopover.style.width = `${popoverWidth}px`;

  accountPopover.classList.remove("placement-bottom");
  accountPopover.style.visibility = "hidden";
  accountPopover.classList.add("is-open");
  const popoverHeight = accountPopover.offsetHeight;
  accountPopover.classList.remove("is-open");
  accountPopover.style.visibility = "";

  let left = rect.left + (rect.width - popoverWidth) / 2;
  left = Math.max(12, Math.min(left, window.innerWidth - popoverWidth - 12));
  left = Math.round(left);

  const topAsAbove = rect.top - 24;
  const showBelow = topAsAbove < 12;
  const maxTop = window.innerHeight - popoverHeight - 12;
  const top = showBelow
    ? Math.min(maxTop, rect.bottom - rect.height * 0.2)
    : Math.min(maxTop, topAsAbove);

  accountPopover.style.left = `${left}px`;
  accountPopover.style.top = `${Math.round(top)}px`;
  accountPopover.classList.toggle("placement-bottom", showBelow);
}

function openAccountPopover() {
  if (!accountEntry) {
    return;
  }
  ensureAccountPopover();

  if (hideAccountPopoverTimer) {
    clearTimeout(hideAccountPopoverTimer);
    hideAccountPopoverTimer = null;
  }

  if (activeFeaturedCard) {
    closeFeaturedPopover({ immediate: true });
  }

  isAccountPopoverOpen = true;
  accountEntry.classList.add("is-source-active");
  accountEntry.setAttribute("aria-expanded", "true");

  positionAccountPopover();
  accountPopover.setAttribute("aria-hidden", "false");
  requestAnimationFrame(() => {
    accountPopover.classList.add("is-open");
  });
}

function closeAccountPopover(options = {}) {
  const immediate = Boolean(options.immediate);
  if (!accountPopover || !isAccountPopoverOpen) {
    return;
  }

  if (immediate) {
    accountPopover.classList.add("no-motion");
  }

  accountPopover.classList.remove("is-open");
  accountPopover.setAttribute("aria-hidden", "true");
  isAccountPopoverOpen = false;
  if (accountEntry) {
    accountEntry.classList.remove("is-source-active");
    accountEntry.setAttribute("aria-expanded", "false");
  }

  if (immediate) {
    accountPopover.style.left = "-9999px";
    accountPopover.style.top = "-9999px";
    requestAnimationFrame(() => {
      if (accountPopover) {
        accountPopover.classList.remove("no-motion");
      }
    });
    return;
  }

  hideAccountPopoverTimer = setTimeout(() => {
    if (accountPopover) {
      accountPopover.style.left = "-9999px";
      accountPopover.style.top = "-9999px";
    }
  }, 260);
}

function bindFeaturedCards() {
  featuredCards.forEach((card) => {
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");
    card.setAttribute("aria-expanded", "false");

    card.addEventListener("click", (event) => {
      event.stopPropagation();
      if (activeFeaturedCard === card) {
        closeFeaturedPopover();
      } else {
        openFeaturedPopover(card);
      }
    });

    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        if (activeFeaturedCard === card) {
          closeFeaturedPopover();
        } else {
          openFeaturedPopover(card);
        }
      }
    });
  });

  document.addEventListener("click", (event) => {
    if (!activeFeaturedCard || !featuredPopover) {
      if (isAccountPopoverOpen && accountPopover && accountEntry) {
        if (accountPopover.contains(event.target)) {
          return;
        }
        if (accountEntry.contains(event.target)) {
          return;
        }
        closeAccountPopover();
      }
      return;
    }
    if (featuredPopover.contains(event.target)) {
      return;
    }
    if (activeFeaturedCard.contains(event.target)) {
      return;
    }
    closeFeaturedPopover();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && activeFeaturedCard) {
      closeFeaturedPopover();
    } else if (event.key === "Escape" && isAccountPopoverOpen) {
      closeAccountPopover();
    }
  });

  window.addEventListener("resize", () => {
    if (activeFeaturedCard) {
      positionFeaturedPopover(activeFeaturedCard);
    }
    if (isAccountPopoverOpen) {
      positionAccountPopover();
    }
  });

  window.addEventListener("orientationchange", () => {
    if (activeFeaturedCard) {
      positionFeaturedPopover(activeFeaturedCard);
    }
    if (isAccountPopoverOpen) {
      positionAccountPopover();
    }
  });

  window.addEventListener("scroll", () => {
    if (activeFeaturedCard) {
      closeFeaturedPopover({ immediate: true });
    }
    if (isAccountPopoverOpen) {
      closeAccountPopover({ immediate: true });
    }
  }, { passive: true });
}

function bindAccountEntry() {
  if (!accountEntry) {
    return;
  }

  accountEntry.addEventListener("click", (event) => {
    event.stopPropagation();
    if (isAccountPopoverOpen) {
      closeAccountPopover();
    } else {
      openAccountPopover();
    }
  });

  accountEntry.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (isAccountPopoverOpen) {
        closeAccountPopover();
      } else {
        openAccountPopover();
      }
    }
  });
}

submitButton.addEventListener("click", submitSignal);
messageField.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    submitSignal();
  }
});

updateClock();
renderLiveFeed();
renderPool();
updateHeroAndPoolCount();
applyFeaturedCompactPreview();
bindFeaturedCards();
bindAccountEntry();
applyFlagRendering(document);
setInterval(updateClock, 1000);