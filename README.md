# Payment Management System

## Overview

This project is a Full Stack Web Development application designed to manage a list of payments and their attributes. It demonstrates the ability to create a functional CRUD application using Python with FastAPI for the backend and Angular for the frontend. The application allows users to perform various operations on payment records, including creating, updating, deleting, and viewing payment details.

## Table of Contents

- [Project Description](#project-description)
- [Specifications](#specifications)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Frontend Features](#frontend-features)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Project Description

This application was developed as part of a Full Stack Web Development exam. The goal was to create a basic functional CRUD application to manage payments, demonstrating skills in web development, problem-solving, and the ability to work under time constraints.

## Specifications

### I. Data Management

- **CSV File**: The application uses a CSV file (`payment_information.csv`) to initialize payment data. The schema includes:
  - `payee_first_name`: text
  - `payee_last_name`: text
  - `payee_payment_status`: text (completed, due_now, overdue, pending)
  - `payee_added_date_utc`: UTC timestamp
  - `payee_due_date`: date (YYYY-MM-DD)
  - `payee_address_line_1`: text (mandatory)
  - `payee_address_line_2`: text
  - `payee_city`: text (mandatory)
  - `payee_country`: text (mandatory, ISO 3166-1 alpha-2)
  - `payee_province_or_state`: text (optional)
  - `payee_postal_code`: text (mandatory)
  - `payee_phone_number`: text (mandatory, E.164)
  - `payee_email`: text (mandatory)
  - `currency`: text (mandatory, ISO 4217)
  - `discount_percent`: number (optional, percentage, 2 decimal points)
  - `tax_percent`: number (optional, percentage, 2 decimal points)
  - `due_amount`: number (mandatory, 2 decimal points)
  - `total_due`: calculated number (2 decimal points)

### II. Backend Development

- **Framework**: Built using Python 3+ and FastAPI.
- **Data Normalization**: Utilizes Pandas to normalize CSV data and save it into MongoDB.
- **File Upload**: Supports uploading evidence files (PDF, PNG, JPG) when the payment status is updated to "completed."
- **API Endpoints**:
  - `get_payments(...)`: Fetches payments with server-side calculations.
  - `update_payment(...)`: Updates a payment.
  - `delete_payment(...)`: Deletes a payment by ID.
  - `create_payment(...)`: Creates a new payment.
  - `upload_evidence(...)`: Allows uploading evidence files.
  - `download_evidence(...)`: Returns the uploaded evidence file.

### III. Frontend Development

- **Framework**: Built using Angular 15+.
- **User Interface**: Provides a Payment Management UI with features such as:
  - Search and filter payments.
  - Display total_due and valid payment status.
  - Seamless server-side pagination.
  - View and update payment details.
  - Upload evidence for completed payments.
  - Delete and add new payments.
- **External APIs**: Utilizes APIs for auto-complete fields for country, city, state, and currency.
- **UI Libraries**: Implements third-party libraries for UI elements (e.g., Material, PrimeNG, ng-bootstrap).

### IV. Deployment

- The application is deployed to a cloud hosting solution (e.g., Heroku, Azure, AWS) or can be shared using ngrok.
- The code is pushed to a public GitHub repository.

## Technologies Used

- **Backend**: Python, FastAPI, MongoDB, Pandas
- **Frontend**: Angular 15+, HTML, CSS, TypeScript
- **Libraries**: Angular Material, Axios (for HTTP requests), and others as needed.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/payment-management-system.git
   cd payment-management-system
   ```

2. Install backend dependencies:
   ```bash
   cd Backend
   pip install -r requirements.txt
   ```

3. Install frontend dependencies:
   ```bash
   cd Frontend
   npm install
   ```

4. Set up your MongoDB database and update the connection string in the backend configuration.

## Usage

1. Start the backend server:
   ```bash
   cd Backend
   uvicorn main:app --reload
   ```

2. Start the frontend application:
   ```bash
   cd Frontend
   ng serve
   ```

3. Open your browser and navigate to `http://localhost:4200` to access the application.

## API Endpoints

- **GET /payments**: Fetch payments with optional filters, search, and pagination.
- **POST /payments**: Create a new payment.
- **PUT /payments/{id}**: Update an existing payment.
- **DELETE /payments/{id}**: Delete a payment by ID.
- **POST /payments/upload**: Upload evidence files.
- **GET /payments/download/{id}**: Download the uploaded evidence file.

## Frontend Features

- Search and filter payments.
- Display total_due and valid payment status.
- Seamless pagination.
- View, update, and delete payments.
- Upload evidence for completed payments.

## Deployment

- The application is deployed on [Heroku/AWS/Azure] (insert your deployment link here).
- The GitHub repository can be found at [GitHub Repository](https://github.com/yourusername/payment-management-system).

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any suggestions or improvements.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.