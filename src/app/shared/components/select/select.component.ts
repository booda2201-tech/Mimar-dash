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

  get visibleOptions(): SelectOption[] {
    const q = this.query.trim().toLowerCase();
    if (!q) return this.options;
    return this.options
      .filter((o) => `${o.display || ''} ${o.label} ${o.hint || ''}`.toLowerCase().includes(q))
      .map((o) => ({ ...o, depth: 0, label: o.display || o.label }));
  }

  get hasValue(): boolean {
    return this.value !== null && this.value !== undefined && this.value !== '';
  }

  toggle(): void {
    if (this.disabled) return;
    this.open = !this.open;
    if (this.open) {
      this.query = '';
      this.updateMenuPosition();
      if (this.searchable) {
        setTimeout(() => this.host.nativeElement.querySelector<HTMLInputElement>('.select-search input')?.focus());
      }
    } else {
      this.onTouched();
    }
  }

  choose(option: SelectOption): void {
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
    const maxH = Math.min(256, openUp ? rect.top - 16 : spaceBelow - 16);

    this.menuStyle = {
      position: 'fixed',
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      maxHeight: `${Math.max(120, maxH)}px`,
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
