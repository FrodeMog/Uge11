import os
import pandas as pd
import requests
from tqdm import tqdm
import urllib.request
import socket
from openpyxl import load_workbook

def load_data(file, start=0, nrows=None):
    # Load the workbook
    workbook = load_workbook(filename=file, read_only=True)

    # Get the first worksheet
    worksheet = workbook.active

    # Get the first row (column headers)
    headers = [cell.value for cell in next(worksheet.iter_rows())]

    # Yield each row in the range
    for i, row in enumerate(worksheet.iter_rows(min_row=start+2, max_row=start+nrows+1 if nrows else None), start=start):  # start+2 because 1-based index and header row
        # Yield the row as a dictionary
        yield dict(zip(headers, (cell.value for cell in row)))



# Set a default timeout for all socket operations
socket.setdefaulttimeout(5)

def download_files(rows, folder='pdf-files'):
    # Create a folder to store the downloaded files
    if not os.path.exists(folder):
        os.makedirs(folder)

    # Initialize counters
    successful_downloads = 0
    failed_downloads = 0
    already_downloaded = 0

    # Process the rows
    for row in tqdm(rows, desc="Downloading files"):
        # Get the URLs
        urls = [row['Pdf_URL'], row['Report Html Address']]
        for url in urls:
            try:
                # Generate a unique filename
                filename = f'{url.split("/")[-1]}'

                # Check if the file already exists
                if os.path.exists(f'{folder}/{filename}'):
                    if filename.lower().endswith('.pdf'):
                        already_downloaded += 1
                    break

                # Check if the file is a .pdf
                if not filename.lower().endswith('.pdf'):
                    failed_downloads += 1
                    continue

                # Open the URL and read the first few bytes
                with urllib.request.urlopen(url, timeout=10) as u:
                    if not u.read(5).startswith(b'%PDF-'):
                        failed_downloads += 1
                        continue

                # Download the file
                urllib.request.urlretrieve(url, f'{folder}/{filename}')
                successful_downloads += 1
                break  # If the download was successful, break the loop and don't try the backup URL
            except (socket.timeout, Exception) as e:
                failed_downloads += 1
                continue  # If an error occurred, continue the loop and try the backup URL

    return successful_downloads, failed_downloads, already_downloaded

def main():
    print("Loading rows")
    rows = load_data(file='GRI_2017_2020.xlsx', start=0, nrows=20)
    successful_downloads, failed_downloads, already_downloaded = download_files(rows, folder='pdf-files')
    print(f"Successfully downloaded: {successful_downloads}")
    print(f"Already downloaded: {already_downloaded}")
    print(f"Failed to download: {failed_downloads}")

if __name__ == '__main__':
    main()