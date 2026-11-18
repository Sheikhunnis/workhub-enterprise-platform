import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.exc import OperationalError
from app.core.config import settings

logger = logging.getLogger("workhub.database")

Base = declarative_base()

def build_engine():
    db_url = settings.DATABASE_URL
    # If environment explicitly specifies SQLite or MySQL connection
    if "sqlite" in db_url:
        return create_engine(db_url, connect_args={"check_same_thread": False})

    try:
        if db_url.startswith("mysql"):
            engine = create_engine(
                db_url,
                connect_args={"connect_timeout": 1},
                pool_pre_ping=True,
                pool_recycle=3600,
                pool_size=10,
                max_overflow=20
            )
            # Test connectivity
            with engine.connect() as conn:
                pass
            logger.info("Successfully connected to MySQL database: %s", settings.MYSQL_DB)
            return engine
        else:
            return create_engine(db_url, connect_args={"check_same_thread": False})
    except Exception as e:
        logger.warning(
            "Could not connect to MySQL (%s). Falling back to local SQLite engine (workhub.db). Reason: %s",
            db_url, e
        )
        return create_engine(
            "sqlite:///./workhub.db",
            connect_args={"check_same_thread": False}
        )

engine = build_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
