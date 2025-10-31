// State management
let testStructure = null;
let testList = [];
let currentTestId = 'test1';
let currentPart = 'part1';
let currentQuestionIndex = 0;
let mediaRecorder = null;
let audioChunks = [];
let recordingStartTime = null;
let timerInterval = null;
let responses = [];

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    await loadTestList();
    await loadTestStructure(currentTestId);
    renderTestSelector();
    renderCurrentQuestion();
    setupEventListeners();
});

// Load test list from API
async function loadTestList() {
    try {
        const response = await fetch('/api/test-list');
        testList = await response.json();
    } catch (error) {
        console.error('Error loading test list:', error);
    }
}

// Load test structure from API
async function loadTestStructure(testId) {
    try {
        const response = await fetch(`/api/test-structure?test_id=${testId}`);
        testStructure = await response.json();
        updateTestName();
    } catch (error) {
        console.error('Error loading test structure:', error);
        showStatus('Lỗi khi tải đề thi. Vui lòng refresh trang.', 'error');
    }
}

// Render test selector
function renderTestSelector() {
    if (testList.length === 0) return;
    
    const selectorDiv = document.getElementById('testSelector');
    
    const options = testList.map(test => 
        `<option value="${test.id}" ${test.id === currentTestId ? 'selected' : ''}>${test.name}</option>`
    ).join('');
    
    selectorDiv.innerHTML = `
        <div style="position: relative; display: inline-block;">
            <label style="display: block; color: white; font-size: 0.9em; margin-bottom: 6px; opacity: 0.9;">Chọn bộ đề:</label>
            <select id="testSelect" class="test-selector">
                ${options}
            </select>
        </div>
    `;
    
    document.getElementById('testSelect').addEventListener('change', async (e) => {
        if (responses.length > 0) {
            if (!confirm('Bạn có chắc muốn đổi đề? Dữ liệu hiện tại sẽ bị xóa.')) {
                e.target.value = currentTestId;
                return;
            }
        }
        
        currentTestId = e.target.value;
        await resetTest();
    });
}

// Update test name display
function updateTestName() {
    const testNameDiv = document.getElementById('testName');
    const currentTest = testList.find(t => t.id === currentTestId);
    if (currentTest && testNameDiv) {
        testNameDiv.querySelector('h3').textContent = `📝 ${currentTest.name}`;
    }
}

// Select a specific part to practice
function selectPart(part) {
    // Check if currently recording
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        if (!confirm('Bạn đang ghi âm. Chuyển Part sẽ hủy bỏ ghi âm hiện tại. Bạn có chắc không?')) {
            return;
        }
        stopRecording();
    }
    
    // Check if there are unsaved responses
    const currentPartResponses = responses.filter(r => r.part === currentPart);
    if (currentPartResponses.length > 0 && currentPart !== part) {
        if (!confirm('Bạn có responses chưa chấm điểm ở Part hiện tại. Chuyển Part sẽ không xóa responses này. Tiếp tục?')) {
            return;
        }
    }
    
    // Update current part
    currentPart = part;
    currentQuestionIndex = 0;
    
    // Update UI
    updatePartSelectorUI();
    
    // Reset controls
    document.getElementById('recordBtn').disabled = false;
    document.getElementById('recordBtn').classList.remove('recording');
    document.getElementById('nextBtn').classList.add('hidden');
    document.getElementById('evaluatePartBtn').classList.add('hidden');
    document.getElementById('stopBtn').classList.add('hidden');
    document.getElementById('recordingIndicator').classList.add('hidden');
    document.getElementById('timer').classList.add('hidden');
    document.getElementById('status').style.display = 'none';
    document.getElementById('evaluationResult').classList.add('hidden');
    
    // Clear any timers
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    // Render the selected part
    renderCurrentQuestion();
    updatePartsStatus();
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Show notification
    const partNames = {
        'part1': 'Part 1 - Introduction and Interview',
        'part2': 'Part 2 - Long Turn',
        'part3': 'Part 3 - Two-way Discussion'
    };
    showStatus(`✨ Đã chuyển sang ${partNames[part]}`, 'success');
}

// Update part selector UI
function updatePartSelectorUI() {
    // Remove active class from all buttons
    document.querySelectorAll('.btn-part').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to selected button
    const selectedBtn = document.getElementById(`select${currentPart.charAt(0).toUpperCase() + currentPart.slice(1)}`);
    if (selectedBtn) {
        selectedBtn.classList.add('active');
    }
}

// Reset test to initial state
async function resetTest() {
    // Reset state
    currentPart = 'part1';
    currentQuestionIndex = 0;
    responses = [];
    
    // Reset UI
    document.getElementById('recordBtn').disabled = false;
    document.getElementById('recordBtn').classList.remove('recording');
    document.getElementById('nextBtn').classList.add('hidden');
    document.getElementById('evaluatePartBtn').classList.add('hidden');
    document.getElementById('stopBtn').classList.add('hidden');
    document.getElementById('recordingIndicator').classList.add('hidden');
    document.getElementById('timer').classList.add('hidden');
    document.getElementById('status').style.display = 'none';
    document.getElementById('transcripts').innerHTML = '';
    document.getElementById('evaluationResult').classList.add('hidden');
    
    // Clear any timers
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    // Load new test
    await loadTestStructure(currentTestId);
    renderCurrentQuestion();
    updatePartsStatus();
    updatePartSelectorUI();
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('recordBtn').addEventListener('click', startRecording);
    document.getElementById('stopBtn').addEventListener('click', stopRecording);
    document.getElementById('nextBtn').addEventListener('click', nextQuestion);
    document.getElementById('evaluatePartBtn').addEventListener('click', evaluateCurrentPart);
    
    // Part selector buttons
    document.getElementById('selectPart1').addEventListener('click', () => selectPart('part1'));
    document.getElementById('selectPart2').addEventListener('click', () => selectPart('part2'));
    document.getElementById('selectPart3').addEventListener('click', () => selectPart('part3'));
}

// Render current question
function renderCurrentQuestion() {
    const testContent = document.getElementById('testContent');
    const part = testStructure[currentPart];
    
    let html = `
        <div class="part-header">
            <h2>${part.title}</h2>
            <p>${part.intro}</p>
            ${part.topic ? `<p style="margin-top: 10px; font-weight: 600; color: #E52E2E;">Topic: ${part.topic}</p>` : ''}
        </div>
    `;

    if (currentPart === 'part1') {
        const question = part.questions[currentQuestionIndex];
        html += `
            <div class="question-card">
                <h3>Question ${currentQuestionIndex + 1} of ${part.questions.length}</h3>
                <p style="font-size: 1.2em; color: #111827; margin-top: 15px;">${question}</p>
            </div>
        `;
    } else if (currentPart === 'part2') {
        html += `
            <div class="question-card">
                <h3>${part.topic}</h3>
                <p style="margin: 15px 0; color: #666;">You should say:</p>
                <ul class="topic-points">
                    ${part.points.map(point => `<li>${point}</li>`).join('')}
                </ul>
            </div>
            <div class="preparation-notice">
                <h3>📝 Long Turn - Nói trong 2 phút</h3>
                <p>Hãy dành thời gian chuẩn bị suy nghĩ về chủ đề. Khi bạn đã sẵn sàng, click "Bắt đầu ghi âm" để bắt đầu nói (tối đa 2 phút).</p>
            </div>
        `;
    } else if (currentPart === 'part3') {
        const question = part.questions[currentQuestionIndex];
        html += `
            <div class="question-card">
                <h3>Question ${currentQuestionIndex + 1} of ${part.questions.length}</h3>
                <p style="font-size: 1.2em; color: #111827; margin-top: 15px;">${question}</p>
            </div>
        `;
    }

    testContent.innerHTML = html;
    updateProgress();
}

// Update progress bar
function updateProgress() {
    const totalQuestions = 
        testStructure.part1.questions.length + 
        1 + // Part 2 has 1 long turn
        testStructure.part3.questions.length;
    
    let completedQuestions = responses.length;
    
    const progress = (completedQuestions / totalQuestions) * 100;
    document.getElementById('progressFill').style.width = progress + '%';
    
    // Update parts status
    updatePartsStatus();
}

// Update parts status indicator
function updatePartsStatus() {
    const part1Responses = responses.filter(r => r.part === 'part1').length;
    const part2Responses = responses.filter(r => r.part === 'part2').length;
    const part3Responses = responses.filter(r => r.part === 'part3').length;
    
    const part1Total = testStructure.part1.questions.length;
    const part3Total = testStructure.part3.questions.length;
    
    // Update Part 1
    const part1Status = document.getElementById('part1Status');
    const part1Icon = part1Status.querySelector('div:first-child');
    const part1Count = document.getElementById('part1Count');
    
    part1Count.textContent = `${part1Responses}/${part1Total} câu`;
    if (part1Responses >= part1Total) {
        part1Icon.textContent = '✅';
        part1Status.style.borderColor = '#10B981';
        part1Status.style.background = '#F0FDF4';
    } else if (part1Responses > 0) {
        part1Icon.textContent = '🔄';
        part1Status.style.borderColor = '#F59E0B';
        part1Status.style.background = '#FFFBEB';
    }
    
    // Update Part 2
    const part2Status = document.getElementById('part2Status');
    const part2Icon = part2Status.querySelector('div:first-child');
    const part2Count = document.getElementById('part2Count');
    
    if (part2Responses >= 1) {
        part2Icon.textContent = '✅';
        part2Status.style.borderColor = '#10B981';
        part2Status.style.background = '#F0FDF4';
        part2Count.textContent = 'Hoàn thành';
    } else {
        part2Count.textContent = 'Long Turn';
    }
    
    // Update Part 3
    const part3Status = document.getElementById('part3Status');
    const part3Icon = part3Status.querySelector('div:first-child');
    const part3Count = document.getElementById('part3Count');
    
    part3Count.textContent = `${part3Responses}/${part3Total} câu`;
    if (part3Responses >= part3Total) {
        part3Icon.textContent = '✅';
        part3Status.style.borderColor = '#10B981';
        part3Status.style.background = '#F0FDF4';
    } else if (part3Responses > 0) {
        part3Icon.textContent = '🔄';
        part3Status.style.borderColor = '#F59E0B';
        part3Status.style.background = '#FFFBEB';
    }
    
    // Highlight current part
    document.querySelectorAll('.part-status-item').forEach(item => {
        item.style.transform = 'scale(1)';
        item.style.transition = 'all 0.3s ease';
    });
    
    if (currentPart === 'part1') {
        part1Status.style.transform = 'scale(1.05)';
        part1Status.style.boxShadow = '0 4px 12px rgba(229, 46, 46, 0.2)';
    } else if (currentPart === 'part2') {
        part2Status.style.transform = 'scale(1.05)';
        part2Status.style.boxShadow = '0 4px 12px rgba(229, 46, 46, 0.2)';
    } else if (currentPart === 'part3') {
        part3Status.style.transform = 'scale(1.05)';
        part3Status.style.boxShadow = '0 4px 12px rgba(229, 46, 46, 0.2)';
    }
}

// Start recording
async function startRecording() {
    try {
        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Start actual recording (no preparation phase for Part 2)
        audioChunks = [];
        mediaRecorder = new MediaRecorder(stream);
        
        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };
        
        mediaRecorder.onstop = async () => {
            stream.getTracks().forEach(track => track.stop());
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            await transcribeAudio(audioBlob);
        };
        
        mediaRecorder.start();
        recordingStartTime = Date.now();
        
        // Update UI
        document.getElementById('recordBtn').classList.add('recording');
        document.getElementById('recordBtn').textContent = '🔴 Đang ghi âm...';
        document.getElementById('stopBtn').classList.remove('hidden');
        document.getElementById('recordingIndicator').classList.remove('hidden');
        document.getElementById('timer').classList.remove('hidden');
        
        // Start timer
        startTimer();
        
        // Auto-stop for Part 2 after 2 minutes
        if (currentPart === 'part2') {
            setTimeout(() => {
                if (mediaRecorder && mediaRecorder.state === 'recording') {
                    stopRecording();
                }
            }, 120000); // 2 minutes
        }
        
    } catch (error) {
        console.error('Error accessing microphone:', error);
        showStatus('Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.', 'error');
    }
}

// Preparation phase removed - users can prepare at their own pace

// Stop recording
function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
    }
    
    // Clear timers
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    // Update UI
    document.getElementById('recordBtn').classList.remove('recording');
    document.getElementById('recordBtn').textContent = '🎤 Bắt đầu ghi âm';
    document.getElementById('recordBtn').disabled = true;
    document.getElementById('stopBtn').classList.add('hidden');
    document.getElementById('recordingIndicator').classList.add('hidden');
    document.getElementById('timer').classList.add('hidden');
    
    showStatus('Đang xử lý âm thanh...', 'processing');
}

// Start timer
function startTimer() {
    let seconds = 0;
    document.getElementById('timer').textContent = '00:00';
    
    timerInterval = setInterval(() => {
        seconds++;
        document.getElementById('timer').textContent = formatTime(seconds);
        
        // Warning colors for Part 2
        if (currentPart === 'part2') {
            if (seconds >= 90 && seconds < 110) {
                document.getElementById('timer').classList.add('warning');
            } else if (seconds >= 110) {
                document.getElementById('timer').classList.add('danger');
            }
        }
    }, 1000);
}

// Format time as MM:SS
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Transcribe audio
async function transcribeAudio(audioBlob) {
    try {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');
        formData.append('part', currentPart);
        formData.append('question_index', currentQuestionIndex);
        
        const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Transcription failed');
        }
        
        const result = await response.json();
        
        // Save response
        responses.push(result);
        
        // Display transcript
        displayTranscript(result);
        
        // Show next button
        showStatus('Ghi âm hoàn tất!', 'success');
        
        // Check if we completed a part
        const isPartComplete = checkIfPartComplete();
        
        if (isPartComplete) {
            // Show both evaluate and continue buttons
            document.getElementById('evaluatePartBtn').classList.remove('hidden');
            if (!isLastQuestion()) {
                document.getElementById('nextBtn').classList.remove('hidden');
            }
        } else {
            // Just show next button
            document.getElementById('nextBtn').classList.remove('hidden');
        }
        
    } catch (error) {
        console.error('Error transcribing audio:', error);
        showStatus('Lỗi khi xử lý âm thanh. Vui lòng thử lại.', 'error');
        document.getElementById('recordBtn').disabled = false;
    }
}

// Display transcript
function displayTranscript(result) {
    const transcriptsDiv = document.getElementById('transcripts');
    
    const transcriptHtml = `
        <div class="transcript">
            <h4>📝 Câu trả lời của bạn (${result.part.toUpperCase()} - Q${result.question_index + 1})</h4>
            <p>${result.text}</p>
            <p style="margin-top: 10px; color: #666; font-size: 0.9em;">
                Số từ: ${result.text.split(' ').length} | 
                Thời lượng: ${result.duration ? result.duration.toFixed(1) + 's' : 'N/A'}
            </p>
        </div>
    `;
    
    transcriptsDiv.innerHTML += transcriptHtml;
}

// Show status message
function showStatus(message, type = 'info') {
    const statusDiv = document.getElementById('status');
    statusDiv.className = `status ${type}`;
    statusDiv.textContent = message;
    statusDiv.style.display = 'block';
}

// Check if this is the last question of the entire test (all 3 parts)
function isLastQuestion() {
    // Only return true if we're at the last question of Part 3
    if (currentPart === 'part3') {
        return currentQuestionIndex >= testStructure.part3.questions.length - 1;
    }
    // For Part 1 and Part 2, always return false (need to continue to next parts)
    return false;
}

// Check if we just completed a part
function checkIfPartComplete() {
    if (currentPart === 'part1') {
        return currentQuestionIndex >= testStructure.part1.questions.length - 1;
    } else if (currentPart === 'part2') {
        return true; // Part 2 only has one long turn
    } else if (currentPart === 'part3') {
        return currentQuestionIndex >= testStructure.part3.questions.length - 1;
    }
    return false;
}

// Move to next question
function nextQuestion() {
    if (currentPart === 'part1') {
        if (currentQuestionIndex < testStructure.part1.questions.length - 1) {
            currentQuestionIndex++;
        } else {
            // Ask if user wants to move to Part 2
            if (confirm('🎉 Part 1 hoàn thành!\n\nBạn có muốn tiếp tục sang Part 2 không?\n\n(Chọn "Cancel" để ở lại Part 1 hoặc chọn Part khác)')) {
                currentPart = 'part2';
                currentQuestionIndex = 0;
                updatePartSelectorUI();
                showStatus('🎉 Bắt đầu Part 2 - Long Turn (2 phút)', 'success');
            } else {
                // Stay at Part 1, don't increment
                showStatus('💡 Bạn có thể chọn Part khác hoặc chấm điểm Part 1', 'info');
                return;
            }
        }
    } else if (currentPart === 'part2') {
        // Ask if user wants to move to Part 3
        if (confirm('🎉 Part 2 hoàn thành!\n\nBạn có muốn tiếp tục sang Part 3 không?\n\n(Chọn "Cancel" để ở lại Part 2 hoặc chọn Part khác)')) {
            currentPart = 'part3';
            currentQuestionIndex = 0;
            updatePartSelectorUI();
            showStatus('🎉 Bắt đầu Part 3 - Two-way Discussion', 'success');
        } else {
            showStatus('💡 Bạn có thể chọn Part khác hoặc chấm điểm Part 2', 'info');
            return;
        }
    } else if (currentPart === 'part3') {
        if (currentQuestionIndex < testStructure.part3.questions.length - 1) {
            currentQuestionIndex++;
        } else {
            // End of Part 3
            showStatus('🎉 Part 3 hoàn thành! Bạn có thể chấm điểm hoặc chọn Part khác để practice', 'success');
            return;
        }
    }
    
    // Reset UI
    document.getElementById('recordBtn').disabled = false;
    document.getElementById('nextBtn').classList.add('hidden');
    document.getElementById('evaluatePartBtn').classList.add('hidden');
    
    // Don't hide status if we just showed a part transition message
    if (currentQuestionIndex !== 0) {
        document.getElementById('status').style.display = 'none';
    }
    
    // Render next question
    renderCurrentQuestion();
    
    // Scroll to top for better UX when changing parts
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Evaluate current part only
async function evaluateCurrentPart() {
    // Get responses for current part only
    const currentPartResponses = responses.filter(r => r.part === currentPart);
    
    if (currentPartResponses.length === 0) {
        showStatus('⚠️ Không có câu trả lời nào để chấm điểm!', 'info');
        return;
    }
    
    // Determine part name for display
    const partNames = {
        'part1': 'Part 1',
        'part2': 'Part 2', 
        'part3': 'Part 3'
    };
    const partName = partNames[currentPart] || currentPart;
    
    // Hide buttons
    document.getElementById('evaluatePartBtn').classList.add('hidden');
    document.getElementById('nextBtn').classList.add('hidden');
    document.getElementById('recordBtn').disabled = true;
    
    // Show loading
    const evaluationDiv = document.getElementById('evaluationResult');
    evaluationDiv.classList.remove('hidden');
    evaluationDiv.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p style="margin-top: 20px; font-size: 1.1em; color: #E52E2E; font-weight: 600;">
                Đang chấm điểm ${partName} của bạn...<br>
                <small style="color: #6B7280; font-weight: 400;">AI đang phân tích chi tiết câu trả lời của bạn</small>
            </p>
        </div>
    `;
    
    try {
        const response = await fetch('/api/evaluate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                responses: currentPartResponses,
                evaluate_type: 'single_part',
                part: currentPart
            })
        });
        
        if (!response.ok) {
            throw new Error('Evaluation failed');
        }
        
        const evaluation = await response.json();
        displayEvaluation(evaluation, partName);
        
    } catch (error) {
        console.error('Error evaluating:', error);
        evaluationDiv.innerHTML = `
            <div class="status error">
                Lỗi khi chấm điểm. Vui lòng thử lại.
            </div>
        `;
        // Re-enable buttons on error
        document.getElementById('evaluatePartBtn').classList.remove('hidden');
        if (!isLastQuestion()) {
            document.getElementById('nextBtn').classList.remove('hidden');
        }
    }
}

// Submit for evaluation (kept for backward compatibility - can be removed)
async function submitForEvaluation() {
    // Validate that all 3 parts are completed
    const hasPart1 = responses.some(r => r.part === 'part1');
    const hasPart2 = responses.some(r => r.part === 'part2');
    const hasPart3 = responses.some(r => r.part === 'part3');
    
    if (!hasPart1 || !hasPart2 || !hasPart3) {
        showStatus('⚠️ Vui lòng hoàn thành cả 3 phần Speaking (Part 1, Part 2, Part 3) trước khi chấm điểm!', 'info');
        return;
    }
    
    // Check minimum requirements for each part
    const part1Count = responses.filter(r => r.part === 'part1').length;
    const part2Count = responses.filter(r => r.part === 'part2').length;
    const part3Count = responses.filter(r => r.part === 'part3').length;
    
    if (part1Count < 3) {
        showStatus('⚠️ Part 1 cần ít nhất 3 câu trả lời. Vui lòng hoàn thành thêm!', 'info');
        return;
    }
    
    if (part2Count < 1) {
        showStatus('⚠️ Part 2 cần hoàn thành bài nói dài (Long Turn). Vui lòng hoàn thành!', 'info');
        return;
    }
    
    if (part3Count < 2) {
        showStatus('⚠️ Part 3 cần ít nhất 2 câu trả lời. Vui lòng hoàn thành thêm!', 'info');
        return;
    }
    
    // Hide buttons
    document.getElementById('submitBtn').classList.add('hidden');
    document.getElementById('recordBtn').disabled = true;
    
    // Show loading
    const evaluationDiv = document.getElementById('evaluationResult');
    evaluationDiv.classList.remove('hidden');
    evaluationDiv.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p style="margin-top: 20px; font-size: 1.1em; color: #E52E2E; font-weight: 600;">
                Đang chấm điểm bài thi của bạn...<br>
                <small style="color: #6B7280; font-weight: 400;">AI đang phân tích chi tiết câu trả lời của bạn</small>
            </p>
        </div>
    `;
    
    try {
        const response = await fetch('/api/evaluate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ responses })
        });
        
        if (!response.ok) {
            throw new Error('Evaluation failed');
        }
        
        const evaluation = await response.json();
        displayEvaluation(evaluation);
        
    } catch (error) {
        console.error('Error evaluating:', error);
        evaluationDiv.innerHTML = `
            <div class="status error">
                Lỗi khi chấm điểm. Vui lòng thử lại.
            </div>
        `;
    }
}

// Display evaluation results
function displayEvaluation(evaluation, partName = null) {
    const evaluationDiv = document.getElementById('evaluationResult');
    
    // Handle both old and new format for backward compatibility
    const fluencyFeedback = typeof evaluation.detailed_feedback.fluency_coherence === 'object' 
        ? evaluation.detailed_feedback.fluency_coherence.analysis 
        : evaluation.detailed_feedback.fluency_coherence;
    
    const lexicalFeedback = typeof evaluation.detailed_feedback.lexical_resource === 'object'
        ? evaluation.detailed_feedback.lexical_resource.analysis
        : evaluation.detailed_feedback.lexical_resource;
    
    const grammaticalFeedback = typeof evaluation.detailed_feedback.grammatical_range === 'object'
        ? evaluation.detailed_feedback.grammatical_range.analysis
        : evaluation.detailed_feedback.grammatical_range;
    
    const pronunciationFeedback = typeof evaluation.detailed_feedback.pronunciation === 'object'
        ? evaluation.detailed_feedback.pronunciation.analysis
        : evaluation.detailed_feedback.pronunciation;
    
    // Title based on evaluation type
    const title = partName 
        ? `🎓 KẾT QUẢ ĐÁNH GIÁ ${partName.toUpperCase()}`
        : `🎓 KẾT QUẢ ĐÁNH GIÁ IELTS SPEAKING`;
    
    const html = `
        <div class="evaluation-result">
            <h2 style="text-align: center; color: #E52E2E; margin-bottom: 30px; font-size: 1.5em; font-weight: 600;">
                ${title}
            </h2>
            
            <div class="band-score">
                <p>Overall Band Score</p>
                <div class="band-score-value">${evaluation.overall_band.toFixed(1)}</div>
            </div>
            
            <div class="criteria-grid">
                <div class="criteria-item">
                    <h4>Fluency & Coherence</h4>
                    <div class="score">${evaluation.criteria_scores.fluency_coherence.toFixed(1)}</div>
                </div>
                <div class="criteria-item">
                    <h4>Lexical Resource</h4>
                    <div class="score">${evaluation.criteria_scores.lexical_resource.toFixed(1)}</div>
                </div>
                <div class="criteria-item">
                    <h4>Grammatical Range</h4>
                    <div class="score">${evaluation.criteria_scores.grammatical_range.toFixed(1)}</div>
                </div>
                <div class="criteria-item">
                    <h4>Pronunciation</h4>
                    <div class="score">${evaluation.criteria_scores.pronunciation.toFixed(1)}</div>
                </div>
            </div>
            
            <div class="feedback-section">
                <h3>📊 Đánh giá chi tiết theo tiêu chí IELTS</h3>
                
                <h4>🗣️ 1. Fluency and Coherence (${evaluation.criteria_scores.fluency_coherence.toFixed(1)}/9)</h4>
                <p style="background: #F9FAFB; padding: 16px; border-radius: 6px; border-left: 3px solid #E52E2E;">${fluencyFeedback}</p>
                
                <h4>📚 2. Lexical Resource (${evaluation.criteria_scores.lexical_resource.toFixed(1)}/9)</h4>
                <p style="background: #F9FAFB; padding: 16px; border-radius: 6px; border-left: 3px solid #E52E2E;">${lexicalFeedback}</p>
                
                <h4>✍️ 3. Grammatical Range and Accuracy (${evaluation.criteria_scores.grammatical_range.toFixed(1)}/9)</h4>
                <p style="background: #F9FAFB; padding: 16px; border-radius: 6px; border-left: 3px solid #E52E2E;">${grammaticalFeedback}</p>
                
                <h4>🎤 4. Pronunciation (${evaluation.criteria_scores.pronunciation.toFixed(1)}/9)</h4>
                <p style="background: #F9FAFB; padding: 16px; border-radius: 6px; border-left: 3px solid #E52E2E;">${pronunciationFeedback}</p>
            </div>
            
            ${evaluation.examiner_feedback ? `
            <div class="feedback-section" style="background: linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%); border: 2px solid #FB923C;">
                <h3>👨‍🏫 Examiner Feedback</h3>
                <p style="font-size: 1.05em; line-height: 1.8; color: #111827;">${evaluation.examiner_feedback}</p>
            </div>
            ` : ''}
            
            <div class="feedback-section">
                <h3>💪 Điểm mạnh</h3>
                <ul>
                    ${evaluation.strengths.map(s => `<li>${s}</li>`).join('')}
                </ul>
            </div>
            
            <div class="feedback-section">
                <h3>📈 Hướng cải thiện</h3>
                <ul>
                    ${evaluation.areas_for_improvement.map(a => `<li>${a}</li>`).join('')}
                </ul>
            </div>
            
            ${evaluation.detailed_feedback.overall ? `
            <div class="feedback-section">
                <h3>✨ Nhận xét tổng quan</h3>
                <p>${evaluation.detailed_feedback.overall}</p>
            </div>
            ` : ''}
            
            <div style="text-align: center; margin-top: 30px;">
                <button class="btn btn-submit" onclick="location.reload()">
                    🔄 Làm bài test mới
                </button>
            </div>
        </div>
    `;
    
    evaluationDiv.innerHTML = html;
    
    // Scroll to results
    evaluationDiv.scrollIntoView({ behavior: 'smooth' });
}

