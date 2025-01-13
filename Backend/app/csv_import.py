import csv
import asyncio
import os
from io import StringIO
from decimal import Decimal
from payment_services import create_payment

# Function to get the dynamic file path
def get_file_path(file_name: str) -> str:
    return os.path.join(os.path.dirname(__file__), file_name)

async def import_csv_to_db(file_content: str):
    csv_data = StringIO(file_content)
    reader = csv.DictReader(csv_data)

    for row in reader:
        try:
            
            await create_payment(row)
            print(f"Inserted payment: {row}")
        except Exception as e:
            print(f"Error inserting payment: {e}")

def run_import(file_name: str):
    try:
        file_path = get_file_path(file_name)  # Get dynamic file path
        with open(file_path, "r") as file:
            content = file.read()
            asyncio.run(import_csv_to_db(content))
    except FileNotFoundError:
        print(f"File not found: {file_name}")
    except Exception as e:
        print(f"Error during CSV import: {e}")

if __name__ == "__main__":
    run_import("payment_information.csv")  # Use your CSV file name here
