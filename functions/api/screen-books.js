import {
  RULE_VERSION,
  buildScreeningPrompt,
} from "../_shared/selection-rules.js";

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
const ALLOWED_RATINGS = new Set(["A", "B", "C", "D"]);
const ALLOWED_CANDIDATE_DECISIONS = new Set(["推荐", "不推荐", "待人工判断"]);
const BATCH_SIZE = 10;
const MAX_ATTEMPTS = 2;

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function errorResponse(code, message, status = 500) {
  return jsonResponse(
    {
      source: "deepseek",
      error: { code, message },
    },
    status,
  );
}

function validateInput(input) {
  if (!input || !Array.isArray(input.books)) {
    return "books 必须是数组";
  }
  if (input.books.length < 1 || input.books.length > 100) {
    return "每次必须提交 1 至 100 本候选书";
  }
  if (
    input.books.some(
      (book) => !book || book.id === undefined || !book.title,
    )
  ) {
    return "每本书都必须包含 id 和 title";
  }
  return null;
}

function normalizeStringArray(value) {
  return Array.isArray(value)
    ? value.filter((item) => typeof item === "string").slice(0, 10)
    : [];
}

function normalizeEnrichedFields(book) {
  const inputFields = {
    isbn: book.isbn,
    author: book.author,
    translator: book.translator,
    publisher: book.publisher,
    publish_date: book.publish_date,
    publish_year: book.publish_year,
    category: book.category,
    keywords: Array.isArray(book.keywords) ? book.keywords.join("、") : book.keywords,
    pages: book.pages,
    binding: book.binding,
    description: book.description,
    price: book.price,
  };
  return Object.fromEntries(
    Object.entries(inputFields).map(([field, value]) => [
      field,
      typeof value === "string" && value.trim() && value !== "待补充"
        ? value.trim()
        : "待人工确认",
    ]),
  );
}

function normalizeResults(payload, books) {
  if (!payload || !Array.isArray(payload.results)) {
    throw new Error("DeepSeek 未返回有效的 results 数组");
  }

  const resultById = new Map(
    payload.results.map((result) => [String(result?.id), result]),
  );

  return books.map((book) => {
    const result = resultById.get(String(book.id));
    if (!result || !ALLOWED_RATINGS.has(result.rating)) {
      throw new Error(`书籍 ${book.id} 缺少有效的 A/B/C/D 判断`);
    }

    const incomplete = book.info_completeness === "poor" || book.needs_review === true;
    const missingInformation = [
      ...normalizeStringArray(result.missing_information),
      ...(Array.isArray(book.missing_fields) ? book.missing_fields : []),
    ];
    if (!book.description) missingInformation.push("图书简介");
    if (!book.catalog) missingInformation.push("目录");
    if (!book.review_excerpt) missingInformation.push("书评或来源摘要");
    const risks = normalizeStringArray(result.risks);
    if (incomplete) risks.push("图书信息不完整，AI 判断置信度已降低，必须人工复核");

    const candidateDecision = ALLOWED_CANDIDATE_DECISIONS.has(result.candidate_decision)
      ? result.candidate_decision
      : result.rating === "D"
        ? "不推荐"
        : result.rating === "A" || result.rating === "B"
          ? "推荐"
          : "待人工判断";

    return {
      id: book.id,
      rating: incomplete && result.rating === "A" ? "C" : result.rating,
      candidate_decision:
        incomplete
          ? "待人工判断"
          : candidateDecision,
      reason:
        typeof result.reason === "string" ? result.reason : "需要人工进一步判断",
      risks: [...new Set(risks)].slice(0, 10),
      shelf_theme:
        typeof result.shelf_theme === "string" ? result.shelf_theme : "待人工确认",
      needs_human_review: true,
      human_review_questions: normalizeStringArray(result.human_review_questions),
      missing_information: [...new Set(missingInformation)].slice(0, 15),
      enriched_fields: normalizeEnrichedFields(book),
      enrichment_confidence: incomplete
        ? "低"
        : ["高", "中", "低"].includes(result.enrichment_confidence)
        ? result.enrichment_confidence
        : "低",
      enrichment_notes: normalizeStringArray(result.enrichment_notes),
    };
  });
}

async function requestDeepSeek(apiKey, input) {
  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(DEEPSEEK_API_URL, {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          response_format: { type: "json_object" },
          temperature: 0.2,
          max_tokens: 8192,
          messages: [
            {
              role: "system",
              content:
                "严格执行 FREETEXT 选书规则。只做辅助初筛，所有结果必须经过人工复核。",
            },
            {
              role: "user",
              content: buildScreeningPrompt(input),
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API 返回 ${response.status}`);
      }

      const deepseekPayload = await response.json();
      const content = deepseekPayload?.choices?.[0]?.message?.content;
      if (typeof content !== "string") {
        throw new Error("DeepSeek 未返回有效内容");
      }

      const parsed = JSON.parse(content);
      return {
        results: normalizeResults(parsed, input.books),
        commonRisks: normalizeStringArray(parsed.summary?.common_risks),
        rulesToReview: normalizeStringArray(parsed.summary?.rules_to_review),
      };
    } catch (error) {
      lastError = error;
      console.error(`DeepSeek screening attempt ${attempt} failed:`, error);
    }
  }

  throw lastError;
}

function splitIntoBatches(books) {
  const batches = [];
  for (let index = 0; index < books.length; index += BATCH_SIZE) {
    batches.push(books.slice(index, index + BATCH_SIZE));
  }
  return batches;
}

function normalizeRuleList(value) {
  return Array.isArray(value)
    ? value.filter((item) => typeof item === "string" && item.trim()).slice(0, 8)
    : [];
}

async function deriveRules(apiKey, input) {
  const response = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 4096,
      messages: [
        {
          role: "system",
          content:
            "你负责根据真实选书过程沉淀可复用规则。只总结本轮数据，不编造，不决定采购。",
        },
        {
          role: "user",
          content: `根据以下原始书单、AI 初筛、人工复核和最终分组，生成本轮选书规则。
只返回 JSON：
{
  "keep_preferences": ["本轮保留偏好"],
  "rejection_reasons": ["本轮剔除原因"],
  "reusable_rules": ["可复用选书规则"],
  "next_round_suggestions": ["下一轮建议"]
}

本轮数据：
${JSON.stringify(input)}`,
        },
      ],
    }),
  });
  if (!response.ok) throw new Error(`DeepSeek API 返回 ${response.status}`);
  const payload = await response.json();
  const parsed = JSON.parse(payload?.choices?.[0]?.message?.content || "{}");
  return {
    keep_preferences: normalizeRuleList(parsed.keep_preferences),
    rejection_reasons: normalizeRuleList(parsed.rejection_reasons),
    reusable_rules: normalizeRuleList(parsed.reusable_rules),
    next_round_suggestions: normalizeRuleList(parsed.next_round_suggestions),
  };
}

export async function onRequestPost(context) {
  if (!context.env.DEEPSEEK_API_KEY) {
    return errorResponse(
      "DEEPSEEK_KEY_MISSING",
      "DeepSeek 暂时不可用，可使用备用演示数据",
      503,
    );
  }

  let input;
  try {
    input = await context.request.json();
  } catch {
    return errorResponse("INVALID_JSON", "请求内容不是有效 JSON", 400);
  }

  if (input?.mode === "derive-rules") {
    try {
      return jsonResponse({
        source: "deepseek",
        rules: await deriveRules(context.env.DEEPSEEK_API_KEY, input),
      });
    } catch (error) {
      console.error("DeepSeek rule derivation failed:", error);
      return errorResponse("RULE_DERIVATION_UNAVAILABLE", "本轮规则暂时无法自动生成", 502);
    }
  }

  const validationError = validateInput(input);
  if (validationError) {
    return errorResponse("INVALID_INPUT", validationError, 400);
  }

  try {
    const batches = splitIntoBatches(input.books);
    const batchResults = await Promise.all(
      batches.map((books) =>
        requestDeepSeek(context.env.DEEPSEEK_API_KEY, { ...input, books }),
      ),
    );
    const results = batchResults.flatMap((batch) => batch.results);
    const ratingCounts = Object.fromEntries(
      ["A", "B", "C", "D"].map((rating) => [
        rating,
        results.filter((result) => result.rating === rating).length,
      ]),
    );

    return jsonResponse({
      source: "deepseek",
      rule_version: RULE_VERSION,
      results,
      summary: {
        total: results.length,
        rating_counts: ratingCounts,
        common_risks: [
          ...new Set(batchResults.flatMap((batch) => batch.commonRisks)),
        ].slice(0, 10),
        rules_to_review: [
          ...new Set(batchResults.flatMap((batch) => batch.rulesToReview)),
        ].slice(0, 10),
      },
    });
  } catch (error) {
    console.error("DeepSeek screening failed:", error);
    return errorResponse(
      "DEEPSEEK_UNAVAILABLE",
      "DeepSeek 暂时不可用，可使用备用演示数据",
      502,
    );
  }
}

export function onRequest(context) {
  return errorResponse("METHOD_NOT_ALLOWED", "只支持 POST 请求", 405);
}
