// Frontend/payment-management-system/src/app/components/add-payment/add-payment.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PaymentService } from '../../services/payment.service';
import { CountryService } from '../../services/country.service';

@Component({
  selector: 'app-add-payment',
  templateUrl: './add-payment.component.html',
  styleUrls: ['./add-payment.component.css']
})
export class AddPaymentComponent implements OnInit {
  paymentForm!: FormGroup;
  isLoading = false;
  selectedFile: File | null = null;
  countries: any[] = [];
  states: any[] = [];
  cities: any[] = [];
  filteredCountries: any[] = [];
  countryFilterCtrl: FormControl = new FormControl();
  statuses = ['pending', 'due_now', 'overdue'];

  constructor(
    private fb: FormBuilder,
    private paymentService: PaymentService,
    private router: Router,
    private snackBar: MatSnackBar,
    private countryService: CountryService
  ) {
  }

  ngOnInit(): void {
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
      payee_phone_number: ['', [Validators.required, Validators.pattern(/^\+\d{1,3}\d{9,15}$/)]],
      payee_payment_status: ['', [Validators.required]],
      payee_added_date_utc: [new Date().toISOString(), [Validators.required]],
      payee_due_date: ['', [Validators.required]],
      currency: ['USD', [Validators.required]],
      discount_percent: [null],
      tax_percent: [null],
      due_amount: ['', [Validators.required, Validators.min(0)]],
    });

    this.countryService.getCountries().subscribe((data: any) => {
      this.countries = data.data;
      this.filteredCountries = this.countries;

      this.countryFilterCtrl.valueChanges.subscribe(value => {
        this.filteredCountries = this._filterCountries(value);
      });
    });
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

    this.countryService.getStates(country).subscribe((data: any) => {
      this.states = data.data.states;
    });
  }

  onStateSelect(event: any) {
    const state = event.value;
    this.paymentForm.get('payee_city')?.setValue('');
    this.cities = [];

    const selectedCountry = this.paymentForm.get('payee_country')?.value;
    this.countryService.getCities(selectedCountry, state).subscribe((data: any) => {
      this.cities = data.data;
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