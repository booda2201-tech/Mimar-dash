import { Injectable } from '@angular/core';
import { GenerativeModel, GoogleGenerativeAI, Schema, SchemaType } from '@google/generative-ai';
import { environment } from '../../../environments/environment';

export interface GeminiSpec {
  specAr: string;
  valueAr: string;
  specEn: string;
  valueEn: string;
}

export interface GeminiProduct {
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  category: string;
  brand: string;
  sku: string;
  price: number | null;
  stock: number | null;
  wholesaleUnitPrice?: number | null;
  wholesaleMinQty?: number | null;
  discountPercent?: number | null;
  specifications: GeminiSpec[];
}

/** صورة مرفقة للموديل — base64 من غير بادئة data: */
export interface GeminiImage {
  mimeType: string;
  data: string;
}

const str = (description: string): Schema => ({ type: SchemaType.STRING, description });
const num = (description: string): Schema => ({ type: SchemaType.NUMBER, description, nullable: true });

const PRODUCT_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    nameAr: str('اسم المنتج بالعربي فقط، بدون أي عنوان أو سعر أو كمية بيع'),
    nameEn: str('Product name in English'),
    descriptionAr: str('وصف تسويقي قصير بالعربي'),
    descriptionEn: str('Short marketing description in English'),
    category: str('اسم الفئة من القائمة المتاحة حرفياً، أو فارغ'),
    brand: str('اسم البراند من القائمة المتاحة حرفياً لو موجود، أو كما كتبه المستخدم، أو فارغ'),
    sku: str('رمز SKU لو مذكور، أو فارغ'),
    price: num('السعر الأساسي للوحدة، رقم فقط'),
    stock: { type: SchemaType.INTEGER, description: 'المخزون، رقم صحيح فقط', nullable: true },
    wholesaleUnitPrice: num('سعر الوحدة للجملة لو مذكور'),
    wholesaleMinQty: { type: SchemaType.INTEGER, description: 'أقل كمية لسعر الجملة لو مذكورة', nullable: true },
    discountPercent: num('نسبة الخصم على المنتج لو مذكورة (0-100)'),
    specifications: {
      type: SchemaType.ARRAY,
      description: 'مواصفات فنية فقط (الوزن، المقاس، اللون، الخامة، بلد المنشأ، الضمان...) — ممنوع الاسم/الوصف/السعر/المخزون/SKU/الفئة/البراند',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          specAr: str('اسم المواصفة بالعربي'),
          valueAr: str('القيمة بالعربي'),
          specEn: str('Spec name in English'),
          valueEn: str('Value in English'),
        },
        required: ['specAr', 'valueAr', 'specEn', 'valueEn'],
      },
    },
  },
  required: ['nameAr', 'nameEn', 'descriptionAr', 'descriptionEn', 'category', 'brand', 'sku', 'specifications'],
};

const SYSTEM_INSTRUCTION = `أنت "بوت معمار"، مساعد إدخال بيانات المنتجات لمنصة معمار لمواد البناء (المقر في الكويت، العملة د.ك).
حلّل نص المستخدم وصور المنتج (لو موجودة) واستخرج بيانات المنتج حسب الـ schema.
الصور:
- اتعرّف على المنتج من الصورة: نوعه، الخامة، اللون، التشطيب، الشكل، الاستخدام، وأي كتابة أو لوجو أو مقاس ظاهر على المنتج أو العبوة.
- استخدم ده عشان تكتب الاسم العربي والإنجليزي والوصفين وتختار الفئة وتطلع مواصفات فنية.
- المواصفات من الصورة تكون اللي باينة فعلاً أو معروفة بثقة عالية لنوع المنتج ده. ممنوع تخترع أرقام دقيقة (وزن، مقاس، سعة) إلا لو مكتوبة أو باينة بوضوح.
- البراند يتحدد بس لو اللوجو أو الاسم باين في الصورة أو مكتوب في النص.
- ممنوع تخترع سعر أو مخزون أو SKU أو خصم أو سعر جملة من الصورة — دول null أو فارغ إلا لو مكتوبين صراحة.
البيانات الحالية:
- لو اتبعتلك "بيانات المنتج الحالية"، رجّع القيم الموجودة زي ما هي من غير تغيير، وكمّل الحقول الفاضية بس.
- ممنوع تكرر مواصفة موجودة بالفعل.
القواعد:
- كل قيمة نصية تكون نظيفة: ممنوع تبدأ بعنوان الحقل مثل "اسم المنتج بالعربي:" أو "Product name (EN):" أو "الوصف:".
- الأسعار والمخزون والنسب أرقام فقط بدون عملة أو وحدات.
- specifications للمواصفات الفنية بس. ممنوع تحط فيها الاسم أو الوصف أو السعر أو المخزون أو SKU أو الفئة أو البراند أو الخصم.
- الفئة لازم تكون واحدة من الفئات المتاحة بنفس الكتابة، ولو مفيش مناسبة سيبها فارغة.
- لو الوصف مش مكتوب اكتب وصف قصير واقعي من البيانات المتاحة، ولو الاسم الإنجليزي مش مكتوب ترجمه.
- أي حقل مش مذكور: نص فارغ أو null.`;

/** بعض الموديلات بتعلّق من غير رد — بعد المدة دي بننقل للموديل اللي بعده */
const GEMINI_TIMEOUT_MS = 25000;

@Injectable({ providedIn: 'root' })
export class GeminiAiService {
  /** الموديلات بالترتيب — لو واحد مضغوط (503) أو مش متاح للمفتاح (404) بنجرب اللي بعده */
  private models: GenerativeModel[] = environment.geminiApiKey
    ? [...new Set([environment.geminiModel, ...(environment.geminiFallbackModels || [])])].map((name) =>
        new GoogleGenerativeAI(environment.geminiApiKey).getGenerativeModel(
          {
            model: name,
            systemInstruction: SYSTEM_INSTRUCTION,
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json',
              responseSchema: PRODUCT_SCHEMA,
            },
          },
          { timeout: GEMINI_TIMEOUT_MS }
        )
      )
    : [];

  get enabled(): boolean {
    return this.models.length > 0;
  }

  async parseProduct(
    text: string,
    ctx: { categories: string[]; brands: string[]; current?: Record<string, unknown> },
    images: GeminiImage[] = []
  ): Promise<GeminiProduct> {
    if (!this.models.length) throw new Error('Gemini API key is not configured');
    const current = ctx.current && Object.keys(ctx.current).length ? JSON.stringify(ctx.current) : '';
    const prompt = [
      `الفئات المتاحة: ${ctx.categories.join(' | ') || '—'}`,
      `البراندات المتاحة: ${ctx.brands.join(' | ') || '—'}`,
      ...(current ? ['', 'بيانات المنتج الحالية (حافظ عليها وكمّل الناقص):', current] : []),
      ...(images.length ? ['', `مرفق ${images.length} صورة للمنتج — حلّلها.`] : []),
      '',
      'نص المستخدم:',
      text || '(مفيش نص — اعتمد على الصور والبيانات الحالية)',
    ].join('\n');
    const parts = [
      { text: prompt },
      ...images.map((img) => ({ inlineData: { mimeType: img.mimeType, data: img.data } })),
    ];
    let lastError: unknown;
    for (const model of this.models) {
      try {
        const result = await model.generateContent(parts);
        return JSON.parse(result.response.text()) as GeminiProduct;
      } catch (err) {
        lastError = err;
        if (!isRetryable(err)) break;
        console.warn(`Gemini ${model.model} failed, trying next model`, err);
      }
    }
    throw lastError;
  }
}

function isRetryable(err: unknown): boolean {
  const status = (err as { status?: number })?.status;
  if (status) return [404, 429, 500, 503].includes(status);
  const name = (err as Error)?.name || '';
  return (
    name === 'AbortError' ||
    /\[(404|429|500|503)\b|overloaded|not found|unavailable|abort|timeout|timed out/i.test(String((err as Error)?.message || err))
  );
}

/** رسالة مفهومة للمستخدم من خطأ Gemini */
export function geminiErrorMessage(err: unknown): string {
  const msg = String((err as Error)?.message || err);
  if (/API key not valid|API_KEY_INVALID|\[400/i.test(msg)) return 'مفتاح Gemini مش صالح';
  if (/\[403|PERMISSION_DENIED/i.test(msg)) return 'مفتاح Gemini مش مسموحله بالموديل ده';
  if (/\[429|quota|RESOURCE_EXHAUSTED/i.test(msg)) return 'خلصت حصة Gemini — استنى شوية وجرّب تاني';
  if (/\[503|overloaded|unavailable/i.test(msg)) return 'خوادم Gemini مضغوطة دلوقتي — جرّب كمان دقيقة';
  if (/abort|timeout|timed out/i.test(msg)) return 'Gemini اتأخر في الرد — جرّب تاني';
  if (/Failed to fetch|NetworkError/i.test(msg)) return 'مفيش اتصال بـ Gemini — اتأكد من النت';
  if (/JSON/i.test(msg)) return 'رد البوت مكانش مفهوم — جرّب تاني';
  return 'تعذر تحليل الصور — جرّب تاني أو صورة أوضح';
}
