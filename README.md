# IELTS Speaking Practice - AI Scoring

Ứng dụng web giúp luyện thi IELTS Speaking với AI chấm điểm tự động theo tiêu chí IELTS chính thức.

## Tính năng

✅ **5 bộ đề thi Speaking hoàn chỉnh**
- Test 1: Travel & Journey
- Test 2: Technology & Learning
- Test 3: Work & Career
- Test 4: Environment & Nature
- Test 5: Culture & Entertainment

✅ **3 phần thi Speaking đầy đủ theo chuẩn IELTS**
- Part 1: Introduction and Interview (4-5 phút) - 6 câu hỏi về chủ đề quen thuộc
- Part 2: Long Turn với preparation time (3-4 phút) - Nói về 1 topic trong 2 phút
- Part 3: Two-way Discussion (4-5 phút) - 4 câu hỏi thảo luận sâu

✅ **Ghi âm trực tiếp trên web**
- Sử dụng microphone để ghi âm
- Hiển thị timer và audio wave animation
- Tự động dừng cho Part 2 sau 2 phút

✅ **AI chấm điểm chi tiết**
- Speech-to-text với timestamp
- Đánh giá theo 4 tiêu chí IELTS:
  - Fluency and Coherence
  - Lexical Resource
  - Grammatical Range and Accuracy
  - Pronunciation
- Band score tổng thể (0-9)
- Feedback chi tiết bằng tiếng Việt

✅ **Giao diện đẹp, hiện đại**
- Responsive design
- Animations mượt mà
- UX tối ưu

## Cài đặt

### 1. Yêu cầu hệ thống
- Python 3.8 trở lên
- OpenAI API key

### 2. Cài đặt dependencies

```bash
pip install -r requirements.txt
```

### 3. Cấu hình API key

Tạo file `.env` trong thư mục project:

```
OPENAI_API_KEY=sk-your-api-key-here
```

Lấy API key tại: https://platform.openai.com/account/api-keys

### 4. Chạy ứng dụng

```bash
python app.py
```

Ứng dụng sẽ chạy tại: **http://localhost:5000**

## Cách sử dụng

1. **Mở trình duyệt** và truy cập http://localhost:5000

2. **Part 1 - Introduction**
   - Đọc câu hỏi
   - Click "Bắt đầu ghi âm" và trả lời
   - Click "Dừng ghi âm" khi xong
   - Click "Câu hỏi tiếp theo" để tiếp tục

3. **Part 2 - Long Turn**
   - Đọc topic và bullet points
   - Click "Bắt đầu ghi âm" để bắt đầu 1 phút chuẩn bị
   - Sau 1 phút, click "Bắt đầu nói" để ghi âm (tối đa 2 phút)
   - Hệ thống sẽ tự động dừng sau 2 phút

4. **Part 3 - Discussion**
   - Trả lời các câu hỏi thảo luận sâu hơn
   - Tương tự Part 1

5. **Xem kết quả**
   - Click "Hoàn thành & Chấm điểm"
   - Đợi AI phân tích (20-30 giây)
   - Xem band score và feedback chi tiết

## Cấu trúc thư mục

```
project/
├── app.py                  # Flask backend
├── transcribe_api.py       # Script gốc (không cần thiết nữa)
├── requirements.txt        # Dependencies
├── .env                    # API keys (cần tạo)
├── templates/
│   └── index.html         # Frontend HTML
└── static/
    └── app.js             # JavaScript logic
```

## Công nghệ sử dụng

- **Backend**: Flask (Python)
- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **AI**: OpenAI Whisper (Speech-to-Text), GPT-4 (Evaluation)
- **Audio**: MediaRecorder API (Web Audio)

## Lưu ý

- Đảm bảo trình duyệt hỗ trợ MediaRecorder API (Chrome, Firefox, Edge)
- Cần cho phép quyền truy cập microphone khi được hỏi
- Chi phí API: ~$0.10-0.30 per test (tùy thuộc độ dài câu trả lời)
- Cần kết nối internet để sử dụng OpenAI API

## Troubleshooting

**Lỗi: "Không thể truy cập microphone"**
- Kiểm tra quyền microphone trong trình duyệt
- Truy cập qua HTTPS hoặc localhost

**Lỗi: "OPENAI_API_KEY not found"**
- Tạo file `.env` với API key
- Kiểm tra API key còn valid

**Lỗi: "Rate limit exceeded"**
- Kiểm tra billing trong tài khoản OpenAI
- Thêm credit nếu cần

## Nâng cấp trong tương lai

- [ ] Lưu lịch sử bài test
- [ ] So sánh tiến bộ theo thời gian
- [ ] Thêm nhiều đề thi khác nhau
- [ ] Export kết quả PDF
- [ ] Phân tích pronunciation chi tiết hơn
- [ ] Gợi ý từ vựng và cấu trúc câu

## License

MIT License - Free to use and modify

---

Made with ❤️ for IELTS learners

