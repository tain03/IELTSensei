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
let preparationTimer = null;
let isPreparationPhase = false;

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
    document.getElementById('submitBtn').classList.add('hidden');
    document.getElementById('stopBtn').classList.add('hidden');
    document.getElementById('audioWave').classList.add('hidden');
    document.getElementById('timer').classList.add('hidden');
    document.getElementById('status').style.display = 'none';
    document.getElementById('transcripts').innerHTML = '';
    document.getElementById('evaluationResult').classList.add('hidden');
    
    // Clear any timers
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    if (preparationTimer) {
        clearInterval(preparationTimer);
        preparationTimer = null;
    }
    isPreparationPhase = false;
    
    // Load new test
    await loadTestStructure(currentTestId);
    renderCurrentQuestion();
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('recordBtn').addEventListener('click', startRecording);
    document.getElementById('stopBtn').addEventListener('click', stopRecording);
    document.getElementById('nextBtn').addEventListener('click', nextQuestion);
    document.getElementById('submitBtn').addEventListener('click', submitForEvaluation);
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
                <h3>⏱️ Preparation Time: 1 minute</h3>
                <p>Click "Bắt đầu ghi âm" to start your 1-minute preparation. After that, you will speak for up to 2 minutes.</p>
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
}

// Start recording
async function startRecording() {
    try {
        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Check if this is Part 2 and we haven't done preparation yet
        if (currentPart === 'part2' && !isPreparationPhase && responses.filter(r => r.part === 'part2').length === 0) {
            startPreparationPhase(stream);
            return;
        }
        
        // Start actual recording
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
        document.getElementById('audioWave').classList.remove('hidden');
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

// Start preparation phase (Part 2 only)
function startPreparationPhase(stream) {
    isPreparationPhase = true;
    
    // Stop the stream since we don't need to record during preparation
    stream.getTracks().forEach(track => track.stop());
    
    document.getElementById('recordBtn').classList.add('recording');
    document.getElementById('recordBtn').textContent = '⏱️ Chuẩn bị...';
    document.getElementById('recordBtn').disabled = true;
    document.getElementById('timer').classList.remove('hidden');
    
    let secondsLeft = 60;
    document.getElementById('timer').textContent = formatTime(secondsLeft);
    
    preparationTimer = setInterval(() => {
        secondsLeft--;
        document.getElementById('timer').textContent = formatTime(secondsLeft);
        
        if (secondsLeft <= 10) {
            document.getElementById('timer').classList.add('warning');
        }
        
        if (secondsLeft <= 0) {
            clearInterval(preparationTimer);
            isPreparationPhase = false;
            document.getElementById('recordBtn').classList.remove('recording');
            document.getElementById('recordBtn').textContent = '🎤 Bắt đầu nói (2 phút)';
            document.getElementById('recordBtn').disabled = false;
            document.getElementById('timer').classList.remove('warning');
            showStatus('Thời gian chuẩn bị đã hết. Hãy click "Bắt đầu nói" để ghi âm câu trả lời của bạn.', 'info');
        }
    }, 1000);
}

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
    document.getElementById('audioWave').classList.add('hidden');
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
        
        // Check if this is the last question
        if (isLastQuestion()) {
            document.getElementById('submitBtn').classList.remove('hidden');
        } else {
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

// Check if this is the last question
function isLastQuestion() {
    if (currentPart === 'part1') {
        return currentQuestionIndex >= testStructure.part1.questions.length - 1;
    } else if (currentPart === 'part2') {
        return true; // Part 2 has only one long turn
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
            // Move to Part 2
            currentPart = 'part2';
            currentQuestionIndex = 0;
        }
    } else if (currentPart === 'part2') {
        // Move to Part 3
        currentPart = 'part3';
        currentQuestionIndex = 0;
    } else if (currentPart === 'part3') {
        if (currentQuestionIndex < testStructure.part3.questions.length - 1) {
            currentQuestionIndex++;
        }
    }
    
    // Reset UI
    document.getElementById('recordBtn').disabled = false;
    document.getElementById('nextBtn').classList.add('hidden');
    document.getElementById('status').style.display = 'none';
    
    // Render next question
    renderCurrentQuestion();
}

// Submit for evaluation
async function submitForEvaluation() {
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
function displayEvaluation(evaluation) {
    const evaluationDiv = document.getElementById('evaluationResult');
    
    const html = `
        <div class="evaluation-result">
            <h2 style="text-align: center; color: #E52E2E; margin-bottom: 30px; font-size: 1.5em; font-weight: 600;">
                🎓 KẾT QUẢ ĐÁNH GIÁ IELTS SPEAKING
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
                <h3>📊 Chi tiết đánh giá</h3>
                
                <h4>Fluency and Coherence</h4>
                <p>${evaluation.detailed_feedback.fluency_coherence}</p>
                
                <h4>Lexical Resource</h4>
                <p>${evaluation.detailed_feedback.lexical_resource}</p>
                
                <h4>Grammatical Range and Accuracy</h4>
                <p>${evaluation.detailed_feedback.grammatical_range}</p>
                
                <h4>Pronunciation</h4>
                <p>${evaluation.detailed_feedback.pronunciation}</p>
            </div>
            
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
            
            <div class="feedback-section">
                <h3>✨ Nhận xét tổng quan</h3>
                <p>${evaluation.detailed_feedback.overall}</p>
            </div>
            
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

