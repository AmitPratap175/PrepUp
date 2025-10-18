import yaml
import requests
from langchain.tools import tool as tool_decorator
import os
import re
import json
from langchain_core.runnables import RunnableConfig
from typing import Dict, Any

# The descriptions of these tools are the primary content for the AI's VectorStore memory.

def load_schema():
    """Loads the OpenAPI schema from a YAML file."""
    schema_path = os.path.join(os.path.dirname(__file__), '../agent_assets/schema.yaml')
    with open(schema_path, 'r') as f:
        return yaml.safe_load(f)

def create_tool_function(path, method, details):
    """Dynamically creates a Python function to call an API endpoint."""
    
    # Create the function signature string with type hints
    params_list = []
    if 'parameters' in details:
        for param in details['parameters']:
            param_name = param['name']
            param_type = 'Any' # default to Any
            if 'schema' in param:
                schema_type = param['schema'].get('type', 'any')
                if schema_type == 'integer':
                    param_type = 'int'
                elif schema_type == 'string':
                    param_type = 'str'
                elif schema_type == 'boolean':
                    param_type = 'bool'
                elif schema_type == 'number':
                    param_type = 'float'

            params_list.append(f"{param_name}: {param_type}")

    params_str = ", ".join(params_list)
    if params_str:
        params_str += ", "

    # Function to be created
    func_str = f"""
def api_tool({params_str}config: RunnableConfig = None):
    '''A dynamically generated tool to interact with the API.'''

    kwargs = locals()
    kwargs.pop('config', None)

    url = f"http://localhost:8000{path}"

    token = config.get("configurable", {{}}).get("token") if config else None
    headers = {{}}
    if token:
        headers["Authorization"] = f"Token {{token}}"

    if method in ['post', 'put', 'patch']:
        headers["Content-Type"] = "application/json"

    # Handle path parameters
    for param_name, param_value in kwargs.items():
        if f"{{{{param_name}}}}" in url:
            url = url.replace(f"{{{{param_name}}}}", str(param_value))

    # Separate payload for body and parameters for query string
    payload = {{k: v for k, v in kwargs.items() if f"{{{{k}}}}" not in path and k != 'config'}}

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
            return f"Unsupported HTTP method: {{method}}"

        if str(response.status_code) in details.get('responses', {{}}):
            response_info = details['responses'][str(response.status_code)]
            if 200 <= response.status_code < 300:
                if response.status_code == 204:
                    return f"Success: {{response_info.get('description', 'Action completed successfully.')}}"
                else:
                    return response.json()
            else:
                return f"Error {{response.status_code}}: {{response_info.get('description', response.text)}}"
        else:
            response.raise_for_status()
            return response.json()
    except requests.exceptions.RequestException as e:
        if e.response is not None:
            return f"An error occurred: {{e}}. Response: {{e.response.text}}"
        else:
            return f"An error occurred: {{e}}"
"""

    # Create the function in a local scope
    local_scope = {}
    exec(func_str, globals(), local_scope)
    api_tool = local_scope['api_tool']

    api_tool.__name__ = f"{method.upper()}_{path.replace('/', '_').replace('{', '').replace('}', '').strip('_')}"
    api_tool.__doc__ = details.get('description', '')

    return api_tool

def get_tools_from_schema():
    """Generates a list of tools from the OpenAPI schema."""
    schema = load_schema()
    tools = []
    for path, methods in schema.get('paths', {}).items():
        for method, details in methods.items():
            # Create the function
            api_function = create_tool_function(path, method, details)
            # Decorate it with @tool
            decorated_tool = tool_decorator(api_function)
            tools.append(decorated_tool)
    return tools

dynamic_tools_list = get_tools_from_schema()