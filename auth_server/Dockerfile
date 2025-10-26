# Use the official uv base image
FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim

# Set environment variables
ENV PYTHONUNBUFFERED 1
ENV VIRTUAL_ENV=/app/.venv
ENV PATH="/app/.venv/bin:$PATH"

# Set the working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    g++ \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency definitions
COPY auth_server/requirements.txt /app/auth_server/requirements.txt

# Create a virtual environment and install dependencies
RUN uv venv && \
    uv pip install --no-cache-dir -r /app/auth_server/requirements.txt

# Copy the application code
COPY auth_server/ /app/auth_server/

# Expose the port the app runs on
EXPOSE 8000

# Command to run the application
CMD ["uvicorn", "auth_server.main:app", "--host", "0.0.0.0", "--port", "8000"]
