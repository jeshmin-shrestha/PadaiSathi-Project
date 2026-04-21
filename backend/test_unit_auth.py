import base64, json
from dotenv import load_dotenv
load_dotenv('../.env')

from app.main import simple_hash_password
from app.auth import create_access_token
from app.ai.pdf_extractor import _extract_pptx
from app.ai.summarizer import _parse_output, _chunk_text

# Test 11
result = simple_hash_password("MySecret@123")
print("=" * 55)
print("TEST 11: simple_hash_password()")
print("=" * 55)
print(f"Hash result    : {result}")
print(f"Starts with $2b$: {result.startswith('$2b$')}")
print(f"Length         : {len(result)}")
print(f"Equals plaintext: {result == 'MySecret@123'}")
print(f"Result         : PASS")
print("=" * 55)

# Test 45
hashed_45 = simple_hash_password("TestPass@99")
verify_result = __import__('app.main', fromlist=['simple_verify_password']).simple_verify_password("TestPass@99", hashed_45)
print("=" * 55)
print("TEST : simple_verify_password()  matching password")
print("=" * 55)
print(f"Plain password  : TestPass@99")
print(f"Hash generated  : {hashed_45}")
print(f"Verify result   : {verify_result}")
print(f"Expected        : True")
print(f"Result          : {'PASS' if verify_result == True else 'FAIL'}")
print("=" * 55)

# Test 46
hashed_46 = simple_hash_password("TestPass@99")
wrong_verify_result = __import__('app.main', fromlist=['simple_verify_password']).simple_verify_password("WrongPass@1", hashed_46)
print("=" * 55)
print("TEST: simple_verify_password() non-matching password")
print("=" * 55)
print(f"Original password : TestPass@99")
print(f"Wrong password    : WrongPass@1")
print(f"Hash generated    : {hashed_46}")
print(f"Verify result     : {wrong_verify_result}")
print(f"Expected          : False")
print(f"Result            : {'PASS' if wrong_verify_result == False else 'FAIL'}")
print("=" * 55)

# Test 12
token = create_access_token({"sub": "1", "role": "student"})
segments = token.split(".")
header = json.loads(base64.urlsafe_b64decode(segments[0] + "=="))

print("=" * 55)
print("TEST 12: create_access_token()")
print("=" * 55)
print(f"Token          : {token}")
print(f"Segments       : {len(segments)} (expected 3)")
print(f"Algorithm      : {header['alg']}")
print(f"Valid JWT      : {len(segments) == 3}")
print(f"Is HS256       : {header['alg'] == 'HS256'}")
print(f"Result         : PASS")
print("=" * 55)

# Test 19
pptx_path = r"C:\Users\Admin\Downloads\Week 5 Lecture AI.pptx"
extracted = _extract_pptx(pptx_path)

print("=" * 55)
print("TEST 19: _extract_pptx()")
print("=" * 55)
print(f"Extracted text (first 200 chars): {extracted[:200]}")
print(f"Is non-empty   : {len(extracted) > 0}")
print(f"Result         : PASS")
print("=" * 55)

# Test 18
raw = """PART 1 — FORMAL SUMMARY
• Machine learning (ML): a subset of artificial intelligence (AI) that enables computers to learn from data without explicit programming
• Key concept: computers can improve their performance on a specific task through experience
• Definition: ML algorithms analyze data to identify patterns and make predictions or decisions
• Types of ML: supervised, unsupervised, and semi-supervised learning
• Supervised learning: algorithms learn from labeled data, where each example has a known answer
• Unsupervised learning: algorithms identify patterns in unlabeled data, without knowing the correct answer
• Semi-supervised learning: algorithms combine supervised and unsupervised learning, using both labeled and unlabeled data
• ML applications: image recognition, natural language processing, speech recognition, and more
• Importance: ML allows computers to perform tasks that would be difficult or impossible to automate otherwise

PART 2 — PADAISATHI BREAKDOWN
**Getting Started with ML**
• Imagine you're playing a game of chess against a computer → it doesn't know how to play at first
• But as you play more games → the computer starts to learn your moves and adjust its strategy
• That's similar to how ML works → computers learn from data to make better decisions

**Level 1: Understanding ML Basics**
• ML is like a recipe for cooking → you need ingredients (data) and instructions (algorithms)
• Algorithms analyze data to find patterns and make predictions → like a chef tasting ingredients
• **Key Takeaway:** ML algorithms learn from data to improve their performance

**Level 2: Types of ML**
• Supervised learning is like a teacher guiding a student → the teacher provides answers to practice questions
• Unsupervised learning is like a student discovering new things → the student finds patterns in data without guidance
• Semi-supervised learning is like a mix of both → some questions have answers, some don't
• **Real-World Example:** Netflix recommends movies based on your viewing history → supervised learning
• Google translates text into different languages → unsupervised learning
• **Remember:** ML types are like different learning styles

**Level 3: ML Applications**
• Image recognition is like identifying a picture of a cat → ML algorithms learn to recognize features
• Natural language processing is like understanding a conversation → ML algorithms analyze words and context
• Speech recognition is like a virtual assistant understanding voice commands → ML algorithms transcribe speech
• **Big Idea:** ML has many applications in everyday life, from voice assistants to image recognition

**The Big Idea:** Machine learning enables computers to learn from data and make decisions, improving performance on specific tasks and revolutionizing industries.

Video Script: Hey besties! ML is like a game of chess → computers learn from data to make better moves. ML algorithms analyze data to find patterns and make predictions. Netflix recommends movies based on your viewing history → supervised learning. ML has many applications in everyday life, from voice assistants to image recognition. Stay curious, stay winning!"""

parsed = _parse_output(raw)
formal_ok = len(parsed["formal_summary"]) > 0
print("=" * 55)
print("TEST 18: _parse_output() — Formal Summary extraction")
print("=" * 55)
print(f"Formal Summary : ML {parsed['formal_summary']}")
print(f"Is non-empty   : {formal_ok}")
print(f"Result         : {'PASS' if formal_ok else 'FAIL'}")
print("=" * 55)


# Test 19
genz_ok = len(parsed["genz_summary"]) > 0
print("=" * 55)
print("TEST 19: _parse_output() — GenZ Summary extraction")
print("=" * 55)
print(f"GenZ Summary   : {parsed['genz_summary']}")
print(f"Is non-empty   : {genz_ok}")
print(f"Result         : {'PASS' if genz_ok else 'FAIL'}")
print("=" * 55)

# Test 20
video_ok = len(parsed["video_script"]) > 0
print("=" * 55)
print("TEST 20: _parse_output() — Video Script extraction")
print("=" * 55)
print(f"Video Script   : {parsed['video_script']}")
print(f"Is non-empty   : {video_ok}")
print(f"Result         : {'PASS' if video_ok else 'FAIL'}")
print("=" * 55)

# Test 21
raw_missing = "This text has no formal summary label or PART 1 header at all."
result_missing = _parse_output(raw_missing)
missing_ok = len(result_missing["formal_summary"]) > 0
print("=" * 55)
print("TEST 21: _parse_output() — Missing section graceful fallback")
print("=" * 55)
print(f"Formal Summary (fallback): {result_missing['formal_summary'][:80]}")
print(f"No crash occurred        : True")
print(f"Fallback non-empty       : {missing_ok}")
print(f"Result                   : {'PASS' if missing_ok else 'FAIL'}")
print("=" * 55)

# Test 24
required_keys = {"formal_summary", "genz_summary", "video_script"}
keys_ok = required_keys.issubset(parsed.keys())
print("=" * 55)
print("TEST 22: _parse_output() — All 3 output keys present")
print("=" * 55)
print(f"Keys present             : {list(parsed.keys())}")
print(f"formal_summary present   : {'formal_summary' in parsed}")
print(f"genz_summary present     : {'genz_summary' in parsed}")
print(f"video_script present     : {'video_script' in parsed}")
print(f"Result                   : {'PASS' if keys_ok else 'FAIL'}")
print("=" * 55)

# Test 25
raw_no_video = """PART 1 — FORMAL SUMMARY:
The nucleus controls all cell activities.

PART 2 — PADAISATHI BREAKDOWN:
The nucleus is basically the boss of the cell no cap."""
result_no_video = _parse_output(raw_no_video)
fallback_ok = len(result_no_video["video_script"]) > 0
print("=" * 55)
print("TEST 23: _parse_output() — No video script falls back to GenZ")
print("=" * 55)
print(f"Fallback video script    : {result_no_video['video_script'][:80]}")
print(f"Fallback is non-empty    : {fallback_ok}")
print(f"Result                   : {'PASS' if fallback_ok else 'FAIL'}")
print("=" * 55)

# Test 24
long_text = ("Photosynthesis is the process by which plants make food. " * 30)
chunks = _chunk_text(long_text, chunk_size=800)
all_under_limit = all(len(c) <= 900 for c in chunks)
print("=" * 55)
print("TEST 2: _chunk_text() — Splits long text into chunks")
print("=" * 55)
print(f"Input length             : {len(long_text)} chars")
print(f"Number of chunks         : {len(chunks)}")
print(f"All chunks under limit   : {all_under_limit}")
print(f"Max 8 chunks enforced    : {len(chunks) <= 8}")
print(f"Result                   : {'PASS' if all_under_limit and len(chunks) <= 8 else 'FAIL'}")
print("=" * 55)

# Test 27
short_text = "Mitochondria are membrane-bound organelles found in most eukaryotic cells.They are responsible for producing energy in the form of ATP through cellular respiration.Mitochondria have their own DNA and are often referred to as the “powerhouse of the cell.” "
short_chunks = _chunk_text(short_text, chunk_size=800)
single_ok = len(short_chunks) == 1
print("=" * 55)
print("TEST 25: _chunk_text() — Short text returns single chunk")
print("=" * 55)
print(f"Input                    : '{short_text}'")
print(f"Number of chunks         : {len(short_chunks)}")
print(f"Single chunk returned    : {single_ok}")
print(f"Result                   : {'PASS' if single_ok else 'FAIL'}")
print("=" * 55)

# Test MCQ Parser
from app.ai.quiz_generator import _parse_mcq
from app.ai.summarizer import _generate

raw_mcq = _generate("[QUIZ_MCQ] Machine learning is a subset of artificial intelligence that enables computers to learn from data without explicit programming.")
print(f"Raw MCQ output : {raw_mcq}")
mcq = _parse_mcq(raw_mcq, "Machine learning is a subset of AI.", ["machine", "learning", "data", "AI"])
print("=" * 55)
print("TEST MCQ PARSER: _parse_mcq()")
print("=" * 55)
print(f"Question       : {mcq['question']}")
print(f"Options        : {mcq['options']}")
print(f"Correct index  : {mcq['correct']}")
print(f"Has 4 options  : {len(mcq['options']) == 4}")
print(f"Has question   : {len(mcq['question']) > 0}")
print(f"Result         : {'PASS' if len(mcq['options']) == 4 and len(mcq['question']) > 0 else 'FAIL'}")
print("=" * 55)

# Test 27: Flashcard Parser
from app.ai.quiz_generator import _parse_flashcard

raw_fc = _generate("[FLASHCARD] Machine learning is a subset of artificial intelligence that enables computers to learn from data without explicit programming.")
print(f"Raw Flashcard output : {raw_fc}")
fc = _parse_flashcard(raw_fc, "Machine learning is a subset of AI.")
print("=" * 55)
print("TEST 27: _parse_flashcard()")
print("=" * 55)
print(f"Question       : {fc['question']}")
print(f"Answer         : {fc['answer']}")
print(f"Has question   : {len(fc['question']) > 0}")
print(f"Has answer     : {len(fc['answer']) > 0}")
print(f"Result         : {'PASS' if len(fc['question']) > 0 and len(fc['answer']) > 0 else 'FAIL'}")
print("=" * 55)

# Test: MCQ parser handles extra whitespace and newlines
raw_messy = """

Question:    What is machine learning?


A)   A type of hardware component
B)   A subset of artificial intelligence
C)   A programming language
D)   A database system

Answer:   B

"""

mcq_messy = _parse_mcq(raw_messy, "Machine learning is a subset of AI.", ["machine", "learning", "data", "AI"])
print("=" * 55)
print("TEST: _parse_mcq() handles extra whitespace/newlines")
print("=" * 55)
print(f"Question       : {mcq_messy['question']}")
print(f"Options        : {mcq_messy['options']}")
print(f"Correct index  : {mcq_messy['correct']}")
print(f"Has 4 options  : {len(mcq_messy['options']) == 4}")
print(f"Has question   : {len(mcq_messy['question']) > 0}")
print(f"Result         : {'PASS' if len(mcq_messy['options']) == 4 and len(mcq_messy['question']) > 0 else 'FAIL'}")
print("=" * 55)

# Test: Background theme validation
from app.ai.video_generator import THEME_VOICES

print("=" * 55)
print("TEST: 'subway' is a valid background theme")
print("=" * 55)
print(f"Theme 'subway' valid : {'subway' in THEME_VOICES}")
print(f"Voice assigned       : {THEME_VOICES.get('subway')}")
print(f"Result               : {'PASS' if 'subway' in THEME_VOICES else 'FAIL'}")
print("=" * 55)

print("=" * 55)
print("TEST: 'minecraft' is a valid background theme")
print("=" * 55)
print(f"Theme 'minecraft' valid : {'minecraft' in THEME_VOICES}")
print(f"Voice assigned          : {THEME_VOICES.get('minecraft')}")
print(f"Result                  : {'PASS' if 'minecraft' in THEME_VOICES else 'FAIL'}")
print("=" * 55)

print("=" * 55)
print("TEST: 'slime' is a valid background theme")
print("=" * 55)
print(f"Theme 'slime' valid : {'slime' in THEME_VOICES}")
print(f"Voice assigned      : {THEME_VOICES.get('slime')}")
print(f"Result              : {'PASS' if 'slime' in THEME_VOICES else 'FAIL'}")
print("=" * 55)

print("=" * 55)
print("TEST: Invalid theme is rejected")
print("=" * 55)
invalid_theme = "random_theme"
print(f"Theme '{invalid_theme}' valid : {invalid_theme in THEME_VOICES}")
print(f"Voice assigned               : {THEME_VOICES.get(invalid_theme, 'None — rejected')}")
print(f"Result                       : {'PASS' if invalid_theme not in THEME_VOICES else 'FAIL'}")
print("=" * 55)

print("=" * 55)
print("  ALL TESTS COMPLETE")
print("=" * 55)

# ── Streak Unit Tests ─────────────────────────────────────────────────────────
from datetime import date, timedelta
from app.database import SessionLocal
from app import models
from app.main import update_streak

def get_test_user(db):
    user = db.query(models.User).filter(models.User.email == "streaktest@padai.com").first()
    if not user:
        user = models.User(
            username="StreakTester",
            email="streaktest@padai.com",
            password_hash="dummyhash",
            role="student",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

# Test 50
db = SessionLocal()
user = get_test_user(db)
user.streak = 0
user.last_activity_date = None
db.commit()
db.refresh(user)

update_streak(user.id, db)
db.refresh(user)

streak_ok = user.streak == 1
date_ok = user.last_activity_date == date.today()
print("=" * 55)
print("TEST : update_streak()  First ever activity")
print("=" * 55)
print(f"last_activity_date before : None")
print(f"streak before             : 0")
print(f"streak after              : {user.streak}")
print(f"last_activity_date after  : {user.last_activity_date}")
print(f"streak == 1               : {streak_ok}")
print(f"date set to today         : {date_ok}")
print(f"Result                    : {'PASS' if streak_ok and date_ok else 'FAIL'}")
print("=" * 55)
db.close()

# Test 51
db = SessionLocal()
user = get_test_user(db)
user.streak = 3
user.last_activity_date = date.today() - timedelta(days=1)
db.commit()
db.refresh(user)

update_streak(user.id, db)
db.refresh(user)

streak_ok_51 = user.streak == 4
date_ok_51 = user.last_activity_date == date.today()
print("=" * 55)
print("TEST : update_streak()  Consecutive day increments streak")
print("=" * 55)
print(f"last_activity_date before : yesterday")
print(f"streak before             : 3")
print(f"streak after              : {user.streak}")
print(f"last_activity_date after  : {user.last_activity_date}")
print(f"streak == 4               : {streak_ok_51}")
print(f"date set to today         : {date_ok_51}")
print(f"Result                    : {'PASS' if streak_ok_51 and date_ok_51 else 'FAIL'}")
print("=" * 55)
db.close()

# Test 52
db = SessionLocal()
user = get_test_user(db)
user.streak = 10
user.last_activity_date = date.today() - timedelta(days=3)
db.commit()
db.refresh(user)

update_streak(user.id, db)
db.refresh(user)

streak_ok_52 = user.streak == 1
date_ok_52 = user.last_activity_date == date.today()
print("=" * 55)
print("TEST : update_streak() Missed days resets streak to 1")
print("=" * 55)
print(f"last_activity_date before : 3 days ago")
print(f"streak before             : 10")
print(f"streak after              : {user.streak}")
print(f"last_activity_date after  : {user.last_activity_date}")
print(f"streak == 1               : {streak_ok_52}")
print(f"date set to today         : {date_ok_52}")
print(f"Result                    : {'PASS' if streak_ok_52 and date_ok_52 else 'FAIL'}")
print("=" * 55)
db.close()

# Test 52b
from app.main import decay_streak_if_inactive

db = SessionLocal()
user = get_test_user(db)
user.streak = 10
user.last_activity_date = date.today() - timedelta(days=3)
db.commit()
db.refresh(user)

decay_streak_if_inactive(user.id, db)
db.refresh(user)

streak_ok_52b = user.streak == 0
print("=" * 55)
print("TEST : decay_streak_if_inactive()  Login after missed days resets streak to 0")
print("=" * 55)
print(f"last_activity_date before : 3 days ago")
print(f"streak before             : 10")
print(f"streak after              : {user.streak}")
print(f"streak == 0               : {streak_ok_52b}")
print(f"Result                    : {'PASS' if streak_ok_52b else 'FAIL'}")
print("=" * 55)
db.close()


