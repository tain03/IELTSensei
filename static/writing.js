// State management
let testStructure = null;
let testList = [];
let currentTestId = 'test1';
let currentTask = 'task1'; // 'task1' or 'task2'
let responses = {}; // {task1: {text: '', wordCount: 0, duration: 0}, task2: {...}}
let timerStarted = false;
let timerInterval = null;
let startTime = null;

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    await loadTestList();
    await loadTestStructure(currentTestId);
    renderTestSelector();
    renderCurrentTask();
    setupEventListeners();
});

// Load test list from API
async function loadTestList() {
    try {
        const response = await fetch('/api/writing/test-list');
        testList = await response.json();
    } catch (error) {
        console.error('Error loading test list:', error);
    }
}

// Load test structure from API
async function loadTestStructure(testId) {
    try {
        const response = await fetch(`/api/writing/test-structure?test_id=${testId}`);
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
        if (Object.keys(responses).length > 0) {
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

// Setup event listeners
function setupEventListeners() {
    document.getElementById('selectTask1').addEventListener('click', () => selectTask('task1'));
    document.getElementById('selectTask2').addEventListener('click', () => selectTask('task2'));
    document.getElementById('startBtn').addEventListener('click', startWriting);
    document.getElementById('submitTaskBtn').addEventListener('click', evaluateCurrentTask);
    document.getElementById('nextTaskBtn').addEventListener('click', nextTask);
    
    // Word count tracker
    const textarea = document.getElementById('writingText');
    textarea.addEventListener('input', updateWordCount);
}

// Select a specific task
function selectTask(task) {
    // Save current task's content
    saveCurrentTaskContent();
    
    // Update current task
    currentTask = task;
    
    // Update UI
    updateTaskSelectorUI();
    renderCurrentTask();
    updateTasksStatus();
    
    // Load saved content if exists
    loadTaskContent();
    
    // Show notification
    const taskNames = {
        'task1': 'Task 1 - Academic/General Report',
        'task2': 'Task 2 - Essay'
    };
    showStatus(`✨ Đã chuyển sang ${taskNames[task]}`, 'success');
}

// Update task selector UI
function updateTaskSelectorUI() {
    document.querySelectorAll('.btn-task').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const selectedBtn = document.getElementById(`select${currentTask.charAt(0).toUpperCase() + currentTask.slice(1)}`);
    if (selectedBtn) {
        selectedBtn.classList.add('active');
    }
}

// Render current task
function renderCurrentTask() {
    const testContent = document.getElementById('testContent');
    const task = testStructure[currentTask];
    
    let html = `
        <div class="part-header">
            <h2>${task.title}</h2>
            <p>${task.intro}</p>
            ${task.time_limit ? `<p style="margin-top: 10px; font-weight: 600; color: #3B82F6;">Thời gian gợi ý: ${task.time_limit} phút</p>` : ''}
        </div>
    `;
    
    // Add image if task1 has image
    if (currentTask === 'task1' && task.image) {
        html += `
            <div class="question-card">
                <div style="text-align: center; margin-bottom: 20px;">
                    <img src="/static/images/writing/${task.image}" 
                         alt="Task 1 Chart/Diagram" 
                         style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                    <div style="display: none; padding: 40px; background: #F3F4F6; border-radius: 8px; color: #6B7280;">
                        <p style="margin: 0; font-style: italic;">📊 Hình ảnh biểu đồ/bảng/sơ đồ sẽ hiển thị ở đây</p>
                        <p style="margin: 8px 0 0; font-size: 0.9em;">Vui lòng thêm file <strong>${task.image}</strong> vào thư mục <code>static/images/writing/</code></p>
                    </div>
                </div>
                <h3>${task.topic || 'Task Question'}</h3>
                <p style="font-size: 1.05em; color: #111827; margin-top: 15px; white-space: pre-line;">${task.question}</p>
            </div>
        `;
    } else {
        html += `
            <div class="question-card">
                <h3>${task.topic || 'Task Question'}</h3>
                <p style="font-size: 1.05em; color: #111827; margin-top: 15px; white-space: pre-line;">${task.question}</p>
            </div>
        `;
    }
    
    testContent.innerHTML = html;
    
    // Update minimum word count
    document.getElementById('minWords').textContent = task.min_words || 150;
    
    updateProgress();
}

// Save current task content
function saveCurrentTaskContent() {
    const textarea = document.getElementById('writingText');
    const text = textarea.value.trim();
    const wordCount = text ? text.split(/\s+/).length : 0;
    
    if (!responses[currentTask]) {
        responses[currentTask] = {};
    }
    
    responses[currentTask].text = text;
    responses[currentTask].wordCount = wordCount;
    
    if (timerStarted && startTime) {
        responses[currentTask].duration = Math.floor((Date.now() - startTime) / 1000);
    }
}

// Load task content
function loadTaskContent() {
    const textarea = document.getElementById('writingText');
    
    if (responses[currentTask] && responses[currentTask].text) {
        textarea.value = responses[currentTask].text;
        updateWordCount();
    } else {
        textarea.value = '';
        document.getElementById('wordCount').textContent = '0';
    }
}

// Update word count
function updateWordCount() {
    const textarea = document.getElementById('writingText');
    const text = textarea.value.trim();
    const wordCount = text ? text.split(/\s+/).length : 0;
    
    document.getElementById('wordCount').textContent = wordCount;
    
    // Update task status
    updateTasksStatus();
}

// Start writing (start timer)
function startWriting() {
    if (!timerStarted) {
        timerStarted = true;
        startTime = Date.now();
        startTimer();
        
        document.getElementById('startBtn').classList.add('hidden');
        document.getElementById('submitTaskBtn').classList.remove('hidden');
        
        showStatus('⏱️ Đã bắt đầu đếm thời gian. Hãy viết bài của bạn!', 'info');
        
        // Focus on textarea
        document.getElementById('writingText').focus();
    }
}

// Start timer
function startTimer() {
    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        document.getElementById('timer').textContent = formatTime(elapsed);
        
        // Warning after 15 minutes for Task 1, 30 minutes for Task 2
        const warningTime = currentTask === 'task1' ? 900 : 1800;
        if (elapsed >= warningTime) {
            document.getElementById('timer').classList.add('warning');
        }
    }, 1000);
}

// Stop timer
function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

// Format time as MM:SS
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Update progress bar
function updateProgress() {
    const totalTasks = 2; // Task 1 and Task 2
    const completedTasks = Object.keys(responses).filter(task => {
        const minWords = task === 'task1' ? testStructure.task1.min_words : testStructure.task2.min_words;
        return responses[task] && responses[task].wordCount >= minWords;
    }).length;
    
    const progress = (completedTasks / totalTasks) * 100;
    document.getElementById('progressFill').style.width = progress + '%';
    
    updateTasksStatus();
}

// Update tasks status indicator
function updateTasksStatus() {
    const task1Response = responses['task1'];
    const task2Response = responses['task2'];
    
    const task1MinWords = testStructure.task1.min_words || 150;
    const task2MinWords = testStructure.task2.min_words || 250;
    
    // Update Task 1
    const task1Status = document.getElementById('task1Status');
    const task1Icon = task1Status.querySelector('div:first-child');
    const task1Count = document.getElementById('task1Count');
    
    if (task1Response && task1Response.wordCount >= task1MinWords) {
        task1Icon.textContent = '✅';
        task1Status.style.borderColor = '#10B981';
        task1Status.style.background = '#F0FDF4';
        task1Count.textContent = `${task1Response.wordCount} từ`;
    } else if (task1Response && task1Response.wordCount > 0) {
        task1Icon.textContent = '🔄';
        task1Status.style.borderColor = '#F59E0B';
        task1Status.style.background = '#FFFBEB';
        task1Count.textContent = `${task1Response.wordCount}/${task1MinWords} từ`;
    } else {
        task1Count.textContent = `Tối thiểu ${task1MinWords} từ`;
    }
    
    // Update Task 2
    const task2Status = document.getElementById('task2Status');
    const task2Icon = task2Status.querySelector('div:first-child');
    const task2Count = document.getElementById('task2Count');
    
    if (task2Response && task2Response.wordCount >= task2MinWords) {
        task2Icon.textContent = '✅';
        task2Status.style.borderColor = '#10B981';
        task2Status.style.background = '#F0FDF4';
        task2Count.textContent = `${task2Response.wordCount} từ`;
    } else if (task2Response && task2Response.wordCount > 0) {
        task2Icon.textContent = '🔄';
        task2Status.style.borderColor = '#F59E0B';
        task2Status.style.background = '#FFFBEB';
        task2Count.textContent = `${task2Response.wordCount}/${task2MinWords} từ`;
    } else {
        task2Count.textContent = `Tối thiểu ${task2MinWords} từ`;
    }
    
    // Highlight current task
    document.querySelectorAll('.task-status-item').forEach(item => {
        item.style.transform = 'scale(1)';
        item.style.transition = 'all 0.3s ease';
    });
    
    if (currentTask === 'task1') {
        task1Status.style.transform = 'scale(1.05)';
        task1Status.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.2)';
    } else if (currentTask === 'task2') {
        task2Status.style.transform = 'scale(1.05)';
        task2Status.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.2)';
    }
}

// Evaluate current task
async function evaluateCurrentTask() {
    // Save current content
    saveCurrentTaskContent();
    
    const taskResponse = responses[currentTask];
    
    if (!taskResponse || !taskResponse.text) {
        showStatus('⚠️ Vui lòng viết bài trước khi chấm điểm!', 'info');
        return;
    }
    
    const minWords = testStructure[currentTask].min_words || 150;
    if (taskResponse.wordCount < minWords) {
        const confirm = window.confirm(`⚠️ Bài viết chưa đủ ${minWords} từ tối thiểu (hiện tại: ${taskResponse.wordCount} từ).\n\nBạn có muốn chấm điểm luôn không?`);
        if (!confirm) return;
    }
    
    stopTimer();
    
    // Hide buttons
    document.getElementById('submitTaskBtn').classList.add('hidden');
    
    // Show loading
    const evaluationDiv = document.getElementById('evaluationResult');
    evaluationDiv.classList.remove('hidden');
    evaluationDiv.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p style="margin-top: 20px; font-size: 1.1em; color: #3B82F6; font-weight: 600;">
                Đang chấm điểm ${currentTask.toUpperCase()} của bạn...<br>
                <small style="color: #6B7280; font-weight: 400;">AI đang phân tích chi tiết bài viết của bạn</small>
            </p>
        </div>
    `;
    
    try {
        const response = await fetch('/api/writing/evaluate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                task: currentTask,
                text: taskResponse.text,
                word_count: taskResponse.wordCount,
                duration: taskResponse.duration || 0,
                question: testStructure[currentTask].question
            })
        });
        
        if (!response.ok) {
            throw new Error('Evaluation failed');
        }
        
        const evaluation = await response.json();
        displayEvaluation(evaluation);
        
        // Show next task button if applicable
        if (currentTask === 'task1') {
            document.getElementById('nextTaskBtn').classList.remove('hidden');
        }
        
    } catch (error) {
        console.error('Error evaluating:', error);
        evaluationDiv.innerHTML = `
            <div class="status error">
                Lỗi khi chấm điểm. Vui lòng thử lại.
            </div>
        `;
        document.getElementById('submitTaskBtn').classList.remove('hidden');
    }
}

// Display evaluation results
function displayEvaluation(evaluation) {
    const evaluationDiv = document.getElementById('evaluationResult');
    
    const taskName = currentTask === 'task1' ? 'TASK 1' : 'TASK 2';
    
    const html = `
        <div class="evaluation-result">
            <h2 style="text-align: center; color: #3B82F6; margin-bottom: 30px; font-size: 1.5em; font-weight: 600;">
                🎓 KẾT QUẢ ĐÁNH GIÁ ${taskName}
            </h2>
            
            <div class="band-score" style="background: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%);">
                <p>Overall Band Score</p>
                <div class="band-score-value">${evaluation.overall_band.toFixed(1)}</div>
            </div>
            
            <div class="criteria-grid">
                <div class="criteria-item">
                    <h4>Task Achievement</h4>
                    <div class="score" style="color: #3B82F6;">${evaluation.criteria_scores.task_achievement.toFixed(1)}</div>
                </div>
                <div class="criteria-item">
                    <h4>Coherence & Cohesion</h4>
                    <div class="score" style="color: #3B82F6;">${evaluation.criteria_scores.coherence_cohesion.toFixed(1)}</div>
                </div>
                <div class="criteria-item">
                    <h4>Lexical Resource</h4>
                    <div class="score" style="color: #3B82F6;">${evaluation.criteria_scores.lexical_resource.toFixed(1)}</div>
                </div>
                <div class="criteria-item">
                    <h4>Grammatical Range</h4>
                    <div class="score" style="color: #3B82F6;">${evaluation.criteria_scores.grammatical_range.toFixed(1)}</div>
                </div>
            </div>
            
            <div class="feedback-section">
                <h3 style="color: #3B82F6;">📊 Đánh giá chi tiết theo tiêu chí IELTS</h3>
                
                <h4>🎯 1. Task Achievement (${evaluation.criteria_scores.task_achievement.toFixed(1)}/9)</h4>
                <p style="background: #F9FAFB; padding: 16px; border-radius: 6px; border-left: 3px solid #3B82F6;">${evaluation.detailed_feedback.task_achievement}</p>
                
                <h4>🔗 2. Coherence and Cohesion (${evaluation.criteria_scores.coherence_cohesion.toFixed(1)}/9)</h4>
                <p style="background: #F9FAFB; padding: 16px; border-radius: 6px; border-left: 3px solid #3B82F6;">${evaluation.detailed_feedback.coherence_cohesion}</p>
                
                <h4>📚 3. Lexical Resource (${evaluation.criteria_scores.lexical_resource.toFixed(1)}/9)</h4>
                <p style="background: #F9FAFB; padding: 16px; border-radius: 6px; border-left: 3px solid #3B82F6;">${evaluation.detailed_feedback.lexical_resource}</p>
                
                <h4>✍️ 4. Grammatical Range and Accuracy (${evaluation.criteria_scores.grammatical_range.toFixed(1)}/9)</h4>
                <p style="background: #F9FAFB; padding: 16px; border-radius: 6px; border-left: 3px solid #3B82F6;">${evaluation.detailed_feedback.grammatical_range}</p>
            </div>
            
            ${evaluation.examiner_feedback ? `
            <div class="feedback-section" style="background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%); border: 2px solid #3B82F6;">
                <h3 style="color: #3B82F6;">👨‍🏫 Examiner Feedback</h3>
                <p style="font-size: 1.05em; line-height: 1.8; color: #111827;">${evaluation.examiner_feedback}</p>
            </div>
            ` : ''}
            
            <div class="feedback-section">
                <h3 style="color: #3B82F6;">💪 Điểm mạnh</h3>
                <ul>
                    ${evaluation.strengths.map(s => `<li>${s}</li>`).join('')}
                </ul>
            </div>
            
            <div class="feedback-section">
                <h3 style="color: #3B82F6;">📈 Hướng cải thiện</h3>
                <ul>
                    ${evaluation.areas_for_improvement.map(a => `<li>${a}</li>`).join('')}
                </ul>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
                <button class="btn btn-submit btn-submit-writing" onclick="location.reload()">
                    🔄 Làm bài test mới
                </button>
            </div>
        </div>
    `;
    
    evaluationDiv.innerHTML = html;
    evaluationDiv.scrollIntoView({ behavior: 'smooth' });
}

// Next task
function nextTask() {
    if (currentTask === 'task1') {
        selectTask('task2');
        document.getElementById('nextTaskBtn').classList.add('hidden');
        document.getElementById('startBtn').classList.remove('hidden');
        showStatus('🎉 Bắt đầu Task 2 - Essay Writing', 'success');
    }
}

// Reset test
async function resetTest() {
    currentTask = 'task1';
    responses = {};
    timerStarted = false;
    startTime = null;
    stopTimer();
    
    document.getElementById('writingText').value = '';
    document.getElementById('wordCount').textContent = '0';
    document.getElementById('timer').textContent = '00:00';
    document.getElementById('timer').classList.remove('warning');
    
    document.getElementById('startBtn').classList.remove('hidden');
    document.getElementById('submitTaskBtn').classList.add('hidden');
    document.getElementById('nextTaskBtn').classList.add('hidden');
    document.getElementById('evaluationResult').classList.add('hidden');
    
    await loadTestStructure(currentTestId);
    renderCurrentTask();
    updateTaskSelectorUI();
    updateTasksStatus();
}

// Show status message
function showStatus(message, type = 'info') {
    const statusDiv = document.getElementById('status');
    statusDiv.className = `status ${type}`;
    statusDiv.textContent = message;
    statusDiv.style.display = 'block';
    
    setTimeout(() => {
        statusDiv.style.display = 'none';
    }, 5000);
}

