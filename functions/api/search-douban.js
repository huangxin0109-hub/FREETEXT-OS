function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const query = url.searchParams.get("q")?.trim();
  const limit = Math.min(20, Math.max(1, Number(url.searchParams.get("limit") || 10)));
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
    return jsonResponse({
      source: "豆瓣官网",
      warning: data.error_info || "",
      items: (data.items || []).slice(0, limit).map((item) => ({
        title: item.title || "",
        author_name: item.author_name || "",
        abstract: item.abstract || item.abstract_2 || "",
        url: item.url || "",
      })),
    });
  } catch (error) {
    return jsonResponse({ source: "豆瓣官网", warning: error.message, items: [] }, 200);
  }
}

export function onRequest(context) {
  return jsonResponse({ error: "只支持 GET 请求", items: [] }, 405);
}
