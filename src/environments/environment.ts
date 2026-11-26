import { secrets } from './environment.secrets';

export const environment = {
  production: false,
  apiUrl: 'https://alhendalcompany-001-site13.jtempurl.com',
  fallbackMock: false,
  /** مفتاح Gemini من environment.secrets.ts (مش بيترفع على Git) */
  geminiApiKey: secrets.geminiApiKey,
  geminiModel: 'gemini-flash-lite-latest',
  geminiFallbackModels: ['gemini-flash-latest', 'gemini-3.8-flash'],
};
