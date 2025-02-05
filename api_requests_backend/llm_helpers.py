from openai import OpenAI
import json
import os

client = OpenAI(api_key=os.environ['CLOUDCRUISE_OPENAI_KEY'])

tools = [{
    "type": "function",
    "function": {
        "name": "choose_request",
        "description": "The request that fits the query.",
        "parameters": {
            "type": "object",
            "properties": {
                "url": {
                    "type": "string",
                    "description": "The url of the relevant entry"
                }
            },
            "required": [
                "url"
            ],
            "additionalProperties": False
        },
        "strict": True
    }
}]

def make_query(query: str, entries: dict):
    completion = client.chat.completions.create(
        messages=[
            {
                "role": "system",
                "content": """
Analyze the API requests and select the most relevant endpoint for the user's query.
Prioritize:
1. API endpoints over static assets
2. Endpoints containing data/information over images/media
3. Endpoints with query parameters related to the request
4. Endpoints from api.* subdomains""",
            },
            {
                "role": "system",
                "content": '\n'.join(entries)
            },
            {
                "role": "user",
                "content": query
            }
        ],
        tools=tools, # type: ignore 
        model="gpt-4o",
        temperature=0
    )
    tool_calls = completion.choices[0].message.tool_calls
    if tool_calls:
        tool_call = tool_calls[0]
        args = json.loads(tool_call.function.arguments)
        return True, args['url']

    return False, completion.choices[0].message.content


