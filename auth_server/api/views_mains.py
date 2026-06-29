import os
import json
import uuid
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import MainsQuestion, MainsEvaluation
from google import genai
from google.genai import types

def seed_mains_questions():
    if MainsQuestion.objects.exists():
        return
        
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    json_path = os.path.join(base_dir, 'data', 'mains_questions_by_topic.json')
    
    questions = []
    if os.path.exists(json_path):
        import re
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                for topic, days_list in data.items():
                    for day_data in days_list:
                        day_id = day_data.get('day_id', '')
                        # Extract GS paper number, e.g. "GS 1 - Day 11" -> paper 1
                        gs_paper = 4  # Default to GS 4
                        gs_match = re.search(r'GS\s*(\d+)', day_id, re.IGNORECASE)
                        if gs_match:
                            gs_paper = int(gs_match.group(1))
                            
                        for q in day_data.get('questions', []):
                            # Generate key points from question words if empty
                            kp = q.get('key_points', [])
                            if not kp:
                                words = [w for w in re.findall(r'\b\w{5,}\b', q.get('question_text', ''))]
                                kp = list(dict.fromkeys(words))[:6] # deduplicate preserving order
                                
                            questions.append({
                                'gs_paper': gs_paper,
                                'syllabus_topic': topic,
                                'question_text': q.get('question_text', ''),
                                'model_answer': q.get('model_answer', ''),
                                'key_points': kp
                            })
        except Exception as e:
            print(f"Error loading mains JSON seed: {e}")
            
    # Fallback to defaults if JSON loading yielded nothing
    if not questions:
        questions = [
            {
                "gs_paper": 1,
                "syllabus_topic": "Modern Indian History & Contribution of Women",
                "question_text": "Discuss the role of women in the Indian freedom struggle, highlighting their contributions to various national movements.",
                "model_answer": "Women played a stellar role in the Indian national movement. From the early resistance like Rani Lakshmibai of Jhansi to Mahatma Gandhi's mass movements, women's participation evolved from supportive roles to leadership positions. During the Non-Cooperation and Civil Disobedience movements, women like Sarojini Naidu, Kasturba Gandhi, and Kamala Nehru led picketing of foreign liquor and cloth shops. Revolutionary leaders like Kalpana Dutt and Pritilata Waddedar actively participated in armed resistance. In the Quit India Movement of 1942, with top leaders jailed, Aruna Asaf Ali hoisted the tricolor at Gowalia Tank Maidan, while Usha Mehta operated an underground radio station. Subhas Chandra Bose's INA had a dedicated women's regiment named the Rani of Jhansi Regiment led by Captain Lakshmi Sahgal. Their contribution was crucial in making the freedom struggle a truly representative mass movement.",
                "key_points": ["Rani Lakshmibai", "Sarojini Naidu", "Aruna Asaf Ali", "Usha Mehta", "Rani of Jhansi Regiment", "Lakshmi Sahgal", "Civil Disobedience", "Quit India Movement"]
            },
            {
                "gs_paper": 1,
                "syllabus_topic": "Physical Geography & Monsoon Dynamics",
                "question_text": "Explain the mechanism of the Indian monsoon and analyze the impact of global warming on monsoon variability.",
                "model_answer": "The Indian monsoon is a complex meteorological phenomenon driven by the differential heating of land and water, the shifting of the Intertropical Convergence Zone (ITCZ), and the influence of jet streams and Tibetan heating. During summer, the intense heating of the Indian landmass creates a low-pressure area, drawing in moisture-laden winds from the high-pressure zone over the southern Indian Ocean. Global warming is significantly altering this mechanism. It leads to rising sea surface temperatures (SST) in the Indian Ocean, modifying the land-sea temperature gradient. Consequently, while the overall quantity of rainfall might show unpredictable shifts, the variability is rising. There is an increase in extreme weather events—short spells of torrential rainfall causing floods (e.g., in Himachal and Kerala) coupled with prolonged dry spells causing droughts. The erratic shifting of the monsoon onset and withdrawal dates directly impacts agricultural sowing cycles.",
                "key_points": ["Differential heating", "ITCZ shift", "Tibetan plateau heating", "Sea Surface Temperature (SST)", "Monsoon variability", "Extreme rain events", "Agricultural impact"]
            },
            {
                "gs_paper": 2,
                "syllabus_topic": "Constitutional Offices & Federalism",
                "question_text": "Discuss the constitutional position of the Governor. To what extent has the office of the Governor been a source of friction in Center-State relations?",
                "model_answer": "Under Article 153 and 154 of the Constitution, the Governor is the executive head of the State, appointed by the President. The Governor has a dual role: as the constitutional head of the State government and as a representative of the Central government. Friction arises primarily from the exercise of discretionary powers under Article 163, such as: 1. Recommendation of President's Rule under Article 356. 2. Reservation of bills for presidential assent (Article 200). 3. Selection of Chief Minister in a hung assembly. 4. Summoning and proroguing the house. Commissions like Sarkaria and Punchhi have noted the partisan use of the office by ruling parties at the center to destabilize state governments. To resolve this, recommendations suggest appointing eminent persons detached from active politics and consulting the Chief Minister before appointment.",
                "key_points": ["Article 153/154", "Dual role", "Article 163 discretionary powers", "Article 200 bill reservation", "Article 356 President's rule", "Sarkaria Commission", "Punchhi Commission"]
            },
            {
                "gs_paper": 2,
                "syllabus_topic": "Governance & Civil Society",
                "question_text": "Assess the role of Self Help Groups (SHGs) in fostering rural development and women empowerment in India.",
                "model_answer": "Self Help Groups (SHGs) are informal associations of rural people who pool resources to solve common problems. Through schemes like Deendayal Antyodaya Yojana - National Rural Livelihoods Mission (DAY-NRLM), SHGs have become key pillars of rural development. 1. Economic Empowerment: Access to microfinance reduces reliance on exploitative moneylenders, fosters thrift, and supports micro-enterprises. 2. Social Empowerment: Regular meetings build confidence, enhance financial literacy, and allow collective action against social evils like domestic violence and alcoholism. 3. Local Governance: SHG members actively participate in Gram Sabhas, improving delivery of public services (PDS, health). However, challenges like low skill levels, credit linkage delays, and regional disparities (skewed towards southern states) persist. Enhancing digital literacy and market linkages is key to scaling their impact.",
                "key_points": ["DAY-NRLM", "Microfinance", "Social empowerment", "Financial inclusion", "Collective action", "Gram Sabha participation", "Digital literacy", "Market linkages"]
            },
            {
                "gs_paper": 3,
                "syllabus_topic": "Indian Economy & Agriculture",
                "question_text": "What are the major structural challenges facing Indian agriculture? How can digital technologies facilitate sustainable farming and double farmers' income?",
                "model_answer": "Indian agriculture supports over 50% of the population but contributes only ~18% to GDP. Key structural challenges include: 1. Extreme fragmentation of landholdings (average size < 1.08 hectares), preventing economies of scale. 2. Disproportionate water use due to flood irrigation and power subsidies, depleting groundwater tables. 3. Climate change vulnerability and inadequate post-harvest infrastructure (cold chains, warehousing). Digital technologies can revolutionize farming via: 1. Precision Agriculture: Internet of Things (IoT) sensors, drones, and satellite imaging for soil health, moisture levels, and crop health tracking. 2. Direct Market Access: Platforms like e-NAM bypass middlemen, facilitating fair price discovery. 3. Agritech FinTech: Digital lending and crop insurance (PMFBY) backed by yield data. Integrating these reduces input costs, improves yields, and secures better margins.",
                "key_points": ["Land fragmentation", "Groundwater depletion", "Precision agriculture", "Drones & IoT", "e-NAM", "Post-harvest infrastructure", "Climate vulnerability", "Input cost reduction"]
            },
            {
                "gs_paper": 3,
                "syllabus_topic": "Cyber Security & National Security",
                "question_text": "Analyze the threat posed by cyber warfare to India's critical national infrastructure and discuss the policy measures needed for a robust cyber defense.",
                "model_answer": "Critical Information Infrastructure (CII)—including power grids, transport networks, banking systems, and nuclear facilities—is highly vulnerable to state and non-state sponsored cyber threats. Recent incidents, like the malware attack on Kudankulam Nuclear Power Plant and power grid outages in Mumbai, highlight the rising threat profile. Challenges include: 1. Sophistication of APT (Advanced Persistent Threat) attacks. 2. Dependency on imported hardware containing potential backdoors. 3. Shortage of skilled cybersecurity professionals. Policy measures needed: 1. Implementation of the National Cyber Security Strategy. 2. Strengthening the National Critical Information Infrastructure Protection Centre (NCIIPC) and CERT-In. 3. Conducting regular cyber security audits and mock drills (Cyber Exercises). 4. Developing indigenous capability in hardware and software design, fostering public-private partnerships.",
                "key_points": ["Critical Information Infrastructure (CII)", "APT attacks", "CERT-In", "NCIIPC", "National Cyber Security Strategy", "Indigenous hardware", "Security audits"]
            },
            {
                "gs_paper": 4,
                "syllabus_topic": "Ethics in Public Administration",
                "question_text": "What do you understand by the term 'administrative ethics'? Discuss the core values that should guide public servants in administrative decision-making.",
                "model_answer": "Administrative ethics refers to the professional moral code and standards of conduct that guide civil servants in the exercise of their official duties and discretionary powers. It ensures that public authority is used for public good and not personal gain. Nolan Committee outlined seven principles of public life: Selflessness, Integrity, Objectivity, Accountability, Openness, Honesty, and Leadership. Other core values include: 1. Empathy and Compassion: Especially towards vulnerable sections, ensuring inclusive governance (Antyodaya). 2. Impartiality and Non-partisanship: Serving the public without political bias or favoritism. 3. Commitment to Rule of Law: Ensuring actions conform to constitutional values and rules. Practicing these values builds public trust and transparency.",
                "key_points": ["Nolan Committee principles", "Selflessness & Integrity", "Objectivity & Accountability", "Empathy & Compassion", "Impartiality & Non-partisanship", "Public trust", "Constitutional values"]
            },
            {
                "gs_paper": 4,
                "syllabus_topic": "Ethics Case Study",
                "question_text": "You are the District Magistrate of a district experiencing high communal tension due to a provocative social media post. A large crowd has gathered outside the police station demanding the immediate arrest of the accused, while another group is preparing for counter-protests. Outline your immediate course of action and a long-term strategy to prevent communal flare-ups.",
                "model_answer": "This situation requires maintaining law and order while ensuring administrative objectivity, empathy, and decisive leadership. Immediate course of action: 1. Deploy security forces (police, CAPF) and impose Section 144 of CrPC to disperse assemblies and prevent clashes. 2. Engage community elders and religious leaders from both sides, forming peace committees to appeal for calm. 3. Issue a temporary suspension of internet services under Telecom Suspension Rules to stop the viral spread of rumors. 4. Register an FIR and ensure transparent, lawful action against the creator of the post to pacify the protestors. Long-term strategy: 1. Set up a Social Media Monitoring Cell under district police to detect communal trends early. 2. Foster regular inter-faith dialogue sessions and youth engagements to build social cohesion. 3. Run digital literacy campaigns in schools and colleges on identifying and reporting fake news and hate speech.",
                "key_points": ["Section 144 CrPC", "Peace committees", "Internet suspension", "FIR and transparent action", "Social Media Monitoring Cell", "Inter-faith dialogue", "Digital literacy campaigns"]
            }
        ]
        
    for q in questions:
        if not MainsQuestion.objects.filter(question_text=q["question_text"]).exists():
            MainsQuestion.objects.create(
                gs_paper=q["gs_paper"],
                syllabus_topic=q["syllabus_topic"],
                question_text=q["question_text"],
                model_answer=q["model_answer"],
                key_points=q["key_points"]
            )

class MainsQuestionsListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        seed_mains_questions()
        
        gs_paper = request.GET.get('gs_paper')
        if gs_paper:
            questions = MainsQuestion.objects.filter(gs_paper=gs_paper)
        else:
            questions = MainsQuestion.objects.all()
            
        data = [
            {
                'id': str(q.id),
                'gs_paper': q.gs_paper,
                'syllabus_topic': q.syllabus_topic,
                'question_text': q.question_text,
                'key_points': q.key_points
            } for q in questions
        ]
        return Response({'questions': data})

class MainsQuestionDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, question_id):
        try:
            q = MainsQuestion.objects.get(id=question_id)
            return Response({
                'id': str(q.id),
                'gs_paper': q.gs_paper,
                'syllabus_topic': q.syllabus_topic,
                'question_text': q.question_text,
                'model_answer': q.model_answer,
                'key_points': q.key_points
            })
        except MainsQuestion.DoesNotExist:
            return Response({'error': 'Question not found'}, status=status.HTTP_404_NOT_FOUND)

class MainsEvaluateAnswerView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, question_id):
        try:
            q = MainsQuestion.objects.get(id=question_id)
        except MainsQuestion.DoesNotExist:
            return Response({'error': 'Question not found'}, status=status.HTTP_404_NOT_FOUND)

        user_answer = request.data.get('user_answer', '').strip()
        if not user_answer:
            return Response({'error': 'Answer text is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Evaluate using Gemini
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            return Response({'error': 'Gemini API key is not configured.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        prompt = f"""
        You are an expert UPSC Civil Services Mains Examination evaluator. Evaluate this subjective answer.
        
        Question Paper: GS-{q.gs_paper}
        Syllabus Topic: {q.syllabus_topic}
        Question: {q.question_text}
        
        Model Answer for Reference:
        {q.model_answer}
        
        Expected Key Points/Keywords:
        {json.dumps(q.key_points)}
        
        Student's Answer:
        {user_answer}
        
        Evaluate the answer strictly according to UPSC criteria:
        1. Introduction (0-10): Relevancy and context setting.
        2. Body (0-10): Addressing the direct directives, quality of arguments, multi-dimensionality (PEESTLE), inclusion of articles/commissions.
        3. Conclusion (0-10): Way forward, balanced summary, optimistic ending.
        4. Structure & Flow (0-10): Cohesion, clarity, formatting.
        
        Identify any specific missing facts, constitutional articles, Supreme Court cases, or data points from the model answer/expected key points that the student failed to include.
        Provide constructive advice on structural flaws and how to improve.
        
        Output your response as JSON with this schema:
        {{
            "intro_score": 8,
            "body_score": 7,
            "conclusion_score": 8,
            "structure_score": 9,
            "overall_score": 8.0,
            "factual_feedback": ["list of missing key facts, cases, or articles"],
            "structural_feedback": "Detailed text feedback on flow, presentation, structure, way forward"
        }}
        """

        try:
            client = genai.Client(api_key=api_key)
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.4
                )
            )

            result = json.loads(response.text)
            
            # Save evaluation to database
            eval_entry = MainsEvaluation.objects.create(
                user=request.user,
                question=q,
                user_answer=user_answer,
                intro_score=result.get('intro_score', 0),
                body_score=result.get('body_score', 0),
                conclusion_score=result.get('conclusion_score', 0),
                structure_score=result.get('structure_score', 0),
                factual_feedback=result.get('factual_feedback', []),
                structural_feedback=result.get('structural_feedback', ''),
                overall_score=result.get('overall_score', 0.0)
            )
            
            return Response({
                'evaluation_id': str(eval_entry.id),
                'intro_score': eval_entry.intro_score,
                'body_score': eval_entry.body_score,
                'conclusion_score': eval_entry.conclusion_score,
                'structure_score': eval_entry.structure_score,
                'overall_score': eval_entry.overall_score,
                'factual_feedback': eval_entry.factual_feedback,
                'structural_feedback': eval_entry.structural_feedback,
                'model_answer': q.model_answer
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({'error': f'AI evaluation failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class MainsEvaluationsListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        evals = MainsEvaluation.objects.filter(user=request.user).order_by('-evaluated_at')
        data = [
            {
                'id': str(ev.id),
                'question_id': str(ev.question.id),
                'question_text': ev.question.question_text,
                'gs_paper': ev.question.gs_paper,
                'overall_score': ev.overall_score,
                'evaluated_at': ev.evaluated_at
            } for ev in evals
        ]
        return Response({'evaluations': data})

class MainsEvaluationDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, evaluation_id):
        try:
            ev = MainsEvaluation.objects.get(id=evaluation_id, user=request.user)
            return Response({
                'id': str(ev.id),
                'question_id': str(ev.question.id),
                'question_text': ev.question.question_text,
                'gs_paper': ev.question.gs_paper,
                'user_answer': ev.user_answer,
                'intro_score': ev.intro_score,
                'body_score': ev.body_score,
                'conclusion_score': ev.conclusion_score,
                'structure_score': ev.structure_score,
                'overall_score': ev.overall_score,
                'factual_feedback': ev.factual_feedback,
                'structural_feedback': ev.structural_feedback,
                'model_answer': ev.question.model_answer,
                'evaluated_at': ev.evaluated_at
            })
        except MainsEvaluation.DoesNotExist:
            return Response({'error': 'Evaluation not found'}, status=status.HTTP_404_NOT_FOUND)
