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

const SYSTEM_INSTRUCTION = `أنت "بوت معمار"، مساعد إدخال بيانات المنتجات لمنصة معمار لمواد البناء.
حلّل نص المستخدم واستخرج بيانات المنتج حسب الـ schema.
القواعد:
- كل قيمة نصية تكون نظيفة: ممنوع تبدأ بعنوان الحقل مثل "اسم المنتج بالعربي:" أو "Product name (EN):" أو "الوصف:".
- الأسعار والمخزون والنسب أرقام فقط بدون عملة أو وحدات.
- specifications للمواصفات الفنية بس. ممنوع تحط فيها الاسم أو الوصف أو السعر أو المخزون أو SKU أو الفئة أو البراند أو الخصم.
- الفئة لازم تكون واحدة من الفئات المتاحة بنفس الكتابة، ولو مفيش مناسبة سيبها فارغة.
- لو الوصف مش مكتوب اكتب وصف قصير واقعي من البيانات المتاحة، ولو الاسم الإنجليزي مش مكتوب ترجمه.
- أي حقل مش مذكور: نص فارغ أو null.`;

@Injectable({ providedIn: 'root' })
export class GeminiAiService {
  private model: GenerativeModel | null = environment.geminiApiKey
    ? new GoogleGenerativeAI(environment.geminiApiKey).getGenerativeModel({
        model: environment.geminiModel,
        systemInstruction: SYSTEM_INSTRUCTION,
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
          responseSchema: PRODUCT_SCHEMA,
        },
      })
    : null;

  get enabled(): boolean {
    return !!this.model;
  }

  async parseProduct(text: string, ctx: { categories: string[]; brands: string[] }): Promise<GeminiProduct> {
    if (!this.model) throw new Error('Gemini API key is not configured');
    const prompt = [
      `الفئات المتاحة: ${ctx.categories.join(' | ') || '—'}`,
      `البراندات المتاحة: ${ctx.brands.join(' | ') || '—'}`,
      '',
      'نص المستخدم:',
      text,
    ].join('\n');
    const result = await this.model.generateContent(prompt);
    return JSON.parse(result.response.text()) as GeminiProduct;
  }
}
