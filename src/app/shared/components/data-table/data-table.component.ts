import { Component, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableColumn } from '../../../core/models';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';

export type DataTableViewMode = 'cards' | 'table';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule, StatusBadgeComponent],
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss'],
})
export class DataTableComponent implements OnChanges {
  @Input() columns: TableColumn[] = [];
  @Input() data: Record<string, unknown>[] = [];
  @Input() loading = false;
  @Input() searchable = true;
  @Input() searchPlaceholder = 'بحث...';
  @Input() pageSize = 8;
  @Input() emptyTitle = 'لا توجد بيانات';
  @Input() emptyMessage = 'لم يتم العثور على نتائج مطابقة لبحثك.';
  @Input() emptyIcon = 'inbox';
  /** إظهار تاب كروت / جداول جنب البحث */
  @Input() viewToggle = false;
  @Input() defaultView: DataTableViewMode = 'table';
  @Input() selectedId: string | number | null = null;
  @Input() rowIdKey = 'id';
  @Input() statusLabels: Record<string, string> = {};
  @Input() editLabel = 'تعديل';
  @Input() editIcon = 'edit';
  @Input() deleteLabel = 'حذف';
  @Input() deleteIcon = 'delete';

  @Output() rowAction = new EventEmitter<{ action: string; row: Record<string, unknown> }>();
  @Output() rowClick = new EventEmitter<Record<string, unknown>>();

  searchTerm = '';
  sortKey = '';
  sortDir: 'asc' | 'desc' = 'asc';
  page = 1;
  viewMode: DataTableViewMode = 'table';
  menuOpenId: string | null = null;
  menuRow: Record<string, unknown> | null = null;
  menuStyle: Record<string, string> | null = null;

  filtered: Record<string, unknown>[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['defaultView'] || changes['viewToggle']) {
      this.viewMode = this.viewToggle ? this.defaultView : 'table';
    }
    if (changes['data']) {
      this.page = 1;
      this.closeMenu();
      this.apply();
    }
  }

  setView(mode: DataTableViewMode): void {
    if (this.viewMode === mode) return;
    this.viewMode = mode;
    this.page = 1;
    this.closeMenu();
  }

  apply(): void {
    let rows = [...(this.data || [])];
    const term = this.searchTerm.trim().toLowerCase();
    if (term) {
      rows = rows.filter((row) =>
        Object.values(row).some((v) => String(v ?? '').toLowerCase().includes(term))
      );
    }
    if (this.sortKey) {
      rows.sort((a, b) => {
        const av = a[this.sortKey];
        const bv = b[this.sortKey];
        if (av === bv) return 0;
        const cmp = av! > bv! ? 1 : -1;
        return this.sortDir === 'asc' ? cmp : -cmp;
      });
    }
    this.filtered = rows;
  }

  onSearch(): void {
    this.page = 1;
    this.apply();
  }

  sort(col: TableColumn): void {
    if (!col.sortable) return;
    if (this.sortKey === col.key) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = col.key;
      this.sortDir = 'asc';
    }
    this.apply();
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filtered.length / this.pageSize));
  }

  get paged(): Record<string, unknown>[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  prev(): void {
    if (this.page > 1) this.page--;
    this.closeMenu();
  }

  next(): void {
    if (this.page < this.totalPages) this.page++;
    this.closeMenu();
  }

  emit(action: string, row: Record<string, unknown>): void {
    this.closeMenu();
    this.rowAction.emit({ action, row });
  }

  rowKey(row: Record<string, unknown>): string {
    return String(row[this.rowIdKey] ?? '');
  }

  isMenuOpen(row: Record<string, unknown>): boolean {
    return this.menuOpenId === this.rowKey(row);
  }

  toggleMenu(event: Event, row: Record<string, unknown>): void {
    event.stopPropagation();
    event.preventDefault();
    const id = this.rowKey(row);
    if (this.menuOpenId === id) {
      this.closeMenu();
      return;
    }
    const el = event.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const menuW = 176;
    const menuH = 156;
    let left = rect.right - menuW;
    if (left < 8) left = 8;
    if (left + menuW > window.innerWidth - 8) left = window.innerWidth - menuW - 8;
    let top = rect.bottom + 8;
    if (top + menuH > window.innerHeight - 8) top = Math.max(8, rect.top - menuH - 8);
    this.menuOpenId = id;
    this.menuRow = row;
    this.menuStyle = {
      top: `${top}px`,
      left: `${left}px`,
    };
  }

  pickAction(action: string, event: Event): void {
    event.stopPropagation();
    const row = this.menuRow;
    this.closeMenu();
    if (row) this.rowAction.emit({ action, row });
  }

  closeMenu(): void {
    this.menuOpenId = null;
    this.menuRow = null;
    this.menuStyle = null;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMenu();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.closeMenu();
  }

  onRowClick(row: Record<string, unknown>): void {
    this.rowClick.emit(row);
  }

  isSelected(row: Record<string, unknown>): boolean {
    if (this.selectedId == null) return false;
    return String(row[this.rowIdKey] ?? '') === String(this.selectedId);
  }

  sourcePerson(row: Record<string, unknown>): string {
    const name = this.displayCell(row['createdBy']);
    if (name && name !== '—' && name !== 'خدمة العملاء' && name.toLowerCase() !== 'admin') return name;
    return row['source'] === 'admin' ? 'موظف غير محدد' : 'العميل من التطبيق';
  }

  displayCell(value: unknown): string {
    if (value == null || value === '') return '—';
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        const parts = value.map((item) => this.displayCell(item)).filter((item) => item && item !== '—');
        return parts.length ? parts.join(' · ') : '—';
      }
      const rec = value as Record<string, unknown>;
      const label =
        rec['nameAr'] ?? rec['fullName'] ?? rec['productName'] ?? rec['companyName'] ?? rec['name'] ?? rec['title'] ?? rec['label'];
      return label != null && `${label}` !== '' && `${label}` !== '[object Object]' ? String(label) : '—';
    }
    const text = String(value);
    return text === '[object Object]' ? '—' : text;
  }

  asCurrency(value: unknown): string {
    return Number(value || 0).toLocaleString('en-US') + ' ر.س';
  }

  asDate(value: unknown): string {
    if (value == null || value === '' || value === '—') return '—';
    const d = new Date(String(value));
    if (Number.isNaN(d.getTime())) return this.displayCell(value);
    return d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  asImage(value: unknown): string | null {
    if (typeof value === 'string' && value.trim()) return value;
    if (Array.isArray(value) && typeof value[0] === 'string' && value[0]) return value[0];
    return null;
  }

  rowImage(row: Record<string, unknown>): string | null {
    const fromCol = this.columns.find((c) => c.type === 'image');
    if (fromCol) return this.asImage(row[fromCol.key]);
    return this.asImage(row['image'] ?? row['images']);
  }

  rowStatus(row: Record<string, unknown>): string | null {
    const col = this.columns.find((c) => c.type === 'status');
    if (!col) return null;
    const v = row[col.key];
    return v != null && `${v}` !== '' ? String(v) : null;
  }

  get contentColumns(): TableColumn[] {
    return this.columns.filter((c) => c.type !== 'actions' && c.type !== 'image');
  }

  get cardColumns(): TableColumn[] {
    return this.contentColumns
      .filter(
        (c) =>
          c.type !== 'status' &&
          c.key !== 'sku' &&
          c.key !== 'name' &&
          c.key !== 'title' &&
          c.key !== 'code'
      )
      .slice(0, 3);
  }

  get cardStatColumns(): TableColumn[] {
    return this.cardColumns.filter((c) => c.key !== 'category');
  }

  rowCategory(row: Record<string, unknown>): string | null {
    const v = row['category'];
    return v != null && `${v}`.trim() && `${v}` !== '—' ? String(v) : null;
  }

  get hasActions(): boolean {
    return this.columns.some((c) => c.type === 'actions');
  }

  rowTitle(row: Record<string, unknown>): string {
    const nameCol =
      this.contentColumns.find((c) => c.key === 'name') ||
      this.contentColumns.find((c) => c.key === 'title') ||
      this.contentColumns[0];
    return nameCol ? this.displayCell(row[nameCol.key]) : '—';
  }

  get hasImageColumn(): boolean {
    return this.columns.some((c) => c.type === 'image');
  }

  rowInitial(row: Record<string, unknown>): string {
    const title = this.rowTitle(row);
    return title && title !== '—' ? title.trim().charAt(0) : '؟';
  }

  rowAmount(row: Record<string, unknown>): string | null {
    const col = this.contentColumns.find((c) => c.type === 'currency');
    return col ? this.asCurrency(row[col.key]) : null;
  }

  rowMeta(row: Record<string, unknown>): string {
    const titleCol =
      this.contentColumns.find((c) => c.key === 'name') ||
      this.contentColumns.find((c) => c.key === 'title') ||
      this.contentColumns[0];
    const subtitle = this.rowSubtitle(row);
    return this.contentColumns
      .filter((c) => c !== titleCol && c.type !== 'status' && c.type !== 'currency')
      .map((c) => {
        if (c.type === 'date') return this.asDate(row[c.key]);
        if (c.type === 'source') return this.sourcePerson(row);
        return this.displayCell(row[c.key]);
      })
      .filter((text) => text && text !== '—' && text !== subtitle)
      .slice(0, 2)
      .join(' · ');
  }

  rowSubtitle(row: Record<string, unknown>): string {
    const skuCol =
      this.contentColumns.find((c) => c.key === 'sku') ||
      this.contentColumns.find((c) => c.key === 'code');
    if (skuCol) return this.displayCell(row[skuCol.key]);
    const col = this.contentColumns.find((c) => c.key !== 'name' && c.key !== 'title');
    if (!col) return '';
    if (col.type === 'currency') return this.asCurrency(row[col.key]);
    if (col.type === 'date') return this.asDate(row[col.key]);
    return this.displayCell(row[col.key]);
  }
}
