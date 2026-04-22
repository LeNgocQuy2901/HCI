#!/usr/bin/env python3
"""
Database migration helper script.

Usage:
    python migrate.py upgrade                # Apply all pending migrations
    python migrate.py downgrade              # Rollback last migration
    python migrate.py revision --autogenerate -m "message"  # Generate new migration
    python migrate.py current                # Show current revision
    python migrate.py history                # Show migration history
"""

import sys
import os
from alembic.config import Config
from alembic import command

# Add app directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def get_alembic_config():
    """Get Alembic configuration"""
    config = Config("alembic.ini")
    config.set_main_option("sqlalchemy.url", os.getenv("DATABASE_URL", "postgresql://user:password@localhost/hcl_db"))
    return config

def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return
    
    command_name = sys.argv[1]
    config = get_alembic_config()
    
    try:
        if command_name == "upgrade":
            revision = sys.argv[2] if len(sys.argv) > 2 else "head"
            command.upgrade(config, revision)
            print(f"✓ Upgraded to {revision}")
            
        elif command_name == "downgrade":
            revision = sys.argv[2] if len(sys.argv) > 2 else "-1"
            command.downgrade(config, revision)
            print(f"✓ Downgraded to {revision}")
            
        elif command_name == "current":
            command.current(config)
            
        elif command_name == "history":
            command.history(config)
            
        elif command_name == "revision":
            autogenerate = "--autogenerate" in sys.argv
            message = None
            if "-m" in sys.argv:
                idx = sys.argv.index("-m")
                message = sys.argv[idx + 1]
            command.revision(config, autogenerate=autogenerate, message=message)
            print("✓ New migration created")
            
        else:
            print(f"Unknown command: {command_name}")
            print(__doc__)
            
    except Exception as e:
        print(f"✗ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
