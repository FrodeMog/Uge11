import json
import pymysql
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from db_classes import *
from sqlalchemy import inspect
from werkzeug.security import generate_password_hash

class DatabaseUtils:

    def __init__(self):
        # Load database information from db_info.json
        with open('db_info.json') as f:
            db_info = json.load(f)

        # Define the database URL
        DATABASE_URL = f"mysql+pymysql://{db_info['username']}:{db_info['password']}@{db_info['hostname']}/{db_info['db_name']}"

        # Create a SQLAlchemy engine
        engine = create_engine(DATABASE_URL)

        # Create a SQLAlchemy ORM session factory
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        self.engine = engine
        self.SessionLocal = SessionLocal
        self.create_schema()

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
        # Load database information from db_info.json
        with open('db_info.json') as f:
            db_info = json.load(f)

        # Connect to the MySQL server (without specifying the database)
        connection = pymysql.connect(host=db_info['hostname'],
                                    user=db_info['username'],
                                    password=db_info['password'])

        try:
            with connection.cursor() as cursor:
                # Create databases (if they don't exist)
                cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_info['db_name']}")
                cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_info['test_db_name']}")

            # Commit the changes
            connection.commit()
        finally:
            connection.close()
        
    def create_tables(self):
        from db_classes import Base
        # Create all tables in the database
        if not inspect(self.engine).has_table('users'):
            Base.metadata.create_all(bind=self.engine)
