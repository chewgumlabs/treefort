export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function sendHtml(response, statusCode, title, body) {
  response.writeHead(statusCode, {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
        font-family: "Trebuchet MS", sans-serif;
        background: linear-gradient(180deg, #ffd5b8, #fff4c8);
        color: #25160b;
      }
      main {
        width: min(560px, 100%);
        padding: 28px 24px;
        border-radius: 24px;
        background: rgba(255, 247, 232, 0.96);
        box-shadow: 0 20px 50px rgba(37, 22, 11, 0.18);
      }
      a {
        color: #9b431b;
        font-weight: 700;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>${escapeHtml(title)}</h1>
      ${body}
    </main>
  </body>
</html>`);
}

export function redirect(response, location) {
  response.writeHead(302, {
    location,
    "cache-control": "no-store",
  });
  response.end();
}
