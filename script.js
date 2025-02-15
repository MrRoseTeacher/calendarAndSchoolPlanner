let changesMade = false;
let calendarLoaded = false;
let fileHandle; // Store the file handle for subsequent overwrites
let originalFileName; // Store the original file name for comparison
let popupToggle = false;
let optionsDiag = false;
let contentDiag = false;
let linkDiag = false;
const instructions = document.getElementById("instructions");
const popup = document.getElementById("popup");
const popupOK = document.getElementById("popup-ok");
const popupCancel = document.getElementById("popup-cancel");
const popupContent = document.getElementById("popup-content");

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

function togglePopup(){
    popupToggle = !popupToggle;
    if(popupToggle){
        popup.style.opacity = 1;
    }
    else{
        popup.style.opacity = 0;
    }
}

popupCancel.onclick = function(){
    togglePopup();
}

function serveOptions(dayDiv){
    optionsDiag = true;
    contentDiag = false;
    linkDiag = false;
    instructions.innerHTML = "Select action:<br>1: Content<br>2: Eval<br>3: Link<br>4: Homework<br>5: Personal Note<br>6: Personal Link<br>7: Holiday"
    popupContent.innerHTML = "";
    const node = document.createElement("input");
    node.type = "text";
    node.addEventListener("keypress", function(event){
        if(event.key == "Enter"){
            popupOK.click();
        }
    })
    popupContent.appendChild(node);
    node.focus();
    popupOK.onclick = function(){
        createContent(dayDiv, node.value);
    }
}

function serveContent(dayDiv, actionType){
    if (actionType === 'holiday') {
        if (dayDiv.classList.contains('holiday')) {
            dayDiv.classList.remove('holiday');
            dayDiv.querySelector('.holiday-reason').remove();
            togglePopup();
        } else {
            instructions.innerHTML = "Enter reason for holiday";
            popupContent.innerHTML = "";
            const node = document.createElement("input");
            node.type = "text";
            node.addEventListener("keypress", function(event){
                if(event.key == "Enter"){
                    popupOK.click();
                }
            })
            popupContent.appendChild(node);
            node.focus();
            popupOK.onclick = function(){
                changeDayContent(dayDiv, actionType, node.value);
            }
        }
    }
    else if (actionType === 'link' || actionType === 'personal-link') {
        instructions.innerHTML = "Enter the URL";
        popupContent.innerHTML = "";
        const node = document.createElement("input");
        node.type = "text";
        node.addEventListener("keypress", function(event){
            if(event.key == "Enter"){
                popupOK.click();
            }
        })
        popupContent.appendChild(node);
        node.focus();
        const pnode = document.createElement("p");
        pnode.innerHTML = "Enter the link text"
        popupContent.appendChild(pnode);
        const node2 = document.createElement("input");
        node2.type = "text";
        node2.addEventListener("keypress", function(event){
            if(event.key == "Enter"){
                popupOK.click();
            }
        })
        popupContent.appendChild(node2);
        popupOK.onclick = function(){
            if(node.value && node2.value){
                changeDayContent(dayDiv, actionType, node2.value, node.value);
            }
        }
    }
    else {
        instructions.innerHTML = "Enter content text";
        popupContent.innerHTML = "";
        const node = document.createElement("input");
        node.type = "text";
        node.addEventListener("keypress", function(event){
            if(event.key == "Enter"){
                popupOK.click();
            }
        })
        popupContent.appendChild(node);
        node.focus();
        popupOK.onclick = function(){
            changeDayContent(dayDiv, actionType, node.value);
        }
    }
}

function changeDayContent(dayDiv, actionType, text, url=null){
    if(actionType == "holiday"){
        if(text){
            dayDiv.classList.add('holiday');
            const reasonP = document.createElement('p');
            reasonP.className = 'holiday-reason';
            reasonP.textContent = text;
            dayDiv.appendChild(reasonP);
        }
    }
    else if(actionType === "link" || actionType === "personal-link"){
        if (url && text) {
            const item = document.createElement('p');
            item.className = actionType;
            item.innerHTML = `<a href="${url}" target="_blank">${text}</a>`;
            item.addEventListener('click', (e) => editItem(e, item));
            item.draggable = true; // Make item draggable
            item.id = `item-${Date.now()}`; // Assign a unique id
            item.addEventListener('dragstart', handleDragStart);
            item.addEventListener('dragover', handleDragOver);
            item.addEventListener('drop', handleDrop);
            const dragHandle = document.createElement('span');
            dragHandle.className = 'drag-handle';
            dragHandle.innerHTML = '⇅'; // Drag handle icon
            dragHandle.addEventListener('mousedown', (e) => e.stopPropagation()); // Prevent triggering editItem
            dragHandle.addEventListener('dragstart', handleDragStart);
            item.prepend(dragHandle);
            dayDiv.appendChild(item);
            markChanges(); // Mark changes
        }
    }
    else{
        if (text) {
            const item = document.createElement('p');
            item.className = actionType;
            item.innerHTML = text; // Allow HTML input for hyperlinks
            item.addEventListener('click', (e) => editItem(e, item));
            item.draggable = true; // Make item draggable
            item.id = `item-${Date.now()}`; // Assign a unique id
            item.addEventListener('dragstart', handleDragStart);
            item.addEventListener('dragover', handleDragOver);
            item.addEventListener('drop', handleDrop);
            const dragHandle = document.createElement('span');
            dragHandle.className = 'drag-handle';
            dragHandle.innerHTML = '⇅'; // Drag handle icon
            dragHandle.addEventListener('mousedown', (e) => e.stopPropagation()); // Prevent triggering editItem
            dragHandle.addEventListener('dragstart', handleDragStart);
            item.prepend(dragHandle);
            dayDiv.appendChild(item);
            markChanges(); // Mark changes
        }
    }
    togglePopup();
}

function clearPopup(){
    popupContent.innerHTML = "";
    instructions.innerHTML = "";
}

function generateCalendar() {
    changesMade = false; // Reset changes flag
    calendarLoaded = true; // Mark calendar as loaded
    document.getElementById('merge-button').disabled = false; // Enable merge button
    const startDate = new Date(document.getElementById('start-date').value);
    const endDate = new Date(document.getElementById('end-date').value);
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';
    let currentDate = new Date(startDate.getTime() + startDate.getTimezoneOffset() * 60000); // Normalize the start date
    const normalizedEndDate = new Date(endDate.getTime() + endDate.getTimezoneOffset() * 60000); // Normalize the end date
    while (currentDate <= normalizedEndDate) {
        if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) { // Skip weekends
            const dayDiv = createDayElement(currentDate.toISOString().split('T')[0]);
            const options = { month: 'short', day: 'numeric' }; // Format options without the year
            dayDiv.innerHTML = `<strong>${currentDate.toLocaleDateString(undefined, options)}</strong>`;
            const sortIcon = document.createElement('span');
            sortIcon.innerHTML = '⤨'; // Sort icon
            sortIcon.className = 'sort-icon';
            sortIcon.style = 'cursor: pointer; margin-left: 5px;';
            sortIcon.addEventListener('click', (e) => {
                e.stopPropagation(); // Stop event propagation
                sortItems(dayDiv);
            });
            dayDiv.appendChild(sortIcon);
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
    togglePopup();
    serveOptions(dayDiv);
}

function createContent(dayDiv, action){
    // if (action === null) return; // Exit if the user presses cancel
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
    serveContent(dayDiv, actionType);
}

function editItem(event, item) {
    event.stopPropagation(); // Prevent triggering the day click event
    if (event.target.tagName.toLowerCase() === 'a') {
        return; // Do not trigger edit if the link text is clicked
    }
    if (item.className == "link" || item.className == "personal-link") {
        editLink(item);
    } else {
        editContent(item)
    }
}

function editContent(item) {
    console.log("editing content");
    togglePopup();
    const dragHandle = item.querySelector('.drag-handle');
    const textContent = dragHandle ? item.textContent.replace(dragHandle.textContent, '').trim() : item.textContent.trim();
    // const newText = prompt("Edit item text:", textContent);
    instructions.innerHTML = "Edit item text";
    popupContent.innerHTML = "";
    const node = document.createElement("input");
    node.type = "text";
    node.value = textContent;
    node.addEventListener("keypress", function(event){
        if(event.key == "Enter"){
            popupOK.click();
        }
    })
    popupContent.appendChild(node);
    node.onfocus = function(){
        node.select();
    }
    node.focus();
    popupOK.onclick = function(){
        if (node.value.trim() === "") {
            item.remove(); // Remove the item if the new text is empty
            markChanges(); // Mark changes
        } else {
            item.innerHTML = node.value;
            if (dragHandle) {
                item.prepend(dragHandle); // Re-add the drag handle
            }
            markChanges(); // Mark changes
        }
        togglePopup();
    }
}

function editLink(item) {
    togglePopup();
    const dragHandle = item.querySelector('.drag-handle');
    const linkElement = item.querySelector('a');
    const linkText = dragHandle ? linkElement.textContent.replace(dragHandle.textContent, '').trim() : linkElement.textContent.trim();
    instructions.innerHTML = "Edit the URL";
    popupContent.innerHTML = "";
    const node = document.createElement("input");
    node.type = "text";
    node.value = linkElement.href;
    node.addEventListener("keypress", function(event){
        if(event.key == "Enter"){
            popupOK.click();
        }
    })
    popupContent.appendChild(node);
    node.onfocus = function(){
        node.select();
    }
    node.focus();
    const pnode = document.createElement("p");
    pnode.innerHTML = "Edit the link text"
    popupContent.appendChild(pnode);
    const node2 = document.createElement("input");
    node2.type = "text";
    node2.value = linkText;
    node2.onfocus = function(){
        node2.select();
    }
    node2.addEventListener("keypress", function(event){
        if(event.key == "Enter"){
            popupOK.click();
        }
    })
    popupContent.appendChild(node2);
    popupOK.onclick = function(){
        if (node.value.trim() === "" || node2.value.trim() === "") {
            item.remove(); // Remove the item if the new text is empty
        } else {
            linkElement.textContent = node2.value;
            linkElement.href = node.value;
        }
        if (dragHandle) {
            item.prepend(dragHandle); // Re-add the drag handle
        }
        markChanges(); // Mark changes
        togglePopup();
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
    const safeTitle = calendarTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const newFileName = `${safeTitle}.json`;
    const calendar = document.getElementById('calendar');
    const days = Array.from(calendar.querySelectorAll('.day'));
    const calendarData = days.map(day => {
        const date = day.id.split('day-')[1];
        const items = Array.from(day.querySelectorAll('p')).map(item => {
            const itemClone = item.cloneNode(true);
            const dragHandle = itemClone.querySelector('.drag-handle');
            if (dragHandle) {
                dragHandle.remove(); // Remove drag handle
            }
            return {
                type: item.className,
                text: itemClone.innerHTML // Save innerHTML to preserve hyperlinks
            };
        });
        return { date, items };
    });
    const json = JSON.stringify({ title: calendarTitle, data: calendarData }, null, 2);

    try {
        const isLocalServer = window.location.hostname === 'localhost';
        if (isLocalServer) {
            const response = await fetch('/api/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    file: {
                        name: newFileName,
                        content: json
                    }
                })
            });
            if (!response.ok) {
                throw new Error(`Failed to save calendar: ${response.statusText}`);
            }
            const result = await response.json();
            console.log('Calendar saved successfully on local server:', result);
        } else {

            if (!fileHandle || originalFileName !== newFileName) {
                fileHandle = await window.showSaveFilePicker({
                    suggestedName: newFileName,
                    types: [
                        {
                            description: 'JSON Files',
                            accept: { 'application/json': ['.json'] }
                        }
                    ]
                });
                originalFileName = newFileName;
                console.log('New fileHandle:', fileHandle);
                console.log('New originalFileName:', originalFileName);
            }
            const writable = await fileHandle.createWritable();
            await writable.write(json);
            await writable.close();
        }
        changesMade = false; // Reset changes flag
        document.getElementById('notification').style.display = 'none'; // Hide notification
    } catch (error) {
        console.error('Error saving calendar:', error);
        alert('An error occurred while saving the calendar. Please try again.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('load-button').addEventListener('click', async function() {
        await loadCalendar();
    });

    document.getElementById('merge-button').addEventListener('click', async function() {
        await mergeCalendar();
    });
});

async function loadCalendar() {

    changesMade = false; // Reset changes flag
    calendarLoaded = true; // Mark calendar as loaded
    document.getElementById('merge-button').disabled = false; // Enable merge button
    document.getElementById('notification').style.display = 'none'; // Hide notification

    const isLocalServer = window.location.hostname === 'localhost';
    if (isLocalServer) {
        // Local server: Load from file input
        try {
            const [handle] = await window.showOpenFilePicker({
                types: [
                    {
                        description: 'JSON Files',
                        accept: { 'application/json': ['.json'] }
                    }
                ]
            });
            fileHandle = handle; // Store the file handle
            const file = await fileHandle.getFile();
            originalFileName = file.name; // Store the original file name
            console.log('Selected file:', file.name);
            const fileContent = await file.text();
            const calendarData = JSON.parse(fileContent);
            renderCalendar(calendarData);
        } catch (error) {
            if (error instanceof AbortError){
                console.error("User aborted file selection", error);
            }
            else{
                console.error('Error loading calendar:', error);
                alert('An error occurred while loading the calendar. Please try again.');
            }
        }
    } else {
        // Vercel: Load from Vercel Blob
        try {
            const [handle] = await window.showOpenFilePicker({
                types: [
                    {
                        description: 'JSON Files',
                        accept: { 'application/json': ['.json'] }
                    }
                ]
            });
            fileHandle = handle; // Store the file handle
            const file = await fileHandle.getFile();
            originalFileName = file.name; // Store the original file name
            console.log('Selected file:', file.name);
            const fileContent = await file.text();
            const calendarData = JSON.parse(fileContent);
            renderCalendar(calendarData);
        } catch (error) {
            if (error instanceof AbortError){
                console.error("User aborted file selection", error);
            }
            else{
                console.error('Error loading calendar:', error);
                alert('An error occurred while loading the calendar. Please try again.');
            }
        }
    }
}

// Helper function to render the calendar
function renderCalendar(calendarData) {
    document.getElementById('calendar-title').value = calendarData.title; // Set the title input
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';
    calendarData.data.forEach((dayData, index) => {
        const dayDiv = createDayElement(dayData.date);
        const options = { month: 'short', day: 'numeric' };
        const dateParts = dayData.date.split('-');
        const date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
        dayDiv.innerHTML = `<strong>${date.toLocaleDateString(undefined, options)}</strong>`;
        const sortIcon = document.createElement('span');
        sortIcon.innerHTML = '⤨'; // Sort icon
        sortIcon.className = 'sort-icon';
        sortIcon.style = 'cursor: pointer; margin-left: 5px;';
        sortIcon.addEventListener('click', (e) => {
            e.stopPropagation(); // Stop event propagation
            sortItems(dayDiv);
        });
        dayDiv.appendChild(sortIcon);
        dayData.items.forEach(itemData => {
            const item = document.createElement('p');
            item.className = itemData.type;
            item.innerHTML = itemData.text; // Use innerHTML to preserve hyperlinks
            item.addEventListener('click', (e) => editItem(e, item));
            item.draggable = true; // Make item draggable
            item.id = `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; // Assign a unique id
            item.addEventListener('dragstart', handleDragStart);
            item.addEventListener('dragover', handleDragOver);
            item.addEventListener('drop', handleDrop);
            item.style = getItemStyle(itemData.type); // Apply inline styles
            if (itemData.type !== 'holiday-reason') {
                const dragHandle = document.createElement('span');
                dragHandle.className = 'drag-handle';
                dragHandle.innerHTML = '⇅'; // Drag handle icon
                dragHandle.addEventListener('mousedown', (e) => e.stopPropagation()); // Prevent triggering editItem
                dragHandle.addEventListener('dragstart', handleDragStart);
                item.prepend(dragHandle);
            }
            dayDiv.appendChild(item);
        });
        if (dayData.items.some(item => item.type === 'holiday-reason')) {
            dayDiv.classList.add('holiday');
        }
        dayDiv.addEventListener('click', () => handleDayClick(dayDiv));
        calendar.appendChild(dayDiv);
        if ((index + 1) % 5 === 0) { // After every 5 days
            const copyButton = document.createElement('button');
            copyButton.innerHTML = '<span class="material-symbols-outlined">content_copy</span>'; // Material Symbols icon
            copyButton.style = 'padding: 5px; width: 30px; height: 30px; border: none; background-color: #007bff; color: #fff; border-radius: 4px; cursor: pointer;';
            copyButton.addEventListener('click', () => copyWeek(date));
            calendar.appendChild(copyButton);
        }
    });
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
        case 'holiday-reason':
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
    let weekHTML = '<div class="calendar" style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; width: 94%;">';
    weekDays.forEach(day => {
        const dayStyleString = dayStyle(day); // Generate the style string
        const dayHTML = day.outerHTML.replace(/class="day holiday"/, `class="day holiday" style="${dayStyleString}"`)
            .replace(/class="day"/, `class="day" style="${dayStyleString}"`);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = dayHTML;
        const dayElement = tempDiv.firstChild;
        dayElement.querySelectorAll('p').forEach(p => {
            if (!p.classList.contains('personal-note') && !p.classList.contains('personal-link')) {
                p.style = getItemStyle(p.className);
            } else {
                p.remove(); // Remove personal notes and links
            }
            // Remove drag handles
            const dragHandle = p.querySelector('.drag-handle');
            if (dragHandle) {
                dragHandle.remove();
            }
        });
        // Remove sort icon
        const sortIcon = dayElement.querySelector('.sort-icon');
        if (sortIcon) {
            sortIcon.remove();
        }
        weekHTML += tempDiv.innerHTML;
    });
    weekHTML += '</div>';
    copyToClipboard(weekHTML);
    alert('Week copied to clipboard!');
}

function dayStyle(day) {
    const styles = window.getComputedStyle(day);
    const isHoliday = day.classList.contains('holiday');
    return `
        padding: ${styles.padding};
        border: ${styles.border};
        border-radius: ${styles.borderRadius};
        background-color: ${isHoliday ? '#ffcccc' : styles.backgroundColor};
        color: ${isHoliday ? '#721c24' : styles.color};
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

async function mergeCalendar() {

    changesMade = false; // Reset changes flag
    calendarLoaded = true; // Mark calendar as loaded
    document.getElementById('merge-button').disabled = false; // Enable merge button
    document.getElementById('notification').style.display = 'none'; // Hide notification

    const isLocalServer = window.location.hostname === 'localhost';
    if (isLocalServer) {
        // Local server: Load from file input
        try {
            const [fileHandle] = await window.showOpenFilePicker({
                types: [
                    {
                        description: 'JSON Files',
                        accept: { 'application/json': ['.json'] }
                    }
                ]
            });
            const file = await fileHandle.getFile();
            console.log('Selected file for merging:', file.name);
            const fileContent = await file.text();
            const oldCalendarData = JSON.parse(fileContent);
            const calendar = document.getElementById('calendar');
            const days = Array.from(calendar.querySelectorAll('.day'));
            let oldDataIndex = 0;
            days.forEach(dayDiv => {
                if (!dayDiv.classList.contains('holiday')) {
                    while (oldDataIndex < oldCalendarData.data.length) {
                        const oldDayData = oldCalendarData.data[oldDataIndex];
                        if (oldDayData.items.some(item => item.type === 'holiday-reason')) {
                            oldDataIndex++;
                            continue; // Skip days with "holiday-reason"
                        }
                        mergeDayItems(dayDiv, oldDayData.items);
                        oldDataIndex++;
                        break;
                    }
                }
            });
            markChanges(); // Mark changes after merging
        } catch (error) {
            console.error('Error merging calendar:', error);
            alert('An error occurred while merging the calendar. Please try again.');
        }
    } else {
        // Vercel: Load from Vercel Blob
        try {
            const [fileHandle] = await window.showOpenFilePicker({
                types: [
                    {
                        description: 'JSON Files',
                        accept: { 'application/json': ['.json'] }
                    }
                ]
            });
            const file = await fileHandle.getFile();
            const fileContent = await file.text();
            const oldCalendarData = JSON.parse(fileContent);
            const calendar = document.getElementById('calendar');
            const days = Array.from(calendar.querySelectorAll('.day'));
            let oldDataIndex = 0;
            days.forEach(dayDiv => {
                if (!dayDiv.classList.contains('holiday')) {
                    while (oldDataIndex < oldCalendarData.data.length) {
                        const oldDayData = oldCalendarData.data[oldDataIndex];
                        if (oldDayData.items.some(item => item.type === 'holiday-reason')) {
                            oldDataIndex++;
                            continue; // Skip days with "holiday-reason"
                        }
                        mergeDayItems(dayDiv, oldDayData.items);
                        oldDataIndex++;
                        break;
                    }
                }
            });
            markChanges(); // Mark changes after merging
        } catch (error) {
            console.error('Error merging calendar:', error);
            alert('An error occurred while merging the calendar. Please try again.');
        }
    }
}

function mergeDayItems(dayDiv, newItems) {
    newItems.forEach(newItemData => {
        const item = document.createElement('p');
        item.className = newItemData.type;
        item.innerHTML = newItemData.text; // Use innerHTML to preserve hyperlinks
        item.addEventListener('click', (e) => editItem(e, item));
        item.draggable = true; // Make item draggable
        item.id = `item-${Date.now()}`; // Assign a unique id
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('drop', handleDrop);
        item.style = getItemStyle(newItemData.type); // Apply inline styles
        const dragHandle = document.createElement('span');
        dragHandle.className = 'drag-handle';
        dragHandle.innerHTML = '⇅'; // Drag handle icon
        dragHandle.addEventListener('mousedown', (e) => e.stopPropagation()); // Prevent triggering editItem
        dragHandle.addEventListener('dragstart', handleDragStart);
        item.prepend(dragHandle);
        dayDiv.appendChild(item);
    });
    sortItems(dayDiv); // Sort items after merging
}

function handleDragStart(event) {
    event.dataTransfer.setData('text/plain', event.target.id);
    event.dataTransfer.effectAllowed = 'move';
}

function handleDrop(event) {
    event.preventDefault();
    const id = event.dataTransfer.getData('text/plain');
    const draggableElement = document.getElementById(id);
    const dropzone = event.target.closest('.day');
    if (dropzone) {
        const items = Array.from(dropzone.querySelectorAll('p'));
        let insertBeforeElement = null;
        for (let i = 0; i < items.length; i++) {
            const rect = items[i].getBoundingClientRect();
            if (event.clientY < rect.top + rect.height / 2) {
                insertBeforeElement = items[i];
                break;
            }
        }
        if (insertBeforeElement) {
            dropzone.insertBefore(draggableElement, insertBeforeElement);
        } else {
            dropzone.appendChild(draggableElement);
        }
        markChanges(); // Mark changes
    }
}

function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    const dropzone = event.target.closest('.day');
    if (dropzone) {
        dropzone.classList.add('drag-over');
    }
}

function handleDragLeave(event) {
    const dropzone = event.target.closest('.day');
    if (dropzone) {
        dropzone.classList.remove('drag-over');
    }
}

function createDayElement(date) {
    const dayDiv = document.createElement('div');
    dayDiv.className = 'day';
    dayDiv.id = `day-${date}`;
    addDragAndDropListeners(dayDiv);
    return dayDiv;
}

function addDragAndDropListeners(dayDiv) {
    dayDiv.addEventListener('dragover', handleDragOver);
    dayDiv.addEventListener('dragleave', handleDragLeave);
    dayDiv.addEventListener('drop', handleDrop);
}

