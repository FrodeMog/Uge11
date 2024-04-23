import os
import subprocess
import getpass

# Prompt the user for the required information
os.environ['DB_USERNAME'] = input('DB_USERNAME: ')
os.environ['DB_PASSWORD'] = getpass.getpass(prompt='DB_PASSWORD: ')
os.environ['MYSQL_ROOT_PASSWORD'] = getpass.getpass(prompt='MYSQL_ROOT_PASSWORD: ')
os.environ['SECRET_KEY'] = getpass.getpass(prompt='SECRET_KEY: ')

# Create .env file if it doesn't exist
if not os.path.exists('.env'):
    open('.env', 'a').close()

# Run docker-compose down -v
subprocess.run(['docker-compose', 'down', '-v'])

# Prune dangling Docker images
subprocess.run(['docker', 'image', 'prune', '-f'])

# Run docker-compose up
subprocess.run(['docker-compose', 'up', '--build', '--force-recreate', '-d'])