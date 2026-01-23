from backend.main import app

# Fix 404: Tell FastAPI it is running behind a path prefix on Vercel
app.root_path = "/api/python"
