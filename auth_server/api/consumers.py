import json
from channels.generic.websocket import AsyncWebsocketConsumer
from api.supervisor import supervisor_graph

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()

    async def disconnect(self, close_code):
        pass

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']

        # This is a simplified interaction.
        # In a real-world scenario, you'd manage conversation state.
        inputs = {"messages": [("user", message)]}

        async for output in supervisor_graph.astream(inputs):
            # The output of astream will be a dictionary with the agent's name
            # and the messages from that agent.
            for key, value in output.items():
                if key != "__end__":
                    # Assuming the value is a dictionary with a 'messages' key
                    # and messages are BaseMessage objects.
                    for msg in value.get('messages', []):
                        await self.send(text_data=json.dumps({
                            'agent': key,
                            'message': msg.content
                        }))