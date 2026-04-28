const fs = require("fs");
const http = require("http");
const path = require("path");

const root = process.cwd();
const port = getPort();

const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8"
};

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const safePath = decodeURIComponent(url.pathname).replace(/^\/+/, "") || "index.html";
  const target = path.normalize(path.join(root, safePath));

  if (!target.startsWith(root)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  const file = fs.existsSync(target) && fs.statSync(target).isDirectory()
    ? path.join(target, "index.html")
    : target;

  fs.readFile(file, (error, data) => {
    if (error) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": types[path.extname(file).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    response.end(data);
  });
});

server.listen(port, () => {
  console.log(`EXAM local server: http://localhost:${port}/`);
});

function getPort() {
  const args = process.argv.slice(2);
  const portFlag = args.findIndex((arg) => arg === "--port" || arg === "-p");
  if (portFlag >= 0 && args[portFlag + 1]) return Number(args[portFlag + 1]);
  return Number(process.env.PORT || 4173);
}
