document.addEventListener('DOMContentLoaded', async () => {
    function applyOptionGlobal(option) {
        document.body.classList.remove("dark", "white");
        document.body.classList.add(option.theme);
    }
    const option = await window.api.getOption();
    applyOptionGlobal(option);

    window.api.receive('option-changed', (option) => {
        applyOptionGlobal(option);
    });
    const result = await window.api.getFolderList();
    console.log(result);
    if (!result.success) {
        alert(result.msg);
        return;
    }
    folderList = result.data;
    populateFolderSelect(folderList);
});

const populateFolderSelect = (folders) => {
    const folderSelect = document.getElementById('folder-select');
    folderSelect.innerHTML = '';
    folders.forEach(folder => {
        const option = document.createElement('option');
        option.value = folder.id;
        option.textContent = folder.folderName;
        folderSelect.appendChild(option);
    });
    // if(folderSelect.value){
    //     folderSelect
    // }
};

window.api.receive('send-data-to-croquis-option', async (imageList) => {
    const startBtn = document.querySelector("div.start-btn");

    if (startBtn) {
        // Add click event listener to the start button
        startBtn.addEventListener("click", () => {
            const option = getCroquisOption();
            if (!option) return;
            window.api.send('send-croquis-data-to-main', {
                option,
                imageList: imageList,
            });
        });
    }

    // Initialize options from the stored configuration
    const option = await window.api.getOption();
    initOptionEl(option.croquis);
});

/**
 * Initialize the UI elements with the provided croquis options.
 * @param {import("../../type.js").CroquisOption} option 
 */
function initOptionEl(option) {
    if (!option) return;

    // Get DOM elements
    const timerSelect = document.getElementById('timer-select');
    const customTimerInput = document.getElementById('custom-timer-input');
    const autoskipCheckbox = document.getElementById('autoskip-checkbox');
    const saveCheckbox = document.getElementById('auto-save-checkbox');
    const savePathInput = document.getElementById('savePath');
    const autoCaptureCheckbox = document.getElementById('auto-capture-checkbox');
    const captureCheckbox = document.getElementById('capture-checkbox');
    const saveOptionCheckbox = document.getElementById('save-option-checkbox');
    const browseSaveButton = document.getElementById('browse-save');
    const windowWidthEl = document.querySelector("input#custom-window-input-width");
    const windowHeightEl = document.querySelector("input#custom-window-input-height");
    const folderSelect = document.getElementById('folder-select');

    const grayOptionCheckbox = document.getElementById('gray-option-checkbox');
    const shuffleOptionCheckbox = document.getElementById('shuffle-option-checkbox');

    shuffleOptionCheckbox.checked = option.shuffleOption || false;
    grayOptionCheckbox.checked = option.grayOption || false;
    // Set initial values from the option object
    savePathInput.value = option.savePath || "";
    autoskipCheckbox.checked = option.auto?.skip || false;
    saveCheckbox.checked = option.auto?.save || false;
    autoCaptureCheckbox.checked = option.auto?.capture || false;
    captureCheckbox.checked = option.capture || false;
    // Always check the save option checkbox
    saveOptionCheckbox.checked = true;
    windowWidthEl.value = option.window?.width || "200";
    windowHeightEl.value = option.window?.height || "300";
    timerSelect.value = option.timer?.maxTime.toString() || "10";
    folderSelect.value = option.saveFolder || "1";

    if (!timerSelect.value) {
        timerSelect.value = "custom";
        customTimerInput.style.display = 'inline';
    } else {
        customTimerInput.style.display = 'none';
    }
    customTimerInput.value = option.timer?.maxTime.toString() || "10";

    // Add event listener to the browse button for selecting a folder
    browseSaveButton.addEventListener('click', async () => {
        const folderPath = await window.api.openFolder();
        if (folderPath) {
            savePathInput.value = folderPath;
        }
    });
}

/**
 * Retrieve croquis options from the current UI values.
 * @returns {import("../../type.js").CroquisOption}
 */
function getCroquisOption() {
    // Get DOM elements
    const timerSelect = document.getElementById('timer-select');
    const folderSelect = document.getElementById('folder-select');
    const customTimerInput = document.getElementById('custom-timer-input');
    const autoskipCheckbox = document.getElementById('autoskip-checkbox');
    const saveCheckbox = document.getElementById('auto-save-checkbox');
    const savePathInput = document.getElementById('savePath');
    const autoCaptureCheckbox = document.getElementById('auto-capture-checkbox');
    const captureCheckbox = document.getElementById('capture-checkbox');
    const saveOptionCheckbox = document.getElementById('save-option-checkbox');
    const windowWidthEl = document.querySelector("input#custom-window-input-width");
    const windowHeightEl = document.querySelector("input#custom-window-input-height");
    const grayOptionCheckbox = document.getElementById('gray-option-checkbox');
    const shuffleOptionCheckbox = document.getElementById('shuffle-option-checkbox');
    

    // Determine timer value based on selection
    let timerValue;
    if (timerSelect && timerSelect.value === 'custom') {
        timerValue = parseInt(customTimerInput.value, 10);
    } else {
        timerValue = parseInt(timerSelect ? timerSelect.value : "0", 10);
    }

    // Get checkbox states
    const isAutoskip = autoskipCheckbox ? autoskipCheckbox.checked : false;
    const isSave = saveCheckbox ? saveCheckbox.checked : false;
    const isCapture = captureCheckbox ? captureCheckbox.checked : false;
    const isAutoCapture = autoCaptureCheckbox ? autoCaptureCheckbox.checked : false;
    const isSaveOption = saveOptionCheckbox ? saveOptionCheckbox.checked : false;
    const isGrayOption = grayOptionCheckbox ? grayOptionCheckbox.checked : false;
    const isShuffleOption = shuffleOptionCheckbox ? shuffleOptionCheckbox.checked : false;

    // Get window dimensions
    const windowWidth = windowWidthEl ? windowWidthEl.value : "0";
    const windowHeight = windowHeightEl ? windowHeightEl.value : "0";

    if (isCapture || (isAutoCapture && isSave && isAutoskip)) {
        if (savePathInput.value === '') {
            alert('Please select a save path');
            return false;
        }
    }
    // Construct the option object
    const option = {
        window: {
            width: windowWidth,
            height: windowHeight,
        },
        auto: {
            skip: isAutoskip,
            save: isSave,
            capture: isAutoCapture,
        },
        timer: {
            maxTime: timerValue,
        },
        capture: isCapture,
        savePath: savePathInput.value,
        saveFolder: folderSelect.value,
        grayOption: isGrayOption,
        shuffleOption: isShuffleOption
    };

    // Save the option if the save option checkbox is checked
    if (isSaveOption) {
        window.api.setOption({
            croquis: option,
        });
    }

    return option;
}
