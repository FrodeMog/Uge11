import os

# Check if .env file exists
if os.path.exists('.env'):
    # Ask if user wants to overwrite it
    overwrite = input('.env file already exists. Do you want to overwrite it? (y/n): ')
    if overwrite.lower() != 'y':
        print('Exiting without overwriting .env file.')
        
        exit()

db_username = ''
db_password = ''
mysql_root_password = ''
secret_key = ''

# If .env file does not exist or user wants to overwrite it
with open('.env', 'w') as f:
    # Prompt for username and password
    db_username = input('Set your database username: ')
    db_password = input('Set your database password: ')
    mysql_root_password = input('Set your mysql root password: ')
    secret_key = input('Set your secret key: ')
    
    # Write your environment variables here
    f.write('ENGINE=mysql\n')
    f.write('ADAPTER=pymysql\n')
    f.write('ASYNC_ADAPTER=aiomysql\n')
    f.write(f'DB_USERNAME={db_username}\n')
    f.write(f'DB_PASSWORD={db_password}\n')
    f.write(f'MYSQL_ROOT_PASSWORD={mysql_root_password}\n')
    f.write('DB_NAME=pdf_system\n')
    f.write('TEST_DB_NAME=test_pdf_system\n')
    f.write(f'SECRET_KEY={secret_key}\n')
    f.write('ALGORITHM=HS256\n')
    f.write('ACCESS_TOKEN_EXPIRE_MINUTES=10060\n')
    f.write('LOCAL_DB_MODE=False\n')
    f.write('LOCAL_DB_ASYNC_ENGINE=sqlite\n')
    f.write('LOCAL_DB_ASYNC_ADAPTER=aiosqlite\n')
    f.write('LOCAL_DB_ENGINE=sqlite\n')
    f.write('LOCAL_DB_NAME=pdf_system.db\n')
    f.write('MYSQL_PORT=3306\n')

# Create init.sql file
with open('init.sql', 'w') as f:
    f.write(f"DROP USER IF EXISTS '{db_username}'@'%';\n")
    f.write(f"CREATE USER '{db_username}'@'%' IDENTIFIED BY '{db_password}';\n")
    f.write(f"GRANT ALL PRIVILEGES ON *.* TO '{db_username}'@'%';\n")
    f.write("FLUSH PRIVILEGES;\n")
