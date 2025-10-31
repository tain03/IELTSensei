from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import openai
import os
from dotenv import load_dotenv
import json
from datetime import datetime

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Cấu hình OpenAI API
client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# IELTS Speaking test questions - Multiple test sets
SPEAKING_TESTS = {
    "test1": {
        "name": "Travel & Journey",
        "part1": {
            "title": "Part 1: Introduction and Interview (4-5 minutes)",
            "intro": "The examiner will ask you general questions about yourself and a range of familiar topics.",
            "topic": "Home & Accommodation",
            "questions": [
                "Do you live in a house or an apartment?",
                "Can you describe your home?",
                "What do you like most about your home?",
                "How long have you lived there?",
                "Would you like to move to a different home in the future?",
                "What kind of home would you like to have in the future?"
            ]
        },
        "part2": {
            "title": "Part 2: Long Turn (3-4 minutes)",
            "intro": "You will be given a topic card. You will have 1 minute to prepare and then speak for 2 minutes.",
            "topic": "Describe a memorable journey you have taken",
            "points": [
                "Where you went",
                "Who you went with",
                "What you did there",
                "And explain why this journey was memorable for you"
            ],
            "preparation_time": 60,
            "speaking_time": 120
        },
        "part3": {
            "title": "Part 3: Two-way Discussion (4-5 minutes)",
            "intro": "The examiner will ask you further questions related to the topic in Part 2.",
            "topic": "Travel & Tourism",
            "questions": [
                "How has travel changed compared to the past?",
                "What are the benefits of traveling to different countries?",
                "Do you think tourism has any negative effects on local communities?",
                "How might technology change the way we travel in the future?"
            ]
        }
    },
    "test2": {
        "name": "Technology & Learning",
        "part1": {
            "title": "Part 1: Introduction and Interview (4-5 minutes)",
            "intro": "The examiner will ask you general questions about yourself and a range of familiar topics.",
            "topic": "Technology",
            "questions": [
                "Do you use technology a lot?",
                "What kind of technology do you use most often?",
                "How has technology changed your life?",
                "Do you think technology makes life easier or more complicated?",
                "What new technology would you like to learn about?",
                "Do you prefer to communicate with people online or face-to-face?"
            ]
        },
        "part2": {
            "title": "Part 2: Long Turn (3-4 minutes)",
            "intro": "You will be given a topic card. You will have 1 minute to prepare and then speak for 2 minutes.",
            "topic": "Describe a useful skill you learned",
            "points": [
                "What the skill was",
                "How you learned it",
                "How long it took to learn",
                "And explain why this skill is useful to you"
            ],
            "preparation_time": 60,
            "speaking_time": 120
        },
        "part3": {
            "title": "Part 3: Two-way Discussion (4-5 minutes)",
            "intro": "The examiner will ask you further questions related to the topic in Part 2.",
            "topic": "Education & Skills",
            "questions": [
                "What skills do you think are most important for young people to learn today?",
                "How has education changed in recent years?",
                "Do you think practical skills are more important than academic knowledge?",
                "What role should technology play in education?"
            ]
        }
    },
    "test3": {
        "name": "Work & Career",
        "part1": {
            "title": "Part 1: Introduction and Interview (4-5 minutes)",
            "intro": "The examiner will ask you general questions about yourself and a range of familiar topics.",
            "topic": "Work or Studies",
            "questions": [
                "Do you work or are you a student?",
                "What do you do? / What do you study?",
                "Why did you choose this job/course?",
                "What do you like most about your work/studies?",
                "What are your responsibilities at work? / What subjects do you study?",
                "What would you like to do in the future?"
            ]
        },
        "part2": {
            "title": "Part 2: Long Turn (3-4 minutes)",
            "intro": "You will be given a topic card. You will have 1 minute to prepare and then speak for 2 minutes.",
            "topic": "Describe a person who inspired you to do something interesting",
            "points": [
                "Who this person is",
                "How you know this person",
                "What interesting thing they inspired you to do",
                "And explain how this person inspired you"
            ],
            "preparation_time": 60,
            "speaking_time": 120
        },
        "part3": {
            "title": "Part 3: Two-way Discussion (4-5 minutes)",
            "intro": "The examiner will ask you further questions related to the topic in Part 2.",
            "topic": "Role Models & Success",
            "questions": [
                "What qualities make someone a good role model?",
                "Do you think celebrities are good role models for young people?",
                "How has the definition of success changed over time?",
                "Is it more important to be happy or successful in your career?"
            ]
        }
    },
    "test4": {
        "name": "Environment & Nature",
        "part1": {
            "title": "Part 1: Introduction and Interview (4-5 minutes)",
            "intro": "The examiner will ask you general questions about yourself and a range of familiar topics.",
            "topic": "Nature & Environment",
            "questions": [
                "Do you like being in nature?",
                "What do you usually do when you're in natural places?",
                "Have you ever been to any famous natural attractions?",
                "Do you think it's important to protect the environment?",
                "What do you do to help protect the environment?",
                "Would you like to live closer to nature?"
            ]
        },
        "part2": {
            "title": "Part 2: Long Turn (3-4 minutes)",
            "intro": "You will be given a topic card. You will have 1 minute to prepare and then speak for 2 minutes.",
            "topic": "Describe a place in nature that you enjoyed visiting",
            "points": [
                "Where this place was",
                "When you went there",
                "What you did there",
                "And explain why you enjoyed visiting this place"
            ],
            "preparation_time": 60,
            "speaking_time": 120
        },
        "part3": {
            "title": "Part 3: Two-way Discussion (4-5 minutes)",
            "intro": "The examiner will ask you further questions related to the topic in Part 2.",
            "topic": "Environmental Issues",
            "questions": [
                "What are the biggest environmental problems facing the world today?",
                "What can individuals do to help protect the environment?",
                "Should governments do more to address environmental issues?",
                "How do you think climate change will affect future generations?"
            ]
        }
    },
    "test5": {
        "name": "Culture & Entertainment",
        "part1": {
            "title": "Part 1: Introduction and Interview (4-5 minutes)",
            "intro": "The examiner will ask you general questions about yourself and a range of familiar topics.",
            "topic": "Music & Entertainment",
            "questions": [
                "Do you like listening to music?",
                "What kind of music do you like?",
                "Have you been to any concerts?",
                "Do you play any musical instruments?",
                "How important is music in your daily life?",
                "Has your taste in music changed over the years?"
            ]
        },
        "part2": {
            "title": "Part 2: Long Turn (3-4 minutes)",
            "intro": "You will be given a topic card. You will have 1 minute to prepare and then speak for 2 minutes.",
            "topic": "Describe a movie or TV show that you enjoyed watching",
            "points": [
                "What it was about",
                "When and where you watched it",
                "Who you watched it with",
                "And explain why you enjoyed watching it"
            ],
            "preparation_time": 60,
            "speaking_time": 120
        },
        "part3": {
            "title": "Part 3: Two-way Discussion (4-5 minutes)",
            "intro": "The examiner will ask you further questions related to the topic in Part 2.",
            "topic": "Media & Entertainment",
            "questions": [
                "How has the way people consume entertainment changed in recent years?",
                "Do you think streaming services have improved people's entertainment experience?",
                "What impact do movies and TV shows have on society?",
                "Will traditional cinemas disappear in the future?"
            ]
        }
    }
}

# Current test selection (can be randomized or chosen by user)
import random
SPEAKING_TEST = SPEAKING_TESTS["test1"]  # Default test

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/test-list', methods=['GET'])
def get_test_list():
    """Trả về danh sách các bài test"""
    test_list = [
        {"id": key, "name": value["name"]}
        for key, value in SPEAKING_TESTS.items()
    ]
    return jsonify(test_list)

@app.route('/api/test-structure', methods=['GET'])
def get_test_structure():
    """Trả về cấu trúc bài test IELTS Speaking"""
    test_id = request.args.get('test_id', 'test1')
    selected_test = SPEAKING_TESTS.get(test_id, SPEAKING_TESTS['test1'])
    return jsonify(selected_test)

@app.route('/api/transcribe', methods=['POST'])
def transcribe_audio():
    """Chuyển đổi audio sang text với timestamps"""
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400
        
        audio_file = request.files['audio']
        part = request.form.get('part', 'unknown')
        question_index = request.form.get('question_index', '0')
        
        # Read file content and create a tuple with filename
        file_content = audio_file.read()
        file_tuple = (audio_file.filename, file_content, audio_file.content_type)
        
        # Transcribe audio với Whisper
        transcript = client.audio.transcriptions.create(
            model="whisper-1",
            file=file_tuple,
            language="en",
            response_format="verbose_json",
            timestamp_granularities=["word"]
        )
        
        # Lưu kết quả
        result = {
            'text': transcript.text,
            'part': part,
            'question_index': int(question_index),
            'duration': transcript.duration if hasattr(transcript, 'duration') else None,
            'words': []
        }
        
        if hasattr(transcript, 'words') and transcript.words:
            result['words'] = [
                {
                    'word': word_info.word,
                    'start': word_info.start,
                    'end': word_info.end
                }
                for word_info in transcript.words
            ]
        
        return jsonify(result)
    
    except Exception as e:
        print(f"Error in transcription: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/evaluate', methods=['POST'])
def evaluate_speaking():
    """Đánh giá toàn bộ bài Speaking với AI"""
    try:
        data = request.json
        responses = data.get('responses', [])
        evaluate_type = data.get('evaluate_type', 'full')  # 'full' or 'single_part'
        part = data.get('part', None)  # 'part1', 'part2', or 'part3'
        
        # Chuẩn bị dữ liệu cho GPT
        evaluation_prompt = create_evaluation_prompt(responses, evaluate_type, part)
        
        # Tạo system prompt dựa trên evaluation type
        if evaluate_type == 'single_part':
            part_names = {
                'part1': 'Part 1 (Introduction and Interview)',
                'part2': 'Part 2 (Long Turn)',
                'part3': 'Part 3 (Two-way Discussion)'
            }
            part_name = part_names.get(part, 'a section')
            system_content = f"""You are an official IELTS Speaking examiner.
You will receive a student's spoken answers for {part_name} only (converted to text) and the questions they were responding to.
Your task is to evaluate this specific part as if it were given in a real IELTS Speaking test.

Follow the IELTS Speaking band descriptors strictly and provide detailed, specific evaluation for this part.
Note: Since you're only evaluating {part_name}, provide feedback specific to the characteristics expected for this section."""
        else:
            system_content = """You are an official IELTS Speaking examiner. 
You will receive a student's spoken answers (converted to text) and the questions they were responding to. 
Your task is to evaluate the answers as if they were given in a real IELTS Speaking test.

Follow the IELTS Speaking band descriptors strictly and provide detailed, specific evaluation."""
        
        # Gọi GPT để đánh giá
        completion = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": system_content + """

Return your response in JSON format with the following structure:
{
    "overall_band": float (average band rounded to nearest 0.5),
    "criteria_scores": {
        "fluency_coherence": float,
        "lexical_resource": float,
        "grammatical_range": float,
        "pronunciation": float
    },
    "detailed_feedback": {
        "fluency_coherence": {
            "score": float,
            "analysis": "Detailed analysis covering: pace of speech, pauses and hesitations, coherence and cohesion, use of linking devices, ability to develop topics. Be specific about what was observed."
        },
        "lexical_resource": {
            "score": float,
            "analysis": "Detailed analysis covering: vocabulary range, use of less common/idiomatic expressions, collocation, word choice appropriacy, any lexical errors or repetitions. Provide specific examples."
        },
        "grammatical_range": {
            "score": float,
            "analysis": "Detailed analysis covering: variety of sentence structures (simple, compound, complex), tense usage and accuracy, grammatical errors and their frequency/severity. Highlight specific structures used or missing."
        },
        "pronunciation": {
            "score": float,
            "analysis": "Based on transcript analysis: assess word stress patterns, sentence rhythm, clarity of expression. Note: actual pronunciation cannot be fully assessed from transcript alone, so focus on indicators of speech clarity and naturalness evident in the text."
        }
    },
    "examiner_feedback": "2-3 sentences of natural feedback as an IELTS examiner: What was good, what to improve, and how to reach the next band level. Be encouraging but honest.",
    "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
    "areas_for_improvement": ["specific area 1 with actionable advice", "specific area 2 with actionable advice", "specific area 3 with actionable advice"]
}

Important guidelines:
- Be specific and reference actual content from the responses
- Scores should reflect official IELTS band descriptors
- Feedback should be professional, constructive, and actionable
- Consider the part type (Part 1: short responses, Part 2: long turn, Part 3: abstract discussion)
- Overall band is the average of the 4 criteria, rounded to nearest 0.5"""
                },
                {
                    "role": "user",
                    "content": evaluation_prompt
                }
            ],
            temperature=0.5,
            response_format={"type": "json_object"}
        )
        
        evaluation = json.loads(completion.choices[0].message.content)
        evaluation['timestamp'] = datetime.now().isoformat()
        
        return jsonify(evaluation)
    
    except Exception as e:
        print(f"Error in evaluation: {e}")
        return jsonify({'error': str(e)}), 500

def create_evaluation_prompt(responses, evaluate_type='full', part=None):
    """Tạo prompt cho GPT để đánh giá"""
    if evaluate_type == 'single_part':
        part_names = {
            'part1': 'PART 1 (Introduction and Interview)',
            'part2': 'PART 2 (Long Turn)',
            'part3': 'PART 3 (Two-way Discussion)'
        }
        part_name = part_names.get(part, 'SECTION')
        prompt = f"=== IELTS SPEAKING {part_name} EVALUATION ===\n\n"
    else:
        prompt = "=== IELTS SPEAKING TEST EVALUATION ===\n\n"
    
    for response in responses:
        response_part = response.get('part', 'unknown')
        question_index = response.get('question_index', 0)
        text = response.get('text', '')
        duration = response.get('duration', 0)
        word_count = len(text.split())
        
        prompt += f"{'='*60}\n"
        prompt += f"[{response_part.upper()} - Question {question_index + 1}]\n"
        prompt += f"{'='*60}\n\n"
        
        if response_part == 'part1':
            question = SPEAKING_TEST['part1']['questions'][question_index] if question_index < len(SPEAKING_TEST['part1']['questions']) else "Question"
            prompt += f"QUESTION: {question}\n\n"
        elif response_part == 'part2':
            topic = SPEAKING_TEST['part2']['topic']
            points = SPEAKING_TEST['part2']['points']
            prompt += f"TOPIC: {topic}\n\n"
            prompt += "Points to cover:\n"
            for point in points:
                prompt += f"  • {point}\n"
            prompt += "\n"
        elif response_part == 'part3':
            question = SPEAKING_TEST['part3']['questions'][question_index] if question_index < len(SPEAKING_TEST['part3']['questions']) else "Question"
            prompt += f"QUESTION: {question}\n\n"
        
        prompt += f"STUDENT'S ANSWER:\n{text}\n\n"
        prompt += f"[Duration: {duration:.1f}s | Word count: {word_count}]\n\n"
    
    prompt += "="*60 + "\n\n"
    
    if evaluate_type == 'single_part':
        prompt += f"""EVALUATION INSTRUCTIONS:
Please evaluate this {part_name} according to official IELTS Speaking band descriptors.
Provide detailed, specific analysis for each criterion with concrete examples from the student's responses.
Consider the specific expectations for {part_name}:
- Part 1: Short, direct answers on familiar topics
- Part 2: Extended monologue on given topic (1-2 minutes)
- Part 3: More abstract discussion with complex ideas

The evaluation should be professional, constructive, and actionable.
All detailed feedback should be in Vietnamese, but use English for criterion names and technical terms."""
    else:
        prompt += """EVALUATION INSTRUCTIONS:
Please evaluate these responses according to official IELTS Speaking band descriptors.
Provide detailed, specific analysis for each criterion with concrete examples from the student's responses.
The evaluation should be professional, constructive, and actionable.
All detailed feedback should be in Vietnamese, but use English for criterion names and technical terms."""
    
    return prompt

if __name__ == '__main__':
    # Tạo thư mục templates nếu chưa có
    if not os.path.exists('templates'):
        os.makedirs('templates')
    
    print("Starting IELTS Speaking Practice Web App...")
    print("Visit: http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)

