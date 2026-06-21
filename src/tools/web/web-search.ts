import dotenv from "dotenv";
import { registerTool } from "../registry";
dotenv.config();

const tavilyApiKey = process.env.TAVILY_API_KEY || "";

type TavilyResult = { title: string; url: string; content: string };
type TavilyResponse = { answer?: string; results?: TavilyResult[] };

registerTool(
  "web_search",
  {
    type: "function",
    function: {
      name: "web_search",
      description:
        "Search the web and return an answer plus the top sources (title, url, snippet). Use for current information or documentation lookups.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "The search query" },
        },
        required: ["query"],
      },
    },
  },
  async (args: { query: string }) => {
    if (!tavilyApiKey) {
      return "web_search is not configured. Set TAVILY_API_KEY in .env (get one at https://tavily.com).";
    }

    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tavilyApiKey}`,
      },
      body: JSON.stringify({
        query: args.query,
        search_depth: "basic",
        include_answer: true,
        max_results: 5,
      }),
    });

    if (!res.ok) return `Search failed: ${res.status} ${await res.text()}`;

    const data = (await res.json()) as TavilyResponse;
    const results = data.results ?? [];
    if (results.length === 0 && !data.answer) return "No results found.";

    const sources = results
      .map((r, i) => `${i + 1}. ${r.title}\n   ${r.url}\n   ${r.content}`)
      .join("\n\n");

    return data.answer
      ? `Answer: ${data.answer}\n\nSources:\n${sources}`
      : sources;
  },
);
