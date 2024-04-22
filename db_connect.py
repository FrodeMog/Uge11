from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from dotenv import load_dotenv
import os

class BaseDatabaseConnect:
    def __init__(self, async_mode, db_url=None):
        load_dotenv()
        local_db_mode = os.getenv('LOCAL_DB_MODE')
        connect_args = {'connect_timeout': 5} if not local_db_mode == "True" else {}
        self.db_url = db_url if db_url else self.db_url_from_env(async_mode)

    def get_new_session(self):
        self.session = self.sessionmaker()
        return self.session

    def get_engine(self):
        return self.engine
    
    def get_db_url(self):
        return self.db_url

    def db_url_from_env(self, async_mode):
        load_dotenv()
        local_db_mode = os.getenv('LOCAL_DB_MODE')
        
        # Use local database settings
        if local_db_mode == 'True':
            engine = os.getenv('LOCAL_DB_ASYNC_ENGINE') if async_mode else os.getenv('LOCAL_DB_ENGINE')
            adapter = os.getenv('LOCAL_DB_ASYNC_ADAPTER') if async_mode else None
            db_name = os.getenv('LOCAL_DB_NAME')
            DATABASE_URL = f"{engine}+{adapter}:///{db_name}" if async_mode else f"{engine}:///{db_name}"
        else:
            # Use production database settings
            engine = os.getenv('ENGINE')
            adapter = os.getenv('ASYNC_ADAPTER') if async_mode else os.getenv('ADAPTER')
            username = os.getenv('USERNAME')
            password = os.getenv('PASSWORD')
            hostname = os.getenv('MYSQL_HOSTNAME')
            port = os.getenv('MYSQL_PORT')
            db_name = os.getenv('DB_NAME')
            DATABASE_URL = f"{engine}+{adapter}://{username}:{password}@{hostname}:{port}/{db_name}"

        return DATABASE_URL


class SyncDatabaseConnect(BaseDatabaseConnect):
    def __init__(self, db_url=None, async_mode=False):
        local_db_mode = os.getenv('LOCAL_DB_MODE')
        connect_args = {'connect_timeout': 5} if not local_db_mode == "True" else {}
        self.db_url = db_url if db_url else self.db_url_from_env(async_mode)
        self.engine = create_engine(
            self.db_url,
            connect_args=connect_args,
            #echo=True
        )
        self.sessionmaker = sessionmaker(self.engine, expire_on_commit=False)

    def close(self):
        self.session.close()
        self.engine.dispose()

    def new_session(self):
        return self.sessionmaker()

class AsyncDatabaseConnect(BaseDatabaseConnect):
    def __init__(self, db_url=None, async_mode=True):
        local_db_mode = os.getenv('LOCAL_DB_MODE')
        connect_args = {'connect_timeout': 5} if not local_db_mode == "True" else {}
        self.db_url = db_url if db_url else self.db_url_from_env(async_mode)
        self.engine = create_async_engine(
            self.db_url,
            connect_args=connect_args,
            #echo=True
        )
        self.sessionmaker = sessionmaker(self.engine, expire_on_commit=False, class_=AsyncSession)

    async def close(self):
        await self.session.close()
        await self.engine.dispose()