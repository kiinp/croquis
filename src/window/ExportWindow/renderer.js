import utils from "./calcPosition.js";

function updatePreview() {
    const gap = parseInt(document.getElementById('image-gap').value) || 0;
    const padding = parseInt(document.getElementById('total-padding').value) || 0;
    const isHorizion = document.querySelector("#is-horizon").checked;
    const option = {
        padding,
        hGap: gap,
        vGap: gap,
        limitPerLine: isHorizion ? 2 : 1
    };
    const boxList = [];

    let aWidth = parseInt(document.getElementById('a-width').value) || 0;
    let aHeight = parseInt(document.getElementById('a-height').value) || 0;
    const aUseRatio = document.getElementById('a-use-ratio').checked;
    if (aUseRatio) {
        const ratioValue = document.getElementById('a-ratio').value;
        if (ratioValue === 'original') {
            aHeight = aWidth * (1.6);
        } else if (ratioValue === '1:1') {
            aHeight = aWidth;
        } else if (ratioValue === '1:1.6') {
            aHeight = aWidth * (1.6);
        } else if (ratioValue === '1.6:1') {
            aHeight = aWidth / (1.6);
        } else if (ratioValue === 'custom') {
            const customW = parseFloat(document.getElementById('a-custom-width').value) || 1;
            let customH = parseFloat(document.getElementById('a-custom-height').value) || 1;

            aHeight = aWidth * (customH / customW);
        }
    }
    const previewA = document.getElementById('preview-a');

    boxList.push({
        name: "a",
        width: aWidth,
        height: aHeight,
    });

    let bWidth = parseInt(document.getElementById('b-width').value) || 0;
    let bHeight = parseInt(document.getElementById('b-height').value) || 0;
    const bUseRatio = document.getElementById('b-use-ratio').checked;
    if (bUseRatio) {
        const ratioValue = document.getElementById('b-ratio').value;
        if (ratioValue === 'original') {
            bHeight = bWidth * (1.6);
        } else if (ratioValue === '1:1') {
            bHeight = bWidth;
        } else if (ratioValue === '1:1.6') {
            bHeight = bWidth * (1.6);
        } else if (ratioValue === '1.6:1') {
            bHeight = bWidth / (1.6);
        } else if (ratioValue === 'custom') {
            const customW = parseFloat(document.getElementById('b-custom-width').value) || 1;
            const customH = parseFloat(document.getElementById('b-custom-height').value) || 1;
            bHeight = bWidth * (customH / customW);
        }
    }
    const previewB = document.getElementById('preview-b');
    boxList.push({
        name: "b",
        width: bWidth,
        height: bHeight,
    });
    const data = utils.calcPosition({
        option, boxList
    });

    
    const previewContainer = document.getElementById('preview-conatainer');
    if (!previewContainer) {
        return;
    }
    
    previewContainer.innerHTML = '';
    
    previewContainer.style.position = 'relative';
    previewContainer.style.width = data.outerWidth + 'px';
    previewContainer.style.height = data.outerHeight + 'px';
    previewContainer.style.border = '1px solid #000';
    
    data.boxList.forEach(box => {
        const boxDiv = document.createElement('div');
        boxDiv.style.position = 'absolute';
        boxDiv.style.left = box.startPos.x + 'px';
        boxDiv.style.top = box.startPos.y + 'px';
        boxDiv.style.width = box.width + 'px';
        boxDiv.style.height = box.height + 'px';
        boxDiv.style.backgroundColor = 'lightblue';
        boxDiv.style.display = 'flex';
        boxDiv.style.alignItems = 'center';
        boxDiv.style.justifyContent = 'center';
        boxDiv.style.border = '1px solid #333';
        boxDiv.textContent = box.name;
        
        previewContainer.appendChild(boxDiv);
    });
}

// Function to toggle ratio mode and disable/enable relevant inputs
function toggleRatio(image) {
    const useRatio = document.getElementById(image + '-use-ratio').checked;
    const heightInput = document.getElementById(image + '-height');
    const ratioSelectDiv = document.getElementById(image + '-ratio-select');

    if (useRatio) {
        // Disable height input and show ratio selection
        heightInput.disabled = true;
        ratioSelectDiv.classList.remove('hidden');
    } else {
        // Enable height input and hide ratio selection and custom input
        heightInput.disabled = false;
        ratioSelectDiv.classList.add('hidden');
        document.getElementById(image + '-custom-ratio').classList.add('hidden');
    }
    updatePreview();
}

// Function to handle ratio selection change for custom option display
function handleRatioChange(image) {
    const ratioValue = document.getElementById(image + '-ratio').value;
    const customDiv = document.getElementById(image + '-custom-ratio');
    if (ratioValue === 'custom') {
        customDiv.classList.remove('hidden');
    } else {
        customDiv.classList.add('hidden');
    }
    updatePreview();
}


// Add event listeners for inputs
document.getElementById('a-use-ratio').addEventListener('change', function () { toggleRatio('a'); });
document.getElementById('b-use-ratio').addEventListener('change', function () { toggleRatio('b'); });

document.getElementById('a-ratio').addEventListener('change', function () { handleRatioChange('a'); });
document.getElementById('b-ratio').addEventListener('change', function () { handleRatioChange('b'); });


// 모든 input 요소에 대해 updatePreview 호출
const inputs = document.querySelectorAll('input, select');
inputs.forEach(input => {
    input.addEventListener('input', updatePreview);
});


// 초기 미리보기 업데이트
updatePreview();