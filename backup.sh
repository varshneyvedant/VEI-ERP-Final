#!/bin/bash
sqlite3 dev.db ".backup backup.db"
echo "Backup completed to backup.db"
