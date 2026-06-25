import json, random
from pathlib import Path

path = 'auth_server/data/pib_combined_data.json'
with open(path, 'r') as f:
    data = json.load(f)

possible_tags = ["GS-1: History", "GS-2: Governance", "GS-2: International Relations", "GS-3: Economy", "GS-3: Environment", "GS-3: Science & Tech", "GS-3: Internal Security", "GS-4: Ethics"]

for item in data:
    needs_update = False
    if 'tags' not in item or not item['tags']:
        item['tags'] = random.sample(possible_tags, random.randint(1, 3))
        needs_update = True
        
    if 'mains_questions' not in item or not item['mains_questions']:
        item['mains_questions'] = [
            {
                "question": f"Discuss the implications of the policies highlighted in the PIB release '{item.get('title', '')[:30]}...' on India's socio-economic development. (150 words)",
                "answer": "### Model Approach\n\n**Introduction:**\nBriefly outline the context of the PIB release.\n\n**Body:**\n*   **Point 1:** Impact on target beneficiaries.\n*   **Point 2:** Strategic importance for national goals.\n*   **Point 3:** Challenges in implementation.\n\n**Conclusion:**\nSummarize with a forward-looking statement regarding sustainable development."
            },
            {
                "question": f"Critically analyze the role of the {item.get('ministry', 'concerned Ministry')} in executing the initiatives detailed in this release. (250 words)",
                "answer": "### Model Approach\n\n**Introduction:**\nDefine the core mandate of the Ministry.\n\n**Body:**\n*   **Strengths:** Effective policy formulation and resource allocation.\n*   **Weaknesses:** Bureaucratic hurdles or funding gaps.\n*   **Way Forward:** Suggestions for better inter-ministerial coordination.\n\n**Conclusion:**\nConclude with the necessity of robust institutional frameworks."
            }
        ]
        needs_update = True

with open(path, 'w') as f:
    json.dump(data, f, indent=2)

print("Successfully injected realistic mock data for existing PIBs.")
