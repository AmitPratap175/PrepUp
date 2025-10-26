import yaml
import requests
from langchain_core.tools import StructuredTool
import os
import re
import json
from langchain_core.runnables import RunnableConfig
from pydantic import BaseModel, Field, create_model
from typing import Dict, Any, Type, List, Optional

# The descriptions of these tools are the primary content for the AI's VectorStore memory.

def create_args_schema(details: Dict[str, Any], schema_components: Dict[str, Any]) -> Optional[Type[BaseModel]]:
    fields = {}

    # Handle parameters
    if 'parameters' in details:
        for param in details['parameters']:
            param_name = param['name']
            param_schema = param.get('schema', {})
            param_type = param_schema.get('type', 'string')

            type_mapping = {
                'string': str,
                'integer': int,
                'number': float,
                'boolean': bool,
            }
            python_type = type_mapping.get(param_type, Any)

            description = param.get('description', '')

            if param.get('required', False):
                fields[param_name] = (python_type, Field(..., description=description))
            else:
                fields[param_name] = (Optional[python_type], Field(None, description=description))

    # Handle requestBody
    if 'requestBody' in details:
        content = details['requestBody'].get('content', {})
        if 'application/json' in content:
            body_schema = content['application/json'].get('schema', {})
            if '$ref' in body_schema:
                ref_path = body_schema['$ref'].split('/')
                ref_name = ref_path[-1]
                component_schema = schema_components.get(ref_name, {})
                if 'properties' in component_schema:
                    for prop_name, prop_details in component_schema['properties'].items():
                        prop_type = prop_details.get('type', 'string')
                        type_mapping = {
                            'string': str,
                            'integer': int,
                            'number': float,
                            'boolean': bool,
                            'uuid': str,
                            'email': str,
                        }
                        python_type = type_mapping.get(prop_type, Any)

                        if not prop_details.get('readOnly', False):
                            if prop_name in component_schema.get('required', []):
                                fields[prop_name] = (python_type, Field(..., description=prop_details.get('description', '')))
                            else:
                                fields[prop_name] = (Optional[python_type], Field(None, description=prop_details.get('description', '')))
            elif 'properties' in body_schema:
                 for prop_name, prop_details in body_schema['properties'].items():
                    prop_type = prop_details.get('type', 'string')
                    type_mapping = {
                        'string': str,
                        'integer': int,
                        'number': float,
                        'boolean': bool,
                    }
                    python_type = type_mapping.get(prop_type, Any)
                    if prop_name in body_schema.get('required', []):
                        fields[prop_name] = (python_type, Field(..., description=prop_details.get('description', '')))
                    else:
                        fields[prop_name] = (Optional[python_type], Field(None, description=prop_details.get('description', '')))

    if not fields:
        return None

    return create_model('DynamicArgsSchema', **fields)


def load_schema():
    """Loads the OpenAPI schema from a YAML file."""
    schema_path = os.path.join(os.path.dirname(__file__), '../agent_assets/schema.yaml')
    with open(schema_path, 'r') as f:
        return yaml.safe_load(f)

def create_tool_function(path, method, details, schema_components):
    """Dynamically creates a Python function to call an API endpoint."""

    args_schema = create_args_schema(details, schema_components)

    def api_tool(config: RunnableConfig = None, **kwargs):
        """A dynamically generated tool to interact with the API."""
        print(f"api_tool called with: kwargs={kwargs}")

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
        payload = {k: v for k, v in kwargs.items() if f"{{{k}}}" not in path and k != 'config' and v is not None}

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

            if str(response.status_code) in details.get('responses', {}):
                response_info = details['responses'][str(response.status_code)]
                if 200 <= response.status_code < 300:
                    if response.status_code == 204:
                        return f"Success: {response_info.get('description', 'Action completed successfully.')}"
                    else:
                        return response.json()
                else:
                    return f"Error {response.status_code}: {response_info.get('description', response.text)}"
            else:
                response.raise_for_status()
                return response.json()
        except requests.exceptions.RequestException as e:
            if e.response is not None:
                return f"An error occurred: {e}. Response: {e.response.text}"
            else:
                return f"An error occurred: {e}"

    description = details.get('description', '')

    tool_kwargs = {
        "name": f"{method.upper()}_{path.replace('/', '_').replace('{', '').replace('}', '').strip('_')}",
        "description": description,
        "func": api_tool,
    }
    if args_schema:
        tool_kwargs["args_schema"] = args_schema

    return StructuredTool.from_function(**tool_kwargs)

def get_tools_from_schema():
    """Generates a list of tools from the OpenAPI schema."""
    schema = load_schema()
    schema_components = schema.get('components', {}).get('schemas', {})
    tools = []
    for path, methods in schema.get('paths', {}).items():
        for method, details in methods.items():
            tool_func = create_tool_function(path, method, details, schema_components)
            tools.append(tool_func)
    return tools

dynamic_tools_list = get_tools_from_schema()