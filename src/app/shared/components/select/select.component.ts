import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewChild,
  forwardRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SelectOption {
  label: string;
  value: string | number;
  /** مستوى التداخل في القوائم الشجرية (0 = رئيسي) */
  depth?: number;
  /** النص اللي يظهر في الزرار بعد الاختيار لو مختلف عن label */
  display?: string;
  hint?: string;
  /** يظهر كعنوان مجموعة ومينفعش يتختار */
  disabled?: boolean;
}

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
})
export class SelectComponent implements ControlValueAccessor {
  @Input() options: SelectOption[] = [];
  @Input() placeholder = 'اختر...';
  @Input() disabled = false;
  @Input() searchable = false;
  @Output() selectionChange = new EventEmitter<string | number | null>();

  @ViewChild('trigger') triggerRef?: ElementRef<HTMLButtonElement>;

  open = false;
  value: string | number | null = null;
  menuStyle: Record<string, string> = {};
  query = '';
  expanded = new Set<string | number>();
  private parentsCache?: { source: SelectOption[]; set: Set<string | number> };

  private onChange: (v: string | number | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor(private host: ElementRef<HTMLElement>) {}

  get selectedLabel(): string {
    const found = this.options.find((o) => o.value === this.value);
    return found ? found.display || found.label : this.placeholder;
  }

  get hasTree(): boolean {
    return !this.query.trim() && this.options.some((o) => (o.depth || 0) > 0);
  }

  /** الفروع بتظهر بس لو كل الآباء مفتوحين */
  get visibleOptions(): SelectOption[] {
    const q = this.query.trim().toLowerCase();
    if (!q) {
      if (!this.hasTree) return this.options;
      const out: SelectOption[] = [];
      const path: (string | number)[] = [];
      for (const o of this.options) {
        const depth = o.depth || 0;
        path.length = depth;
        if (path.every((v) => this.expanded.has(v))) out.push(o);
        path[depth] = o.value;
      }
      return out;
    }
    return this.options
      .filter((o) => !o.disabled && `${o.display || ''} ${o.label} ${o.hint || ''}`.toLowerCase().includes(q))
      .map((o) => ({ ...o, depth: 0, label: o.display || o.label }));
  }

  isParent(option: SelectOption): boolean {
    if (this.parentsCache?.source !== this.options) {
      const set = new Set<string | number>();
      this.options.forEach((o, i) => {
        const next = this.options[i + 1];
        if (next && (next.depth || 0) > (o.depth || 0)) set.add(o.value);
      });
      this.parentsCache = { source: this.options, set };
    }
    return this.parentsCache.set.has(option.value);
  }

  isExpanded(option: SelectOption): boolean {
    return this.expanded.has(option.value);
  }

  toggleExpand(option: SelectOption): void {
    if (this.expanded.has(option.value)) this.expanded.delete(option.value);
    else this.expanded.add(option.value);
  }

  onOptionClick(option: SelectOption): void {
    if (option.disabled) {
      if (this.isParent(option) && this.hasTree) this.toggleExpand(option);
      return;
    }
    this.choose(option);
  }

  private expandToSelected(): void {
    const index = this.options.findIndex((o) => o.value === this.value);
    if (index < 0) return;
    let depth = this.options[index].depth || 0;
    for (let i = index - 1; i >= 0 && depth > 0; i--) {
      const d = this.options[i].depth || 0;
      if (d < depth) {
        this.expanded.add(this.options[i].value);
        depth = d;
      }
    }
  }

  get hasValue(): boolean {
    return this.value !== null && this.value !== undefined && this.value !== '';
  }

  toggle(): void {
    if (this.disabled) return;
    this.open = !this.open;
    if (this.open) {
      this.query = '';
      this.expandToSelected();
      this.updateMenuPosition();
      if (this.searchable) {
        setTimeout(() => this.host.nativeElement.querySelector<HTMLInputElement>('.select-search input')?.focus());
      }
    } else {
      this.onTouched();
    }
  }

  choose(option: SelectOption): void {
    if (option.disabled) return;
    this.value = option.value;
    this.onChange(this.value);
    this.selectionChange.emit(this.value);
    this.open = false;
    this.onTouched();
  }

  writeValue(value: string | number | null): void {
    this.value = value;
  }

  registerOnChange(fn: (v: string | number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  private updateMenuPosition(): void {
    const el = this.triggerRef?.nativeElement ?? this.host.nativeElement.querySelector('.select-trigger');
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < 260 && rect.top > spaceBelow;
    const maxH = Math.min(320, openUp ? rect.top - 16 : spaceBelow - 16);
    const width = Math.min(Math.max(rect.width, 240), window.innerWidth - 16);
    const left = Math.min(Math.max(8, rect.right - width), window.innerWidth - width - 8);

    this.menuStyle = {
      position: 'fixed',
      left: `${left}px`,
      width: `${width}px`,
      maxHeight: `${Math.max(140, maxH)}px`,
      zIndex: '120',
      ...(openUp
        ? { bottom: `${window.innerHeight - rect.top + 6}px`, top: 'auto' }
        : { top: `${rect.bottom + 6}px`, bottom: 'auto' }),
    };
  }

  @HostListener('window:resize')
  @HostListener('window:scroll')
  onViewportChange(): void {
    if (this.open) this.updateMenuPosition();
  }

  @HostListener('document:click', ['$event'])
  onDocClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      if (this.open) {
        this.open = false;
        this.onTouched();
      }
    }
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.open) {
      this.open = false;
      this.onTouched();
    }
  }
}
