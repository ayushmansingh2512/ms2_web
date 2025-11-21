from backend.database import SessionLocal
from backend import models

def debug_data():
    db = SessionLocal()
    try:
        # List all users
        users = db.query(models.User).all()
        print(f"Total Users: {len(users)}")
        for user in users:
            print(f"User ID: {user.id}, Username: {user.username}, Email: {user.email}")

        # Check for posts with non-existent owners
        posts = db.query(models.Post).all()
        print(f"\nTotal Posts: {len(posts)}")
        user_ids = {u.id for u in users}
        
        orphan_posts = []
        for post in posts:
            if post.owner_id not in user_ids:
                orphan_posts.append(post)
                print(f"WARNING: Post ID {post.id} has owner_id {post.owner_id} which does not exist!")

        if not orphan_posts:
            print("No orphan posts found.")
            
    except Exception as e:
        print(f"Error during debug: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    debug_data()
