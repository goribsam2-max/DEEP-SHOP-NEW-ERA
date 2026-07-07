const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

// Remove the broken top part again (we did this earlier but just to be sure)
code = code.replace(/const isProd = process\.env\.NODE_ENV === "production" \|\| process\.env\.VERCEL;[\s\S]*?app\.use\(vite\.middlewares\);\n      \}\n  \}/, '');

// The bottom of server.ts currently ends with top-level await and app.listen
// Let's replace everything starting from `const isProd = process.env.NODE_ENV === "production";`
code = code.replace(/const isProd = process\.env\.NODE_ENV === "production";[\s\S]*$/, `
let appInitialized = false;

export async function initializeAppAsync() {
  if (appInitialized) return;
  appInitialized = true;

  const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL;
  let vite: any;
  const distPath = path.join(process.cwd(), "dist");

  // Only use static serving locally in production, NOT on Vercel
  // because on Vercel, static files are handled by vercel static routing if present.
  if (isProd && !process.env.VERCEL) {
      app.use(express.static(distPath, { index: false }));
  }

  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.get("*all", async (req, res) => {
    try {
      let template: string;

      if (!isProd) {
        template = fs.readFileSync(path.resolve("index.html"), "utf-8");
        template = await vite.transformIndexHtml(req.originalUrl, template);
      } else {
        template = fs.readFileSync(
          path.join(distPath, "index.html"),
          "utf-8",
        );
      }

      // Check if it's a product page matching \`/product/:id\` or \`/:slug\`
      const productMatch = req.path.match(/^\\/product\\/(.+)/);
      const isSlugMatch = req.path !== "/" && req.path !== "/all-products" && !req.path.startsWith("/api");

      let product: any = null;
      if (productMatch && productMatch[1]) {
        const productId = productMatch[1].split("/")[0];
        product = await fetchProductData(productId);
      } else if (isSlugMatch && admin.apps?.length) {
        try {
          const snapshot = await getFirestore().collection("products").get();
          for (const doc of snapshot.docs) {
            const data = doc.data();
            const slug = toSlug(data.title);
            if (\`/\${slug}\` === req.path) {
              product = data;
              break;
            }
          }
        } catch (e) {}
      }

      if (product) {
        const title = product.title?.stringValue || "Product";
        const description = product.description?.stringValue || "";
        const imageUrl =
          product.image?.stringValue ||
          product.images?.arrayValue?.values?.[0]?.stringValue ||
          "/favicon.png";
        const price =
          product.price?.numberValue ||
          product.price?.integerValue ||
          product.price?.doubleValue ||
          0;

        let metaTags = \`
          <title>\${title} | DEEP SHOP</title>
          <meta name="description" content="\${description}" />
          <meta property="og:title" content="\${title} | DEEP SHOP" />
          <meta property="og:description" content="\${description}" />
          <meta property="og:image" content="\${imageUrl}" />
          <meta property="og:image:alt" content="\${title}" />
          <meta property="og:type" content="product" />
          <meta property="og:url" content="https://www.deepshop.top\${req.path}" />
          <link rel="canonical" href="https://www.deepshop.top\${req.path}" />
          <meta property="product:brand" content="DEEP SHOP" />
          <meta property="product:price:amount" content="\${price}" />
          <meta property="product:price:currency" content="BDT" />
          <meta property="product:availability" content="instock" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="\${title}" />
          <meta name="twitter:description" content="\${description}" />
          <meta name="twitter:image" content="\${imageUrl}" />
        \`;

        // Inject meta tags
        const metaRegex =
          /<!-- META_TAGS_PLACEHOLDER -->[\\s\\S]*?<!-- END_META_TAGS_PLACEHOLDER -->/;
        if (metaRegex.test(template)) {
          template = template.replace(metaRegex, metaTags);
        } else {
          template = template.replace("</head>", \`\${metaTags}\\n</head>\`);
        }

        // Basic HTML Pre-rendering for AEO / Bots
        const preRenderedHTML = \`
          <div style="display: none;" aria-hidden="true">
            <h1>\${title}</h1>
            <p>\${description}</p>
            <img src="\${imageUrl}" alt="\${title}" />
            <p>Price: BDT \${price}</p>
          </div>
        \`;
        template = template.replace('<div id="root"></div>', '<div id="root">' + preRenderedHTML + '</div>');
      } else if (req.path === "/all-products") {
        const category = req.query.category ? String(req.query.category) : "All";
        const canonicalUrl = category !== "All" ? \`https://www.deepshop.top/all-products?category=\${encodeURIComponent(category)}\` : \`https://www.deepshop.top/all-products\`;
        
        let metaTags = \`
          <title>\${category === "All" ? "All Products" : \`\${category} Products\`} | DEEP SHOP</title>
          <meta name="description" content="Browse our collection of \${category} at DEEP SHOP." />
          <meta property="og:title" content="\${category === "All" ? "All Products" : \`\${category} Products\`} | DEEP SHOP" />
          <link rel="canonical" href="\${canonicalUrl}" />
          <meta property="og:url" content="\${canonicalUrl}" />
        \`;
        
        const metaRegex =/<!-- META_TAGS_PLACEHOLDER -->[\\s\\S]*?<!-- END_META_TAGS_PLACEHOLDER -->/;
        if (metaRegex.test(template)) {
          template = template.replace(metaRegex, metaTags);
        } else {
          template = template.replace("</head>", \`\${metaTags}\\n</head>\`);
        }
      } else if (req.path === "/" && admin.apps?.length) {
        // Fetch home SEO
        try {
          const seoSnap = await getFirestore()
            .collection("settings")
            .doc("seo")
            .get();
          if (seoSnap.exists) {
            const data = seoSnap.data() as any;
            const title = data.metaTitle || "DEEP SHOP | #1 Trusted Platform for Border Cross Mobiles";
            const description =
              data.metaDescription ||
              "DEEP SHOP - Discover premium border cross phones, original mobiles & accessories.";
            const imageUrl =
              data.metaImage || "/favicon.png";

            let metaTags = \`
                <title>\${title}</title>
                <meta name="description" content="\${description}" />
                <meta property="og:title" content="\${title}" />
                <meta property="og:description" content="\${description}" />
                <meta property="og:image" content="\${imageUrl}" />
                <meta property="og:type" content="website" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="\${title}" />
                <meta name="twitter:description" content="\${description}" />
                <meta name="twitter:image" content="\${imageUrl}" />
             \`;
            template = template.replace("</head>", \`\${metaTags}\\n</head>\`);
          }
        } catch (e) {}
      }

      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (e: any) {
      if (!isProd && vite) {
        vite.ssrFixStacktrace(e);
      }
      console.log(e.stack);
      res.status(500).end(e.stack);
    }
  });
}

if (!process.env.VERCEL) {
  initializeAppAsync().then(() => {
    const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(\`Server running on http://localhost:\${PORT}\`);
    });
  });
}
`);

fs.writeFileSync('server.ts', code);
