import { StatCardData } from '../models';

/** هياكل فاضية للرسوم — بدون أرقام وهمية */
export const DASHBOARD_STATS: StatCardData[] = [
  { title: 'المنتجات', value: 0, change: 'من الـ API', changeType: 'neutral', icon: 'inventory_2', animate: true },
  { title: 'البراندات', value: 0, change: 'من الـ API', changeType: 'neutral', icon: 'workspace_premium', animate: true },
  { title: 'الفئات', value: 0, change: 'من الـ API', changeType: 'neutral', icon: 'category', animate: true },
  { title: 'منتجات جديدة', value: 0, change: 'isNew', changeType: 'neutral', icon: 'new_releases', animate: true },
];

export const SALES_CHART_DATA = {
  labels: [] as string[],
  datasets: [
    {
      label: 'المبيعات',
      data: [] as number[],
      borderColor: '#0B4A3A',
      backgroundColor: 'rgba(11, 74, 58, 0.12)',
      fill: true,
      tension: 0.4,
    },
  ],
};

export const CATEGORY_CHART_DATA = {
  labels: [] as string[],
  datasets: [
    {
      data: [] as number[],
      backgroundColor: ['#0B4A3A', '#C8A24B', '#2D6A4F', '#95D5B2', '#D4A373', '#ADB5BD'],
      borderWidth: 0,
    },
  ],
};