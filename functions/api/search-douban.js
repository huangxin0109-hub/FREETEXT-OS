function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
}

function dateParts(value) {
  const match = String(value || "").match(/\b(\d{4})(?:[-/.年](\d{1,2}))?/);
  return {
    publishDate: match?.[0] || "",
    publishYear: match?.[1] || "",
    publishMonth: match?.[2] ? `${match[1]}-${String(match[2]).padStart(2, "0")}` : "",
  };
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const query = url.searchParams.get("q")?.trim();
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || 10)));
  if (!query) return jsonResponse({ error: "缺少查询关键词", items: [] }, 400);

  try {
    const response = await fetch(
      `https://book.douban.com/subject_search?search_text=${encodeURIComponent(query)}&cat=1001`,
      {
        headers: {
          "user-agent": "Mozilla/5.0 FREETEXT-OS book search",
          accept: "text/html",
        },
      },
    );
    if (!response.ok) throw new Error(`豆瓣官网返回 ${response.status}`);
    const html = await response.text();
    const dataText = html.match(/window\.__DATA__\s*=\s*(\{.*?\});/s)?.[1];
    if (!dataText) throw new Error("豆瓣官网未返回可识别的搜索数据");
    const data = JSON.parse(dataText);
    const items = (data.items || []).slice(0, limit).map((item) => {
      const summary = item.abstract || item.abstract_2 || "";
      const details = summary.split("/").map((part) => part.trim()).filter(Boolean);
      const date = dateParts(summary);
      const reasons = [];
      if (!date.publishYear) reasons.push("出版时间缺失，需人工复核");
      else if (!date.publishMonth) reasons.push("出版月份缺失，需人工复核");
      reasons.push("豆瓣搜索摘要字段有限，具体版本需人工复核");
      return {
        title: item.title || "",
        author: item.author_name || details[0] || "",
        isbn: "",
        publisher: details.find((part) => /出版社|书店|Press|Publishing/i.test(part)) || "",
        ...date,
        pages: "",
        coverUrl: item.cover_url || "",
        source: "豆瓣图书搜索代理",
        sourceStatus: "partial",
        needsReview: true,
        reviewReason: reasons.join("；"),
        summary,
        sourceUrl: item.url || "",
      };
    });
    return jsonResponse({
      source: "豆瓣图书搜索代理",
      sourceStatus: items.length ? "success" : "unavailable",
      message: data.error_info || (items.length ? "" : "豆瓣暂未返回结果"),
      items,
    });
  } catch (error) {
    return jsonResponse({
      source: "豆瓣图书搜索代理",
      sourceStatus: "unavailable",
      message: `豆瓣暂时不可用：${error.message}`,
      items: [],
    });
  }
}

export function onRequest(context) {
  return jsonResponse({ error: "只支持 GET 请求", items: [] }, 405);
}
