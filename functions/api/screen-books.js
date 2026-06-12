import {
  RULE_VERSION,
  buildScreeningPrompt,
} from "../_shared/selection-rules.js";

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
const ALLOWED_RATINGS = new Set(["A", "B", "C", "D"]);
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
  if (input.books.length < 1 || input.books.length > 20) {
    return "每次必须提交 1 至 20 本候选书";
  }
  if (
    input.books.some(
      (book) => !book || book.id === undefined || !book.title || !book.description,
    )
  ) {
    return "每本书都必须包含 id、title 和 description";
  }
  return null;
}

function normalizeStringArray(value) {
  return Array.isArray(value)
    ? value.filter((item) => typeof item === "string").slice(0, 10)
    : [];
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

    return {
      id: book.id,
      rating: result.rating,
      candidate_decision:
        typeof result.candidate_decision === "string"
          ? result.candidate_decision
          : "需要人工判断",
      reason:
        typeof result.reason === "string" ? result.reason : "需要人工进一步判断",
      risks: normalizeStringArray(result.risks),
      shelf_theme:
        typeof result.shelf_theme === "string" ? result.shelf_theme : "待人工确认",
      needs_human_review: true,
      human_review_questions: normalizeStringArray(result.human_review_questions),
      missing_information: normalizeStringArray(result.missing_information),
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
