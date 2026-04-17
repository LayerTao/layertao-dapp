import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const availableModels = [
  { id: "Qwen/Qwen3-32B-TEE", company: "Qwen", name: "Qwen3-32B-TEE" },
  { id: "openai/gpt-oss-120b-TEE", company: "OpenAI", name: "gpt-oss-120b-TEE" },
  { id: "deepseek-ai/DeepSeek-V3.1-TEE", company: "DeepSeek", name: "DeepSeek-V3.1-TEE" },
  { id: "deepseek-ai/DeepSeek-V3.2-TEE", company: "DeepSeek", name: "DeepSeek-V3.2-TEE" },
  { id: "Qwen/Qwen3-235B-A22B-Instruct-2507-TEE", company: "Qwen", name: "Qwen3-235B-A22B-Instruct-2507-TEE" },
  { id: "MiniMaxAI/MiniMax-M2.5-TEE", company: "MiniMax", name: "MiniMax-M2.5-TEE" },
  { id: "zai-org/GLM-5-Turbo", company: "Chutes AI", name: "zai-org/GLM-5-Turbo" },
  { id: "Qwen/Qwen3-Coder-Next-TEE", company: "Qwen", name: "Qwen/Qwen3-Coder-Next-TEE" },
  { id: "tngtech/DeepSeek-TNG-R1T2-Chimera-TEE", company: "Chutes AI", name: "tngtech/DeepSeek-TNG-R1T2-Chimera-TEE" },
] as const;


export const tools = [
  {
    type: "function" as const,
    function: {
      name: "route_to_chutes",
      description: `Route user requests to the best model.

MANDATORY: Select the BEST model.id from this EXACT list ONLY:

${JSON.stringify(availableModels, null, 2)}

Guidelines:
- Advanced coding / complex technical reasoning: "deepseek-ai/DeepSeek-V3.2-TEE"
- Coding (general): "deepseek-ai/DeepSeek-V3.1-TEE"
- Coding specialist / software engineering tasks: "Qwen/Qwen3-Coder-Next-TEE"
- Deep reasoning / math / research-grade analysis: "tngtech/DeepSeek-TNG-R1T2-Chimera-TEE"
- Complex reasoning / long context: "Qwen/Qwen3-235B-A22B-Instruct-2507-TEE"
- General Q&A / balanced reasoning: "Qwen/Qwen3-32B-TEE" or "openai/gpt-oss-120b-TEE"
- Multilingual / translation: "MiniMaxAI/MiniMax-M2.5-TEE"
- Fast / lightweight tasks: "zai-org/GLM-5-Turbo"

Rules:
- Use ONLY model IDs from the list
- Select ONE best model
- Never invent model names
- Default fallback: "Qwen/Qwen3-32B-TEE"`,
      parameters: {
        type: "object",
        properties: {
          messages: {
            type: "array",
            items: { type: "object" },
          },
          model: {
            type: "string",
          },
        },
        required: ["messages", "model"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "route_to_desearch",
      description: `Route to DeSearch for real-time or web research queries.
Use when the user needs current information, news, social sentiment, academic papers, or anything not in training data.`,
      parameters: {
        type: "object",
        properties: {
          tools: {
            type: "array",
            items: {
              type: "string",
              enum: ["web", "hackernews", "reddit", "wikipedia", "youtube", "twitter", "arxiv"]
            },
            description: `Pick ONLY the platforms likely to have the best answer. Guidelines:
- "web": general facts, news, any broad query — almost always include this
- "reddit": opinions, personal experience, community discussions, recommendations
- "twitter": breaking news, trending topics, public reactions, real-time events
- "youtube": tutorials, video content, how-to queries
- "arxiv": academic/scientific/ML research papers
- "hackernews": tech industry news, startup/dev discussions
- "wikipedia": historical facts, definitions, established knowledge
Do NOT include all tools — pick only what's relevant.`
          }
        },
        required: ["tools"]
      }
    }
  }
];