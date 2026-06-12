import { RULE_VERSION, buildScreeningPrompt } from "../_shared/selection-rules.js";

const API_URL = "https://api.deepseek.com/chat/completions";
const RATINGS = new Set(["A", "B", "C", "D"]);
const reply = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const fail = (code, message, status = 500) => reply({ source: "deepseek", error: { code, message } }, status);
const strings = (value) => Array.isArray(value) ? value.filter((item) => typeof item === "string").slice(0, 10) : [];

function validate(input) {
  if (!input || !Array.isArray(input.books)) return "books 必须是数组";
  if (input.books.length < 1 || input.books.length > 20) return "每次必须提交 1 至 20 本候选书";
  if (input.books.some((book) => !book || book.id === undefined || !book.title || !book.description)) return "每本书都必须包含 id、title 和 description";
  return null;
}

function normalize(payload, books) {
  if (!payload || !Array.isArray(payload.results)) throw new Error("DeepSeek 未返回有效结果");
  const byId = new Map(payload.results.map((item) => [String(item?.id), item]));
  return books.map((book) => {
    const item = byId.get(String(book.id));
    if (!item || !RATINGS.has(item.rating)) throw new Error(`书籍 ${book.id} 缺少有效判断`);
    return {
      id: book.id,
      rating: item.rating,
      candidate_decision: typeof item.candidate_decision === "string" ? item.candidate_decision : "需要人工判断",
      reason: typeof item.reason === "string" ? item.reason : "需要人工进一步判断",
      risks: strings(item.risks),
      shelf_theme: typeof item.shelf_theme === "string" ? item.shelf_theme : "待人工确认",
      needs_human_review: true,
      human_review_questions: strings(item.human_review_questions),
      missing_information: strings(item.missing_information),
    };
  });
}

export async function onRequestPost(context) {
  if (!context.env.DEEPSEEK_API_KEY) return fail("DEEPSEEK_KEY_MISSING", "DeepSeek 暂时不可用，可使用备用演示数据", 503);
  let input;
  try { input = await context.request.json(); } catch { return fail("INVALID_JSON", "请求内容不是有效 JSON", 400); }
  const problem = validate(input);
  if (problem) return fail("INVALID_INPUT", problem, 400);
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { authorization: `Bearer ${context.env.DEEPSEEK_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ model: "deepseek-chat", response_format: { type: "json_object" }, temperature: 0.2, messages: [
        { role: "system", content: "严格执行 FREETEXT 选书规则。只做辅助初筛，所有结果必须经过人工复核。" },
        { role: "user", content: buildScreeningPrompt(input) },
      ] }),
    });
    if (!response.ok) throw new Error(`DeepSeek API 返回 ${response.status}`);
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") throw new Error("DeepSeek 未返回有效内容");
    const parsed = JSON.parse(content);
    const results = normalize(parsed, input.books);
    return reply({ source: "deepseek", rule_version: RULE_VERSION, results, summary: { total: results.length, rating_counts: Object.fromEntries(["A", "B", "C", "D"].map((rating) => [rating, results.filter((item) => item.rating === rating).length])), common_risks: strings(parsed.summary?.common_risks), rules_to_review: strings(parsed.summary?.rules_to_review) } });
  } catch (error) {
    console.error("DeepSeek screening failed:", error);
    return fail("DEEPSEEK_UNAVAILABLE", "DeepSeek 暂时不可用，可使用备用演示数据", 502);
  }
}

export function onRequest() { return fail("METHOD_NOT_ALLOWED", "只支持 POST 请求", 405); }
