# SOPForge

Multi-agent system for generating Statement of Purpose documents.

## Setup

1.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
    or if you use `uv`:
    ```bash
    uv pip install -r requirements.txt
    ```
2.  Create a `.env` file from the `.env.example` and fill in the required API keys.
    ```bash
    cp .env.example .env
    ```
3.  Run the server:
    ```bash
    python -m src.api.server
    ```

## Usage

Use the API endpoints as described in the `/example-usage` endpoint.
