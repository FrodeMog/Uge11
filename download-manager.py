import os
import pandas as pd
import requests

def load_data(nrows):
    # Load the Excel file
    df = pd.read_excel('GRI_2017_2020.xlsx', header=0, nrows=nrows)

    # Get the 'Pdf_URL' column
    pdf_urls = df['Pdf_URL']

    return pdf_urls

def download_files(df):
    # Create a folder to store the downloaded files
    if not os.path.exists('pdf-files'):
        os.makedirs('pdf-files')

    # Download the files 
    for index, pdf_url in df.items():
        try:
            # Get the filename
            filename = pdf_url.split('/')[-1]
    
            # Download the file
            response = requests.get(pdf_url)
            with open(f'pdf-files/{filename}', 'wb') as file:
                file.write(response.content)
    
            print(f'{filename} downloaded')
        except Exception as e:
            print(f'Error downloading {pdf_url}: {e}')

def main():
    df = load_data(15)
    df = download_files(df)

if __name__ == '__main__':
    main()