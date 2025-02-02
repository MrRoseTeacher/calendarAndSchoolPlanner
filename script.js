let changesMade = false;

function showNotification() {
    const notification = document.getElementById('notification');
    notification.style.display = 'block';
}

function markChanges() {
    if (!changesMade) {
        changesMade = true;
        showNotification();
    }
}

function generateCalendar() {
    changesMade = false; // Reset changes flag
    const startDate = new Date(document.getElementById('start-date').value);
    const endDate = new Date(document.getElementById('end-date').value);
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';

    let currentDate = new Date(startDate.getTime() + startDate.getTimezoneOffset() * 60000); // Normalize the start date
    const normalizedEndDate = new Date(endDate.getTime() + endDate.getTimezoneOffset() * 60000); // Normalize the end date

    while (currentDate <= normalizedEndDate) {
        if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) { // Skip weekends
            const dayDiv = document.createElement('div');
            dayDiv.className = 'day';
            const dateString = currentDate.toISOString().split('T')[0];
            dayDiv.id = `day-${dateString}`;
            const options = { month: 'short', day: 'numeric' }; // Format options without the year
            dayDiv.innerHTML = `<strong>${currentDate.toLocaleDateString(undefined, options)}</strong>`;
            dayDiv.addEventListener('click', () => handleDayClick(dayDiv));
            calendar.appendChild(dayDiv);

            // Add copy button for each week
            if (currentDate.getDay() === 5) { // Friday
                const copyButton = document.createElement('button');
                copyButton.innerHTML = '<span class="material-symbols-outlined">content_copy</span>'; // Material Symbols icon
                copyButton.style = 'padding: 5px; width: 30px; height: 30px; border: none; background-color: #007bff; color: #fff; border-radius: 4px; cursor: pointer;';
                copyButton.addEventListener('click', () => copyWeek(currentDate));
                calendar.appendChild(copyButton);
            }
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
}

function handleDayClick(dayDiv) {
    const action = prompt("Select action:\n1: Content\n2: Eval\n3: Link\n4: Homework\n5: Personal Note\n6: Personal Link\n7: Holiday");
    if (action === null) return; // Exit if the user presses cancel

    let actionType;

    switch (action) {
        case '1':
            actionType = 'content';
            break;
        case '2':
            actionType = 'eval';
            break;
        case '3':
            actionType = 'link';
            break;
        case '4':
            actionType = 'homework';
            break;
        case '5':
            actionType = 'personal-note';
            break;
        case '6':
            actionType = 'personal-link';
            break;
        case '7':
            actionType = 'holiday';
            break;
        default:
            alert("Invalid selection. Please enter a number between 1 and 7.");
            return;
    }

    if (actionType === 'holiday') {
        if (dayDiv.classList.contains('holiday')) {
            dayDiv.classList.remove('holiday');
            dayDiv.querySelector('.holiday-reason').remove();
        } else {
            const reason = prompt("Enter reason for holiday:");
            if (reason) {
                dayDiv.classList.add('holiday');
                const reasonP = document.createElement('p');
                reasonP.className = 'holiday-reason';
                reasonP.textContent = reason;
                dayDiv.appendChild(reasonP);
            }
        }
    } else if (actionType === 'link' || actionType === 'personal-link') {
        const url = prompt("Enter URL:");
        const linkText = prompt("Enter link text:");
        if (url && linkText) {
            const item = document.createElement('p');
            item.className = actionType;
            item.innerHTML = `<a href="${url}" target="_blank">${linkText}</a>`;
            item.addEventListener('click', (e) => editItem(e, item));
            dayDiv.appendChild(item);
            markChanges(); // Mark changes
        }
    } else {
        const itemText = prompt("Enter item text (use <a href='URL'>link text</a> for hyperlinks):");
        if (itemText) {
            const item = document.createElement('p');
            item.className = actionType;
            item.innerHTML = itemText; // Allow HTML input for hyperlinks
            item.addEventListener('click', (e) => editItem(e, item));
            dayDiv.appendChild(item);
            markChanges(); // Mark changes
        }
    }
}

function editItem(event, item) {
    event.stopPropagation(); // Prevent triggering the day click event
    if (event.target.tagName.toLowerCase() === 'a') {
        return; // Do not trigger edit if the link text is clicked
    }

    const newText = prompt("Edit item text:", item.textContent);
    if (newText === null) return; // Exit if the user presses cancel

    if (item.className === 'link' || item.className === 'personal-link') {
        const newUrl = prompt("Edit URL:", item.querySelector('a').href);
        if (newUrl !== null) {
            item.querySelector('a').href = newUrl;
        }
    }

    if (newText.trim() === "") {
        item.remove(); // Remove the item if the new text is empty
        markChanges(); // Mark changes
    } else {
        item.innerHTML = newText;
        sortItems(item.parentElement);
        markChanges(); // Mark changes
    }
}

function sortItems(dayDiv) {
    const items = Array.from(dayDiv.querySelectorAll('p'));
    items.sort((a, b) => {
        const order = { 'content': 1, 'eval': 2, 'link': 3, 'homework': 4, 'personal-note': 5, 'personal-link': 6 };
        return order[a.className] - order[b.className];
    });
    items.forEach(item => dayDiv.appendChild(item));
}

async function saveCalendar() {
    const calendarTitle = document.getElementById('calendar-title').value.trim();
    if (!calendarTitle) {
        alert("Please enter a calendar title.");
        return;
    }

    // Replace spaces and special characters in the title to create a valid filename
    const safeTitle = calendarTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    const calendar = document.getElementById('calendar');
    const days = Array.from(calendar.querySelectorAll('.day'));
    const calendarData = days.map(day => {
        const date = day.id.split('day-')[1]; // Correctly extract the full date
        const items = Array.from(day.querySelectorAll('p')).map(item => ({
            type: item.className,
            text: item.innerHTML // Save innerHTML to preserve hyperlinks
        }));
        return { date, items };
    });

    const json = JSON.stringify({ title: calendarTitle, data: calendarData });

    try {
        const response = await fetch('http://localhost:3000/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: json
        });
        const result = await response.text();
        console.log(result);
        changesMade = false; // Reset changes flag after saving
        document.getElementById('notification').style.display = 'none'; // Hide notification
    } catch (error) {
        console.error('Error saving calendar:', error);
    }
}

async function loadCalendar(event) {
    changesMade = false; // Reset changes flag
    document.getElementById('notification').style.display = 'none'; // Hide notification

    const fileInput = event.target;
    const file = fileInput.files[0];
    if (!file) {
        // Exit the function if no file was selected
        return;
    }

    console.log('Selected file:', file.name);

    const reader = new FileReader();
    reader.onload = function(e) {
        const calendarData = JSON.parse(e.target.result);
        document.getElementById('calendar-title').value = calendarData.title; // Set the title input
        const calendar = document.getElementById('calendar');
        calendar.innerHTML = '';
        calendarData.data.forEach((dayData, index) => {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'day';
            dayDiv.id = `day-${dayData.date}`;
            const options = { month: 'short', day: 'numeric' };
            const dateParts = dayData.date.split('-');
            const date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
            dayDiv.innerHTML = `<strong>${date.toLocaleDateString(undefined, options)}</strong>`;
            dayData.items.forEach(itemData => {
                const item = document.createElement('p');
                item.className = itemData.type;
                item.innerHTML = itemData.text; // Use innerHTML to preserve hyperlinks
                item.addEventListener('click', (e) => editItem(e, item));
                item.style = getItemStyle(itemData.type); // Apply inline styles
                dayDiv.appendChild(item);
            });
            if (dayData.items.some(item => item.type === 'holiday-reason')) {
                dayDiv.classList.add('holiday');
            }
            dayDiv.addEventListener('click', () => handleDayClick(dayDiv));
            calendar.appendChild(dayDiv);

            // Add copy button for each week
            if ((index + 1) % 5 === 0) { // After every 5 days
                const copyButton = document.createElement('button');
                copyButton.innerHTML = '<span class="material-symbols-outlined">content_copy</span>'; // Material Symbols icon
                copyButton.style = 'padding: 5px; width: 30px; height: 30px; border: none; background-color: #007bff; color: #fff; border-radius: 4px; cursor: pointer;';
                copyButton.addEventListener('click', () => copyWeek(date));
                calendar.appendChild(copyButton);
            }
        });
    };
    reader.readAsText(file);
}

function getItemStyle(type) {
    switch (type) {
        case 'content':
            return 'background-color: #d1ecf1; color: #0c5460;';
        case 'eval':
            return 'background-color: #d4edda; color: #155724;';
        case 'homework':
            return 'background-color: #fff3cd; color: #856404;';
        case 'holiday':
            return 'background-color: #ffcccc; color: #721c24;';
        case 'link':
            return 'background-color: #cce5ff; color: #004085;';
        case 'personal-note':
        case 'personal-link':
            return 'background-color: #e2e3e5; color: #383d41;';
        default:
            return '';
    }
}

function copyWeek(currentDate) {
    const calendar = document.getElementById('calendar');
    const days = Array.from(calendar.querySelectorAll('.day'));
    const startIndex = days.findIndex(day => day.id === `day-${currentDate.toISOString().split('T')[0]}`);
    const weekDays = days.slice(startIndex - 4, startIndex + 1); // Adjust this to select the desired week

    let weekHTML = '<div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px;">';

    weekDays.forEach(day => {
        const dayHTML = day.outerHTML.replace(/class="day"/, `style="${dayStyle(day)}"`);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = dayHTML;
        const dayElement = tempDiv.firstChild;
        dayElement.querySelectorAll('p').forEach(p => {
            if (!p.classList.contains('personal-note') && !p.classList.contains('personal-link')) {
                p.style = getItemStyle(p.className);
            } else {
                p.remove(); // Remove personal notes and links
            }
        });
        weekHTML += tempDiv.innerHTML;
    });

    weekHTML += '</div>';

    copyToClipboard(weekHTML);
    alert('Week copied to clipboard!');
}

function dayStyle(day) {
    const styles = window.getComputedStyle(day);
    return `
        padding: ${styles.padding};
        border: ${styles.border};
        border-radius: ${styles.borderRadius};
        background-color: ${styles.backgroundColor};
        min-height: ${styles.minHeight};
        cursor: ${styles.cursor};
        word-wrap: ${styles.wordWrap};
    `;
}

function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
}