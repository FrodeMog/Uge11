import json
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

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