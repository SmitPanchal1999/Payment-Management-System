import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentService } from '../../services/payment.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Payment } from '../../models/payment.model';

@Component({
  selector: 'app-upload-evidence',
  templateUrl: './upload-evidence.component.html',
  styleUrls: ['./upload-evidence.component.css']
})
export class UploadEvidenceComponent implements OnInit {
  payment: Payment | null = null;
  paymentId: string = '';
  selectedFile: File | null = null;
  isLoading = false;
  hasEvidence = false;

  constructor(
    private paymentService: PaymentService,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.paymentId = this.route.snapshot.params['id'];
    this.loadPayment();
  }

  loadPayment(): void {
    this.isLoading = true;
    this.paymentService.getPaymentById(this.paymentId).subscribe({
      next: (payment) => {
        this.payment = payment;
        this.hasEvidence = !!payment.evidence_file_id;
        this.isLoading = false;
      },
      error: (error) => {
        this.snackBar.open('Error loading payment', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        this.snackBar.open('Please upload only JPG, PNG or PDF files', 'Close', { duration: 3000 });
        return;
      }
      this.selectedFile = file;
    }
  }

  uploadEvidence(): void {
    if (!this.selectedFile) {
      this.snackBar.open('Please select a file first', 'Close', { duration: 3000 });
      return;
    }

    this.isLoading = true;
    this.paymentService.uploadEvidence(this.paymentId, this.selectedFile).subscribe({
      next: () => {
        this.snackBar.open('Evidence uploaded successfully', 'Close', { duration: 3000 });
        this.selectedFile = null;
        this.loadPayment();
      },
      error: (error) => {
        this.snackBar.open('Error uploading evidence', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  downloadEvidence(): void {
    if (!this.payment?.evidence_file_id) {
      this.snackBar.open('No evidence file available', 'Close', { duration: 3000 });
      return;
    }

    this.isLoading = true;
    this.paymentService.downloadEvidence(this.paymentId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payment_evidence_${this.paymentId}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.isLoading = false;
      },
      error: (error) => {
        this.snackBar.open('Error downloading evidence', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }
}
