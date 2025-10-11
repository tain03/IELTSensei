import openai
import json
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Cấu hình API key từ environment variable
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    print("Loi: Khong tim thay OPENAI_API_KEY trong file .env")
    print("Vui long tao file .env va them dong: OPENAI_API_KEY=your_api_key_here")
    exit(1)

client = openai.OpenAI(api_key=api_key)

# Kiểm tra xem file âm thanh có tồn tại không
audio_file_path = "voice.mp3"
if not os.path.exists(audio_file_path):
    print(f"Loi: Khong tim thay file '{audio_file_path}'")
    print("Vui long dat file am thanh (.mp3, .wav, .m4a, etc.) trong thu muc hien tai")
    exit(1)

try:
    # Mở file âm thanh
    with open(audio_file_path, "rb") as audio_file:
        # Gọi API để chuyển giọng nói sang text với timestamps
        transcript = client.audio.transcriptions.create(
            model="whisper-1",   # mô hình Whisper trên cloud
            file=audio_file,
            language="en",        # english
            response_format="verbose_json",  # Để có timestamps
            timestamp_granularities=["word"]  # Timestamps cho từng từ
        )
        
        print("Ket qua chuyen doi voi timestamps:")
        print("=" * 50)
        
        # In ra toàn bộ text
        print(f"Text: {transcript.text}")
        print("\n" + "=" * 50)
        
        # In ra timestamps chi tiết
        if hasattr(transcript, 'words') and transcript.words:
            print("Timestamps chi tiet:")
            for word_info in transcript.words:
                start_time = word_info.start
                end_time = word_info.end
                word = word_info.word
                print(f"[{start_time:.2f}s - {end_time:.2f}s] {word}")
        else:
            print("Khong co thong tin timestamps chi tiet")
            
        # In ra JSON đầy đủ để debug
        print("\n" + "=" * 50)
        print("JSON response:")
        print(json.dumps(transcript.model_dump(), indent=2, ensure_ascii=False))
        
except openai.AuthenticationError:
    print("Loi xac thuc: API key khong hop le")
    print("Vui long kiem tra lai API key tai: https://platform.openai.com/account/api-keys")
except openai.RateLimitError:
    print("Loi: Da vuot qua gioi han su dung API")
    print("Vui long kiem tra lai tai khoan va thanh toan tai: https://platform.openai.com/account/billing")
except Exception as e:
    print(f"Loi: {e}")
