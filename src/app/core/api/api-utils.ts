/** Helpers to normalize Postman / ASP.NET payloads (camelCase or PascalCase). */

export function pick<T = unknown>(obj: Record<string, unknown> | null | undefined, ...keys: string[]): T | undefined {
  if (!obj) return undefined;
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null) return obj[key] as T;
    const lower = key.charAt(0).toLowerCase() + key.slice(1);
    if (obj[lower] !== undefined && obj[lower] !== null) return obj[lower] as T;
    const upper = key.charAt(0).toUpperCase() + key.slice(1);
    if (obj[upper] !== undefined && obj[upper] !== null) return obj[upper] as T;
  }
  return undefined;
}

export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

export function unwrapList(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload.map(asRecord);
  if (!payload || typeof payload !== 'object') return [];

  const obj = asRecord(payload);
  const nested = pick<unknown>(
    obj,
    'data',
    'Data',
    'items',
    'Items',
    'result',
    'Result',
    'value',
    'Value',
    'lists',
    'Lists',
    'materialLists',
    'MaterialLists',
    'rows',
    'Rows'
  );

  if (Array.isArray(nested)) return nested.map(asRecord);
  if (nested && typeof nested === 'object') return unwrapList(nested);

  return [];
}

export function unwrapItem(payload: unknown): Record<string, unknown> {
  const obj = asRecord(payload);
  const nested = pick<unknown>(obj, 'data', 'Data', 'result', 'Result', 'value', 'Value');
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) return asRecord(nested);
  return obj;
}

const LABEL_KEYS = [
  'nameAr',
  'NameAr',
  'fullName',
  'FullName',
  'displayName',
  'DisplayName',
  'productName',
  'ProductName',
  'companyName',
  'CompanyName',
  'customerName',
  'CustomerName',
  'userName',
  'UserName',
  'titleAr',
  'TitleAr',
  'name',
  'Name',
  'title',
  'Title',
  'label',
  'Label',
  'trackingNumber',
  'TrackingNumber',
  'number',
  'Number',
  'code',
  'Code',
];

/** اسم ظاهر من سترنج أو كائن/مصفوفة جاية من الـ API */
export function labelOf(value: unknown, fallback = ''): string {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'string') return value.trim() || fallback;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    const parts = value.map((item) => labelOf(item)).filter((part) => part && part !== fallback);
    return parts.length ? parts.join(' · ') : fallback;
  }
  if (typeof value === 'object') {
    const rec = asRecord(value);
    const nestedList = rec['$values'];
    if (Array.isArray(nestedList)) return labelOf(nestedList, fallback);
    const nested = pick(rec, ...LABEL_KEYS);
    if (nested !== undefined && nested !== null && typeof nested !== 'object') {
      const text = String(nested).trim();
      return text && text !== '[object Object]' ? text : fallback;
    }
    if (nested && typeof nested === 'object') return labelOf(nested, fallback);
    return fallback;
  }
  const text = String(value);
  return text === '[object Object]' ? fallback : text;
}

export function str(value: unknown, fallback = ''): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value || fallback;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object') return labelOf(value, fallback);
  const text = String(value);
  return text === '[object Object]' ? fallback : text;
}

export function num(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function bool(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === 'True' || value === 1 || value === '1') return true;
  if (value === 'false' || value === 'False' || value === 0 || value === '0') return false;
  return fallback;
}

const ACCOUNT_HANDLES = new Set([
  'admin',
  'administrator',
  'superadmin',
  'mimaradmin',
  'mimoradmin',
  'staff',
  'agent',
  'csr',
  'support',
  'system',
  'employee',
  'customerservice',
  'customersupport',
  'backoffice',
  'خدمةالعملاء',
  'موظفخدمةالعملاء',
  'موظفغيرمحدد',
]);

/** يوزرنيم/رول مش اسم شخص ظاهر */
export function isAccountHandle(value: string): boolean {
  const v = value.trim();
  if (!v || v === '—' || v === 'خدمة العملاء' || v === 'موظف خدمة العملاء' || v === 'موظف غير محدد') {
    return true;
  }
  const compact = v.toLowerCase().replace(/[\s._-]/g, '');
  if (ACCOUNT_HANDLES.has(compact)) return true;
  if (/^[^\s]+admin$/i.test(v)) return true;
  if (v.includes('@')) return true;
  if (/^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(v)) return true;
  if (/^\d{6,}$/.test(v)) return true;
  return false;
}

/** اسم شخص حقيقي من سترنج أو كائن مستخدم (يتجاهل الـ username) */
export function displayPersonName(...values: unknown[]): string {
  for (const value of values) {
    if (value == null || value === '') continue;
    if (typeof value === 'object') {
      const rec = asRecord(value);
      const first = str(
        pick(rec, 'firstName', 'FirstName', 'givenName', 'GivenName', 'firstNameAr', 'FirstNameAr')
      );
      const last = str(
        pick(rec, 'lastName', 'LastName', 'familyName', 'FamilyName', 'lastNameAr', 'LastNameAr')
      );
      const composed = [first, last].filter(Boolean).join(' ').trim();
      const nested = displayPersonName(
        composed,
        pick(rec, 'fullName', 'FullName', 'displayName', 'DisplayName', 'nameAr', 'NameAr'),
        pick(rec, 'name', 'Name')
      );
      if (nested) return nested;
      continue;
    }
    const text = str(value);
    if (text && text !== '—' && !isAccountHandle(text)) return text;
  }
  return '';
}
