export const environment = {
  production: false,
  apiUrl: 'https://alhendalcompany-001-site13.jtempurl.com',
  fallbackMock: false,
  /** مفتاح Gemini — لو فاضي البوت بيستخدم المحلل المحلي (ومن غيره تحليل الصور مش هيشتغل) */
  geminiApiKey: 'AIzaSyAxBu878DSd9v7rwo1YEJUT0FLjHlYcyio',
  geminiModel: 'gemini-flash-lite-latest',
  geminiFallbackModels: ['gemini-flash-latest', 'gemini-3.5-flash'],
};
