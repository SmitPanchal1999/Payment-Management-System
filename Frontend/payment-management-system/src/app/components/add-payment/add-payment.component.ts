// Frontend/payment-management-system/src/app/components/add-payment/add-payment.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PaymentService } from '../../services/payment.service';

@Component({
  selector: 'app-add-payment',
  templateUrl: './add-payment.component.html',
  styleUrls: ['./add-payment.component.css']
})
export class AddPaymentComponent implements OnInit {
  paymentForm!: FormGroup;
  isLoading = false;
  selectedFile: File | null = null;
  countries = [
    { code: 'US', name: 'United States' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'IT', name: 'Italy' },
    { code: 'ES', name: 'Spain' },
    { code: 'JP', name: 'Japan' },
    { code: 'CN', name: 'China' },
    { code: 'IN', name: 'India' },
    { code: 'BR', name: 'Brazil' },
    { code: 'MX', name: 'Mexico' },
    { code: 'RU', name: 'Russia' },
    { code: 'ZA', name: 'South Africa' },
    { code: 'SG', name: 'Singapore' },
    { code: 'NZ', name: 'New Zealand' },
    { code: 'AE', name: 'United Arab Emirates' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'SE', name: 'Sweden' }
  ];
  statuses = ['pending', 'due_now', 'overdue'];

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
      payee_address_line_1: ['', [Validators.required]],
      payee_address_line_2: [''],
      payee_city: ['', [Validators.required]],
      payee_country: ['', [Validators.required]],
      payee_province_or_state: [''],
      payee_postal_code: ['', [Validators.required]],
      payee_phone_number: ['', [Validators.required, Validators.pattern(/^\+\d{1,3}\d{9,15}$/)]],
      payee_payment_status: ['', [Validators.required]],
      payee_added_date_utc: [new Date().toISOString(), [Validators.required]],
      payee_due_date: ['', [Validators.required]],
      currency: ['USD', [Validators.required]],
      discount_percent: [null],
      tax_percent: [null],
      due_amount: ['', [Validators.required, Validators.min(0)]],
    });

    
  }

  async onSubmit(): Promise<void> {
    if (this.isFormValid()) {
      this.isLoading = true;
      const formValue = this.paymentForm.value;

      // Create a plain object for the payment
      const paymentData = {
        ...formValue// Include the selected file if present
      };

      try {
        // Send the plain object to the payment service
        await this.paymentService.createPayment(paymentData).toPromise();
        this.snackBar.open('Payment created successfully', 'Close', { duration: 3000 });
        this.router.navigate(['/payments']);
      } catch (error: any) {
        let errorMessage = 'Error creating payment';
        if (error.error?.detail) {
          errorMessage += ': ' + error.error.detail;
        }
        this.snackBar.open(errorMessage, 'Close', { duration: 3000 });
      } finally {
        this.isLoading = false;
      }
    }
  }

  isFormValid(): boolean {
    const isBasicFormValid = this.paymentForm.valid;
  

    return isBasicFormValid;
  }
}