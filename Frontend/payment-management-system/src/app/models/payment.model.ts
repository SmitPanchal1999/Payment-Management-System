export interface Payment {
    _id: string;
    payee_first_name: string;
    payee_last_name: string;
    payee_payment_status: 'completed' | 'due_now' | 'overdue' | 'pending';
    payee_added_date_utc: string;
    payee_due_date: string;
    payee_address_line_1: string;
    payee_address_line_2?: string;
    payee_city: string;
    payee_country: string;
    payee_province_or_state?: string;
    payee_postal_code: string;
    payee_phone_number: string;
    payee_email: string;
    currency: string;
    discount_percent?: number;
    tax_percent?: number;
    due_amount: number;
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