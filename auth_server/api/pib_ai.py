import os
import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate

def generate_pib_content_ai(text):
    """
    Generates summary and quiz for a PIB release.
    """
    if not text:
        return None, None

    # Use the model defined in environment or default
    model_name = os.environ.get("GOOGLE_GENAI_MODEL", "gemini-2.5-flash")
    
    try:
        model = ChatGoogleGenerativeAI(model=model_name, temperature=0.3)
    except Exception as e:
        print(f"Error initializing ChatGoogleGenerativeAI: {e}")
        return None, None
    
    prompt = PromptTemplate.from_template("""
    You are an expert UPSC exam content creator. 
    Analyze the following PIB (Press Information Bureau) release and create study material for UPSC aspirants.
    
    Release Content:
    {text}
    
    Output Format (JSON):
    {{
        "summary": "A comprehensive, detailed summary of the release. It should cover all key facts, schemes, data points, and policy decisions mentioned. Organize with clear markdown headings and bullet points. Make it suitable for deep study.",
        "quiz": [
            {{
                "question": "Question text",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correct_answer": "Option A",
                "explanation": "Brief explanation"
            }}
        ],
        "mains_questions": [
            {{
                "question": "A subjective question relevant to UPSC Mains (General Studies) based on this release.",
                "answer": "A model answer structure or key points to include in the answer. Use markdown."
            }}
        ]
    }}
    
    Generate 5 high-quality Prelims MCQs and 2 Mains Questions. Returns ONLY valid JSON.
    """)
    
    chain = prompt | model
    
    try:
        response = chain.invoke({"text": text})
        content = response.content
        # Clean markdown code blocks if present
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
             content = content.split("```")[1].split("```")[0].strip()
        
        print(f"DEBUG_AG: Content Type: {type(content)}")
        print(f"DEBUG_AG: Content: {content}")
        
        data = json.loads(content)
        return data.get("summary"), data.get("quiz"), data.get("mains_questions")
    except Exception as e:
        print(f"AI Generation Error: {e}")
        return None, None, None
