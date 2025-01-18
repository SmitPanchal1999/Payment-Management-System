import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentService } from '../../services/payment.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Payment } from '../../models/payment.model';

@Component({
  selector: 'app-edit-payment',
  templateUrl: './edit-payment.component.html',
  styleUrls: ['./edit-payment.component.css']
})
export class EditPaymentComponent implements OnInit {
  paymentForm!: FormGroup;
  paymentStatus: string = 'pending';
  isLoading = false;
  paymentId!: string;
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

  constructor(
    private fb: FormBuilder,
    private paymentService: PaymentService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.createForm();
  }

  ngOnInit(): void {
    this.paymentId = this.route.snapshot.params['id'];
    this.loadPayment();
  }

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
      payee_phone_number: ['', [Validators.required]],
      payee_payment_status: ['', [Validators.required]],
      payee_added_date_utc: [new Date().toISOString(), [Validators.required]],
      payee_due_date: ['', [Validators.required]],
      currency: ['USD', [Validators.required]],
      discount_percent: [null],
      tax_percent: [null],
      due_amount: ['', [Validators.required, Validators.min(0)]],
      payee_payment_status_completed: ['no', [Validators.required]]
    });

    // Listen for status changes to handle evidence requirement
    this.paymentForm.get('payee_payment_status_completed')?.valueChanges.subscribe(status => {
      if (status === 'yes') {
        this.paymentForm.patchValue({ payee_payment_status: 'completed' });
        if(!this.selectedFile){
          this.snackBar.open('Evidence file is required for completed status', 'Close', { duration: 3000 });
        }
      }
      else{
        this.paymentForm.patchValue({ payee_payment_status: this.paymentStatus });
        this.selectedFile = null;
      }
    });
  }

  loadPayment(): void {
    this.isLoading = true;
    this.paymentService.getPaymentById(this.paymentId).subscribe({
      next: (payment: Payment) => {
        this.paymentForm.patchValue({
          ...payment,
          payee_due_date: new Date(payment.payee_due_date)
        });
        this.paymentStatus = payment.payee_payment_status;
        this.isLoading = false;
      },
      error: (error) => {
        this.snackBar.open('Error loading payment: ' + error.message, 'Close', { duration: 3000 });
        this.isLoading = false;
        this.router.navigate(['/payments']);
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  async onSubmit(): Promise<void> {
    if (this.isFormValid()) {
      this.isLoading = true;
      const formValue = this.paymentForm.value;
      
      try {
        const formData = new FormData();
        // Add form data as JSON string
        formData.append('data', JSON.stringify(formValue));
        
        // Add file if present and status is completed
        if (formValue.payee_payment_status === 'completed' && this.selectedFile) {
          formData.append('evidence_file', this.selectedFile);
        }
        
        await this.paymentService.updatePayment(this.paymentId, formData).toPromise();
        this.snackBar.open('Payment updated successfully', 'Close', { duration: 3000 });
        this.router.navigate(['/payments']);
      } catch (error: any) {
        let errorMessage = 'Error updating payment';
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
    const status = this.paymentForm.get('payee_payment_status')?.value;
    
    // If status is completed, evidence file is required
    if (status === 'completed' && !this.selectedFile) {
      return false;
    }

    return isBasicFormValid;
  }

  onStatusChange(event: any): void {
    if (event.checked) {
      this.paymentForm.patchValue({ payee_payment_status: 'completed' , is_completed: true});
    } else {
      this.paymentForm.patchValue({ payee_payment_status: null , is_completed: false});
    }
  }
}
