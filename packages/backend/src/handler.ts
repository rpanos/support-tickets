import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";
import { TicketQuerySchema } from "@app/shared";
import { InMemoryTicketRepository } from "./repositories/inMemoryTicketRepository.js";
import type { TicketRepository } from "./repositories/ticketRepository.js";

const JSON_HEADERS = { "content-type": "application/json" };

function jsonResponse(statusCode: number, body: unknown): APIGatewayProxyStructuredResultV2 {
  return {
    statusCode,
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  };
}

export function createHandler(repository: TicketRepository) {
  return async function handler(
    event: APIGatewayProxyEventV2,
  ): Promise<APIGatewayProxyStructuredResultV2> {
    const parsed = TicketQuerySchema.safeParse(event.queryStringParameters ?? {});
    if (!parsed.success) {
      return jsonResponse(400, { error: parsed.error.message });
    }

    const result = await repository.findMany(parsed.data);
    return jsonResponse(200, result);
  };
}

// Constructed once at module scope so the fixture load and repository are
// reused across warm Lambda invocations instead of on every request.
const defaultRepository = new InMemoryTicketRepository();

export const handler = createHandler(defaultRepository);
