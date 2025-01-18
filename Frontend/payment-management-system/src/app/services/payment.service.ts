import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Payment } from '../models/payment.model';
import { tap, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = 'http://127.0.0.1:8000'; // Make sure this matches your backend URL

  constructor(private http: HttpClient) {}

  getPayments(page: number = 1, limit: number = 10, search?: string): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (search) {
      params = params.set('search', search);
    }

    return this.http.get(`${this.apiUrl}/payments`, { params });
  }

  getPaymentById(id: string): Observable<Payment> {
    console.log('Fetching payment with ID:', id);
    return this.http.get<Payment>(`${this.apiUrl}/payments/${id}`).pipe(
      tap({
        next: (response) => console.log('Payment details:', response),
        error: (error) => console.error('Error fetching payment:', error)
      })
    );
  }

  createPayment(payment: Payment): Observable<any> {
    return this.http.post(`${this.apiUrl}/payments`, payment);
  }

  updatePayment(id: string, data: any): Observable<any> {
    // If data is FormData, send it as is
    if (data instanceof FormData) {
      return this.http.put(`${this.apiUrl}/payments/${id}`, data);
    }
    // If regular JSON data, convert to FormData
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    return this.http.put(`${this.apiUrl}/payments/${id}`, formData);
  }

  deletePayment(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/payments/${id}`);
  }

  uploadEvidence(id: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/payments/${id}/upload_evidence`, formData);
  }

  importCsv(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/payments/import-csv`, formData);
  }

  downloadEvidence(paymentId: string): Observable<Blob> {
    console.log(`Attempting to download evidence for payment ID: ${paymentId}`);
    return this.http.get(`${this.apiUrl}/payments/${paymentId}/evidence/download`, {
      responseType: 'blob',
      observe: 'response'  // Get the full response to check headers
    }).pipe(
      tap({
        next: (response) => {
          console.log('Evidence download response:', response);
          console.log('Content-Type:', response.headers.get('content-type'));
          console.log('Content-Disposition:', response.headers.get('content-disposition'));
        },
        error: (error) => {
          console.error('Error downloading evidence:', error);
          throw error;
        }
      }),
      map(response => response.body as Blob)
    );
  }
}
