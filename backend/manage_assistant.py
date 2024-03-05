from openai import OpenAI
import os
from dotenv import load_dotenv, find_dotenv

print(find_dotenv())
load_dotenv(override=True)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
print(OPENAI_API_KEY)

client = OpenAI()
# Personal Assistant ID
# assistant_id = "asst_wGnLMklJXCbUvyF3myAdAVCf"
# assitant id in I10
assistant_id = 'asst_N49231tQuA5jB1Eh4zrh6u9d'
my_assistant = client.beta.assistants.retrieve(assistant_id=assistant_id)
print(my_assistant)

# new_assitant = client.beta.assistants.create(
#     name="DIYMate-Assitant",
#     model="gpt-3.5-turbo-1106",
#     instructions="You are to assist the user in helping write a DIY tutorial.",
# )

# print(new_assitant)
