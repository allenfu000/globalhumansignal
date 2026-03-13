import { fetchLatestSessionMessages, fetchRecentSupabaseMessages, insertSupabaseMessage, insertSupabaseTask } from "../lib/storage-supabase.js";

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
  Expires: "0"
};

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: JSON_HEADERS
  });
}

function getErrorMessage(data, fallbackMessage) {
  return (
    data?.error?.message ||
    data?.message ||
    fallbackMessage ||
    "Unknown error"
  );
}

function toResponseText(data) {
  return data?.choices?.[0]?.message?.content || "";
}

function resolveSessionId(body) {
  const fromBody = typeof body?.session_id === "string" ? body.session_id.trim() : "";
  if (fromBody) {
    return fromBody;
  }
  return `gs_web_${Date.now()}`;
}

function resolveMode(body) {
  const mode = String(body?.mode || "normal").trim().toLowerCase();
  return mode === "dev" ? "dev" : "normal";
}

function resolveProvider(env) {
  const aiProvider = String(env?.AI_PROVIDER || "openai").trim().toLowerCase();
  const baseRaw = String(env?.OPENAI_BASE_URL || "https://api.openai.com/v1").trim();
  const baseUrl = baseRaw.endsWith("/") ? baseRaw.slice(0, -1) : baseRaw;
  const timeoutMsRaw = Number(env?.AI_TIMEOUT_MS || 30000);
  const timeoutMs = Number.isFinite(timeoutMsRaw) ? Math.max(8000, timeoutMsRaw) : 30000;
  return { aiProvider, baseUrl, timeoutMs };
}

function parseImages(images) {
  if (!Array.isArray(images)) {
    return [];
  }
  return images
    .map((item) => {
      if (typeof item === "string") {
        return { url: item.trim(), name: "" };
      }
      if (item && typeof item === "object") {
        return {
          url: String(item.url || "").trim(),
          name: String(item.name || "").trim()
        };
      }
      return { url: "", name: "" };
    })
    .filter((item) => item.url && (item.url.startsWith("data:image/") || /^https?:\/\//.test(item.url)))
    .slice(0, 10);
}

/** 每次请求只发一条 system：控制台身份 + 状态 + 禁止通用话术。开发模式时在同一条里追加 JSON 要求。 */
function buildConsoleSystemPrompt(opts) {
  const modeLabel = opts.mode === "dev" ? "开发模式 / Cursor模式" : "普通模式";
  const openAiStatus = opts.openAiReady ? "已连接" : "未知";
  const supabaseStatus = opts.supabaseReady ? "已连接" : "未配置或不可用";
  const historyNote =
    opts.supabaseCount > 0
      ? `本会话在数据库中有 ${opts.supabaseCount} 条近期记录，下方已按时间顺序附上。回答时必须结合这些内容和当前控制台状态，禁止给出通用教程或百科式回答。`
      : "本会话暂无历史记录，请仅根据当前用户输入和下述控制台状态回答。";

  const parts = [
    "【硬性规定】你是「全球信号智能控制台」的后台助手。严禁使用以下话术或任何变体：\"我是在基于云的环境中运行的人工智能模型\"、\"我的训练数据包括\"、\"我旨在处理和生成文本\"、\"欢迎告诉我\"等。禁止做通用自我介绍，直接以控制台助手身份结合当前状态和会话内容回答。",
    "",
    "【当前页面身份】全球信号智能控制台（gs-control）",
    "【当前模式】" + modeLabel,
    "【当前会话】session_id: " + (opts.sessionId || "未知"),
    "【当前连接状态】OpenAI: " + openAiStatus + "；Supabase: " + supabaseStatus + "；本会话历史条数: " + (opts.supabaseCount ?? 0) + "；本次附带图片: " + (opts.imageCount ?? 0) + " 张。",
    "",
    historyNote
  ];

  if (opts.mode === "dev") {
    parts.push(
      "",
      "【开发模式输出】你必须且仅输出一个 JSON，不要输出 JSON 之外的文字。结构：",
      '{"human_summary":"中文说明","cursor_task_title":"任务标题","cursor_task_prompt":"给 Cursor 的开发任务全文","affected_files":[],"notes":[],"risk":[],"test_points":[]}',
      "数组字段为字符串数组；cursor_task_prompt 需结构化（目标、改动文件、约束、测试点）。"
    );
  }

  return parts.join("\n");
}

function safeJsonParse(text) {
  const input = String(text || "").trim();
  if (!input) {
    return null;
  }
  try {
    return JSON.parse(input);
  } catch {
    const maybe = input.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (maybe?.[1]) {
      try {
        return JSON.parse(maybe[1]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

function normalizeDevOutput(rawText, parsed) {
  const fallback = {
    human_summary: rawText || "模型未返回结构化开发说明。",
    cursor_task_title: "待整理开发任务",
    cursor_task_prompt: rawText || "",
    affected_files: [],
    notes: [],
    risk: [],
    test_points: []
  };
  if (!parsed || typeof parsed !== "object") {
    return fallback;
  }
  const asArray = (value) => (Array.isArray(value) ? value.map((v) => String(v || "").trim()).filter(Boolean) : []);
  return {
    human_summary: String(parsed.human_summary || fallback.human_summary).trim(),
    cursor_task_title: String(parsed.cursor_task_title || fallback.cursor_task_title).trim(),
    cursor_task_prompt: String(parsed.cursor_task_prompt || fallback.cursor_task_prompt).trim(),
    affected_files: asArray(parsed.affected_files),
    notes: asArray(parsed.notes),
    risk: asArray(parsed.risk),
    test_points: asArray(parsed.test_points)
  };
}

function toPlainTextContent(value) {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item;
        if (item?.type === "text" && typeof item?.text === "string") return item.text;
        if (typeof item?.content === "string") return item.content;
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }
  return "";
}

function buildDevResponseFormat() {
  return {
    type: "json_schema",
    json_schema: {
      name: "gs_control_dev_output",
      strict: false,
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          human_summary: { type: "string" },
          cursor_task_title: { type: "string" },
          cursor_task_prompt: { type: "string" },
          affected_files: {
            type: "array",
            items: { type: "string" }
          },
          notes: {
            type: "array",
            items: { type: "string" }
          },
          risk: {
            type: "array",
            items: { type: "string" }
          },
          test_points: {
            type: "array",
            items: { type: "string" }
          }
        },
        required: [
          "human_summary",
          "cursor_task_title",
          "cursor_task_prompt",
          "affected_files",
          "notes",
          "risk",
          "test_points"
        ]
      }
    }
  };
}

function buildHistoryPreview(items, maxItems = 3) {
  const preview = [];
  for (const item of (items || []).slice(-maxItems)) {
    const role = item?.role === "assistant" ? "assistant" : "user";
    const raw = String(item?.content || "").replace(/\s+/g, " ").trim();
    const text = raw.length > 80 ? `${raw.slice(0, 80)}...` : raw;
    if (!text) continue;
    preview.push({ role, text });
  }
  return preview;
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      ...JSON_HEADERS,
      Allow: "POST, OPTIONS"
    }
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const { aiProvider, baseUrl, timeoutMs } = resolveProvider(env);

  if (!env?.OPENAI_API_KEY) {
    return jsonResponse(
      {
        ok: false,
        error: "missing_openai_api_key",
        message: "未配置 OPENAI_API_KEY，无法请求 AI 服务。"
      },
      500
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(
      {
        ok: false,
        error: "invalid_json",
        message: "请求体必须是有效 JSON。"
      },
      400
    );
  }

  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const sessionId = resolveSessionId(body);
  const mode = resolveMode(body);
  const images = parseImages(body?.images);
  const source = String(body?.source || "gs-control").trim() || "gs-control";
  const fromVoice = Boolean(body?.from_voice);
  const userMessageType = fromVoice ? "voice_text" : (images.length ? "image_text" : (mode === "dev" ? "dev_request" : "normal_text"));
  if (!message) {
    return jsonResponse(
      {
        ok: false,
        error: "missing_message",
        message: "请先输入内容。"
      },
      400
    );
  }

  const model = typeof body?.model === "string" && body.model.trim()
    ? body.model.trim()
    : "gpt-4o-mini";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort("timeout"), timeoutMs);

  try {
    let historyMessages = [];
    let historyLoadError = "";
    try {
      historyMessages = await fetchRecentSupabaseMessages(env, sessionId, 12);
    } catch (e) {
      historyLoadError = String(e?.message || e || "history_load_failed");
      historyMessages = [];
    }

    if (!historyMessages.length) {
      try {
        const fallback = await fetchLatestSessionMessages(env, 12);
        if (fallback.length) {
          historyMessages = fallback;
          historyLoadError = historyLoadError || "used_latest_session_fallback";
        }
      } catch (e) {
        historyLoadError = historyLoadError || String(e?.message || e || "latest_session_fallback_failed");
      }
    }

    const userContent = [{ type: "text", text: message }];
    for (const image of images) {
      userContent.push({
        type: "image_url",
        image_url: { url: image.url }
      });
    }

    const supabaseReady = Boolean(env?.SUPABASE_URL?.trim() && env?.SUPABASE_SERVICE_ROLE_KEY?.trim());
    const consoleSystemContent = buildConsoleSystemPrompt({
      mode,
      sessionId,
      openAiReady: true,
      supabaseReady,
      supabaseCount: historyMessages.length,
      imageCount: images.length
    });

    const messages = [];
    messages.push({
      role: "system",
      content: consoleSystemContent
    });

    for (const item of historyMessages) {
      const role = item?.role === "assistant" ? "assistant" : "user";
      const content = String(item?.content || "").trim();
      if (!content) continue;
      messages.push({
        role,
        content
      });
    }

    messages.push({
      role: "user",
      content: userContent
    });

    const requestBody = {
      model,
      messages,
      temperature: mode === "dev" ? 0.2 : 0.6
    };
    if (mode === "dev") {
      requestBody.response_format = buildDevResponseFormat();
    }

    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      const code = data?.error?.code || "openai_error";
      const baseMessage = getErrorMessage(data, "OpenAI request failed.");

      if (code === "unsupported_country_region_territory") {
        return jsonResponse(
          {
            ok: false,
            error: code,
            message: "当前上游区域不可用，请切换可用上游或代理。",
            details: baseMessage,
            hint: "可通过 OPENAI_BASE_URL 或 AI_PROVIDER 切换上游。"
          },
          403
        );
      }

      return jsonResponse(
        {
          ok: false,
          error: code,
          message: baseMessage,
          upstream_status: upstream.status
        },
        upstream.status
      );
    }

    const text = toPlainTextContent(toResponseText(data)).trim();
    const devParsed = mode === "dev" ? safeJsonParse(text) : null;
    const devOutput = mode === "dev" ? normalizeDevOutput(text, devParsed) : null;

    const debug = {
      aiProvider,
      openaiBaseUrl: baseUrl,
      timeoutMs,
      supabaseUrlSet: Boolean(env?.SUPABASE_URL?.trim()),
      supabaseKeySet: Boolean(env?.SUPABASE_SERVICE_ROLE_KEY?.trim()),
      supabaseWriteAttempted: false,
      supabaseReadAttempted: true,
      supabaseReadCount: historyMessages.length,
      supabaseReadError: historyLoadError,
      historyPreview: buildHistoryPreview(historyMessages, 3),
      upstreamStatus: upstream.status,
      mode,
      imageCount: images.length,
      userMessageWrite: "fail",
      assistantMessageWrite: "fail",
      userMessageError: "",
      assistantMessageError: ""
    };

    const userResult = await insertSupabaseMessage(env, {
      session_id: sessionId,
      role: "user",
      content: message,
      source,
      mode,
      message_type: userMessageType,
      attachments: images,
      meta: {
        from_voice: fromVoice
      },
      ts: Date.now()
    }).catch((e) => ({ ok: false, skipped: false, error: String(e?.message || e || "exception") }));

    const assistantContent = mode === "dev"
      ? (devOutput?.human_summary || text || "")
      : (text || "");
    const assistantMessageType = mode === "dev" ? "dev_summary" : "normal_text";
    const assistantResult = await insertSupabaseMessage(env, {
      session_id: sessionId,
      role: "assistant",
      content: assistantContent,
      source,
      mode,
      message_type: assistantMessageType,
      attachments: [],
      meta: mode === "dev" ? { has_cursor_task: Boolean(devOutput?.cursor_task_prompt) } : {},
      ts: Date.now()
    }).catch((e) => ({ ok: false, skipped: false, error: String(e?.message || e || "exception") }));

    if (mode === "dev" && devOutput?.cursor_task_prompt) {
      await insertSupabaseMessage(env, {
        session_id: sessionId,
        role: "assistant",
        content: devOutput.cursor_task_prompt,
        source,
        mode: "dev",
        message_type: "cursor_task",
        attachments: [],
        meta: {
          title: devOutput.cursor_task_title || "开发任务"
        },
        ts: Date.now()
      }).catch(() => null);
    }

    let taskWrite = { ok: false, skipped: true, reason: "not_requested" };
    if (mode === "dev" && body?.save_task === true && devOutput?.cursor_task_prompt) {
      taskWrite = await insertSupabaseTask(env, {
        session_id: sessionId,
        title: devOutput.cursor_task_title || "开发任务",
        status: "pending",
        task_content: devOutput.cursor_task_prompt,
        source,
        ts: Date.now()
      }).catch((e) => ({ ok: false, skipped: false, error: String(e?.message || e || "exception") }));
    }

    debug.supabaseWriteAttempted = !userResult.skipped || !assistantResult.skipped;
    debug.userMessageWrite = userResult.ok ? "success" : "fail";
    debug.assistantMessageWrite = assistantResult.ok ? "success" : "fail";
    debug.userMessageError = userResult.ok ? "" : (userResult.reason || userResult.error || "fail");
    debug.assistantMessageError = assistantResult.ok ? "" : (assistantResult.reason || assistantResult.error || "fail");
    debug.taskWrite = taskWrite.ok ? "success" : (taskWrite.skipped ? "skipped" : "fail");
    debug.taskWriteError = taskWrite.ok ? "" : (taskWrite.reason || taskWrite.error || "");

    return jsonResponse({
      ok: true,
      session_id: sessionId,
      text: mode === "dev" ? (devOutput?.human_summary || text) : text,
      dev_output: devOutput,
      debug
    });
  } catch (error) {
    if (String(error).includes("timeout")) {
      return jsonResponse(
        {
          ok: false,
          error: "upstream_timeout",
          message: "AI 请求超时，请稍后重试。"
        },
        504
      );
    }

    return jsonResponse(
      {
        ok: false,
        error: "internal_error",
        message: error?.message || "服务内部错误，请稍后重试。"
      },
      500
    );
  } finally {
    clearTimeout(timeout);
  }
}