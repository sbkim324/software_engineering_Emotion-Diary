document.addEventListener('DOMContentLoaded', async () => {
  const $ = (id) => document.getElementById(id);

  const currentDate = $('currentDate');
  const questionNumber = $('questionNumber');
  const questionText = $('questionText');
  const answerText = $('answerText');
  const saveButton = $('saveButton');
  const saveMessage = $('saveMessage');
  const completedMessage = $('completedMessage');
  const memoriesList = $('memoriesList');
  const memoriesPagination = $('memoriesPagination');
  const sortButton = $('sortButton');
  const calendarContainer = $('calendarContainer');
  const calendarDetails = $('calendarDetails');
  const prevMonth = $('prevMonth');
  const nextMonth = $('nextMonth');
  const yearInput = $('yearInput');
  const monthInput = $('monthInput');

  const itemsPerPage = 5;
  let currentPage = 1;
  let currentSort = 'desc';
  let currentCalendarDate = new Date();

  let currentQuestionNumber = parseInt(localStorage.getItem('currentQuestionNumber')) || 1;
  let memories = JSON.parse(localStorage.getItem('memories')) || [];
  let questions = [];

  async function loadQuestions() {
    const res = await fetch('questions.json');
    questions = await res.json();
  }

  function getTodayKey() {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now.toISOString().slice(0, 10);
  }

  function getRandomQuestion() {
    const answered = memories.map(m => m.question);
    const remaining = questions.filter(q => !answered.includes(q));
    if (remaining.length === 0) return "모든 질문에 답하셨습니다!";
    return remaining[Math.floor(Math.random() * remaining.length)];
  }

  await loadQuestions();

  const todayKey = getTodayKey();
  let lastQuestionDate = localStorage.getItem('lastQuestionDate');
  if (lastQuestionDate !== todayKey || !localStorage.getItem('todayQuestion')) {
    const newQuestion = getRandomQuestion();
    localStorage.setItem('todayQuestion', newQuestion);
    localStorage.setItem('lastQuestionDate', todayKey);
  }

  const storedQuestion = localStorage.getItem('todayQuestion')?.trim();

  function updateDate() {
    const now = new Date();
    currentDate.textContent = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
  }

  function updateQuestion() {
    questionNumber.textContent = `오늘의 질문 #${currentQuestionNumber}번째 질문`;
    questionText.textContent = storedQuestion || "오늘의 질문이 로드되지 않았습니다.";
  }

  function saveAnswer() {
    const answer = answerText.value.trim();
    if (!answer) return;

    const now = new Date();
    memories.push({
      number: currentQuestionNumber,
      question: storedQuestion,
      answer,
      date: now.toISOString()
    });

    localStorage.setItem('memories', JSON.stringify(memories));
    localStorage.setItem('currentQuestionNumber', ++currentQuestionNumber);

    showSaveMessage();
    disableQuestionSection();
    updateMemories();
    updateCalendar();
  }

  function showSaveMessage() {
    saveMessage.style.display = 'block';
    setTimeout(() => saveMessage.style.display = 'none', 2000);
  }

  function disableQuestionSection() {
    questionText.style.opacity = '0.5';
    answerText.disabled = true;
    answerText.value = '이미 완료하였습니다.';
    answerText.style.backgroundColor = '#eee';
    answerText.style.color = '#999';
    saveButton.disabled = true;
    saveButton.style.backgroundColor = '#ccc';
    completedMessage.style.display = 'none';
  }

  function updateMemories() {
    memoriesList.innerHTML = '';
    const sorted = [...memories].sort((a, b) => currentSort === 'asc' ? a.number - b.number : b.number - a.number);
    const pageItems = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    pageItems.forEach(mem => {
      const el = document.createElement('div');
      el.className = 'memory-item';
      el.innerHTML = `<h3>#${mem.number} | ${mem.question}</h3><p>${mem.answer}</p>`;
      memoriesList.appendChild(el);
    });

    updatePagination(sorted.length);
  }

  function updatePagination(total) {
    memoriesPagination.innerHTML = '';
    const pageCount = Math.ceil(total / itemsPerPage);
    for (let i = 1; i <= pageCount; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      btn.onclick = () => { currentPage = i; updateMemories(); };
      memoriesPagination.appendChild(btn);
    }
  }

  function updateCalendar() {
    calendarContainer.innerHTML = '';

    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    weekdays.forEach(day => {
      const cell = document.createElement('div');
      cell.textContent = day;
      cell.className = 'calendar-weekday-cell';
      calendarContainer.appendChild(cell);
    });

    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();

    yearInput.value = year;
    monthInput.value = month;

    for (let i = 0; i < firstDay; i++) {
      calendarContainer.appendChild(Object.assign(document.createElement('div'), { className: 'calendar-day empty' }));
    }

    for (let day = 1; day <= lastDate; day++) {
      const el = document.createElement('div');
      el.className = 'calendar-day';
      el.textContent = day;

      const today = new Date();
      if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
        el.classList.add('today');
      }

      const memo = memories.find(m => {
        const d = new Date(m.date);
        return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
      });

      if (memo) {
        el.classList.add('answered');
        el.onclick = () => {
          calendarContainer.querySelector('.calendar-day-content')?.remove();
          const box = document.createElement('div');
          box.className = 'calendar-day-content';
          box.innerHTML = `<h4>${memo.question}</h4><p>${memo.answer}</p>`;
          calendarContainer.appendChild(box);
        };
      }

      calendarContainer.appendChild(el);
    }
  }

  function changeMonth(offset) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + offset);
    updateCalendar();
  }

  updateDate();
  setInterval(updateDate, 1000);

  const alreadyAnswered = memories.some(
    m => m.question.trim() === storedQuestion
  );

  alreadyAnswered
    ? disableQuestionSection()
    : updateQuestion();

  updateMemories();
  updateCalendar();

  saveButton.onclick = saveAnswer;
  sortButton.onclick = () => {
    currentSort = currentSort === 'asc' ? 'desc' : 'asc';
    sortButton.textContent = currentSort === 'asc' ? '🔼 오름차순' : '🔽 내림차순';
    currentPage = 1;
    updateMemories();
  };

  prevMonth.onclick = () => changeMonth(-1);
  nextMonth.onclick = () => changeMonth(1);
  yearInput.onchange = () => {
    currentCalendarDate.setFullYear(parseInt(yearInput.value));
    updateCalendar();
  };
  monthInput.onchange = () => {
    currentCalendarDate.setMonth(parseInt(monthInput.value));
    updateCalendar();
  };
});
