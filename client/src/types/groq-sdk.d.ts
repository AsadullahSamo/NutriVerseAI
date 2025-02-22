declare module 'groq-sdk' {
  interface GroqResponse {
    choices: Array<{
      message: {
        content: string;
        role: string;
      };
    }>;
  }

  interface GroqConfig {
    apiKey: string;
    dangerouslyAllowBrowser?: boolean;  // Add this option
  }

  class Groq {
    constructor(config: GroqConfig);
    chat: {
      completions: {
        create: (params: {
          messages: Array<{
            role: string;
            content: string;
          }>;
          model: string;
          temperature?: number;
          max_tokens?: number;
        }) => Promise<GroqResponse>;
      };
    };
  }

  export default Groq;
}