FROM python:3.12-slim

WORKDIR /app

# Install dependencies first (better layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Directories for the SQLite database and uploaded attachments
# (mounted as a volume in docker-compose so data survives restarts)
RUN mkdir -p /app/data/uploads

ENV DATABASE_PATH=/app/data/complaints.db
ENV UPLOAD_FOLDER=/app/data/uploads
ENV SECRET_KEY=change-this-in-production
ENV FLASK_APP=app.py

EXPOSE 5000

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "3", "--timeout", "60", "app:app"]
