import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import { PaymentService } from '../../services/payment.service';
import { Payment } from '../../models/payment.model';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-view-payment',
  templateUrl: './view-payment.component.html',
  styleUrls: ['./view-payment.component.css']
})
export class ViewPaymentComponent implements OnInit {
  paymentForm!: FormGroup;
  payment!: Payment;
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private paymentService: PaymentService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const paymentId = this.route.snapshot.paramMap.get('id');
    if (paymentId) {
      this.loadPaymentDetails(paymentId);
    }
  }

  loadPaymentDetails(id: string) {
    this.isLoading = true;
    this.paymentService.getPaymentById(id).subscribe({
      next: (response) => {
        this.payment = response;
        this.initializeForm(); // Initialize the form with payment data
        this.isLoading = false;
      },
      error: (error) => {
        this.snackBar.open('Error loading payment details: ' + error.message, 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  initializeForm() {
    this.paymentForm = this.fb.group({
      payee_first_name: [this.payment.payee_first_name],
      payee_last_name: [this.payment.payee_last_name],
      payee_payment_status: [this.payment.payee_payment_status],
      payee_added_date_utc: [this.payment.payee_added_date_utc],
      payee_due_date: [this.payment.payee_due_date],
      payee_address_line_1: [this.payment.payee_address_line_1],
      payee_address_line_2: [this.payment.payee_address_line_2],
      payee_city: [this.payment.payee_city],
      payee_country: [this.payment.payee_country],
      payee_province_or_state: [this.payment.payee_province_or_state],
      payee_postal_code: [this.payment.payee_postal_code],
      payee_phone_number: [this.payment.payee_phone_number],
      payee_email: [this.payment.payee_email],
      currency: [this.payment.currency],
      discount_percent: [this.payment.discount_percent],
      tax_percent: [this.payment.tax_percent],
      due_amount: [this.payment.due_amount],
      total_due: [this.payment.total_due],
      evidence_file_id: [this.payment.evidence_file_id]
    });
  }

  downloadEvidence() {
    if (this.payment.evidence_file_id && this.payment.payee_payment_status === 'completed') {
      this.paymentService.downloadEvidence(this.payment._id).subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = this.payment.evidence_file_id || 'evidence_file';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        },
        error: (error) => {
          this.snackBar.open('Error downloading evidence: ' + error.message, 'Close', { duration: 3000 });
        }
      });
    } else {
      this.snackBar.open('No evidence file available for this payment or status is not completed.', 'Close', { duration: 3000 });
    }
  }
}
