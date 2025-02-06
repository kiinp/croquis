/**
 * 
 * @param {number} sec 
 * @returns {number[]} [min, sec]
 */
function getTimeMinAndSecFromSec(sec) {
    return [
        Math.floor(sec / 60),
        Math.floor(sec % 60)
    ];
}

/**
 * Formats a number with leading zeros to ensure a fixed length.
 * @param {number | string} number - The number to format.
 * @param {number} length - The desired length of the output string (default is 2).
 * @returns {string} The formatted string with leading zeros.
 */
const pad = (number, length = 2) => String(number).padStart(length, '0');

/**
 * Parses a Date object into a formatted string.
 * Returns "yyyy-mm-dd" if isHm is false,
 * or "yyyy-mm-dd hh:mm" (with minutes floored to the nearest 10) if isHm is true.
 * @param {Date} dateObj - The Date object to parse.
 * @param {boolean} isHm - Whether to include hours and minutes.
 * @returns {string} The formatted date string.
 */
const parseDateToYmd = (dateObj, isHm = false) => {
    const year = dateObj.getFullYear();
    const month = pad(dateObj.getMonth() + 1);
    const day = pad(dateObj.getDate());
    const hour = pad(dateObj.getHours());
    const minute = pad(Math.floor(dateObj.getMinutes() / 10) * 10);

    return isHm
        ? `${year}-${month}-${day} ${hour}:${minute}`
        : `${year}-${month}-${day}`;
}

/**
 * Groups an array of items by their date.
 * Each item is assumed to have a "date" property.
 * @param {Object[]} items - The array of items containing date strings.
 * @param {boolean} isHm - Whether to group by hour and minute (10-minutes interval).
 * @returns {Object} An object with formatted date strings as keys and arrays of items as values.
 */
const parseItems = (items, isHm = false) => {
    const groupedItems = {};

    items.forEach(item => {
        const dateObj = new Date(item.date);
        const key = parseDateToYmd(dateObj, isHm);

        if (!groupedItems[key]) {
            groupedItems[key] = [];
        }
        groupedItems[key].push(item);
    });

    return groupedItems;
};

/**
 * Creates a single calendar box element.
 * The box's appearance and tooltip are determined by the count of items on that date.
 * @param {string} ymd - The formatted date string ("yyyy-mm-dd" or "yyyy-mm-dd hh:mm").
 * @param {number} count - The number of items for the given date.
 * @returns {HTMLElement} The created box element.
 */
const createBox = (ymd, count) => {
    const box = document.createElement('div');
    box.classList.add('box');

    if (count > 0) {
        // Apply a specific class based on the count range.
        if (count === 1) {
            box.classList.add('first-box');
        } else if (count >= 2 && count <= 5) {
            box.classList.add('second-box');
        } else if (count >= 6 && count <= 10) {
            box.classList.add('third-box');
        } else if (count >= 11 && count <= 20) {
            box.classList.add('fourth-box');
        } else {
            box.classList.add('max-box');
        }
        box.title = `${ymd} has a total of ${count} croquis.`;
    } else if (count < 0) {
        // Negative count indicates an empty placeholder (used for aligning the week days).
        box.classList.add('no-box');
    } else {
        // Count of zero indicates no activity on that date.
        box.classList.add('zero-box');
        box.title = `There is no activity on ${ymd}.`;
    }

    return box;
};

/**
 * Creates week container elements filled with calendar boxes.
 * Depending on the mode, it iterates through days or 10-minute intervals.
 * @param {boolean} isHm - If true, the calendar is in hour-minute mode (10-minute steps); otherwise, day mode.
 * @param {Date} current - The starting date/time.
 * @param {Date} end - The ending date/time.
 * @param {HTMLElement} weekContainer - The current week container element.
 * @param {Object} parsedData - The data grouped by formatted date strings.
 * @param {Function} handleBoxClick - Event handler for clicking on a calendar box.
 * @returns {HTMLElement[]} An array of week container elements.
 */
const createWeekContainers = (isHm, current, end, weekContainer, parsedData, handleBoxClick) => {
    const maxBoxesPerWeek = isHm ? 6 : 7;
    const weekContainers = [];

    while (current <= end) {
        const currentDate = new Date(current);
        const ymd = parseDateToYmd(current, isHm);
        const items = parsedData[ymd];
        const box = createBox(ymd, items?.length || 0);
        box.dataset.date = currentDate.toISOString();

        if (items && items.length > 0) {
            box.addEventListener('click', () => handleBoxClick(ymd));
        }

        weekContainer.appendChild(box);

        // Move to the next date or time slot.
        if (isHm) {
            current.setMinutes(current.getMinutes() + 10);
        } else {
            current.setDate(current.getDate() + 1);
        }
        if (weekContainer.childNodes.length === maxBoxesPerWeek) {
            weekContainers.push(weekContainer);
            weekContainer = document.createElement('div');
            weekContainer.classList.add('week-container');
        }
    }

    // Append any remaining boxes
    if (weekContainer.childNodes.length > 0) {
        weekContainers.push(weekContainer);
    }
    return weekContainers;
};

/**
 * Creates the calendar and returns an array of week container elements.
 * If a date filter is provided, it creates a calendar for that specific day in hour-minute mode.
 * Otherwise, it creates a calendar for the entire year 2025.
 * @param {import("../type").HistoryItem[]} items - Array of items containing date information.
 * @param {Function} handleBoxClick - Callback function to execute when a calendar box is clicked.
 * @param {number} [selectedYear] - Year to display. If omitted, defaults to the current year.
 * @returns {HTMLElement[]} An array of week container elements representing the calendar.
 */
const createCalendar = (items, handleBoxClick, selectedYear) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const year = selectedYear ? Number(selectedYear) : currentYear;
    let start, end;

    if (year === currentYear) {
        end = today;
        const currentMonth = today.getMonth() + 1; // 1-12
        if (currentMonth < 12) {
            // For current year, start from previous year's (currentMonth + 1)th month, day 1.
            start = new Date((currentYear - 1) + '-' + pad(currentMonth + 1) + '-01T00:00:00');
        }
        else {
            start = new Date(year + '-01-01T00:00:00');
        }
    }
    else {
        start = new Date(year + '-01-01T00:00:00');
        end = new Date(year + '-12-31T23:59:59');
    }

    // Filter items to include only those within the range.
    const filteredItems = items.filter(item => {
        const d = new Date(item.date);
        return d >= start && d <= end;
    });
    const parsedData = parseItems(filteredItems, false);

    // Create initial week container.
    const initialWeekContainer = document.createElement('div');
    initialWeekContainer.classList.add('week-container');

    // Add leading placeholder boxes based on the starting weekday.
    const firstDayOfWeek = start.getDay(); // 0 (Sunday) to 6 (Saturday)
    for (let i = 0; i < firstDayOfWeek; i++) {
        initialWeekContainer.appendChild(createBox("", -1));
    }

    // Create week columns.
    const weekColumns = createWeekContainers(false, new Date(start), end, initialWeekContainer, parsedData, handleBoxClick);

    // Create calendar container.
    const calendarContainer = document.createElement('div');
    calendarContainer.classList.add('calendar-container');

    // Create month labels container.
    const monthLabels = document.createElement('div');
    monthLabels.classList.add('month-labels');

    let preMonthLabel;
    let spacerCnt = 0;
    // Determine month labels based on the first day of each week column.
    weekColumns.forEach((weekColumn, index) => {
        const firstBox = weekColumn.firstChild;
        if (index === 0) {
            const label = document.createElement('div');
            label.classList.add('month-label');
            label.textContent = start.toLocaleString('en-US', { month: 'short' });
            monthLabels.appendChild(label);
            preMonthLabel = label;
        }
        else if (firstBox && firstBox.dataset.date) {
            const date = new Date(firstBox.dataset.date);
            const month = date.getMonth();
            const prevFirstBox = weekColumns[index - 1].firstChild;
            if (prevFirstBox && prevFirstBox.dataset.date) {
                const prevDate = new Date(prevFirstBox.dataset.date);
                if (prevDate.getMonth() !== month) {
                    const label = document.createElement('div');
                    label.classList.add('month-label');
                    label.textContent = date.toLocaleString('en-US', { month: 'short' });

                    preMonthLabel.style.minWidth = `calc(14px * ${spacerCnt + 1})`
                    preMonthLabel = label;
                    monthLabels.appendChild(label);
                    spacerCnt = 0;
                }
                else {
                    spacerCnt++;
                }
            }
        }
    });
    console.log(monthLabels)

    // Create day labels container (only "Mon", "Wed", "Fri").
    const dayLabels = document.createElement('div');
    dayLabels.classList.add('day-labels');
    ['Mon', 'Wed', 'Fri'].forEach(dayText => {
        const label = document.createElement('div');
        label.classList.add('day-label');
        label.textContent = dayText;
        dayLabels.appendChild(label);
    });

    // Create weeks container.
    const weeksContainer = document.createElement('div');
    weeksContainer.classList.add('weeks-container');
    weekColumns.forEach(weekColumn => {
        weeksContainer.appendChild(weekColumn);
    });

    // Assemble the final calendar layout.
    calendarContainer.appendChild(dayLabels);
    const gridWrapper = document.createElement('div');
    gridWrapper.classList.add('grid-wrapper');
    gridWrapper.appendChild(monthLabels);
    gridWrapper.appendChild(weeksContainer);
    calendarContainer.appendChild(gridWrapper);

    return calendarContainer;
};


export default { pad, parseDateToYmd, parseItems, createCalendar, getTimeMinAndSecFromSec };

/* 특정 날짜의 경우 각 시간별로 보여주는 코드
const createWeekContainers = (isHm, current, end, weekContainer, parsedData, handleBoxClick) => {
    const maxBoxesPerWeek = isHm ? 6 : 7;
    const weekContainers = [];

    while (current <= end) {
        const ymd = parseDateToYmd(current, isHm);
        const items = parsedData[ymd];
        const box = createBox(ymd, items?.length || 0);

        if (items && items.length > 0) {
            box.addEventListener('click', () => handleBoxClick(ymd));
        }

        weekContainer.appendChild(box);

        // Move to the next date or time slot.
        if (isHm) {
            current.setMinutes(current.getMinutes() + 10);
        } else {
            current.setDate(current.getDate() + 1);
        }
        if (weekContainer.childNodes.length === maxBoxesPerWeek) {
            weekContainers.push(weekContainer);
            weekContainer = document.createElement('div');
            weekContainer.classList.add('week-container');
        }
    }

    // Append any remaining boxes
    if (weekContainer.childNodes.length > 0) {
        weekContainers.push(weekContainer);
    }
    return weekContainers;
};

const createCalendar = (items, handleBoxClick, date = null) => {
    // If date is provided, use hour-minute mode; otherwise, use day mode.
    const isHm = !!date;
    const parsedData = parseItems(items, isHm);
    console.log(parsedData)
    let start, end;
    if (date) {
        // When a date filter is provided, set start and end times for that specific day.
        const year = date.year || 2025;
        const month = pad(date.month || 1);
        const day = pad(parseInt(date.day) || 1);
        start = new Date(`${year}-${month}-${day}T00:00:00`);
        end = new Date(`${year}-${month}-${day}T23:59:59`);
    } else {
        start = new Date('2025-01-01T00:00:00');
        end = new Date('2025-12-31T23:59:59');
    }

    const current = new Date(start);
    let weekContainer = document.createElement('div');
    weekContainer.classList.add('week-container');

    if (!date) {
        // Add empty boxes at the beginning of the calendar to align with the correct weekday.
        const firstDayOfWeek = current.getDay(); // 0 (Sunday) to 6 (Saturday)
        for (let i = 0; i < firstDayOfWeek; i++) {
            weekContainer.appendChild(createBox("", -1));
        }
    }

    // Create the calendar and return the array of week containers.
    return createWeekContainers(isHm, current, end, weekContainer, parsedData, handleBoxClick);
};

*/