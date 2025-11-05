# Use the official uv base image
FROM ghcr.io/astral-sh/uv:python3.13-bookworm-slim

# Set environment variables
ENV PYTHONUNBUFFERED 1
ENV VIRTUAL_ENV=/app/.venv
ENV PATH="/app/.venv/bin:$PATH"

# Set the working directory
WORKDIR /app

# Install system dependencies needed for nc
# Install system dependencies for building libraries
RUN apt-get update && apt-get install -y \
    build-essential \
    g++ \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency definitions
COPY uv.lock pyproject.toml README.md /app/

# Install dependencies
RUN uv sync --frozen --no-cache

# Copy the application code
COPY auth_server/ .


# Expose the port the app runs on
EXPOSE 8000

# Command to run the application
# The python executable from the virtual environment will be used thanks to the PATH update
CMD ["/app/.venv/bin/python", "manage.py", "runserver", "0.0.0.0:8000"] 
