import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { handler } from "./handler.js";

const PORT = Number(process.env.PORT ?? 3001);
const DELAY_MS = Number(process.env.DELAY_MS ?? 0);

function toEvent(req: IncomingMessage, url: URL): APIGatewayProxyEventV2 {
  const queryStringParameters: Record<string, string> = {};
  for (const [key, value] of url.searchParams) {
    queryStringParameters[key] = value;
  }

  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === "string") headers[key] = value;
  }

  const method = req.method ?? "GET";

  return {
    version: "2.0",
    routeKey: `${method} ${url.pathname}`,
    rawPath: url.pathname,
    rawQueryString: url.search.replace(/^\?/, ""),
    headers,
    queryStringParameters:
      Object.keys(queryStringParameters).length > 0 ? queryStringParameters : undefined,
    requestContext: {
      http: { method, path: url.pathname },
    } as APIGatewayProxyEventV2["requestContext"],
    isBase64Encoded: false,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function respondNotFound(res: ServerResponse): void {
  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
}

// Emulates just enough of API Gateway v2 + the single "GET /tickets" route
// from template.yaml to drive handler.ts locally. handler.ts never imports
// from here — this is purely an adapter around it.
const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);

  if (req.method !== "GET" || url.pathname !== "/tickets") {
    respondNotFound(res);
    return;
  }

  if (DELAY_MS > 0) {
    await sleep(DELAY_MS);
  }

  const event = toEvent(req, url);
  const result = await handler(event);

  res.writeHead(result.statusCode ?? 200, (result.headers ?? {}) as Record<string, string>);
  res.end(result.body ?? "");
});

server.listen(PORT, () => {
  console.log(`Dev server listening on http://localhost:${PORT}`);
});
