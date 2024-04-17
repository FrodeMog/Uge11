import json
from sqlalchemy.ext.asyncio import create_async_engine,  AsyncSession, AsyncEngine, AsyncConnection, AsyncResult
from sqlalchemy.orm import sessionmaker , Session
from sqlalchemy import create_engine


class DatabaseConnect:
    def __init__(self, db_url):
        self.engine = create_async_engine(
            db_url,
            connect_args={'connect_timeout': 5}
            #,echo=True
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
        # Load database information from db_info.json
        with open('db_info.json') as f:
            db_info = json.load(f)

        username = db_info['username']
        password = db_info['password']
        hostname = db_info['hostname']
        database_name = db_info['db_name']

        db_url = f"mysql+aiomysql://{username}:{password}@{hostname}/{database_name}"
        db_connect = DatabaseConnect(db_url)

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
                connect_args={'connect_timeout': 5}
                #,echo=True
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
        # Load database information from db_info.json
        with open('db_info.json') as f:
            db_info = json.load(f)

        username = db_info['username']
        password = db_info['password']
        hostname = db_info['hostname']
        database_name = db_info['db_name']

        db_url = f"mysql+pymysql://{username}:{password}@{hostname}/{database_name}"
        db_connect = DatabaseConnectSync(db_url)

        return db_connect