"""
Bulk Import API Endpoints
Hỗ trợ import hàng loạt lessons từ CSV hoặc JSON
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import io
import csv
import json
from typing import List, Dict, Any

from app.services.database import get_db
from app.models.learning_model import Lesson
from app.schemas.learning_schema import LessonResponse, LessonCreate

router = APIRouter()


class BulkImportService:
    """Service for handling bulk imports"""
    
    @staticmethod
    async def import_lessons_from_csv(
        file_content: bytes,
        session: AsyncSession
    ) -> Dict[str, Any]:
        """Import lessons from CSV file
        
        CSV Format:
        title,description,video_url,level,order,thumbnail_url,content
        """
        stats = {
            "total": 0,
            "created": 0,
            "skipped": 0,
            "errors": 0,
            "error_details": []
        }
        
        try:
            # Decode CSV
            content_str = file_content.decode('utf-8')
            csv_reader = csv.DictReader(io.StringIO(content_str))
            
            if not csv_reader.fieldnames:
                raise ValueError("CSV file is empty")
            
            for row_num, row in enumerate(csv_reader, start=2):
                stats["total"] += 1
                
                try:
                    # Extract data
                    title = row.get('title', '').strip()
                    description = row.get('description', '').strip()
                    video_url = row.get('video_url', '').strip()
                    level = row.get('level', 'beginner').strip().lower()
                    order = int(row.get('order', 0))
                    thumbnail_url = row.get('thumbnail_url', '').strip() or None
                    content = row.get('content', '').strip() or None
                    
                    # Validate
                    if not title:
                        raise ValueError("Title is required")
                    if not video_url:
                        raise ValueError("Video URL is required")
                    
                    valid_levels = ['beginner', 'intermediate', 'advanced']
                    if level not in valid_levels:
                        raise ValueError(f"Invalid level: {level}")
                    
                    # Check duplicate
                    stmt = select(Lesson).where(Lesson.title == title)
                    result = await session.execute(stmt)
                    existing = result.scalar_one_or_none()
                    
                    if existing:
                        stats["skipped"] += 1
                        continue
                    
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
                    
                    session.add(lesson)
                    stats["created"] += 1
                
                except Exception as e:
                    stats["errors"] += 1
                    stats["error_details"].append(f"Row {row_num}: {str(e)}")
            
            # Commit
            await session.commit()
        
        except Exception as e:
            await session.rollback()
            raise HTTPException(status_code=400, detail=f"Error parsing CSV: {str(e)}")
        
        return stats
    
    @staticmethod
    async def import_lessons_from_json(
        data: List[Dict[str, Any]],
        session: AsyncSession
    ) -> Dict[str, Any]:
        """Import lessons from JSON data"""
        stats = {
            "total": len(data),
            "created": 0,
            "skipped": 0,
            "errors": 0,
            "error_details": []
        }
        
        try:
            for idx, item in enumerate(data, start=1):
                try:
                    # Extract data
                    title = item.get('title', '').strip()
                    description = item.get('description', '').strip()
                    video_url = item.get('video_url', '').strip()
                    level = item.get('level', 'beginner').strip().lower()
                    order = item.get('order', 0)
                    thumbnail_url = item.get('thumbnail_url', '').strip() or None
                    content = item.get('content', '').strip() or None
                    
                    # Validate
                    if not title:
                        raise ValueError("Title is required")
                    if not video_url:
                        raise ValueError("Video URL is required")
                    
                    valid_levels = ['beginner', 'intermediate', 'advanced']
                    if level not in valid_levels:
                        raise ValueError(f"Invalid level: {level}")
                    
                    # Check duplicate
                    stmt = select(Lesson).where(Lesson.title == title)
                    result = await session.execute(stmt)
                    existing = result.scalar_one_or_none()
                    
                    if existing:
                        stats["skipped"] += 1
                        continue
                    
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
                    
                    session.add(lesson)
                    stats["created"] += 1
                
                except Exception as e:
                    stats["errors"] += 1
                    stats["error_details"].append(f"Item {idx}: {str(e)}")
            
            # Commit
            await session.commit()
        
        except Exception as e:
            await session.rollback()
            raise HTTPException(status_code=400, detail=f"Error processing data: {str(e)}")
        
        return stats


# ==================== BULK IMPORT ENDPOINTS ====================

@router.post("/admin/bulk-import/csv")
async def bulk_import_csv(
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Bulk import lessons from CSV file
    
    CSV Format:
    title,description,video_url,level,order,thumbnail_url,content
    
    Required columns: title, video_url
    Optional columns: description, level, order, thumbnail_url, content
    
    Example:
    "Chào buổi sáng","Cách chào sáng",https://drive.google.com/file/d/ABC/view,beginner,1,
    """
    
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be CSV format")
    
    try:
        content = await file.read()
        stats = await BulkImportService.import_lessons_from_csv(content, session)
        return {
            "status": "success",
            "message": f"Imported {stats['created']} lessons",
            "stats": stats
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/admin/bulk-import/json")
async def bulk_import_json(
    data: List[Dict[str, Any]],
    session: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Bulk import lessons from JSON data
    
    Request body: Array of lesson objects
    
    Example:
    [
        {
            "title": "Chào buổi sáng",
            "description": "Cách chào sáng",
            "video_url": "https://drive.google.com/file/d/ABC/view",
            "level": "beginner",
            "order": 1
        }
    ]
    """
    
    if not data:
        raise HTTPException(status_code=400, detail="Data array is empty")
    
    if len(data) > 1000:
        raise HTTPException(status_code=400, detail="Maximum 1000 items per import")
    
    try:
        stats = await BulkImportService.import_lessons_from_json(data, session)
        return {
            "status": "success",
            "message": f"Imported {stats['created']} lessons",
            "stats": stats
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/admin/bulk-import/template")
async def get_import_template() -> Dict[str, Any]:
    """
    Get CSV template for bulk import
    
    Returns example with format
    """
    return {
        "csv_format": "title,description,video_url,level,order,thumbnail_url,content",
        "required_fields": ["title", "video_url"],
        "optional_fields": ["description", "level", "order", "thumbnail_url", "content"],
        "example_rows": [
            {
                "title": "Chào buổi sáng",
                "description": "Cách chào vào buổi sáng",
                "video_url": "https://drive.google.com/file/d/1A2B3C4D5E6F7G/view",
                "level": "beginner",
                "order": 1,
                "thumbnail_url": "",
                "content": "Nội dung bài học"
            },
            {
                "title": "Chào buổi chiều",
                "description": "Cách chào vào buổi chiều",
                "video_url": "https://drive.google.com/file/d/ABC123XYZ456/view",
                "level": "beginner",
                "order": 2,
                "thumbnail_url": "",
                "content": "Nội dung bài học"
            }
        ],
        "level_options": ["beginner", "intermediate", "advanced"],
        "notes": [
            "Video URL can be: Google Drive, YouTube, or MP4 direct link",
            "Level: beginner, intermediate, or advanced",
            "Order: number for lesson display order",
            "Duplicate titles will be skipped"
        ]
    }
