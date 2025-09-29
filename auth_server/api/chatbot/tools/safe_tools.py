import sqlite3
import json
from datetime import datetime, timedelta
from typing import Optional, List, Dict

from langchain_core.runnables import RunnableConfig
from langchain.tools import tool
from sqlite3 import Connection
from ..settings import settings


@tool
def get_datetime_now():
    """
    Get the current datetime in iso format
    """
    return datetime.now().isoformat()

from .quiz_tool import quiz_tools_list

safe_tools_list = [get_datetime_now] + quiz_tools_list