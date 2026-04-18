import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PagosService } from '../../services/pagos.service';

@Component({
  selector: 'app-confirmar-pago',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './confirmar-pago.component.html',
  styleUrls: ['./confirmar-pago.component.css']
})
export class ConfirmarPagoComponent {
  private pagosService = inject(PagosService);

  @Input() solicitudId: string = '';
  @Input() clienteNombre: string = '';
  @Input() vehiculoInfo: string = '';
  @Output() onConfirmar = new EventEmitter<any>();
  @Output() onCancelar = new EventEmitter<void>();

  monto: number = 0;
  loading = false;
  error: string = '';

  get comision(): number {
    return this.monto * 0.10;
  }

  get total(): number {
    return this.monto + this.comision;
  }

  validarMonto(): boolean {
    if (!this.monto || this.monto <= 0) {
      this.error = 'El monto debe ser mayor a 0';
      return false;
    }
    this.error = '';
    return true;
  }

  confirmar() {
    if (!this.validarMonto()) return;

    this.loading = true;
    console.log('📤 Enviando confirmación de pago:', {
      solicitudId: this.solicitudId,
      monto: this.monto,
      comision: this.comision,
      total: this.total
    });

    this.pagosService.confirmarPago(this.solicitudId, this.monto).subscribe({
      next: (response) => {
        console.log('✅ Confirmación de pago exitosa:', response);
        this.loading = false;
        this.onConfirmar.emit({
          solicitudId: this.solicitudId,
          monto: this.monto,
          comision: this.comision,
          total: this.total,
          response
        });
      },
      error: (err) => {
        console.error('❌ Error al confirmar pago:', err);
        this.loading = false;
        this.error = err.error?.detail || 'Error al confirmar el pago';
      }
    });
  }

  cancelar() {
    this.onCancelar.emit();
  }
}
