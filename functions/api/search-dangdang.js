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
    publishDate: String(value || ""),
    publishYear: match?.[1] || "",
    publishMonth: match?.[2] ? `${match[1]}-${String(match[2]).padStart(2, "0")}` : "",
  };
}

function normalizeProduct(product) {
  const date = dateParts(product.publish_date);
  const reviewReasons = [];
  if (!date.publishYear) reviewReasons.push("出版时间缺失，需人工复核");
  else if (!date.publishMonth) reviewReasons.push("出版月份缺失，需人工复核");
  reviewReasons.push("当当搜索结果通常不含 ISBN，具体版本需人工复核");
  return {
    title: product.name || "",
    author: product.authorname || "",
    isbn: "",
    publisher: product.publisher || "",
    ...date,
    pages: "",
    coverUrl: product.image_url || "",
    source: "当当图书搜索",
    sourceStatus: "success",
    needsReview: true,
    reviewReason: reviewReasons.join("；"),
    summary: product.subname || "",
    price: product.dd_sale_price || product.price || "",
    sourceUrl: product.product_url || "",
  };
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const query = url.searchParams.get("q")?.trim();
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || 10)));
  if (!query) return jsonResponse({ error: "缺少查询关键词", items: [] }, 400);

  try {
    const endpoint = new URL("http://search.m.dangdang.com/search_ajax.php");
    endpoint.searchParams.set("act", "get_product_flow_search");
    endpoint.searchParams.set("keyword", query);
    endpoint.searchParams.set("page", "1");
    endpoint.searchParams.set("cid", "0");
    const response = await fetch(endpoint, {
      headers: {
        "user-agent": "Mozilla/5.0 FREETEXT-OS book search",
        accept: "application/json,text/plain,*/*",
      },
    });
    if (!response.ok) throw new Error(`当当返回 ${response.status}`);
    const data = await response.json();
    if (Number(data.errorCode) !== 0) throw new Error(data.errorMsg || "当当未返回可识别结果");
    const queryIsbn = query.replace(/[^\dXx]/g, "");
    const items = (data.products || [])
      .filter((product) => product.is_publication === "1" || product.publisher)
      .filter((product) => {
        if (queryIsbn.length !== 10 && queryIsbn.length !== 13) return true;
        return `${product.name || ""} ${product.subname || ""}`.replace(/[^\dXx]/g, "").includes(queryIsbn);
      })
      .slice(0, limit)
      .map(normalizeProduct);
    return jsonResponse({
      source: "当当图书搜索",
      sourceStatus: items.length ? "success" : "empty",
      message: items.length ? "" : "当当暂未找到相关图书",
      items,
    });
  } catch (error) {
    return jsonResponse({
      source: "当当图书搜索",
      sourceStatus: "unavailable",
      message: `当当暂时不可用：${error.message}`,
      items: [],
    });
  }
}

export function onRequest(context) {
  return jsonResponse({ error: "只支持 GET 请求", items: [] }, 405);
}
