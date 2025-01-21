import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Payment } from '../../models/payment.model';
import { PaymentService } from '../../services/payment.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-payment-list',
  templateUrl: './payment-list.component.html',
  styleUrls: ['./payment-list.component.css']
})
export class PaymentListComponent implements OnInit {
  displayedColumns: string[] = [
    'payee_first_name',
    'payee_last_name',
    'payee_email',
    'payee_country',
    'payee_added_date_utc',
    'payee_due_date',
    'due_amount',
    'total_due',
    'payee_payment_status',
    'actions'
  ];
  
  dataSource: MatTableDataSource<Payment>;
  totalItems = 0;
  pageSize = 10;
  currentPage = 0;
  searchSubject = new Subject<string>();
  isLoading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private paymentService: PaymentService,
    private snackBar: MatSnackBar
  ) {
    this.dataSource = new MatTableDataSource<Payment>([]);
    
    // Setup search debounce
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.loadPayments(searchTerm);
    });
  }

  ngOnInit() {
    this.loadPayments();
    
  }
  ngAfterViewInit() {
    this.dataSource.sort = this.sort; // Assign the MatSort to the data source
  }
  loadPayments(search?: string) {
    this.isLoading = true;
    this.paymentService.getPayments(
      this.currentPage + 1,
      this.pageSize,
      search
    ).subscribe({
      next: (response) => {
        this.dataSource.data = response.payments;
        this.totalItems = response.total;
        this.isLoading = false;
      },
      error: (error) => {
        this.snackBar.open('Error loading payments: ' + error.message, 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  onSearch(event: Event) {
    const searchTerm = (event.target as HTMLInputElement).value;
    this.searchSubject.next(searchTerm);
  }

  onPageChange(event: any) {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    const searchInput = document.getElementById('search-input') as HTMLInputElement;
    if (!searchInput.value) {
      searchInput.value = '';
    }
    this.loadPayments(searchInput.value);
  }

  onImportCsv(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.isLoading = true;
      this.paymentService.importCsv(file).subscribe({
        next: (response) => {
          this.snackBar.open('CSV import successful', 'Close', { duration: 3000 });
          this.loadPayments();
          this.isLoading = false;
        },
        error: (error) => {
          this.snackBar.open('Error importing CSV: ' + error.message, 'Close', { duration: 3000 });
          this.isLoading = false;
        }
      });
    }
  }

  deletePayment(id: string) {
    if (confirm('Are you sure you want to delete this payment?')) {
      this.isLoading = true;
      this.paymentService.deletePayment(id).subscribe({
        next: () => {
          this.snackBar.open('Payment deleted successfully', 'Close', { duration: 3000 });
          this.loadPayments();
        },
        error: (error) => {
          this.snackBar.open('Error deleting payment: ' + error.message, 'Close', { duration: 3000 });
          this.isLoading = false;
        }
      });
    }
  }

  getStatusClass(status: string): string {
    return `status-${status.toLowerCase()}`;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    };
    return date.toLocaleString('en-US', options);
  }
}
