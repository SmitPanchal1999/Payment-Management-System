import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PaymentService } from '../../services/payment.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-add-payment',
  templateUrl: './add-payment.component.html',
  styleUrls: ['./add-payment.component.css']
})
export class AddPaymentComponent implements OnInit {
  paymentForm!: FormGroup;
  isLoading = false;

  countries = ['USA', 'UK', 'Canada', 'Australia', 'India']; // Add more as needed

  constructor(
    private fb: FormBuilder,
    private paymentService: PaymentService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.createForm();
  }

  ngOnInit(): void {}

  createForm(): void {
    this.paymentForm = this.fb.group({
      payee_first_name: ['', [Validators.required]],
      payee_last_name: ['', [Validators.required]],
      payee_email: ['', [Validators.required, Validators.email]],
      payee_address: ['', [Validators.required]],
      payee_city: ['', [Validators.required]],
      payee_country: ['', [Validators.required]],
      payee_due_date: ['', [Validators.required]],
      due_amount: ['', [Validators.required, Validators.min(0)]],
      discount_percent: [0, [Validators.min(0), Validators.max(100)]],
      tax_percent: [0, [Validators.min(0), Validators.max(100)]],
      payee_payment_status: ['pending']
    });
  }

  onSubmit(): void {
    if (this.paymentForm.valid) {
      this.isLoading = true;
      this.paymentService.createPayment(this.paymentForm.value).subscribe({
        next: () => {
          this.snackBar.open('Payment created successfully', 'Close', { duration: 3000 });
          this.router.navigate(['/payments']);
        },
        error: (error) => {
          this.snackBar.open('Error creating payment: ' + error.message, 'Close', { duration: 3000 });
          this.isLoading = false;
        }
      });
    }
  }
}
