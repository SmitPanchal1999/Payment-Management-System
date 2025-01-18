import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentService } from '../../services/payment.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Payment } from '../../models/payment.model';
import { CountryService } from '../../services/country.service';
import { Observable } from 'rxjs';
import { startWith, map } from 'rxjs/operators';

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
  countries: any[] = [];
  states: any[] = [];
  cities: any[] = [];
  filteredCountries: any[] = [];
  countryFilterCtrl: FormControl = new FormControl();

  constructor(
    private fb: FormBuilder,
    private paymentService: PaymentService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private countryService: CountryService
  ) {
    this.createForm();
  }

  ngOnInit(): void {
    this.paymentId = this.route.snapshot.params['id'];
    this.loadPayment();
    console.log("countries");
    this.countryService.getCountries().subscribe((data: any) => {
      console.log("data", data);
      this.countries = data.data;
      this.filteredCountries = this.countries;

      this.countryFilterCtrl.valueChanges.subscribe(value => {
        this.filteredCountries = this._filterCountries(value);
      });
    });
    console.log("filteredCountries", this.filteredCountries);
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
      payee_province_or_state: ['', [Validators.required]],
      payee_postal_code: ['', [Validators.required]],
      payee_phone_number: ['', [Validators.required]],
      payee_payment_status: ['', [Validators.required]],
      payee_added_date_utc: [new Date().toISOString(), [Validators.required]],
      payee_due_date: ['', [Validators.required]],
      currency: ['USD', [Validators.required]],
      discount_percent: [null],
      tax_percent: [null],
      due_amount: ['', [Validators.required, Validators.min(0)]],
      payee_payment_status_completed: ['no', [Validators.required]],
      countryFilterCtrl: [''],
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
        this.countryService.getStates(payment.payee_country).subscribe(data => {
          this.states = data.data.states;
        });
        this.countryService.getCities(payment.payee_country, payment.payee_province_or_state).subscribe(data => {
          this.cities = data.data;
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
    if (this.paymentForm.valid) {
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
    } else {
      // Mark all controls as touched to show validation errors
      this.paymentForm.markAllAsTouched();
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

  private _filterCountries(value: string): any[] {
    const filterValue = value.toLowerCase();
    return this.countries.filter(country => country.name.toLowerCase().includes(filterValue));
  }

  onCountrySelect(event: any) {
    const country = event.value;
    this.paymentForm.get('payee_province_or_state')?.setValue('');
    this.paymentForm.get('payee_city')?.setValue('');
    this.states = [];
    this.cities = [];

    this.countryService.getStates(country).subscribe(data => {
      this.states = data.data.states;
    });
  }

  onStateSelect(event: any) {
    const state = event.value;
    this.cities = [];

    this.countryService.getCities(this.paymentForm.get('payee_country')?.value, state).subscribe(data => {
      this.cities = data.data;
    });
  }
}

