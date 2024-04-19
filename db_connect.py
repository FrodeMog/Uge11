import json
from sqlalchemy.ext.asyncio import create_async_engine,  AsyncSession, AsyncEngine, AsyncConnection, AsyncResult
from sqlalchemy.orm import sessionmaker , Session
from sqlalchemy import create_engine
from dotenv import load_dotenv
import os

class DatabaseConnect:
    def __init__(self, db_url):
        load_dotenv()
        local_db_mode = os.getenv('LOCAL_DB_MODE')
        connect_args = {'timeout': 5} if not local_db_mode == "True" else {}
        self.engine = create_async_engine(
            db_url,
            connect_args=connect_args,
            #echo=True
        )
        self.sessionmaker = sessionmaker(self.engine, expire_on_commit=False, class_=AsyncSession)

    async def get_new_session(self):
        self.session = self.sessionmaker()
        return self.session

    async def close(self):
        await self.session.close()
        await self.engine.dispose()
            
    @staticmethod
    async def connect_from_config():
        load_dotenv()

        local_db_mode = os.getenv('LOCAL_DB_MODE')

        if local_db_mode == 'True':
            # Use local database settings
            engine = os.getenv('LOCAL_DB_ASYNC_ENGINE')
            adapter = os.getenv('LOCAL_DB_ASYNC_ADAPTER')
            db_name = os.getenv('LOCAL_DB_NAME')
            DATABASE_URL = f"{engine}+{adapter}:///{db_name}"
        else:
            # Use production database settings
            engine = os.getenv('ENGINE')
            adapter = os.getenv('ASYNC_ADAPTER')
            username = os.getenv('USERNAME')
            password = os.getenv('PASSWORD')
            hostname = os.getenv('HOSTNAME')
            db_name = os.getenv('DB_NAME')
            DATABASE_URL = f"{engine}+{adapter}://{username}:{password}@{hostname}/{db_name}"

        db_connect = DatabaseConnect(DATABASE_URL)

        return db_connect

class DatabaseConnectSync:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(DatabaseConnectSync, cls).__new__(cls)
        return cls._instance

    def __init__(self, db_url):
        if not hasattr(self, 'engine'):
            self.engine = create_engine(
                db_url,
                #echo=True
            )
            self.sessionmaker = sessionmaker(self.engine, expire_on_commit=False)

    def get_new_session(self):
        self.session = self.sessionmaker()
        return self.session

    def close(self):
        self.session.close()
        self.engine.dispose()
            
    @staticmethod
    def connect_from_config():
        load_dotenv()

        local_db_mode = os.getenv('LOCAL_DB_MODE')

        if local_db_mode == 'True':
            # Use local database settings
            engine = os.getenv('LOCAL_DB_ENGINE')
            db_name = os.getenv('LOCAL_DB_NAME')
            DATABASE_URL = f"{engine}:///{db_name}"
        else:
            # Use production database settings
            engine = os.getenv('ENGINE')
            adapter = os.getenv('ADAPTER')
            username = os.getenv('USERNAME')
            password = os.getenv('PASSWORD')
            hostname = os.getenv('HOSTNAME')
            db_name = os.getenv('DB_NAME')
            DATABASE_URL = f"{engine}+{adapter}://{username}:{password}@{hostname}/{db_name}"

        db_connect = DatabaseConnectSync(DATABASE_URL)

        return db_connect