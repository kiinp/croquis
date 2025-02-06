let isResizing = false;
let currentTarget = null;
let startX = 0;
let type = "right";
const minSize = 10;
let startWidth = 0;

function bindGlobalEvents() {
    document.addEventListener('mousemove', (event) => {
        if (!isResizing) return;
        const gab = type == "right" ? (event.clientX - startX) : (startX - event.clientX);
        let newWidth = startWidth + gab;
        if (newWidth < minSize) {
            currentTarget.classList.add('hidden');
        } else {
            currentTarget.classList.remove('hidden');
        }
        if (currentTarget) {
            currentTarget.style.width = newWidth + 'px';
        }
    });

    document.addEventListener('mouseup', () => {
        isResizing = false;
        currentTarget = null;
    });
}


function createSizeChangeBar(targetDiv, _type="right") {
    const bar = document.createElement('div');
    bar.classList.add('size-change-bar');

    bar.addEventListener('mousedown', (event) => {
        console.log("hi")
        isResizing = true;
        currentTarget = targetDiv;
        startX = event.clientX;
        type = _type;
        startWidth = currentTarget.offsetWidth;
        event.preventDefault();
    });
    return bar;
}

export default {
    bindGlobalEvents,
    createSizeChangeBar
};