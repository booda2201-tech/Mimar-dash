import { CommonModule } from '@angular/common';
import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-image-dropzone',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ImageDropzoneComponent),
      multi: true,
    },
  ],
  templateUrl: './image-dropzone.component.html',
  styleUrls: ['./image-dropzone.component.scss'],
})
export class ImageDropzoneComponent implements ControlValueAccessor {
  @Input() label = 'صورة';
  @Input() hint = 'اسحب الصورة هنا أو اضغط للاختيار';
  @Input() accept = 'image/*';
  @Input() maxSizeMb = 5;

  value = '';
  dragging = false;
  disabled = false;
  error = '';

  private onChange: (v: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    this.value = value || '';
  }

  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.disabled) this.dragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragging = false;
    if (this.disabled) return;
    const file = event.dataTransfer?.files?.[0];
    if (file) this.readFile(file);
  }

  onFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.readFile(file);
    input.value = '';
  }

  clear(event?: Event): void {
    event?.stopPropagation();
    this.error = '';
    this.value = '';
    this.onChange('');
    this.onTouched();
  }

  private readFile(file: File): void {
    this.error = '';
    if (!file.type.startsWith('image/')) {
      this.error = 'الملف يجب أن يكون صورة';
      return;
    }
    const maxBytes = this.maxSizeMb * 1024 * 1024;
    if (file.size > maxBytes) {
      this.error = `الحد الأقصى ${this.maxSizeMb} ميجابايت`;
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        this.value = reader.result;
        this.onChange(this.value);
        this.onTouched();
      }
    };
    reader.readAsDataURL(file);
  }
}
