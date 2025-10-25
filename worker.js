export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/+|\/+$/g, "");

    // POST /shorten  -> body: { "url": "https://example.com" }
    if (request.method === "POST" && path === "shorten") {
      try {
        const j = await request.json();
        let original = j.url;
        if (!original) return new Response("Missing URL", { status: 400 });

        // اگر scheme نداشت، https اضافه کن
        if (!/^https?:\/\//i.test(original)) original = "https://" + original;

        // تولید کد 6 حرفی base36 (قابل تغییر)
        const code = Math.random().toString(36).slice(2, 8);

        // ذخیره در KV (env.LINKS باید متصل شود)
        await env.LINKS.put(code, original);

        return new Response(JSON.stringify({
          short: `${url.origin}/${code}`,
          code,
          original
        }), { status: 201, headers: { "Content-Type": "application/json" }});
      } catch (e) {
        return new Response("Invalid JSON", { status: 400 });
      }
    }

    // GET /<code>  -> redirect
    if (request.method === "GET" && path) {
      const target = await env.LINKS.get(path);
      if (target) return Response.redirect(target, 301);
      return new Response("Not found", { status: 404 });
    }

    return new Response("URL shortener Worker — POST /shorten with JSON {url} or GET /<code>", { status: 200 });
  }
};
