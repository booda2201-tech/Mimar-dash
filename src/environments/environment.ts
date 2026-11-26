export const environment = {
  production: false,
  apiUrl: 'https://alhendalcompany-001-site13.jtempurl.com',
  fallbackMock: false,
  /** مفتاح Gemini من https://aistudio.google.com/apikey — لو فاضي البوت بيستخدم المحلل المحلي (ومن غيره تحليل الصور مش هيشتغل) */
  geminiApiKey: 'AIzaSyA_fmPemE38EywQzO0nAnHQC8Q1ZF1sSzA',
  geminiModel: 'gemini-flash-lite-latest',
  geminiFallbackModels: ['gemini-flash-latest', 'gemini-3.8-flash'],
};
