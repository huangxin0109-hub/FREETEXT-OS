const DOUBAN_MOBILE_ORIGIN = "https://m.douban.com";
const MOBILE_USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 FREETEXT-OS book search";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, "")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&nbsp;", " ")
    .replace(/\s+/g, " ")
    .trim();
}

function attr(block, name) {
  return block.match(new RegExp(`${name}="([^"]*)"`, "i"))?.[1] || "";
}

function absoluteMobileUrl(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${DOUBAN_MOBILE_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}

function dateParts(value) {
  const match = String(value || "").match(/\b(\d{4})(?:[-/.年](\d{1,2}))?/);
  return {
    publishDate: match?.[0] || "",
    publishYear: match?.[1] || "",
    publishMonth: match?.[2] ? `${match[1]}-${String(match[2]).padStart(2, "0")}` : "",
  };
}

function splitMeta(meta) {
  return decodeHtml(meta)
    .replace(/出版$/, "")
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseBookMeta(meta) {
  const parts = splitMeta(meta);
  const dateIndex = parts.findIndex((part) => /\b(?:19|20)\d{2}(?:[-/.年]\d{1,2})?/.test(part));
  const publisher = dateIndex > 0 ? parts[dateIndex - 1] : "";
  const authorParts = dateIndex > 0 ? parts.slice(0, Math.max(0, dateIndex - 1)) : parts;
  return {
    author: authorParts.join("、"),
    publisher,
    ...dateParts(dateIndex >= 0 ? parts[dateIndex] : ""),
  };
}

function summaryFromDescription(description, title) {
  return decodeHtml(description)
    .replace(`${title}豆瓣评分：`, "豆瓣评分：")
    .replace(/^.*?简介：/, "")
    .trim();
}

function parseSearchResults(html, limit) {
  const moduleMatch = html.match(
    /<span class="search-results-modules-name">\s*读书\s*<\/span>[\s\S]*?<ul class="search_results_subjects">([\s\S]*?)<\/ul>/,
  );
  const listHtml = moduleMatch?.[1] || "";
  const items = [];
  const blocks = listHtml.match(/<li>[\s\S]*?<\/li>/g) || [];

  for (const block of blocks) {
    if (items.length >= limit) break;
    const href = attr(block.match(/<a [\s\S]*?<\/a>/)?.[0] || "", "href");
    const subjectId = href.match(/\/book\/subject\/(\d+)\/?/i)?.[1] || "";
    const title = decodeHtml(block.match(/<span class="subject-title">([\s\S]*?)<\/span>/)?.[1]);
    if (!subjectId || !title) continue;
    const imageBlock = block.match(/<img [\s\S]*?>/)?.[0] || "";
    const rating = decodeHtml(block.match(/<p class="rating">[\s\S]*?<span>([\d.]+)<\/span>/)?.[1]);
    items.push({
      title,
      subjectId,
      isbn: "",
      author: "",
      publisher: "",
      publishDate: "",
      publishYear: "",
      publishMonth: "",
      pages: "",
      coverUrl: attr(imageBlock, "src"),
      sourceUrl: absoluteMobileUrl(href),
      source: "豆瓣移动端图书搜索",
      sourceStatus: "partial",
      sourceConfidence: "medium",
      infoCompleteness: "poor",
      needsReview: true,
      reviewReason: "豆瓣移动端搜索结果字段有限，具体版本需人工复核",
      summary: "",
      catalog: "",
      reviewExcerpt: rating ? `豆瓣移动端搜索页评分：${rating}` : "",
      candidateReason: "豆瓣移动端关键词模糊匹配",
    });
  }

  return items;
}

async function fetchDoubanMobile(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": MOBILE_USER_AGENT,
      accept: "text/html,application/xhtml+xml",
      "accept-language": "zh-CN,zh;q=0.9",
      referer: `${DOUBAN_MOBILE_ORIGIN}/book/`,
    },
  });
  if (!response.ok) throw new Error(`豆瓣移动端返回 ${response.status}`);
  return response.text();
}

async function enrichFromSubjectPage(book) {
  try {
    const html = await fetchDoubanMobile(book.sourceUrl);
    const title = decodeHtml(html.match(/<div class="sub-title">([\s\S]*?)<\/div>/)?.[1]) || book.title;
    const meta = decodeHtml(html.match(/<div class="sub-meta">([\s\S]*?)<\/div>/)?.[1]);
    const description =
      html.match(/<meta name="description" content="([^"]*)"/)?.[1] ||
      html.match(/<meta property="og:description" content="([^"]*)"/)?.[1] ||
      "";
    const intro = decodeHtml(html.match(/<p class="section-intro_desc"[^>]*>([\s\S]*?)<\/p>/)?.[1]);
    const coverUrl =
      attr(html.match(/<meta itemprop="image"[^>]*>/)?.[0] || "", "content") ||
      attr(html.match(/<meta property="og:image"[^>]*>/)?.[0] || "", "content") ||
      book.coverUrl;
    const metaParts = parseBookMeta(meta);
    const summary = intro || summaryFromDescription(description, title);
    const reviewExcerpt = [
      book.reviewExcerpt,
      ...[...html.matchAll(/<p class="review-item_abstract">([\s\S]*?)<\/p>/g)]
        .slice(0, 2)
        .map((match) => decodeHtml(match[1])),
    ]
      .filter(Boolean)
      .join("；");
    const reasons = [];
    if (!metaParts.publishYear) reasons.push("出版时间缺失，需人工复核");
    else if (!metaParts.publishMonth) reasons.push("出版月份缺失，需人工复核");
    if (!summary) reasons.push("图书简介缺失");
    reasons.push("豆瓣移动端信息仅作候选发现，版本和事实字段需人工复核");

    return {
      ...book,
      title,
      author: metaParts.author,
      publisher: metaParts.publisher,
      publishDate: metaParts.publishDate,
      publishYear: metaParts.publishYear,
      publishMonth: metaParts.publishMonth,
      coverUrl,
      summary,
      reviewExcerpt,
      sourceStatus: "success",
      sourceConfidence: summary && metaParts.author && metaParts.publisher ? "medium" : "low",
      infoCompleteness: summary && metaParts.author && metaParts.publisher && metaParts.publishYear ? "partial" : "poor",
      needsReview: true,
      reviewReason: [...new Set(reasons)].join("；"),
    };
  } catch (error) {
    return {
      ...book,
      sourceStatus: "partial",
      needsReview: true,
      reviewReason: `${book.reviewReason}；豆瓣详情页暂时不可用：${error.message}`,
    };
  }
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const query = url.searchParams.get("q")?.trim();
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || 10)));
  if (!query) return jsonResponse({ error: "缺少查询关键词", items: [] }, 400);

  try {
    const searchUrl = new URL("/search/", DOUBAN_MOBILE_ORIGIN);
    searchUrl.searchParams.set("query", query);
    searchUrl.searchParams.set("type", "book");
    const html = await fetchDoubanMobile(searchUrl);
    const searchItems = parseSearchResults(html, limit);
    const items = await Promise.all(searchItems.map(enrichFromSubjectPage));

    return jsonResponse({
      source: "豆瓣移动端图书搜索",
      sourceStatus: items.length ? "success" : "empty",
      message: items.length ? "" : "豆瓣移动端暂未找到相关图书",
      items,
    });
  } catch (error) {
    return jsonResponse({
      source: "豆瓣移动端图书搜索",
      sourceStatus: "unavailable",
      message: `豆瓣移动端暂时不可用：${error.message}`,
      items: [],
    });
  }
}

export function onRequest(context) {
  return jsonResponse({ error: "只支持 GET 请求", items: [] }, 405);
}
