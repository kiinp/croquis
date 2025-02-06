let isLoaded = false;
let windowId;
let isDown = false
let savePath;
let startX = 0;
let startY = 0;

window.api.receive('start-selection', (data) => {
    windowId = data.windowId;
    isDown = false;
    savePath = data.savePath
    isLoaded = true;
    startX = 0;
startY = 0;
})
document.addEventListener('DOMContentLoaded', () => {

    startX = 0;
    startY = 0;
    let selectionBox = document.getElementById('selectionBox');

    const clearRect = () =>{
        selectionBox.style.left = startX + 'px';
        selectionBox.style.top = startY + 'px';
        selectionBox.style.width = '0px';
        selectionBox.style.height = '0px';
    }

    document.addEventListener('pointerdown', e => {
        if (!isLoaded) return;
        if(startX!=0 || startY != 0){
            let x = Math.min(e.pageX, startX);
            let y = Math.min(e.pageY, startY);
            let w = Math.abs(e.pageX - startX);
            let h = Math.abs(e.pageY - startY);

            selectionBox.style.left = x + 'px';
            selectionBox.style.top = y + 'px';
            selectionBox.style.width = w + 'px';
            selectionBox.style.height = h + 'px';
            
            if(w< 10 || h < 10) {
                return;
            }
    
            
            
            setTimeout(()=>{
                window.api.send('selected-rect', { 
                    rect: { x, y, width: w, height: h }, 
                    saveId: windowId, 
                    savePath 
                });
                clearRect(); 
            }, 300);
            
            isLoaded = false;
            return;
        }
        isDown = true;
        startX = e.pageX;
        startY = e.pageY;
        clearRect(); 
    });

    document.addEventListener('pointermove', e => {
        if (!isLoaded) return;
        if (!isDown) return;
        
        let x = Math.min(e.pageX, startX);
        let y = Math.min(e.pageY, startY);
        let w = Math.abs(e.pageX - startX);
        let h = Math.abs(e.pageY - startY);
        
        selectionBox.style.left = x + 'px';
        selectionBox.style.top = y + 'px';
        selectionBox.style.width = w + 'px';
        selectionBox.style.height = h + 'px';
    });

    document.addEventListener('pointerup', e => {
        if (!isLoaded) return;
        if (!isDown) return;
        isDown = false;
        
        let x = parseInt(selectionBox.style.left);
        let y = parseInt(selectionBox.style.top);
        let w = parseInt(selectionBox.style.width);
        let h = parseInt(selectionBox.style.height);
        
        if(w< 10 || h < 10) {
            return;
        }

        window.api.send('selected-rect', { 
            rect: { x, y, width: w, height: h }, 
            saveId: windowId, 
            savePath 
        });
        
        clearRect(); 
        isLoaded = false;
    });
})

