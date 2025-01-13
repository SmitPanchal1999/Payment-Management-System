export interface Payment {
    _id?: string;
    payee_first_name: string;
    payee_last_name: string;
    payee_email: string;
    payee_address: string;
    payee_city: string;
    payee_country: string;
    payee_due_date: string;
    payee_payment_status: 'pending' | 'due_now' | 'completed' | 'overdue';
    due_amount: number;
    discount_percent?: number;
    tax_percent?: number;
    total_due?: number;
    evidence_file_id?: string;
}

export interface PaymentResponse {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    payments: Payment[];
} 