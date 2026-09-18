import { TypeSafeClient } from "@typesafe-ai/sdk";

let client: TypeSafeClient | null = null;

/** One shared client per server process. Reads TYPESAFE_API_KEY from the environment. */
export function jev(): TypeSafeClient {
  if (!process.env.TYPESAFE_API_KEY) {
    throw new Error("TYPESAFE_API_KEY is not set");
  }
  client ??= new TypeSafeClient();
  return client;
}
