# Cập nhật: Yêu cầu hoàn thành cả 3 phần Speaking

## Tổng quan
Hệ thống giờ đây yêu cầu người dùng hoàn thành **cả 3 phần Speaking** (Part 1, Part 2, và Part 3) trước khi có thể chấm điểm.

## Những thay đổi chính

### 1. **Logic hiển thị nút "Hoàn thành & Chấm điểm"**

#### Trước đây:
- Nút submit xuất hiện khi kết thúc mỗi part
- Có thể chấm điểm ngay sau Part 1 hoặc Part 2

#### Bây giờ:
- Nút submit **CHỈ** xuất hiện khi đã trả lời **câu cuối cùng của Part 3**
- Các phần khác luôn hiển thị nút "Câu hỏi tiếp theo →"

```javascript
// app.js - isLastQuestion()
function isLastQuestion() {
    // Only return true if we're at the last question of Part 3
    if (currentPart === 'part3') {
        return currentQuestionIndex >= testStructure.part3.questions.length - 1;
    }
    // For Part 1 and Part 2, always return false
    return false;
}
```

### 2. **Validation đa lớp**

#### Layer 1: UI Logic
- Nút submit chỉ hiển thị ở cuối Part 3

#### Layer 2: Submit Function Validation
```javascript
// Kiểm tra có đủ cả 3 parts không
const hasPart1 = responses.some(r => r.part === 'part1');
const hasPart2 = responses.some(r => r.part === 'part2');
const hasPart3 = responses.some(r => r.part === 'part3');

// Kiểm tra số lượng câu trả lời tối thiểu
- Part 1: ≥ 3 câu trả lời
- Part 2: ≥ 1 long turn
- Part 3: ≥ 2 câu trả lời
```

#### Thông báo lỗi:
- ⚠️ Vui lòng hoàn thành cả 3 phần Speaking (Part 1, Part 2, Part 3) trước khi chấm điểm!
- ⚠️ Part 1 cần ít nhất 3 câu trả lời
- ⚠️ Part 2 cần hoàn thành bài nói dài (Long Turn)
- ⚠️ Part 3 cần ít nhất 2 câu trả lời

### 3. **Parts Status Indicator (Trực quan)**

#### Giao diện mới:
```
┌─────────────────────────────────────────────────────────┐
│  ⭕ Part 1        ⭕ Part 2        ⭕ Part 3            │
│  0/6 câu          Long Turn        0/4 câu             │
└─────────────────────────────────────────────────────────┘
```

#### Trạng thái:
- **⭕ Trắng**: Chưa bắt đầu
- **🔄 Vàng**: Đang làm (in progress)
- **✅ Xanh**: Hoàn thành

#### Đặc điểm:
- Real-time update sau mỗi câu trả lời
- Highlight part hiện tại với scale + shadow
- Hiển thị số câu đã hoàn thành
- Responsive design

### 4. **Thông báo chuyển Part**

#### Khi chuyển từ Part 1 → Part 2:
```
🎉 Part 1 hoàn thành! Bắt đầu Part 2 - Long Turn (2 phút)
```

#### Khi chuyển từ Part 2 → Part 3:
```
🎉 Part 2 hoàn thành! Bắt đầu Part 3 - Two-way Discussion (phần cuối)
```

#### Đặc điểm:
- Success status message với màu xanh
- Auto-scroll to top khi chuyển part
- Message hiển thị ngắn để người dùng đọc

### 5. **User Experience Improvements**

#### Smooth transitions:
```javascript
// Scroll to top when changing parts
window.scrollTo({ top: 0, behavior: 'smooth' });
```

#### Visual feedback:
- Progress bar cập nhật real-time
- Parts status với animations (scale, color change)
- Clear status messages

## Luồng sử dụng mới

### Bước 1: Part 1 (Introduction)
1. Trả lời 6 câu hỏi Part 1
2. Sau mỗi câu: hiển thị transcript + nút "Câu hỏi tiếp theo →"
3. Sau câu 6: nút "Câu hỏi tiếp theo →" → chuyển sang Part 2
4. Status: Part 1 ✅ | Part 2 🔄 | Part 3 ⭕

### Bước 2: Part 2 (Long Turn)
1. 1 phút chuẩn bị (timer countdown)
2. 2 phút nói (auto-stop sau 2 phút hoặc dừng thủ công)
3. Sau khi nói xong: hiển thị transcript + nút "Câu hỏi tiếp theo →"
4. Chuyển sang Part 3
5. Status: Part 1 ✅ | Part 2 ✅ | Part 3 🔄

### Bước 3: Part 3 (Discussion)
1. Trả lời 4 câu hỏi Part 3
2. Sau mỗi câu: hiển thị transcript + nút "Câu hỏi tiếp theo →"
3. **Sau câu cuối cùng**: Nút "✅ Hoàn thành & Chấm điểm" xuất hiện
4. Status: Part 1 ✅ | Part 2 ✅ | Part 3 ✅

### Bước 4: Chấm điểm
1. Click "✅ Hoàn thành & Chấm điểm"
2. Validation check (tự động)
3. AI phân tích chi tiết (loading spinner)
4. Hiển thị kết quả với:
   - Overall Band Score
   - 4 điểm tiêu chí
   - Detailed analysis
   - Examiner feedback
   - Strengths & improvements

## Ví dụ các tình huống

### ✅ Tình huống hợp lệ:
```
Part 1: 6/6 câu ✅
Part 2: 1/1 long turn ✅
Part 3: 4/4 câu ✅
→ Nút submit xuất hiện
→ Cho phép chấm điểm
```

### ❌ Tình huống không hợp lệ:
```
Part 1: 6/6 câu ✅
Part 2: 0/1 long turn ⭕
Part 3: 0/4 câu ⭕
→ Nút submit KHÔNG xuất hiện
→ Thông báo: "Vui lòng hoàn thành cả 3 phần"
```

### ❌ Tình huống thiếu câu trả lời:
```
Part 1: 2/6 câu 🔄 (cần ít nhất 3)
→ Validation failed
→ Thông báo: "Part 1 cần ít nhất 3 câu trả lời"
```

## Technical Details

### Files Modified:
1. **static/app.js**
   - `isLastQuestion()`: Logic mới
   - `nextQuestion()`: Thêm thông báo + scroll
   - `submitForEvaluation()`: Thêm validation
   - `updatePartsStatus()`: Hàm mới
   - `updateProgress()`: Gọi updatePartsStatus()

2. **templates/index.html**
   - Thêm Parts Status Indicator section
   - 3-column grid với icons và counters

### Không cần thay đổi Backend:
- Backend logic không đổi
- Chỉ frontend UI/UX cải thiện

## Testing Checklist

- [ ] Start Part 1, trả lời 1-2 câu → Chỉ có nút Next
- [ ] Hoàn thành Part 1 → Chuyển sang Part 2 với thông báo
- [ ] Hoàn thành Part 2 → Chuyển sang Part 3 với thông báo
- [ ] Part 3 trả lời đến câu thứ 3 → Chỉ có nút Next
- [ ] Part 3 câu cuối cùng → Nút Submit xuất hiện
- [ ] Click Submit với đủ 3 parts → Success
- [ ] Parts status indicator cập nhật đúng
- [ ] Validation messages hiển thị đúng

## Benefits

### 1. **Đảm bảo tính chính xác**
- Chấm điểm dựa trên TOÀN BỘ bài test
- Không có đánh giá thiếu sót
- Đúng với format IELTS thật

### 2. **User Experience tốt hơn**
- Clear visual feedback
- Biết rõ đã làm đến đâu
- Thông báo rõ ràng khi chuyển part
- Không bị confusion

### 3. **Prevent errors**
- Multiple layers of validation
- Clear error messages
- Actionable feedback

## Future Enhancements

- [ ] Allow skipping questions (với warning)
- [ ] Save progress to localStorage
- [ ] Add "Continue later" feature
- [ ] Export partial results
- [ ] Add time tracking per part

