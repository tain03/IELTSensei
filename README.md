# IELTS Practice - AI Scoring

Ứng dụng web giúp luyện thi IELTS Speaking & Writing với AI chấm điểm tự động theo tiêu chí IELTS chính thức.

---

## 🎯 Tính năng

### 🎤 IELTS Speaking
- **3 phần thi đầy đủ**: Part 1 (Interview), Part 2 (Long Turn), Part 3 (Discussion)
- **5 bộ đề hoàn chỉnh**: Travel, Technology, Work, Environment, Culture
- **Ghi âm trực tiếp** trên web với timer và audio wave
- **AI chấm điểm** theo 4 tiêu chí: Fluency & Coherence, Lexical Resource, Grammatical Range, Pronunciation
- **Chọn Part tự do** - không cần làm theo thứ tự

### ✍️ IELTS Writing
- **2 Tasks**: Task 1 (Report - 150 từ), Task 2 (Essay - 250 từ)
- **5 bộ đề hoàn chỉnh** với hình ảnh biểu đồ/bảng/sơ đồ cho Task 1
- **Editor thông minh** với đếm từ real-time và timer
- **AI chấm điểm** theo 4 tiêu chí: Task Achievement, Coherence & Cohesion, Lexical Resource, Grammatical Range
- **Feedback chi tiết** bằng tiếng Việt với gợi ý cải thiện

### 🤖 AI Scoring
- Speech-to-text với OpenAI Whisper (Speaking)
- GPT-4 evaluation với IELTS band descriptors
- Band score (0-9) và feedback chi tiết
- Phân tích điểm mạnh và hướng cải thiện

---

## 📋 Yêu cầu hệ thống

- Python 3.8+
- OpenAI API key
- Trình duyệt hỗ trợ MediaRecorder API (Chrome, Firefox, Edge)

---

## 🚀 Cài đặt

### 1. Clone hoặc download project

```bash
git clone <repository-url>
cd transcribe
```

### 2. Cài đặt dependencies

```bash
pip install -r requirements.txt
```

### 3. Cấu hình API key

Tạo file `.env` trong thư mục project:

```env
OPENAI_API_KEY=sk-your-api-key-here
```

💡 Lấy API key tại: https://platform.openai.com/account/api-keys

### 4. Chạy ứng dụng

```bash
python app.py
```

Ứng dụng sẽ chạy tại: **http://localhost:5000**

---

## 📖 Cách sử dụng

### Trang chủ

Mở http://localhost:5000 để chọn Speaking hoặc Writing.

### 🎤 Speaking Practice

1. **Chọn bộ đề** từ dropdown (5 bộ đề)
2. **Chọn Part** (Part 1, 2, hoặc 3) - có thể chọn tự do
3. **Ghi âm câu trả lời**:
   - Part 1: 6 câu hỏi ngắn
   - Part 2: Nói 2 phút về topic (có 1 phút chuẩn bị)
   - Part 3: 4 câu hỏi thảo luận sâu
4. **Chấm điểm Part** sau khi hoàn thành
5. Xem **band score** và feedback chi tiết

### ✍️ Writing Practice

1. **Chọn bộ đề** từ dropdown (5 bộ đề)
2. **Chọn Task** (Task 1 hoặc Task 2)
3. **Đọc đề bài**:
   - Task 1: Xem hình ảnh biểu đồ/bảng/sơ đồ
   - Task 2: Đọc topic và yêu cầu
4. **Bắt đầu viết** (timer sẽ tự động chạy)
5. Viết đủ số từ tối thiểu (150 hoặc 250)
6. **Chấm điểm Task** khi hoàn thành
7. Xem **band score** và feedback chi tiết

---

## 📁 Cấu trúc project

```
project/
├── app.py                      # Flask backend
├── requirements.txt            # Python dependencies
├── .env                        # API keys (cần tạo)
├── templates/
│   ├── home.html              # Trang chủ
│   ├── speaking.html          # Trang Speaking
│   └── writing.html           # Trang Writing
├── static/
│   ├── common.css             # CSS chung
│   ├── speaking.js            # Logic Speaking
│   ├── writing.js             # Logic Writing
│   └── images/
│       └── writing/           # Hình ảnh cho Writing Task 1
│           ├── test1_task1.jpg
│           ├── test2_task1.jpg
│           ├── test3_task1.jpg
│           ├── test4_task1.jpg
│           └── test5_task1.jpg
└── README.md                   # File này
```

---

## 🎨 Công nghệ sử dụng

- **Backend**: Flask (Python)
- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **AI**: 
  - OpenAI Whisper (Speech-to-Text)
  - GPT-4 (Evaluation & Scoring)
- **Audio**: MediaRecorder API

---

## 💡 Bộ đề có sẵn

### Speaking Tests
1. **Travel & Journey** - Home & Accommodation, Memorable Journey
2. **Technology & Learning** - Technology Usage, Useful Skill
3. **Work & Career** - Work/Studies, Inspiring Person
4. **Environment & Nature** - Nature Places, Environmental Issues
5. **Culture & Entertainment** - Music, Movies & TV Shows

### Writing Tests
1. **Education & Technology** - Household chart, Technology debate
2. **Environment & Society** - Water system, Environmental actions
3. **Work & Career** - Employment table, Success factors
4. **Health & Lifestyle** - Meat consumption, Life expectancy
5. **Culture & Media** - Retail pie charts, Media influence

---

## 💰 Chi phí API

Ước tính cho mỗi lần chấm điểm:
- **Speaking**: ~$0.10-0.20 (tùy độ dài câu trả lời)
- **Writing**: ~$0.05-0.15 (tùy độ dài bài viết)

**Tổng**: ~$0.15-0.35 per full test

---

## ⚠️ Lưu ý

### Speaking
- Cần cho phép quyền truy cập microphone
- Trình duyệt cần hỗ trợ MediaRecorder API
- Kết nối internet ổn định

### Writing
- Task 1 yêu cầu ít nhất 150 từ
- Task 2 yêu cầu ít nhất 250 từ
- Có thể viết nhiều hơn số từ tối thiểu
- Timer chỉ mang tính tham khảo

### Hình ảnh Writing Task 1
Tất cả 5 ảnh đã có sẵn trong `static/images/writing/`. Nếu cần thay đổi:
- Đặt tên file: `test{số}_task1.jpg`
- Đặt vào thư mục: `static/images/writing/`
- Refresh trang (không cần restart server)

---

## 🐛 Troubleshooting

### "Không thể truy cập microphone"
- Kiểm tra quyền microphone trong browser settings
- Chỉ hoạt động trên HTTPS hoặc localhost

### "OPENAI_API_KEY not found"
- Kiểm tra file `.env` đã tạo chưa
- Đảm bảo API key đúng format: `OPENAI_API_KEY=sk-...`

### "Rate limit exceeded"
- Kiểm tra billing trong tài khoản OpenAI
- Thêm credit nếu cần
- Đợi một chút rồi thử lại

### Ảnh Writing không hiển thị
- Kiểm tra file tên đúng: `test1_task1.jpg`, `test2_task1.jpg`, ...
- Kiểm tra đường dẫn: `static/images/writing/`
- Hard refresh: `Ctrl + F5` (Windows) hoặc `Cmd + Shift + R` (Mac)

---

## 🔒 Bảo mật

- **Không commit file `.env`** vào git
- API key là riêng tư, không chia sẻ
- Audio recordings không được lưu trên server
- Tất cả xử lý là tạm thời trong memory

---

## 📊 Tiêu chí chấm điểm

### Speaking (4 tiêu chí)
1. **Fluency and Coherence** (0-9)
2. **Lexical Resource** (0-9)
3. **Grammatical Range and Accuracy** (0-9)
4. **Pronunciation** (0-9)

### Writing (4 tiêu chí)
1. **Task Achievement/Response** (0-9)
2. **Coherence and Cohesion** (0-9)
3. **Lexical Resource** (0-9)
4. **Grammatical Range and Accuracy** (0-9)

**Overall Band** = Trung bình 4 tiêu chí, làm tròn đến 0.5

---

## 🌟 Tính năng nổi bật

- ✅ Giao diện đẹp, hiện đại, responsive
- ✅ Navigation dễ dàng giữa Speaking và Writing
- ✅ Chọn Part/Task tự do, không theo thứ tự
- ✅ Real-time word count và timer
- ✅ Feedback chi tiết bằng tiếng Việt
- ✅ Band score chính xác theo IELTS standards
- ✅ Hướng cải thiện cụ thể và actionable

---

## 🔜 Roadmap

- [ ] Lưu lịch sử bài test vào database
- [ ] User authentication & accounts
- [ ] Progress tracking dashboard
- [ ] Export kết quả PDF
- [ ] Thêm Reading và Listening modules
- [ ] Mobile app version
- [ ] Vocabulary & grammar suggestions
- [ ] Sample answers & model responses

---

## 📄 License

MIT License - Free to use and modify

---

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

---

## 💬 Support

Nếu gặp vấn đề:
1. Kiểm tra phần **Troubleshooting** ở trên
2. Xem Console log (F12 trong browser)
3. Check terminal output của Flask
4. Tạo issue trên GitHub

---

**Made with ❤️ for IELTS learners**

🎯 **Tổng cộng: 25+ bài test** (Speaking: 15 variations, Writing: 10 variations)

**Version**: 2.0  
**Updated**: October 2025
