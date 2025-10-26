#!/usr/bin/env python3
"""
Migration script to add scheduled_messages table to the existing database.
Run this script to add WhatsApp message scheduling functionality.
"""

import sqlite3
import os
from pathlib import Path
from ..settings import settings

def add_scheduled_messages_table(db_path: str):
    """Add the scheduled_messages table to an existing database."""
    print(f"Adding scheduled_messages table to database: {db_path}")

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Create the scheduled_messages table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS scheduled_messages (
            scheduled_message_id INTEGER PRIMARY KEY AUTOINCREMENT,
            appointment_id INTEGER,
            user_id INTEGER NOT NULL,
            phone_number TEXT NOT NULL,
            message_text TEXT NOT NULL,
            message_type TEXT DEFAULT 'text' CHECK(message_type IN ('text', 'reminder', 'confirmation')),
            scheduled_datetime TIMESTAMP NOT NULL,
            status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'sent', 'failed', 'cancelled')),
            retry_count INTEGER DEFAULT 0,
            max_retries INTEGER DEFAULT 3,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            sent_at TIMESTAMP,
            error_message TEXT,
            FOREIGN KEY(user_id) REFERENCES users(user_id),
            FOREIGN KEY(appointment_id) REFERENCES appointments(appointment_id) ON DELETE CASCADE
        );
    """)

    # Create index for efficient querying
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_scheduled_messages_datetime_status
        ON scheduled_messages(scheduled_datetime, status);
    """)

    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_scheduled_messages_appointment
        ON scheduled_messages(appointment_id);
    """)

    conn.commit()
    cursor.close()
    conn.close()

    print("scheduled_messages table added successfully!")

def main():
    """Run the migration on the configured database."""
    db_path = settings.INFO_DB_PATH

    if not os.path.exists(db_path):
        print(f"Database not found at: {db_path}")
        print("Please ensure the database exists before running this migration.")
        return

    try:
        add_scheduled_messages_table(db_path)
        print(f"Migration completed successfully for {db_path}")
    except Exception as e:
        print(f"Migration failed: {e}")
        raise

if __name__ == "__main__":
    main()