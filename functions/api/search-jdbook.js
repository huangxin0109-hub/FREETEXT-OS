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
    .trim();
}

function parseProducts(html, limit) {
  return [...html.matchAll(/<li[^>]+class="gl-item"[\s\S]*?<\/li>/g)]
    .slice(0, limit)
    .map((match) => {
      const block = match[0];
      const title = decodeHtml(block.match(/class="p-name[^"]*"[\s\S]*?<em>([\s\S]*?)<\/em>/)?.[1]);
      const author = decodeHtml(block.match(/class="p-bookdetails"[\s\S]*?class="p-bi-name"[^>]*>([\s\S]*?)<\/span>/)?.[1]);
      const publisher = decodeHtml(block.match(/class="p-bi-store"[^>]*>([\s\S]*?)<\/span>/)?.[1]);
      const coverUrl = block.match(/(?:data-lazy-img|src)="([^"]+)"/)?.[1] || "";
      return {
        title,
        author,
        isbn: "",
        publisher,
        publishDate: "",
        publishYear: "",
        publishMonth: "",
        pages: "",
        coverUrl: coverUrl.startsWith("//") ? `https:${coverUrl}` : coverUrl,
        source: "京东图书搜索",
        sourceStatus: "partial",
        needsReview: true,
        reviewReason: "京东搜索结果缺少 ISBN 或出版时间，需人工复核",
      };
    })
    .filter((book) => book.title);
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const query = url.searchParams.get("q")?.trim();
  const limit = Math.min(20, Math.max(1, Number(url.searchParams.get("limit") || 10)));
  if (!query) return jsonResponse({ error: "缺少查询关键词", items: [] }, 400);

  try {
    const endpoint = new URL("https://search.jd.com/s_new.php");
    endpoint.searchParams.set("keyword", query);
    endpoint.searchParams.set("enc", "utf-8");
    endpoint.searchParams.set("page", "1");
    const response = await fetch(endpoint, {
      headers: {
        "user-agent": "Mozilla/5.0 FREETEXT-OS book search",
        accept: "text/html,application/json",
        referer: `https://search.jd.com/Search?keyword=${encodeURIComponent(query)}&enc=utf-8`,
      },
    });
    if (!response.ok) throw new Error(`京东返回 ${response.status}`);
    const body = await response.text();
    let items = [];
    let message = "";
    if (body.trim().startsWith("{")) {
      const data = JSON.parse(body);
      if (data?.body?.errorCode) message = data.body.errorReason || "京东触发访问限制";
      else items = parseProducts(data?.body?.html || "", limit);
    } else {
      items = parseProducts(body, limit);
    }
    return jsonResponse({
      source: "京东图书搜索",
      sourceStatus: items.length ? "success" : "unavailable",
      message: items.length ? "" : `京东暂时不可用：${message || "未返回可识别图书结果"}`,
      items,
    });
  } catch (error) {
    return jsonResponse({
      source: "京东图书搜索",
      sourceStatus: "unavailable",
      message: `京东暂时不可用：${error.message}`,
      items: [],
    });
  }
}

export function onRequest(context) {
  return jsonResponse({ error: "只支持 GET 请求", items: [] }, 405);
}
