import { MaterialList, Product, StatusType } from '../../core/models';

function pickProduct(products: Product[], index: number): Product | undefined {
  return products[index];
}

function item(
  products: Product[],
  index: number,
  quantity: number,
  fallbackName: string,
  unit: string,
  notes: string,
  fallbackPrice: number
) {
  const product = pickProduct(products, index);
  return {
    id: `DI-${index}-${quantity}`,
    productId: product?.id || `demo-${index}`,
    productName: product?.name || fallbackName,
    productSku: product?.sku && product.sku !== '—' ? product.sku : undefined,
    quantity,
    unit: product?.unit || unit,
    notes,
    price: product?.price || fallbackPrice,
  };
}

export function buildDemoMaterialLists(products: Product[] = []): MaterialList[] {
  return [
    {
      id: 'DEMO-1',
      name: 'تشطيب فيلا النرجس',
      nameEn: 'Al Narjis villa finishing',
      projectName: 'فيلا النرجس — الرياض',
      ownerName: 'محمود حسن',
      description: 'قائمة المقاول للتشطيبات الداخلية: سيراميك، دهانات، وأدوات تركيب.',
      status: 'active' as StatusType,
      shareToken: 'narjis-demo',
      createdAt: '2026-09-12T10:00:00Z',
      items: [
        item(products, 0, 80, 'سيراميك أرضيات', 'م²', 'دور أرضي وصالات', 95),
        item(products, 1, 24, 'دهان داخلي', 'جالون', 'لون أبيض مطفي', 180),
        item(products, 2, 12, 'أسمنت أبيض', 'كيس', 'لتركيب السيراميك', 45),
      ],
      itemsCount: 3,
    },
    {
      id: 'DEMO-2',
      name: 'هيكل عمارة العليا',
      nameEn: 'Al Olaya structure',
      projectName: 'عمارة العليا',
      ownerName: 'Sara Ali',
      description: 'مواد الهيكل والإنشاء حسب طلب العميل من التطبيق.',
      status: 'active' as StatusType,
      shareToken: 'olaya-demo',
      createdAt: '2026-09-20T08:30:00Z',
      items: [
        item(products, 3, 40, 'حديد تسليح 16 مم', 'طن', 'قواعد وأعمدة', 2800),
        item(products, 4, 200, 'أسمنت بورتلاندي', 'كيس', 'خرسانة مسلحة', 22),
        item(products, 5, 18, 'بلوك إسمنتي', 'طبلية', 'جدران خارجية', 250),
        item(products, 1, 6, 'عازل مائي', 'لفة', 'سطح المبنى', 90),
      ],
      itemsCount: 4,
    },
    {
      id: 'DEMO-3',
      name: 'صيانة مستودع الخرج',
      nameEn: 'Kharj warehouse maintenance',
      projectName: 'مستودع الخرج',
      ownerName: 'م. عبد الرحمن',
      description: 'قائمة جهّزتها خدمة العملاء للصيانة العاجلة، ومشتركة مع المقاول.',
      status: 'inactive' as StatusType,
      createdAt: '2026-08-28T14:15:00Z',
      items: [
        item(products, 2, 8, 'دهان أسطح', 'جالون', 'عزل حراري للسقف', 160),
        item(products, 0, 30, 'إضاءة كشاف', 'قطعة', 'استبدال التالف', 85),
      ],
      itemsCount: 2,
    },
  ].map((list) => ({ ...list, itemsCount: list.items.length }));
}

export function isDemoListId(id?: string): boolean {
  return !!id && id.startsWith('DEMO-');
}
