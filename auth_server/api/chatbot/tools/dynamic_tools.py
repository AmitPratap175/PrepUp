
import yaml
import requests
from langchain.tools import Tool
import os
import re
import json
from langchain_core.runnables import RunnableConfig

# The descriptions of these tools are the primary content for the AI's VectorStore memory.

def load_schema():
    """Loads the OpenAPI schema from a YAML file."""
    schema_path = os.path.join(os.path.dirname(__file__), '../agent_assets/schema.yaml')
    with open(schema_path, 'r') as f:
        return yaml.safe_load(f)

def create_tool_function(path, method, details):
    """Dynamically creates a Python function to call an API endpoint."""
    
    def api_tool(*args, config: RunnableConfig = None, **kwargs):
        """A dynamically generated tool to interact with the API."""
        print(f"api_tool called with: args={args}, kwargs={kwargs}")
        
        if args:
            if isinstance(args[0], dict):
                kwargs.update(args[0])
            elif isinstance(args[0], str):
                try:
                    kwargs.update(json.loads(args[0]))
                except json.JSONDecodeError:
                    pass

        url = f"http://localhost:8000{path}"
        
        token = config.get("configurable", {}).get("token") if config else None
        headers = {}
        if token:
            headers["Authorization"] = f"Token {token}"

        if method in ['post', 'put', 'patch']:
            headers["Content-Type"] = "application/json"
        
        # Handle path parameters
        for param_name, param_value in kwargs.items():
            if f"{{{param_name}}}" in url:
                url = url.replace(f"{{{param_name}}}", str(param_value))

        # Separate payload for body and parameters for query string
        payload = {k: v for k, v in kwargs.items() if f"{{{k}}}" not in path and k != 'config'}
        
        try:
            if method == 'get':
                response = requests.get(url, headers=headers, params=payload)
            elif method == 'post':
                response = requests.post(url, headers=headers, json=payload)
            elif method == 'put':
                response = requests.put(url, headers=headers, json=payload)
            elif method == 'patch':
                response = requests.patch(url, headers=headers, json=payload)
            elif method == 'delete':
                response = requests.delete(url, headers=headers, params=payload)
            else:
                return f"Unsupported HTTP method: {method}"

            response.raise_for_status()  # Raise an exception for bad status codes
            return response.json()
        except requests.exceptions.RequestException as e:
            if e.response is not None:
                return f"An error occurred: {e}. Response: {e.response.text}"
            else:
                return f"An error occurred: {e}"

    description = details.get('description', '')
    if path == '/api/auth/bookmarks/create/':
        description = "Creates a bookmark for the current question. The 'subject' and 'question_id' from the question context must be provided as arguments."
    elif path == '/api/auth/bookmarks/delete/{question_id}/':
        description = "Deletes a bookmark for the current question. The 'question_id' must be provided, and the 'subject' from the question context must also be provided."

    return Tool(
        name=f"{method.upper()}_{path.replace('/', '_').replace('{', '').replace('}', '').strip('_')}",
        description=description,
        func=api_tool
    )

def get_tools_from_schema():
    """Generates a list of tools from the OpenAPI schema."""
    schema = load_schema()
    tools = []
    for path, methods in schema.get('paths', {}).items():
        for method, details in methods.items():
            tool_func = create_tool_function(path, method, details)
            tools.append(tool_func)
    return tools

dynamic_tools_list = get_tools_from_schema()
