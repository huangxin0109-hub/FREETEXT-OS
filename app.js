const steps = [
  { route: "home", label: "首页" },
  { route: "generate", label: "候选生成" },
  { route: "screen", label: "AI初筛" },
  { route: "review", label: "人工复核" },
  { route: "final", label: "最终清单" },
];

const mockBooks = [
  {
    id: 1,
    title: "永结无情游",
    author: "示例作者",
    publisher: "理想国｜上海三联书店",
    date: "2026-05",
    category: "文学",
    summary: "讨论人与地方、记忆与行走的文学作品。",
    rating: "A",
    reason: "内容有深度，气质安静，适合形成书店文学主题陈列。",
    risk: "需要确认读者对作者的熟悉程度。",
    shelf: "文学｜行走与记忆",
  },
  {
    id: 2,
    title: "要有光",
    author: "示例作者",
    publisher: "新经典文化",
    date: "2026-04",
    category: "文学非虚构",
    summary: "从普通人的生活经验出发，记录缓慢但真实的改变。",
    rating: "A",
    reason: "叙事清楚，有现实关怀，适合书店读者持续阅读。",
    risk: "同类非虚构作品较多，需要控制采购数量。",
    shelf: "文学｜真实生活",
  },
  {
    id: 3,
    title: "士变",
    author: "示例作者",
    publisher: "三联书店",
    date: "2026-06",
    category: "思想史",
    summary: "梳理传统知识人的身份变化与时代选择。",
    rating: "A",
    reason: "符合文史哲优先方向，主题清晰，具有长期陈列价值。",
    risk: "阅读门槛略高，适合重点推荐而非大量进货。",
    shelf: "历史｜思想史",
  },
  {
    id: 4,
    title: "先秦人的日常时光",
    author: "示例作者",
    publisher: "广西师范大学出版社",
    date: "2026-05",
    category: "历史",
    summary: "通过衣食住行理解先秦社会的日常生活。",
    rating: "A",
    reason: "历史知识可靠且容易阅读，适合普通读者进入传统文化。",
    risk: "需要人工确认内容是否过度通俗化。",
    shelf: "历史｜古人日常",
  },
  {
    id: 5,
    title: "绿色的火焰",
    author: "示例作者",
    publisher: "译林出版社",
    date: "2026-03",
    category: "文学",
    summary: "围绕自然、孤独和生命经验展开的短篇作品。",
    rating: "B",
    reason: "文学气质合适，可补充自然主题和短篇阅读。",
    risk: "市场认知较低，需要搭配推荐语。",
    shelf: "文学｜自然书写",
  },
  {
    id: 6,
    title: "八成可用社会",
    author: "示例作者",
    publisher: "中信出版集团",
    date: "2026-05",
    category: "社科",
    summary: "讨论效率、生活选择与社会系统之间的关系。",
    rating: "B",
    reason: "议题贴近日常，能作为社科方向的轻入口。",
    risk: "标题偏流行，需要人工判断内容深度。",
    shelf: "社科｜社会观察",
  },
  {
    id: 7,
    title: "Land",
    author: "Sample Author",
    publisher: "Overseas Press",
    date: "2026-04",
    category: "海外文学",
    summary: "一部尚未引进的海外文学新作样本。",
    rating: "C",
    reason: "主题与文学方向相符，但当前信息不足。",
    risk: "未确认中文版权、译本与真实采购条件，仅建议观察。",
    shelf: "观察｜海外文学",
  },
  {
    id: 8,
    title: "低质流量型成长励志新书样本",
    author: "示例作者",
    publisher: "示例出版社",
    date: "2026-06",
    category: "成长励志",
    summary: "以快速成功和情绪口号为主要卖点的样本书。",
    rating: "D",
    reason: "内容深度不足，与自由文本书店气质不符。",
    risk: "可能短期有流量，但不应因此替代人的长期判断。",
    shelf: "不建议上架",
  },
];

const state = {
  generated: false,
  books: mockBooks,
  originalBooks: [],
  inputMode: "real",
  bookInput: "",
  inputErrors: [],
  inputWarnings: [],
  enrichmentStatus: "idle",
  enrichmentMessage: "",
  searchQuery: "",
  searchYearFrom: "2015-01",
  searchYearTo: "2026-12",
  searchLimit: 20,
  searchStatus: "idle",
  searchResults: [],
  searchSelected: {},
  searchSourceWarnings: [],
  attachmentStatus: "idle",
  attachmentName: "",
  attachmentPreview: [],
  screeningStatus: "idle",
  screeningSource: "mock",
  screeningError: "",
  filter: "全部",
  selectedId: 1,
  reviewIndex: 0,
  reviews: {},
  rulesSaved: false,
  roundRules: null,
  rulesStatus: "idle",
};

const app = document.querySelector("#app");
const stepList = document.querySelector("#step-list");

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isHeaderRow(fields) {
  return fields[0]?.trim() === "书名" && fields.some((field) => field.trim() === "简介");
}

function cleanIsbn(value) {
  const match = String(value || "").match(/(?:97[89][\d\-\s]{10,16}|\d[\dXx\-\s]{8,16}\d)/);
  if (!match) return "";
  const isbn = match[0].replace(/[^\dXx]/g, "").toUpperCase();
  return isbn.length === 10 || isbn.length === 13 ? isbn : "";
}

function cleanTitle(value, isbn = "") {
  return String(value || "")
    .replace(isbn, "")
    .replace(/^\s*(?:\d+[.、)]\s*|[-*]+\s*)/, "")
    .replace(/\*\*/g, "")
    .replace(/^[《“"]|[》”"]$/g, "")
    .trim();
}

function emptyBook(id, title = "", isbn = "") {
  return {
    id,
    title,
    isbn,
    author: "待补充",
    translator: "待补充",
    publisher: "待补充",
    date: "待补充",
    year: "待补充",
    category: "待补充",
    keywords: [],
    pages: "待补充",
    binding: "待补充",
    price: null,
    summary: "",
    dataSource: [],
    confidence: "低",
    missingFields: [],
    enrichmentRisk: "待补充信息需人工确认",
    rating: "C",
    reason: "等待 DeepSeek 初筛。",
    risk: "信息需要人工复核。",
    shelf: "待人工确认",
  };
}

function parseBookInput(text) {
  const errors = [];
  const warnings = [];
  const books = [];
  const rows = text.split(/\r?\n/);

  rows.forEach((rawRow, index) => {
    const lineNumber = index + 1;
    const row = rawRow.trim();
    if (!row) return;

    const fields = row.split("|").map((field) => field.trim());
    if (isHeaderRow(fields)) return;
    if (fields.length > 7) {
      errors.push(`第 ${lineNumber} 行字段超过 7 个，请检查多余的 |。`);
      return;
    }

    const rowIsbn = cleanIsbn(row);
    if (fields.length === 1) {
      const title = cleanTitle(row, rowIsbn);
      if (!title) {
        errors.push(`第 ${lineNumber} 行缺少书名。`);
        return;
      }
      books.push(emptyBook(`input-${books.length + 1}`, title, rowIsbn));
      return;
    }

    const [rawTitle, author, publisher, date, category, summary, price] = fields;
    const titleIsbn = cleanIsbn(rawTitle);
    const isbn = rowIsbn || titleIsbn;
    const title = cleanTitle(rawTitle, isbn);
    if (!title) errors.push(`第 ${lineNumber} 行缺少书名。`);
    if (!title) return;

    const missing = [
      ["作者", author],
      ["出版社", publisher],
      ["出版时间", date],
      ["类别", category],
      ["简介", summary],
      ["定价", price],
    ]
      .filter(([, value]) => !value)
      .map(([label]) => label);
    if (missing.length) {
      warnings.push(`第 ${lineNumber} 行缺少${missing.join("、")}，DeepSeek 将标记为需要人工复核。`);
    }

    books.push({
      ...emptyBook(`input-${books.length + 1}`, title, isbn),
      author: author || "待补充",
      publisher: publisher || "待补充",
      date: date || "待补充",
      year: String(date || "").match(/\d{4}/)?.[0] || "待补充",
      category: category || "待补充",
      summary: summary || "",
      price: price || null,
    });
  });

  if (books.length > 20) {
    errors.push(`当前共有 ${books.length} 本书，单次最多 20 本，请分批测试。`);
  }
  if (!books.length && !errors.length) {
    errors.push("请至少粘贴 1 本候选书。");
  }

  return { books, errors, warnings };
}

function normalizeGoogleBook(item, source = "Google Books") {
  const info = item?.volumeInfo || {};
  const sale = item?.saleInfo || {};
  const identifiers = info.industryIdentifiers || [];
  const isbn =
    identifiers.find((entry) => entry.type === "ISBN_13")?.identifier ||
    identifiers.find((entry) => entry.type === "ISBN_10")?.identifier ||
    "";
  return {
    title: info.title || "",
    isbn: cleanIsbn(isbn),
    author: (info.authors || []).join("、"),
    translator: "",
    publisher: info.publisher || "",
    date: info.publishedDate || "",
    year: String(info.publishedDate || "").match(/\d{4}/)?.[0] || "",
    category: (info.categories || []).join("、"),
    keywords: info.categories || [],
    pages: info.pageCount ? String(info.pageCount) : "",
    binding: info.printType || "",
    price: sale.listPrice
      ? `${sale.listPrice.amount} ${sale.listPrice.currencyCode}`
      : "",
    summary: info.description || "",
    dataSource: [source],
  };
}

function normalizeOpenLibrary(doc, source = "Open Library") {
  const isbn = Array.isArray(doc?.isbn) ? doc.isbn.find((value) => cleanIsbn(value)) : doc?.isbn_13?.[0] || doc?.isbn_10?.[0] || "";
  return {
    title: doc?.title || "",
    isbn: cleanIsbn(isbn),
    author: (doc?.author_name || []).join("、"),
    translator: "",
    publisher: (doc?.publisher || []).slice(0, 2).join("、"),
    date: doc?.first_publish_year ? String(doc.first_publish_year) : "",
    year: doc?.first_publish_year ? String(doc.first_publish_year) : "",
    category: (doc?.subject || []).slice(0, 3).join("、"),
    keywords: (doc?.subject || []).slice(0, 8),
    pages: doc?.number_of_pages_median ? String(doc.number_of_pages_median) : "",
    binding: "",
    price: "",
    summary: "",
    dataSource: [source],
  };
}

function normalizeDoubanBook(item, source = "豆瓣官网") {
  const abstract = String(item?.abstract || item?.abstract_2 || "");
  const isbn = cleanIsbn(abstract);
  const date = abstract.match(/\b(?:19|20)\d{2}(?:-\d{1,2})?(?:-\d{1,2})?\b/)?.[0] || "";
  return {
    title: item?.title || "",
    isbn,
    author: item?.author_name || "",
    translator: "",
    publisher: "",
    date,
    year: date.match(/\d{4}/)?.[0] || "",
    category: "待补充",
    keywords: [],
    pages: "",
    binding: "",
    price: "",
    summary: abstract,
    dataSource: [source],
  };
}

function useful(value) {
  return value !== undefined && value !== null && value !== "" && value !== "待补充" && value !== "待人工确认";
}

function mergeBookData(base, additions) {
  const merged = { ...base };
  additions.forEach((addition) => {
    if (!addition) return;
    [
      "title",
      "isbn",
      "author",
      "translator",
      "publisher",
      "date",
      "year",
      "category",
      "pages",
      "binding",
      "price",
      "summary",
    ].forEach((field) => {
      if (!useful(merged[field]) && useful(addition[field])) merged[field] = addition[field];
    });
    merged.keywords = [...new Set([...(merged.keywords || []), ...(addition.keywords || [])])].slice(0, 10);
    merged.dataSource = [...new Set([...(merged.dataSource || []), ...(addition.dataSource || [])])];
  });
  const required = ["isbn", "author", "translator", "publisher", "date", "year", "category", "keywords", "pages", "binding", "price", "summary"];
  merged.missingFields = required.filter((field) => !useful(merged[field]) || (Array.isArray(merged[field]) && !merged[field].length));
  merged.confidence = merged.dataSource.length >= 2 ? "高" : merged.dataSource.length === 1 ? "中" : "低";
  const dateRisk = !useful(merged.date) && !useful(merged.year) ? "出版时间缺失，需人工复核。" : "";
  merged.enrichmentRisk = [
    merged.missingFields.length
      ? `仍缺少：${merged.missingFields.join("、")}，需要人工确认。`
      : "公开数据字段较完整，仍需人工确认具体版本。",
    dateRisk,
  ].filter(Boolean).join(" ");
  return merged;
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`公开图书 API 返回 ${response.status}`);
  return response.json();
}

async function lookupGoogle(query, limit = 5) {
  const data = await fetchJson(
    `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=${Math.min(limit, 40)}&langRestrict=zh`,
  );
  return (data.items || []).map((item) => normalizeGoogleBook(item));
}

async function lookupOpenLibrary(query, limit = 5) {
  const data = await fetchJson(
    `https://openlibrary.org/search.json?${query}&limit=${Math.min(limit, 100)}`,
  );
  return (data.docs || []).map((doc) => normalizeOpenLibrary(doc));
}

async function lookupDouban(query, limit = 5) {
  const data = await fetchJson(
    `/api/search-douban?q=${encodeURIComponent(query)}&limit=${Math.min(limit, 20)}`,
  );
  if (data.warning && !(data.items || []).length) throw new Error(`豆瓣官网：${data.warning}`);
  return (data.items || []).map((item) => normalizeDoubanBook(item));
}

async function enrichBook(book) {
  const additions = [];
  if (book.isbn) {
    const exact = await Promise.allSettled([
      lookupGoogle(`isbn:${book.isbn}`, 3),
      lookupOpenLibrary(`isbn=${encodeURIComponent(book.isbn)}`, 3),
      lookupDouban(book.isbn, 3),
    ]);
    exact.forEach((result) => {
      if (result.status === "fulfilled" && result.value[0]) additions.push(result.value[0]);
    });
  }
  if (!additions.length || additions.every((item) => !useful(item.author))) {
    const byTitle = await Promise.allSettled([
      lookupGoogle(`intitle:${book.title}`, 3),
      lookupOpenLibrary(`title=${encodeURIComponent(book.title)}`, 3),
      lookupDouban(book.title, 3),
    ]);
    byTitle.forEach((result) => {
      if (result.status === "fulfilled" && result.value[0]) additions.push(result.value[0]);
    });
  }
  return mergeBookData(book, additions);
}

async function enrichBooks(books) {
  state.enrichmentStatus = "loading";
  state.enrichmentMessage = `正在通过公开图书 API 补全 ${books.length} 本书…`;
  render({ scrollToTop: false });
  const results = [];
  for (let index = 0; index < books.length; index += 4) {
    const batch = books.slice(index, index + 4);
    const settled = await Promise.allSettled(batch.map(enrichBook));
    settled.forEach((result, offset) => {
      results.push(
        result.status === "fulfilled"
          ? result.value
          : mergeBookData(batch[offset], []),
      );
    });
  }
  state.enrichmentStatus = "success";
  state.enrichmentMessage = `公开图书 API 补全完成：${results.filter((book) => book.dataSource.length).length} / ${results.length} 本找到数据。`;
  return results;
}

async function searchOnlineBooks() {
  const query = document.querySelector("#search-query")?.value.trim() || state.searchQuery;
  const yearFrom = document.querySelector("#year-from")?.value || state.searchYearFrom;
  const yearTo = document.querySelector("#year-to")?.value || state.searchYearTo;
  const limit = Math.min(40, Math.max(1, Number(document.querySelector("#search-limit")?.value || state.searchLimit)));
  if (!query) {
    state.inputErrors = ["请输入网上书单查询关键词。"];
    render();
    return;
  }
  Object.assign(state, { searchQuery: query, searchYearFrom: yearFrom, searchYearTo: yearTo, searchLimit: limit, searchStatus: "loading", inputErrors: [], searchSourceWarnings: [] });
  render({ scrollToTop: false });
  try {
    const sourceWarnings = new Set();
    const searchSources = async (term) => {
      const sources = [
        ["Google Books", lookupGoogle(term, Math.max(limit, 40))],
        ["Open Library", lookupOpenLibrary(`q=${encodeURIComponent(term)}`, 100)],
        ["豆瓣官网", lookupDouban(term, limit)],
      ];
      const results = await Promise.allSettled(sources.map(([, request]) => request));
      return results.flatMap((result, index) => {
        if (result.status === "fulfilled") return result.value;
        sourceWarnings.add(`${sources[index][0]}暂时不可用`);
        return [];
      });
    };
    let combined = await searchSources(query);
    const topicTranslations = {
      艺术: "art introduction",
      设计: "design introduction",
      文学: "literature introduction",
      历史: "history introduction",
      哲学: "philosophy introduction",
      社科: "social science introduction",
    };
    const broaderQuery = query.replace(/入门|导论|指南|教程/g, "").trim();
    const translatedQuery = Object.entries(topicTranslations).find(([topic]) => query.includes(topic))?.[1];
    for (const fallbackQuery of [broaderQuery.length >= 3 ? broaderQuery : "", translatedQuery]) {
      if (!combined.length && fallbackQuery && fallbackQuery !== query) {
        combined = await searchSources(fallbackQuery);
      }
    }
    const byKey = new Map();
    combined.forEach((book) => {
      const publishDate = publicationDateInfo(book.date || book.year);
      const fromYear = yearFrom.slice(0, 4);
      const toYear = yearTo.slice(0, 4);
      if (publishDate.month && ((yearFrom && publishDate.month < yearFrom) || (yearTo && publishDate.month > yearTo))) return;
      if (!publishDate.month && publishDate.year && ((fromYear && publishDate.year < fromYear) || (toYear && publishDate.year > toYear))) return;
      if (!publishDate.year) {
        book.enrichmentRisk = [book.enrichmentRisk, "出版时间缺失，需人工复核。"].filter(Boolean).join(" ");
      } else if (!publishDate.month) {
        book.enrichmentRisk = [book.enrichmentRisk, "出版月份缺失，需人工复核。"].filter(Boolean).join(" ");
      }
      const key = book.isbn || `${book.title}-${book.author}`;
      byKey.set(key, mergeBookData(byKey.get(key) || emptyBook(`search-${byKey.size + 1}`, book.title, book.isbn), [book]));
    });
    state.searchResults = [...byKey.values()].slice(0, limit).map((book, index) => ({ ...book, id: `search-${index + 1}` }));
    state.searchSelected = Object.fromEntries(state.searchResults.map((book) => [book.id, true]));
    state.searchSourceWarnings = [...sourceWarnings];
    state.searchStatus = "success";
    if (!state.searchResults.length) {
      state.inputErrors = ["公开图书 API 暂未返回符合年份范围的结果，请放宽年份或更换关键词。"];
    }
    render({ scrollToTop: false });
  } catch {
    state.searchStatus = "error";
    state.inputErrors = ["网上查询暂时不可用，请稍后重试或使用粘贴/附件导入。"];
    render({ scrollToTop: false });
  }
}

function publicationDateInfo(value) {
  const match = String(value || "").match(/\b(\d{4})(?:[-/.年](\d{1,2}))?/);
  if (!match) return { year: "", month: "" };
  return {
    year: match[1],
    month: match[2]
      ? `${match[1]}-${String(Math.min(12, Math.max(1, Number(match[2])))).padStart(2, "0")}`
      : "",
  };
}

function importSelectedSearchBooks() {
  const selected = state.searchResults.filter((book) => state.searchSelected[book.id]);
  if (!selected.length) {
    state.inputErrors = ["请至少勾选 1 本网上查询结果。"];
    render({ scrollToTop: false });
    return;
  }
  state.books = selected.map((book, index) => ({ ...book, id: `input-${index + 1}` }));
  state.originalBooks = structuredClone(state.books);
  state.inputMode = "search";
  state.inputErrors = [];
  state.enrichmentMessage = `已从网上查询结果导入 ${state.books.length} 本书，可继续补全并初筛。`;
  render({ scrollToTop: false });
}

function loadBrowserScript(src, globalName) {
  if (window[globalName]) return Promise.resolve(window[globalName]);
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve(window[globalName]);
    script.onerror = () => reject(new Error(`无法加载 ${globalName}`));
    document.head.append(script);
  });
}

function readTextFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("TXT 文件读取失败。"));
    reader.readAsText(file, "utf-8");
  });
}

function rowsToBooks(rows) {
  const normalizedRows = rows
    .filter((row) => Array.isArray(row) && row.some((cell) => String(cell || "").trim()))
    .map((row) => row.map((cell) => String(cell ?? "").trim()));
  if (!normalizedRows.length) return [];
  const aliases = {
    title: ["书名", "title"],
    author: ["作者", "author"],
    isbn: ["isbn"],
    publisher: ["出版社", "publisher"],
    date: ["出版时间", "出版日期", "出版年月", "date"],
    category: ["分类", "类别", "category"],
    summary: ["简介", "内容简介", "summary", "description"],
    price: ["价格", "定价", "price"],
  };
  const normalizedHeader = normalizedRows[0].map((cell) => cell.toLowerCase().replace(/\s+/g, ""));
  const headerMap = {};
  Object.entries(aliases).forEach(([field, names]) => {
    const index = normalizedHeader.findIndex((cell) => names.some((name) => cell === name.toLowerCase()));
    if (index >= 0) headerMap[field] = index;
  });
  const hasHeader = headerMap.title !== undefined && Object.keys(headerMap).length >= 2;
  if (hasHeader) normalizedRows.shift();
  const columnIndex = hasHeader
    ? headerMap
    : { title: 0, author: 1, isbn: 2, publisher: 3, date: 4, category: 5, summary: 6, price: 7 };
  const cell = (row, field) => columnIndex[field] === undefined ? "" : row[columnIndex[field]] || "";
  return normalizedRows.slice(0, 40).map((row, index) => {
    const isbn = cleanIsbn(cell(row, "isbn")) || cleanIsbn(row.join(" "));
    const title = cleanTitle(cell(row, "title"), isbn);
    const date = cell(row, "date");
    return {
      ...emptyBook(`attachment-${index + 1}`, title, isbn),
      author: cell(row, "author") || "待补充",
      publisher: cell(row, "publisher") || "待补充",
      date: date || "待补充",
      year: String(date).match(/\d{4}/)?.[0] || "待补充",
      category: cell(row, "category") || "待补充",
      summary: cell(row, "summary"),
      price: cell(row, "price") || null,
    };
  }).filter((book) => book.title);
}

async function parseAttachment(file) {
  const extension = file.name.split(".").pop().toLowerCase();
  if (extension === "txt") {
    const text = await readTextFile(file);
    return parseBookInput(text).books;
  }
  if (extension === "xlsx" || extension === "xls") {
    const XLSX = await loadBrowserScript("https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js", "XLSX");
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
    return rowsToBooks(XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1, defval: "", raw: false }));
  }
  if (extension === "docx") {
    const mammoth = await loadBrowserScript("https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js", "mammoth");
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return parseBookInput(result.value).books;
  }
  throw new Error("仅支持 txt、docx、xlsx、xls 文件。");
}

async function handleAttachment(file) {
  if (!file) return;
  state.attachmentStatus = "loading";
  state.attachmentName = file.name;
  state.inputErrors = [];
  render({ scrollToTop: false });
  try {
    state.attachmentPreview = await parseAttachment(file);
    state.attachmentStatus = "preview";
    if (!state.attachmentPreview.length) state.inputErrors = ["附件中没有识别到书名，请检查文件内容。"];
  } catch (error) {
    state.attachmentStatus = "error";
    state.inputErrors = [error.message || "附件解析失败。"];
  }
  render({ scrollToTop: false });
}

function confirmAttachmentImport() {
  state.books = state.attachmentPreview.slice(0, 20).map((book, index) => ({ ...book, id: `input-${index + 1}` }));
  state.originalBooks = structuredClone(state.books);
  state.inputMode = "attachment";
  state.enrichmentMessage = `已从附件导入 ${state.books.length} 本书，可继续补全并初筛。`;
  render({ scrollToTop: false });
}

function currentRoute() {
  const route = location.hash.replace("#", "") || "home";
  return steps.some((step) => step.route === route) ? route : "home";
}

function navigate(route) {
  location.hash = route;
}

function renderSteps(route) {
  const activeIndex = steps.findIndex((step) => step.route === route);
  stepList.innerHTML = steps
    .map(
      (step, index) => `
        <li>
          <a href="#${step.route}" class="${index === activeIndex ? "active" : ""} ${
            index < activeIndex ? "completed" : ""
          }">
            ${index + 1}. ${step.label}
          </a>
        </li>
      `,
    )
    .join("");
}

function ratingTag(rating) {
  return `<span class="rating ${rating}">${rating}</span>`;
}

function statsMarkup() {
  const counts = ["A", "B", "C", "D"].map(
    (rating) => state.books.filter((book) => book.rating === rating).length,
  );
  return `
    <section class="stats" aria-label="AI初筛统计">
      ${["A 强烈推荐", "B 可以推荐", "C 谨慎观察", "D 不推荐"]
        .map(
          (label, index) => `
            <div class="stat">
              <strong>${counts[index]}</strong>
              <span>${label}</span>
            </div>
          `,
        )
        .join("")}
    </section>
  `;
}

function pageHome() {
  return `
    <section class="page hero">
      <p class="eyebrow">FREETEXT Bookstore OS · 第一个功能模块</p>
      <h1>把选书的苦活交给 AI，把最后判断留给人。</h1>
      <p class="lead">
        本月选书从一批候选新书开始。AI负责整理、初筛和解释，
        选书人负责复核、修正并决定最终名单。
      </p>
      <div class="notice">
        可粘贴真实候选书单，也可使用本地演示书单；AI 初筛调用 DeepSeek，最终清单仍由人工复核形成，不会产生真实采购动作。
      </div>
      <div class="actions">
        <button class="button" data-action="start">开始本月选书</button>
        <button class="button secondary" data-action="view-final">查看示例最终清单</button>
      </div>
    </section>
  `;
}

function pageGenerate() {
  const pastedCount = parseBookInput(state.bookInput).books.length;
  const activeCount = state.inputMode === "demo" ? mockBooks.length : state.books.length;
  const previewBooks = state.inputMode === "attachment" ? state.attachmentPreview : state.books;
  return `
    <section class="page">
      <div class="page-heading">
        <div>
          <p class="eyebrow">第 2 步 · 候选生成与信息补全</p>
          <h2>准备本月候选书</h2>
          <p>书名必填，ISBN 可选。系统优先查询公开图书 API，DeepSeek 只负责整理和初筛。</p>
        </div>
        <span class="tag">${state.inputMode === "real" ? `已识别 ${pastedCount} 本` : `当前 ${activeCount} 本`}</span>
      </div>

      <div class="filters" aria-label="书单导入方式">
        <button class="filter ${state.inputMode === "real" ? "active" : ""}" data-input-mode="real">粘贴书单</button>
        <button class="filter ${state.inputMode === "search" ? "active" : ""}" data-input-mode="search">网上查询</button>
        <button class="filter ${state.inputMode === "attachment" ? "active" : ""}" data-input-mode="attachment">附件导入</button>
        <button class="filter ${state.inputMode === "demo" ? "active" : ""}" data-input-mode="demo">8 本演示书单</button>
      </div>

      ${state.inputMode === "real" ? `
        <div class="field">
          <label for="book-input">支持“书名 ISBN”、一行一本书，或使用 | 分隔完整字段</label>
          <textarea id="book-input" rows="12" placeholder="《乡土中国》 9787108069423
艺术的故事
书名 | 作者 | 出版社 | 出版时间 | 类别 | 简介 | 定价">${escapeHtml(state.bookInput)}</textarea>
        </div>
      ` : ""}

      ${state.inputMode === "search" ? `
        <section class="panel">
          <h3>网上书单查询</h3>
          <div class="form-grid">
            <div class="field"><label for="search-query">搜索关键词</label><input id="search-query" value="${escapeHtml(state.searchQuery)}" placeholder="例如：艺术入门" /></div>
            <div class="field"><label for="year-from">出版年月从</label><input id="year-from" type="month" value="${escapeHtml(state.searchYearFrom)}" /></div>
            <div class="field"><label for="year-to">出版年月到</label><input id="year-to" type="month" value="${escapeHtml(state.searchYearTo)}" /></div>
            <div class="field"><label for="search-limit">最大数量</label><input id="search-limit" type="number" min="1" max="40" value="${state.searchLimit}" /></div>
          </div>
          <p>查询来源：Google Books、Open Library、豆瓣官网。缺少出版时间的书会保留并交给人工复核。</p>
          ${state.searchSourceWarnings.length ? `<p>来源提示：${state.searchSourceWarnings.map(escapeHtml).join("；")}，其他来源结果仍可继续使用。</p>` : ""}
          <div class="actions"><button class="button" data-action="search-online">${state.searchStatus === "loading" ? "正在查询…" : "查询网上书单"}</button></div>
        </section>
        ${state.searchResults.length ? `
          <section class="panel result-panel">
            <h3>查询结果：${state.searchResults.length} 本</h3>
            <div class="selection-list">${state.searchResults.map((book) => `
              <label class="selection-row"><input type="checkbox" data-search-id="${book.id}" ${state.searchSelected[book.id] ? "checked" : ""} />
                <span><strong>${escapeHtml(book.title)}</strong><br />${escapeHtml(book.author)} · ${escapeHtml(book.publisher)} · ${escapeHtml(book.date || "出版时间缺失，需人工复核")} · ${escapeHtml(book.isbn)}</span>
              </label>`).join("")}</div>
            <div class="actions"><button class="button" data-action="import-search">导入已勾选书目</button></div>
          </section>` : ""}
      ` : ""}

      ${state.inputMode === "attachment" ? `
        <section class="panel">
          <h3>附件导入</h3>
          <p>支持 TXT、DOCX、XLSX、XLS。文件只在当前浏览器中解析。</p>
          <div class="field"><label for="attachment-input">选择书单附件</label><input id="attachment-input" type="file" accept=".txt,.docx,.xlsx,.xls" /></div>
          ${state.attachmentName ? `<p>当前文件：${escapeHtml(state.attachmentName)}</p>` : ""}
        </section>
        ${state.attachmentPreview.length ? `
          <section class="panel result-panel"><h3>解析预览：${state.attachmentPreview.length} 本</h3>
            ${bookPreviewMarkup(state.attachmentPreview)}
            <div class="actions"><button class="button" data-action="confirm-attachment">确认导入前 20 本</button></div>
          </section>` : ""}
      ` : ""}

      ${state.inputMode === "demo" ? `<div class="notice"><strong>演示模式：</strong>仅使用固定 8 本 mock 数据，演示规则不会污染真实规则。</div>${bookPreviewMarkup(mockBooks)}` : ""}

      ${state.inputMode !== "demo" && previewBooks.length && state.inputMode !== "real" && state.enrichmentMessage ? bookPreviewMarkup(previewBooks) : ""}
      ${state.enrichmentMessage ? `<div class="notice">${escapeHtml(state.enrichmentMessage)}</div>` : ""}
      ${state.inputErrors.length ? `<div class="notice"><strong>请处理以下问题：</strong><br />${state.inputErrors.map(escapeHtml).join("<br />")}</div>` : ""}
      ${state.inputWarnings.length ? `<div class="notice"><strong>需要人工复核：</strong><br />${state.inputWarnings.map(escapeHtml).join("<br />")}</div>` : ""}

      <div class="actions">
        <button class="button" data-action="generate" ${state.screeningStatus === "loading" || state.enrichmentStatus === "loading" ? "disabled" : ""}>
          ${state.enrichmentStatus === "loading" ? "正在补全图书信息…" : state.screeningStatus === "loading" ? "DeepSeek 正在初筛…" : "补全并交给 DeepSeek 初筛"}
        </button>
        <button class="button muted" data-action="back-home">返回首页</button>
      </div>
      ${state.screeningError ? `<div class="notice">${state.screeningError}<div class="actions"><button class="button secondary" data-action="use-mock">使用备用演示数据</button></div></div>` : ""}
    </section>`;
}

function bookPreviewMarkup(books) {
  if (!books.length) return "";
  return `<div class="cards">${books.slice(0, 20).map((book) => `
    <article class="card"><div class="card-top"><div><h3>${escapeHtml(book.title)}</h3>
    <p>${escapeHtml(book.author)} · ${escapeHtml(book.publisher)}</p></div><span class="tag">${escapeHtml(book.isbn || book.category)}</span></div>
    <p>${escapeHtml(book.summary || book.enrichmentRisk || "等待信息补全")}</p></article>`).join("")}</div>`;
}

function pageScreen() {
  const visible =
    state.filter === "全部"
      ? state.books
      : state.books.filter((book) => book.rating === state.filter);
  const selected =
    visible.find((book) => book.id === state.selectedId) ||
    visible[0] ||
    state.books[0];
  state.selectedId = selected.id;

  return `
    <section class="page">
      <div class="page-heading">
        <div>
          <p class="eyebrow">第 3 步 · AI 初筛</p>
          <h2>AI 已经完成整理和初步判断</h2>
          <p>先看结果和理由，不在这里做最终决定。</p>
        </div>
        <span class="tag">${state.screeningSource === "deepseek" ? "DeepSeek 初筛结果" : "备用演示数据"}</span>
      </div>

      ${statsMarkup()}

      <div class="filters" aria-label="推荐等级筛选">
        ${["全部", "A", "B", "C", "D"]
          .map(
            (filter) => `
              <button class="filter ${filter === state.filter ? "active" : ""}" data-filter="${filter}">
                ${filter}
              </button>
            `,
          )
          .join("")}
      </div>

      <div class="split">
        <section class="panel">
          <h3>候选书</h3>
          <div class="book-list">
            ${visible
              .map(
                (book) => `
                  <button class="book-row ${book.id === selected.id ? "active" : ""}" data-book-id="${book.id}">
                    <span><strong>${escapeHtml(book.title)}</strong><br />${escapeHtml(book.category)}</span>
                    ${ratingTag(book.rating)}
                  </button>
                `,
              )
              .join("")}
          </div>
        </section>

        <section class="panel">
          <div class="card-top">
            <div>
              <p class="eyebrow">AI 判断详情</p>
              <h2>${escapeHtml(selected.title)}</h2>
            </div>
            ${ratingTag(selected.rating)}
          </div>
          <dl class="detail-list">
            <dt>推荐理由</dt><dd>${escapeHtml(selected.reason)}</dd>
            <dt>风险提醒</dt><dd>${escapeHtml(selected.risk)}</dd>
            <dt>建议书架</dt><dd>${escapeHtml(selected.shelf)}</dd>
            <dt>基本信息</dt><dd>${escapeHtml(selected.author)} · ${escapeHtml(selected.publisher)} · ${escapeHtml(selected.date)}</dd>
            <dt>信息补全</dt><dd>${escapeHtml(selected.enrichment || "未补全或无需补全")}</dd>
          </dl>
        </section>
      </div>

      <div class="actions">
        <button class="button" data-action="begin-review">开始人工复核</button>
        <button class="button muted" data-action="back-generate">返回候选生成</button>
      </div>
    </section>
  `;
}

function pageReview() {
  if (state.reviewIndex >= state.books.length) {
    return `
      <section class="page hero">
        <p class="eyebrow">人工复核完成</p>
        <h1>${state.books.length} 本书都已经由人做出判断。</h1>
        <p class="lead">AI 的工作到这里是提供参考。最终清单以人工复核结果为准。</p>
        <div class="actions">
          <button class="button" data-action="finish-review">生成最终清单</button>
          <button class="button muted" data-action="review-again">重新复核</button>
        </div>
      </section>
    `;
  }

  const book = state.books[state.reviewIndex];
  const saved = state.reviews[book.id] || {};
  const progress = Math.round((state.reviewIndex / state.books.length) * 100);

  return `
    <section class="page">
      <div class="review-card">
        <div class="review-progress">
          <span>第 ${state.reviewIndex + 1} / ${state.books.length} 本</span>
          <span>${progress}% 已完成</span>
        </div>
        <div class="progress-track"><div class="progress-bar" style="width: ${progress}%"></div></div>

        <section class="panel" style="margin-top: 20px;">
          <div class="card-top">
            <div>
              <p class="eyebrow">第 4 步 · 人工复核</p>
              <h2>${escapeHtml(book.title)}</h2>
              <p>${escapeHtml(book.author)} · ${escapeHtml(book.publisher)} · ${escapeHtml(book.category)}</p>
            </div>
            ${ratingTag(book.rating)}
          </div>
          <dl class="detail-list">
            <dt>AI 推荐理由</dt><dd>${escapeHtml(book.reason)}</dd>
            <dt>AI 风险提醒</dt><dd>${escapeHtml(book.risk)}</dd>
            <dt>建议书架</dt><dd>${escapeHtml(book.shelf)}</dd>
            <dt>AI 信息补全</dt><dd>${escapeHtml(book.enrichment || "未补全或无需补全")}</dd>
          </dl>

          <details class="edit-fields">
            <summary>修改补全后的图书字段</summary>
            <div class="form-grid">
              ${editableBookField("title", "书名", book.title)}
              ${editableBookField("isbn", "ISBN", book.isbn)}
              ${editableBookField("author", "作者", book.author)}
              ${editableBookField("translator", "译者", book.translator)}
              ${editableBookField("publisher", "出版社", book.publisher)}
              ${editableBookField("date", "出版时间", book.date)}
              ${editableBookField("year", "出版年份", book.year)}
              ${editableBookField("category", "分类", book.category)}
              ${editableBookField("keywords", "关键词", (book.keywords || []).join("、"))}
              ${editableBookField("pages", "页数", book.pages)}
              ${editableBookField("binding", "装帧", book.binding)}
              ${editableBookField("price", "价格", book.price)}
              ${editableBookField("dataSource", "数据来源", (book.dataSource || []).join("、"))}
              ${editableBookField("confidence", "可信度", book.confidence)}
              ${editableBookField("missingFields", "缺失字段", (book.missingFields || []).join("、"))}
            </div>
            <div class="field"><label for="book-field-summary">简介</label><textarea id="book-field-summary" data-book-field="summary">${escapeHtml(book.summary)}</textarea></div>
            <div class="field"><label for="book-field-enrichmentRisk">风险提示</label><textarea id="book-field-enrichmentRisk" data-book-field="enrichmentRisk">${escapeHtml(book.enrichmentRisk)}</textarea></div>
          </details>

          <div class="field">
            <label for="final-status">人工最终判断</label>
            <select id="final-status">
              <option value="进入候选清单" ${saved.status === "进入候选清单" ? "selected" : ""}>进入候选清单</option>
              <option value="继续观察" ${saved.status === "继续观察" ? "selected" : ""}>继续观察</option>
              <option value="不进入清单" ${saved.status === "不进入清单" ? "selected" : ""}>不进入清单</option>
            </select>
          </div>

          <div class="field">
            <label for="review-note">人工备注（可不填）</label>
            <textarea id="review-note" placeholder="例如：内容合适，但首批只进少量。">${escapeHtml(saved.note || "")}</textarea>
          </div>

          <div class="decision-grid">
            <button class="button" data-decision="同意">同意 AI 判断</button>
            <button class="button secondary" data-decision="修改">修改后采用</button>
            <button class="button danger" data-decision="不接受">不接受 AI 判断</button>
          </div>
        </section>
      </div>
    </section>
  `;
}

function editableBookField(field, label, value) {
  return `<div class="field"><label for="book-field-${field}">${label}</label><input id="book-field-${field}" data-book-field="${field}" value="${escapeHtml(value || "")}" /></div>`;
}

function reviewedStatus(book) {
  if (state.reviews[book.id]) return state.reviews[book.id].status;
  if (book.rating === "A" || book.rating === "B") return "进入候选清单";
  if (book.rating === "C") return "继续观察";
  return "不进入清单";
}

function finalGroup(status) {
  return state.books.filter((book) => reviewedStatus(book) === status);
}

function bookListMarkup(items) {
  if (!items.length) return `<p class="empty">暂无书目</p>`;
  return `
    <ol class="final-list">
      ${items.map((book) => `<li><strong>${escapeHtml(book.title)}</strong> · ${escapeHtml(book.category)} · AI ${escapeHtml(book.rating)}</li>`).join("")}
    </ol>
  `;
}

function pageFinal() {
  const included = finalGroup("进入候选清单");
  const observing = finalGroup("继续观察");
  const rejected = finalGroup("不进入清单");

  return `
    <section class="page">
      <div class="page-heading">
        <div>
          <p class="eyebrow">第 5 步 · 最终清单</p>
          <h2>本月候选清单已形成</h2>
          <p>清单来自人工最终判断，AI 只负责提供整理和建议。</p>
        </div>
        <span class="tag">${Object.keys(state.reviews).length} / ${state.books.length} 本已人工复核</span>
      </div>

      <section class="stats">
        <div class="stat"><strong>${included.length}</strong><span>进入候选清单</span></div>
        <div class="stat"><strong>${observing.length}</strong><span>继续观察</span></div>
        <div class="stat"><strong>${rejected.length}</strong><span>不进入清单</span></div>
        <div class="stat"><strong>${Object.keys(state.reviews).length}</strong><span>人工复核数量</span></div>
      </section>

      <div class="final-columns">
        <section class="panel">
          <h3>进入候选清单</h3>
          ${bookListMarkup(included)}
        </section>
        <section class="panel">
          <h3>继续观察</h3>
          ${bookListMarkup(observing)}
        </section>
        <section class="panel">
          <h3>不进入清单</h3>
          ${bookListMarkup(rejected)}
        </section>
        <section class="panel">
          <h3>本轮可沉淀的规则</h3>
          ${roundRulesMarkup()}
          <div class="actions">
            <button class="button secondary" data-action="save-rules">
              ${state.rulesSaved ? "规则已确认" : "确认沉淀规则"}
            </button>
          </div>
        </section>
      </div>

      <div class="actions">
        <button class="button" data-action="export">导出清单（模拟）</button>
        <button class="button muted" data-action="restart">开始新的选书轮次</button>
      </div>
    </section>
  `;
}

function roundRulesMarkup() {
  if (state.screeningSource === "mock") {
    return `<div class="notice"><strong>演示规则：</strong>以下内容只用于 mock 流程，不会保存为真实规则。</div>
      <ul class="rule-list"><li>文学样本保持适当比例。</li><li>信息不足的书先观察。</li><li>低质量流量书不进入清单。</li></ul>`;
  }
  if (state.rulesStatus === "loading") return `<p>DeepSeek 正在根据本轮人工判断生成规则…</p>`;
  if (!state.roundRules) return `<p>尚未生成本轮规则。</p>`;
  const sections = [
    ["本轮保留偏好", state.roundRules.keep_preferences],
    ["本轮剔除原因", state.roundRules.rejection_reasons],
    ["可复用选书规则", state.roundRules.reusable_rules],
    ["下一轮建议", state.roundRules.next_round_suggestions],
  ];
  return sections.map(([title, items]) => `<h3>${title}</h3><ul class="rule-list">${(items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`).join("");
}

function render(options = {}) {
  const route = currentRoute();
  renderSteps(route);
  const pages = {
    home: pageHome,
    generate: pageGenerate,
    screen: pageScreen,
    review: pageReview,
    final: pageFinal,
  };
  app.innerHTML = pages[route]();
  if (options.scrollToTop !== false) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function showToast(message) {
  document.querySelector(".toast")?.remove();
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.append(toast);
  setTimeout(() => toast.remove(), 2200);
}

function saveReview(decision) {
  const book = state.books[state.reviewIndex];
  document.querySelectorAll("[data-book-field]").forEach((input) => {
    book[input.dataset.bookField] =
      ["keywords", "dataSource", "missingFields"].includes(input.dataset.bookField)
        ? input.value.split(/[、,，]/).map((value) => value.trim()).filter(Boolean)
        : input.value.trim();
  });
  const status = document.querySelector("#final-status").value;
  const note = document.querySelector("#review-note").value.trim();
  state.reviews[book.id] = { decision, status, note };
  state.reviewIndex += 1;
  render({ scrollToTop: false });
}

function rulePayload() {
  return {
    mode: "derive-rules",
    original_books: state.originalBooks,
    screened_books: state.books.map((book) => ({
      id: book.id,
      title: book.title,
      category: book.category,
      rating: book.rating,
      reason: book.reason,
      risks: book.risk,
    })),
    reviews: state.reviews,
    final_groups: {
      included: finalGroup("进入候选清单").map((book) => book.title),
      observing: finalGroup("继续观察").map((book) => book.title),
      rejected: finalGroup("不进入清单").map((book) => book.title),
    },
  };
}

async function generateRoundRules() {
  if (state.screeningSource === "mock") {
    state.rulesStatus = "demo";
    return;
  }
  state.rulesStatus = "loading";
  render({ scrollToTop: false });
  try {
    const response = await fetch("/api/screen-books", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(rulePayload()),
    });
    const payload = await response.json();
    if (!response.ok || !payload.rules) throw new Error("规则生成失败");
    state.roundRules = payload.rules;
    state.rulesStatus = "success";
  } catch {
    state.rulesStatus = "error";
    state.roundRules = {
      keep_preferences: ["本轮规则生成暂时不可用，请根据最终清单人工总结。"],
      rejection_reasons: [],
      reusable_rules: [],
      next_round_suggestions: ["下一轮继续记录人工修改原因。"],
    };
  }
}

function exportMockList() {
  const lines = [
    "AI选书官 · 最终候选清单（静态原型）",
    "",
    ...finalGroup("进入候选清单").map(
      (book, index) => `${index + 1}. ${book.title}｜${book.category}｜AI ${book.rating}`,
    ),
    "",
    `说明：本清单来自${state.screeningSource === "deepseek" ? " DeepSeek 初筛" : "备用演示数据"}，最终结果由人工复核形成，不代表采购决定。`,
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "AI_BOOK_SELECTOR_FINAL_LIST.txt";
  link.click();
  URL.revokeObjectURL(link.href);
  showToast("模拟清单已导出");
}

function screeningInput() {
  return {
    rule_version: "selection_rules_v0.1",
    task: {
      target_count: 6,
      focus_topics: ["文学", "文史哲", "社科", "艺术"],
      exclude_topics: ["低质量拼凑", "纯流量畅销", "应试工具书"],
    },
    books: state.books.map((book) => ({
      id: book.id,
      title: book.title,
      isbn: book.isbn,
      author: book.author,
      translator: book.translator,
      publisher: book.publisher,
      publish_date: book.date,
      publish_year: book.year,
      category: book.category,
      keywords: book.keywords,
      pages: book.pages,
      binding: book.binding,
      description: book.summary,
      price: book.price ?? null,
      data_source: book.dataSource,
      confidence: book.confidence,
      missing_fields: book.missingFields,
      enrichment_risk: book.enrichmentRisk,
      is_recent: true,
      inventory_duplicate: "unknown",
    })),
  };
}

async function screenWithDeepSeek() {
  state.screeningStatus = "loading";
  state.screeningError = "";
  render();

  try {
    const response = await fetch("/api/screen-books", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(screeningInput()),
    });
    const payload = await response.json();
    if (!response.ok || !Array.isArray(payload.results)) {
      throw new Error(payload?.error?.message);
    }

    const resultById = new Map(
      payload.results.map((result) => [String(result.id), result]),
    );
    const submittedBooks = [...state.books];
    state.books = submittedBooks.map((book) => {
      const result = resultById.get(String(book.id));
      if (!result) throw new Error("DeepSeek 返回结果不完整");
      const enriched = result.enriched_fields || {};
      const confirmedValue = (original, supplemented) =>
        original && original !== "待补充" ? original : supplemented || "待人工确认";
      return {
        ...book,
        isbn: confirmedValue(book.isbn, enriched.isbn),
        author: confirmedValue(book.author, enriched.author),
        translator: confirmedValue(book.translator, enriched.translator),
        publisher: confirmedValue(book.publisher, enriched.publisher),
        date: confirmedValue(book.date, enriched.publish_date),
        year: confirmedValue(book.year, enriched.publish_year),
        category: confirmedValue(book.category, enriched.category),
        keywords: useful(book.keywords) && book.keywords.length
          ? book.keywords
          : String(enriched.keywords || "").split(/[、,，]/).filter(Boolean),
        pages: confirmedValue(book.pages, enriched.pages),
        binding: confirmedValue(book.binding, enriched.binding),
        summary: confirmedValue(book.summary, enriched.description),
        price: confirmedValue(book.price, enriched.price),
        rating: result.rating,
        reason: result.reason,
        risk: result.risks?.join("；") || "无明确风险，仍需人工复核。",
        shelf: result.shelf_theme,
        enrichment: `可信度：${result.enrichment_confidence || "低"}。${
          result.enrichment_notes?.join("；") || "补全内容仍需人工确认。"
        }`,
      };
    });
    state.generated = true;
    state.screeningStatus = "success";
    state.screeningSource = "deepseek";
    state.reviews = {};
    state.reviewIndex = 0;
    state.filter = "全部";
    state.selectedId = state.books[0].id;
    navigate("screen");
  } catch {
    state.screeningStatus = "error";
    state.screeningError = "DeepSeek 暂时不可用，可使用备用演示数据";
    render();
  }
}

document.addEventListener("click", async (event) => {
  const action = event.target.closest("[data-action]")?.dataset.action;
  const inputMode = event.target.closest("[data-input-mode]")?.dataset.inputMode;
  const filter = event.target.closest("[data-filter]")?.dataset.filter;
  const bookId = event.target.closest("[data-book-id]")?.dataset.bookId;
  const decision = event.target.closest("[data-decision]")?.dataset.decision;

  if (filter) {
    state.filter = filter;
    render();
  }
  if (bookId) {
    state.selectedId = bookId.startsWith("input-") ? bookId : Number(bookId);
    render();
  }
  if (decision) saveReview(decision);
  if (inputMode) {
    state.inputMode = inputMode;
    state.inputErrors = [];
    state.inputWarnings = [];
    if (inputMode === "demo") state.books = mockBooks;
    if (inputMode === "search" || inputMode === "attachment") {
      state.books = [];
      state.enrichmentMessage = "";
    }
    render();
  }

  if (action === "start") navigate("generate");
  if (action === "view-final") navigate("final");
  if (action === "back-home") navigate("home");
  if (action === "back-generate") navigate("generate");
  if (action === "select-real") {
    state.inputMode = "real";
    state.inputErrors = [];
    state.inputWarnings = [];
    render();
  }
  if (action === "select-demo") {
    state.inputMode = "demo";
    state.books = mockBooks;
    state.inputErrors = [];
    state.inputWarnings = [];
    state.screeningError = "";
    render();
  }
  if (action === "search-online") await searchOnlineBooks();
  if (action === "import-search") importSelectedSearchBooks();
  if (action === "confirm-attachment") confirmAttachmentImport();
  if (action === "generate") {
    if (state.inputMode === "real") {
      state.bookInput = document.querySelector("#book-input")?.value ?? state.bookInput;
      const parsed = parseBookInput(state.bookInput);
      state.inputErrors = parsed.errors;
      state.inputWarnings = parsed.warnings;
      if (parsed.errors.length) {
        render();
        return;
      }
      state.books = parsed.books;
    } else if (state.inputMode === "demo") {
      state.books = mockBooks;
    } else if (!state.books.length) {
      state.inputErrors = ["请先查询并导入书目，或上传附件并确认导入。"];
      render();
      return;
    }
    state.originalBooks = structuredClone(state.books);
    if (state.inputMode !== "demo") {
      state.books = await enrichBooks(state.books);
    }
    await screenWithDeepSeek();
  }
  if (action === "use-mock") {
    state.books = mockBooks;
    state.generated = true;
    state.screeningStatus = "success";
    state.screeningSource = "mock";
    state.screeningError = "";
    state.reviews = {};
    state.reviewIndex = 0;
    state.filter = "全部";
    state.selectedId = mockBooks[0].id;
    navigate("screen");
  }
  if (action === "begin-review") {
    state.reviewIndex = 0;
    navigate("review");
  }
  if (action === "finish-review") {
    navigate("final");
    await generateRoundRules();
    render({ scrollToTop: false });
  }
  if (action === "review-again") {
    state.reviewIndex = 0;
    render();
  }
  if (action === "save-rules") {
    state.rulesSaved = true;
    if (state.screeningSource !== "mock" && state.roundRules) {
      localStorage.setItem(
        "freetext-selection-rules",
        JSON.stringify({ saved_at: new Date().toISOString(), rules: state.roundRules }),
      );
    }
    showToast("本轮规则已确认");
    render();
  }
  if (action === "export") exportMockList();
  if (action === "restart") {
    state.generated = false;
    state.books = mockBooks;
    state.inputMode = "real";
    state.bookInput = "";
    state.inputErrors = [];
    state.inputWarnings = [];
    state.screeningStatus = "idle";
    state.screeningSource = "mock";
    state.screeningError = "";
    state.filter = "全部";
    state.reviewIndex = 0;
    state.reviews = {};
    state.rulesSaved = false;
    state.roundRules = null;
    state.rulesStatus = "idle";
    navigate("home");
  }
});

document.addEventListener("input", (event) => {
  if (event.target.id === "book-input") {
    state.bookInput = event.target.value;
    state.inputErrors = [];
    state.inputWarnings = [];
  }
  if (event.target.dataset.searchId) {
    state.searchSelected[event.target.dataset.searchId] = event.target.checked;
  }
});

document.addEventListener("change", async (event) => {
  if (event.target.id === "attachment-input") {
    await handleAttachment(event.target.files?.[0]);
  }
});

window.addEventListener("hashchange", render);
render();
