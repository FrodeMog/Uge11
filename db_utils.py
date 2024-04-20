import json
import pymysql
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from db_classes import *
from sqlalchemy import inspect
from werkzeug.security import generate_password_hash
from openpyxl import Workbook
from dotenv import load_dotenv
import os

class DatabaseUtils:

    def __init__(self):
        load_dotenv()

        # Get the database information from the environment variables
        self.local_db_mode = os.getenv('LOCAL_DB_MODE')
        self.engine = os.getenv('ENGINE')
        self.local_db_engine = os.getenv('LOCAL_DB_ENGINE')
        self.adapter = os.getenv('ADAPTER')
        self.username = os.getenv('USERNAME')
        self.password = os.getenv('PASSWORD')
        self.hostname = os.getenv('MYSQL_HOSTNAME')
        self.port = os.getenv('MYSQL_PORT')
        self.local_db_name = os.getenv('LOCAL_DB_NAME')
        self.db_name = os.getenv('DB_NAME')
        self.db_test_name = os.getenv('DB_TEST_NAME')
    
        if self.local_db_mode == "True":
            # Use SQLite for local DB mode
            # Get the directory of this script
            dir_path = os.path.dirname(os.path.realpath(__file__))
            # Join the directory path and the local DB name to get the full path to the SQLite database file
            self.local_db_name = os.path.join(dir_path, self.local_db_name)
            DATABASE_URL = f"{self.local_db_engine}:///{self.local_db_name}"
        else:
            # Use the existing database configuration for non-local DB mode
            DATABASE_URL = f"{self.engine}+{self.adapter}://{self.username}:{self.password}@{self.hostname}:{self.port}/{self.db_name}"

        # Create a SQLAlchemy engine
        engine = create_engine(DATABASE_URL)

        # Create a SQLAlchemy ORM session factory
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        self.engine = engine
        self.SessionLocal = SessionLocal
        self.create_schema()

    def extract_table_as_csv(self, table_name, file_name, folder_location="pdf-summary"):
        db = self.SessionLocal()
        query = db.query(table_name)
        with open(f"{folder_location}/{file_name}", 'w') as f:
            f.write(','.join([column.name for column in table_name.__table__.columns]) + '\n')
            for row in query:
                f.write(','.join([str(getattr(row, column.name)) for column in table_name.__table__.columns]) + '\n')
        db.close()
    
    def extract_table_as_xlsx(self, table_name, file_name, folder_location="pdf-summary"):
        db = self.SessionLocal()
        query = db.query(table_name)
        workbook = Workbook()
        sheet = workbook.active
        sheet.append([column.name for column in table_name.__table__.columns])
        for row in query:
            sheet.append([str(getattr(row, column.name)) for column in table_name.__table__.columns])
        workbook.save(f"{folder_location}/{file_name}")
        db.close()

    def reset_and_setup_db(self):
        self.drop_tables()
        self.create_tables()
        self.setup_db()

    def setup_db(self):
        self.create_tables()
        self.generate_user('user', 'user', 'user@user.com', "False")
        self.generate_user('admin', 'admin', 'admin@admin.com', "True")

    def generate_user(self, username, password, email, is_admin="False"):
        db = self.SessionLocal()
        #check if user exist
        user = db.query(User).filter(User.username == username).first() or db.query(User).filter(User.email == email).first()
        if user:
            db.close()
            return
        user = User(username=username, email=email, password=generate_password_hash(password), is_admin=is_admin)
        db.add(user)
        db.commit()
        db.close()

    def drop_tables(self):
        from db_classes import Base
        if inspect(self.engine).has_table('users'):
            # Drop all tables in the database
            Base.metadata.drop_all(bind=self.engine)

    def create_schema(self):
        # If LOCAL_DB_MODE is True, don't try to connect to MySQL
        if os.getenv('LOCAL_DB_MODE') == 'True':
            return
    
        # Connect to the MySQL server (without specifying the database)
        connection = pymysql.connect(host=self.hostname,
                                    user=self.username,
                                    password=self.password)
    
        try:
            with connection.cursor() as cursor:
                # Create databases (if they don't exist)
                cursor.execute(f"CREATE DATABASE IF NOT EXISTS {self.db_name}")
                cursor.execute(f"CREATE DATABASE IF NOT EXISTS {self.db_test_name}")
    
            # Commit the changes
            connection.commit()
        finally:
            connection.close()
        
    def create_tables(self):
        from db_classes import Base
        # Create all tables in the database
        if not inspect(self.engine).has_table('users'):
            Base.metadata.create_all(bind=self.engine)
