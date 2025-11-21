from backend.database import SessionLocal
from backend import models

def cleanup_bookmarks():
    db = SessionLocal()
    try:
        # Find bookmarks where post_id is NULL
        null_bookmarks = db.query(models.Bookmark).filter(models.Bookmark.post_id == None).all()
        print(f"Found {len(null_bookmarks)} bookmarks with NULL post_id")
        
        for b in null_bookmarks:
            db.delete(b)
            
        # Find bookmarks where post does not exist
        # This is a bit more expensive but necessary if FK constraints weren't enforced
        all_bookmarks = db.query(models.Bookmark).all()
        orphan_count = 0
        for b in all_bookmarks:
            if b.post_id is not None:
                post = db.query(models.Post).filter(models.Post.id == b.post_id).first()
                if not post:
                    print(f"Deleting orphan bookmark {b.id} pointing to non-existent post {b.post_id}")
                    db.delete(b)
                    orphan_count += 1
        
        db.commit()
        print(f"Deleted {len(null_bookmarks)} NULL bookmarks and {orphan_count} orphan bookmarks")
        
    except Exception as e:
        print(f"Error during cleanup: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    cleanup_bookmarks()
