import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import { CohereClient } from 'cohere-ai';

export interface ProviderConfig {
  provider: 'openai' | 'google' | 'cohere' | 'nim' | 'github' | 'groq' | 'mistral' | 'cerebras' | 'cloudflare' | 'huggingface' | 'openrouter';
  baseURL?: string;
  apiKeyEnvVar: string;
  modelEnvVar: string;
  defaultModel: string;
}

export const ROUTER_CONFIG: Record<string, ProviderConfig> = {
  discovery: {
    provider: 'google',
    apiKeyEnvVar: 'GOOGLE_AI_API_KEY',
    modelEnvVar: 'GOOGLE_MODEL',
    defaultModel: 'gemini-2.5-flash',
  },
  ingestion: {
    provider: 'github',
    baseURL: 'https://models.inference.ai.azure.com',
    apiKeyEnvVar: 'GITHUB_MODELS_TOKEN',
    modelEnvVar: 'GITHUB_MODEL',
    defaultModel: 'gpt-4o-mini',
  },
  architect: {
    provider: 'mistral',
    baseURL: 'https://api.mistral.ai/v1',
    apiKeyEnvVar: 'MISTRAL_API_KEY',
    modelEnvVar: 'MISTRAL_REASONING_MODEL',
    defaultModel: 'mistral-medium-3-5',
  },
  design: {
    provider: 'cohere',
    apiKeyEnvVar: 'COHERE_API_KEY',
    modelEnvVar: 'COHERE_MODEL',
    defaultModel: 'command-r-plus',
  },
  divergence: {
    provider: 'groq',
    baseURL: 'https://api.groq.com/openai/v1',
    apiKeyEnvVar: 'GROQ_API_KEY',
    modelEnvVar: 'GROQ_MODEL',
    defaultModel: 'llama-3.3-70b-versatile',
  },
  'coder-fe': {
    provider: 'mistral',
    baseURL: 'https://api.mistral.ai/v1',
    apiKeyEnvVar: 'MISTRAL_API_KEY',
    modelEnvVar: 'MISTRAL_CODE_MODEL',
    defaultModel: 'codestral-latest',
  },
  'coder-be': {
    provider: 'mistral',
    baseURL: 'https://api.mistral.ai/v1',
    apiKeyEnvVar: 'MISTRAL_API_KEY',
    modelEnvVar: 'MISTRAL_CODE_MODEL',
    defaultModel: 'codestral-latest',
  },
  qa: {
    provider: 'cerebras',
    baseURL: 'https://api.cerebras.ai/v1',
    apiKeyEnvVar: 'CEREBRAS_API_KEY',
    modelEnvVar: 'CEREBRAS_MODEL',
    defaultModel: 'llama3.1-70b',
  },
  testing: {
    provider: 'github',
    baseURL: 'https://models.inference.ai.azure.com',
    apiKeyEnvVar: 'GITHUB_MODELS_TOKEN',
    modelEnvVar: 'GITHUB_VISION_MODEL',
    defaultModel: 'gpt-4o-mini',
  },
  negotiation: {
    provider: 'cloudflare',
    baseURL: 'https://api.cloudflare.com/client/v4/accounts/default/ai/v1',
    apiKeyEnvVar: 'CLOUDFLARE_API_KEY',
    modelEnvVar: 'CLOUDFLARE_MODEL',
    defaultModel: '@cf/meta/llama-3-8b-instruct',
  },
  growth: {
    provider: 'huggingface',
    baseURL: 'https://api-inference.huggingface.co/v1',
    apiKeyEnvVar: 'HUGGINGFACE_API_KEY',
    modelEnvVar: 'HF_MODEL',
    defaultModel: 'meta-llama/Llama-3-8b-instruct',
  },
  learning: {
    provider: 'openrouter',
    baseURL: 'https://openrouter.ai/api/v1',
    apiKeyEnvVar: 'OPENROUTER_API_KEY',
    modelEnvVar: 'OPENROUTER_MODEL',
    defaultModel: 'meta-llama/llama-3-8b-instruct',
  },
  asset: {
    provider: 'google',
    apiKeyEnvVar: 'GOOGLE_AI_API_KEY',
    modelEnvVar: 'GOOGLE_MODEL',
    defaultModel: 'gemini-2.5-flash',
  },
};

const FALLBACK_CONFIG: ProviderConfig = {
  provider: 'nim',
  baseURL: 'https://integrate.api.nvidia.com/v1',
  apiKeyEnvVar: 'NVIDIA_NIM_API_KEY',
  modelEnvVar: 'NIM_MODEL_NAME',
  defaultModel: 'nvidia/nemotron-3-super-120b-a12b',
};

export class ModelRouter {
  /**
   * Universal chat completion method that routes calls to the primary provider
   * with automatic, logged fallback to NVIDIA NIM.
   */
  static async chatCompletion(options: {
    agentName: string;
    messages: any[];
    temperature?: number;
    responseFormat?: { type: 'json_object' };
    maxTokens?: number;
  }): Promise<{ content: string; providerUsed: string; modelUsed: string }> {
    const config = ROUTER_CONFIG[options.agentName] || FALLBACK_CONFIG;
    const rawApiKey = process.env[config.apiKeyEnvVar] || '';
    const primaryModel = process.env[config.modelEnvVar] || config.defaultModel;

    // Detect placeholder/template values (e.g. "your_google_ai_api_key_here") and treat as unconfigured
    const isPlaceholder = (val: string) => !val || val.startsWith('your_') || val.endsWith('_here');
    const primaryApiKey = isPlaceholder(rawApiKey) ? '' : rawApiKey;

    // If no key is set for the primary provider, fall back immediately to NVIDIA NIM
    if (!primaryApiKey && config.provider !== 'nim') {
      console.warn(
        `[ModelRouter] No API key found for primary provider (${config.provider}) of agent "${options.agentName}". Falling back to NVIDIA NIM.`
      );
      return this.executeNIMFallback(options, `Missing key ${config.apiKeyEnvVar}`);
    }

    try {
      if (config.provider === 'google') {
        const content = await this.executeGoogle(primaryApiKey, primaryModel, options);
        return { content, providerUsed: 'google', modelUsed: primaryModel };
      }

      if (config.provider === 'cohere') {
        const content = await this.executeCohere(primaryApiKey, primaryModel, options);
        return { content, providerUsed: 'cohere', modelUsed: primaryModel };
      }

      // OpenAI-compatible providers
      const content = await this.executeOpenAICompatible(
        config.provider,
        config.baseURL || '',
        primaryApiKey,
        primaryModel,
        options
      );
      return { content, providerUsed: config.provider, modelUsed: primaryModel };
    } catch (err: any) {
      console.warn(
        `[ModelRouter] Primary provider (${config.provider}) call failed for agent "${options.agentName}": ${err.message}. Falling back to NVIDIA NIM.`
      );
      return this.executeNIMFallback(options, err.message);
    }
  }

  private static async executeGoogle(apiKey: string, model: string, options: any): Promise<string> {
    const ai = new GoogleGenAI({ apiKey });
    const messages = options.messages || [];

    const systemInstruction = messages.find((m: any) => m.role === 'system')?.content || '';
    const otherMessages = messages.filter((m: any) => m.role !== 'system');

    const contents = otherMessages.map((m: any) => {
      let parts: any[] = [];
      if (Array.isArray(m.content)) {
        for (const part of m.content) {
          if (part.type === 'text') {
            parts.push({ text: part.text });
          } else if (part.type === 'image_url') {
            const matches = part.image_url.url.match(/^data:([^;]+);base64,(.+)$/);
            if (matches) {
              parts.push({
                inlineData: {
                  mimeType: matches[1],
                  data: matches[2],
                },
              });
            }
          }
        }
      } else {
        parts.push({ text: m.content });
      }

      return {
        role: m.role === 'assistant' ? 'model' : 'user',
        parts,
      };
    });

    const responseFormat = options.responseFormat?.type === 'json_object' ? 'application/json' : undefined;

    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction,
        temperature: options.temperature ?? 0.2,
        responseMimeType: responseFormat,
        maxOutputTokens: options.maxTokens,
      },
    });

    return response.text || '';
  }

  private static async executeCohere(apiKey: string, model: string, options: any): Promise<string> {
    const cohere = new CohereClient({ token: apiKey });
    const messages = options.messages || [];

    const systemInstruction = messages.find((m: any) => m.role === 'system')?.content || '';
    const chatHistory = messages
      .filter((m: any) => m.role !== 'system')
      .map((m: any) => ({
        role: m.role === 'assistant' ? 'CHATBOT' : 'USER',
        message: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
      }));

    const lastMessage = chatHistory.pop()?.message || '';

    const response = await cohere.chat({
      model,
      message: lastMessage,
      chatHistory: chatHistory as any,
      preamble: systemInstruction || undefined,
      temperature: options.temperature ?? 0.2,
    });

    return response.text || '';
  }

  private static async executeOpenAICompatible(
    providerName: string,
    baseURL: string,
    apiKey: string,
    model: string,
    options: any
  ): Promise<string> {
    const client = new OpenAI({ apiKey, baseURL });
    const reqOptions: any = {
      model,
      messages: options.messages,
      temperature: options.temperature ?? 0.2,
    };

    if (options.responseFormat) {
      reqOptions.response_format = options.responseFormat;
    }
    if (options.maxTokens) {
      reqOptions.max_tokens = options.maxTokens;
    }

    const response = await client.chat.completions.create(reqOptions);
    return response.choices[0]?.message?.content || '';
  }

  private static async executeNIMFallback(options: any, originalError: string): Promise<{ content: string; providerUsed: string; modelUsed: string }> {
    const nimKey = process.env.NVIDIA_NIM_API_KEY || '';
    const nimBaseUrl = process.env.NVIDIA_NIM_BASE_URL || 'https://integrate.api.nvidia.com/v1';
    const nimModel = process.env.NIM_MODEL_NAME || 'nvidia/llama-3.1-nemotron-70b-instruct';

    if (!nimKey) {
      throw new Error(`Fallback failed: NVIDIA_NIM_API_KEY not configured. Original error: ${originalError}`);
    }

    const client = new OpenAI({ apiKey: nimKey, baseURL: nimBaseUrl });
    const reqOptions: any = {
      model: nimModel,
      messages: options.messages,
      temperature: options.temperature ?? 0.2,
    };

    if (options.responseFormat) {
      reqOptions.response_format = options.responseFormat;
    }
    if (options.maxTokens) {
      reqOptions.max_tokens = options.maxTokens;
    }

    const response = await client.chat.completions.create(reqOptions);
    return {
      content: response.choices[0]?.message?.content || '',
      providerUsed: 'nim',
      modelUsed: nimModel,
    };
  }
}
