#!/usr/bin/env python
"""
Bulk Import Lessons from CSV
Tự động tạo lessons từ file CSV chứa video URLs
"""

import asyncio
import csv
from pathlib import Path
from uuid import UUID
from sqlalchemy import select
import sys

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent))

from app.config import settings
from app.models.learning_model import Lesson, Vocabulary, Quiz, QuizQuestion
from app.services.database import AsyncSessionLocal, engine, Base
from sqlalchemy.ext.asyncio import AsyncSession


class LessonBulkImporter:
    """Bulk import lessons from CSV file"""
    
    def __init__(self):
        self.session: AsyncSession = None
        self.stats = {
            "total": 0,
            "created": 0,
            "skipped": 0,
            "errors": 0,
            "error_details": []
        }
    
    async def connect(self):
        """Connect to database"""
        self.session = AsyncSessionLocal()
        print("✓ Connected to database")
    
    async def disconnect(self):
        """Disconnect from database"""
        if self.session:
            await self.session.close()
        print("✓ Disconnected from database")
    
    async def import_from_csv(self, csv_path: str):
        """Import lessons from CSV file
        
        CSV Format:
        title,description,video_url,level,order,thumbnail_url
        
        Example:
        "Chào buổi sáng","Cách chào vào buổi sáng",https://drive.google.com/file/d/ABC123/view,beginner,1,
        """
        
        csv_file = Path(csv_path)
        
        if not csv_file.exists():
            print(f"❌ File not found: {csv_path}")
            return False
        
        print(f"\n📂 Importing from: {csv_path}")
        print("=" * 60)
        
        try:
            with open(csv_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                
                for row_num, row in enumerate(reader, start=2):  # Start at 2 (skip header)
                    self.stats["total"] += 1
                    
                    try:
                        await self._create_lesson_from_row(row, row_num)
                    except Exception as e:
                        self.stats["errors"] += 1
                        error_msg = f"Row {row_num}: {str(e)}"
                        self.stats["error_details"].append(error_msg)
                        print(f"❌ {error_msg}")
            
            return True
        
        except Exception as e:
            print(f"❌ Error reading CSV: {str(e)}")
            return False
    
    async def _create_lesson_from_row(self, row: dict, row_num: int):
        """Create a lesson from CSV row"""
        
        # Extract and validate data
        title = row.get('title', '').strip()
        description = row.get('description', '').strip()
        video_url = row.get('video_url', '').strip()
        level = row.get('level', 'beginner').strip().lower()
        order = int(row.get('order', 0))
        thumbnail_url = row.get('thumbnail_url', '').strip() or None
        content = row.get('content', '').strip() or None
        
        # Validate required fields
        if not title:
            raise ValueError("Title is required")
        
        if not video_url:
            raise ValueError("Video URL is required")
        
        # Validate level
        valid_levels = ['beginner', 'intermediate', 'advanced']
        if level not in valid_levels:
            raise ValueError(f"Invalid level: {level}. Must be one of: {', '.join(valid_levels)}")
        
        # Check if lesson already exists
        stmt = select(Lesson).where(Lesson.title == title)
        result = await self.session.execute(stmt)
        existing = result.scalar_one_or_none()
        
        if existing:
            self.stats["skipped"] += 1
            print(f"⚠️  Skipped (already exists): {title}")
            return
        
        # Create lesson
        lesson = Lesson(
            title=title,
            description=description,
            video_url=video_url,
            thumbnail_url=thumbnail_url,
            content=content,
            level=level,
            order=order,
            is_active=True
        )
        
        self.session.add(lesson)
        await self.session.flush()  # Get the ID
        
        self.stats["created"] += 1
        print(f"✅ Created: {title} (Level: {level}, Order: {order})")
    
    async def import_from_list(self, lessons_data: list):
        """Import lessons from list of dictionaries
        
        Args:
            lessons_data: List of dicts with keys:
                - title (required)
                - description
                - video_url (required)
                - level (default: 'beginner')
                - order (default: 0)
                - thumbnail_url
                - content
        """
        
        self.stats["total"] = len(lessons_data)
        print(f"\n📋 Importing {len(lessons_data)} lessons")
        print("=" * 60)
        
        for row_num, data in enumerate(lessons_data, start=1):
            try:
                await self._create_lesson_from_row(data, row_num)
            except Exception as e:
                self.stats["errors"] += 1
                error_msg = f"Item {row_num}: {str(e)}"
                self.stats["error_details"].append(error_msg)
                print(f"❌ {error_msg}")
    
    async def commit(self):
        """Commit all changes to database"""
        try:
            await self.session.commit()
            print("\n✅ All changes committed to database")
            return True
        except Exception as e:
            print(f"\n❌ Error committing: {str(e)}")
            await self.session.rollback()
            return False
    
    def print_stats(self):
        """Print import statistics"""
        print("\n" + "=" * 60)
        print("📊 IMPORT STATISTICS")
        print("=" * 60)
        print(f"Total processed: {self.stats['total']}")
        print(f"✅ Created:      {self.stats['created']}")
        print(f"⚠️  Skipped:      {self.stats['skipped']}")
        print(f"❌ Errors:       {self.stats['errors']}")
        
        if self.stats['error_details']:
            print("\n❌ Error Details:")
            for error in self.stats['error_details']:
                print(f"   - {error}")
        
        print("=" * 60)


async def main():
    """Main entry point"""
    
    importer = LessonBulkImporter()
    
    try:
        # Connect to database
        await importer.connect()
        
        # Example 1: Import from CSV file
        if len(sys.argv) > 1:
            csv_file = sys.argv[1]
            success = await importer.import_from_csv(csv_file)
        else:
            # Example 2: Import from list (built-in example)
            print("\n⚠️  No CSV file provided")
            print("   Usage: python bulk_import_lessons.py <csv_file>")
            print("\nUsing built-in example data...")
            
            example_data = [
                {
                    "title": "Chào buổi sáng",
                    "description": "Học cách chào vào buổi sáng",
                    "video_url": "https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9I0J1K2L3M/view",
                    "level": "beginner",
                    "order": 1,
                    "content": "Đây là bài học chào vào buổi sáng"
                },
                {
                    "title": "Chào buổi chiều",
                    "description": "Học cách chào vào buổi chiều",
                    "video_url": "https://drive.google.com/file/d/ABC123XYZ456DEF/view",
                    "level": "beginner",
                    "order": 2,
                    "content": "Đây là bài học chào vào buổi chiều"
                },
                {
                    "title": "Chào buổi tối",
                    "description": "Học cách chào vào buổi tối",
                    "video_url": "https://drive.google.com/file/d/XYZ789ABC456DEF/view",
                    "level": "beginner",
                    "order": 3,
                    "content": "Đây là bài học chào vào buổi tối"
                }
            ]
            
            await importer.import_from_list(example_data)
        
        # Commit changes
        success = await importer.commit()
        
    finally:
        # Print statistics
        importer.print_stats()
        
        # Disconnect
        await importer.disconnect()


if __name__ == "__main__":
    asyncio.run(main())
