import utils from "./calcPosition.js";


window.api.receive('export-images', (selectedList) => {
    const firstWindowUI = new FirstWindowUI();
    const secondWindowUI = new SecondWindowUI(selectedList);

    firstWindowUI.setSecondUI(secondWindowUI);
    secondWindowUI.setFirstUI(firstWindowUI);
});



class FirstWindowLogic {
    /**
     * Calculates the preview layout data based on the provided configuration.
     *
     * @param {Object} inputData - The configuration object containing dimensions, ratios, and layout options.
     * @param {number} inputData.aWidth - The width of box A.
     * @param {number} inputData.aHeight - The height of box A.
     * @param {boolean} inputData.aUseRatio - Indicates whether to use a ratio for box A.
     * @param {string} inputData.aRatio - The ratio setting for box A (e.g., 'original', '1:1', '1:1.6', '1.6:1', or 'custom').
     * @param {number} inputData.aCustomW - Custom ratio width for box A (used when aRatio === 'custom').
     * @param {number} inputData.aCustomH - Custom ratio height for box A (used when aRatio === 'custom').
     * @param {number} inputData.bWidth - The width of box B.
     * @param {number} inputData.bHeight - The height of box B.
     * @param {boolean} inputData.bUseRatio - Indicates whether to use a ratio for box B.
     * @param {string} inputData.bRatio - The ratio setting for box B (e.g., 'original', '1:1', '1:1.6', '1.6:1', or 'custom').
     * @param {number} inputData.bCustomW - Custom ratio width for box B (used when bRatio === 'custom').
     * @param {number} inputData.bCustomH - Custom ratio height for box B (used when bRatio === 'custom').
     * @param {number} inputData.gap - Gap (horizontal/vertical) between boxes.
     * @param {number} inputData.padding - Padding around the entire layout.
     * @param {boolean} inputData.isHorizon - If true, allows up to two boxes in one row; if false, stacks boxes vertically.
     * @returns {Object} An object containing layout data, including `outerWidth`, `outerHeight`, and `boxList` with position info.
     */
    calcPreviewData(inputData) {
        let { aWidth, aHeight } = inputData;
        if (inputData.aUseRatio) {
            const ratioValue = inputData.aRatio;
            if (ratioValue === 'original') {
                aHeight = aWidth * 1.6;
            } else if (ratioValue === '1:1') {
                aHeight = aWidth;
            } else if (ratioValue === '1:1.6') {
                aHeight = aWidth * 1.6;
            } else if (ratioValue === '1.6:1') {
                aHeight = aWidth / 1.6;
            } else if (ratioValue === 'custom') {
                const customW = inputData.aCustomW || 1;
                const customH = inputData.aCustomH || 1;
                aHeight = aWidth * (customH / customW);
            }
        }

        let { bWidth, bHeight } = inputData;
        if (inputData.bUseRatio) {
            const ratioValue = inputData.bRatio;
            if (ratioValue === 'original') {
                bHeight = bWidth * 1.6;
            } else if (ratioValue === '1:1') {
                bHeight = bWidth;
            } else if (ratioValue === '1:1.6') {
                bHeight = bWidth * 1.6;
            } else if (ratioValue === '1.6:1') {
                bHeight = bWidth / 1.6;
            } else if (ratioValue === 'custom') {
                const customW = inputData.bCustomW || 1;
                const customH = inputData.bCustomH || 1;
                bHeight = bWidth * (customH / customW);
            }
        }

        let boxList = [
            { name: "orgin", width: aWidth, height: aHeight },
            { name: "drawing", width: bWidth, height: bHeight },
        ];

        boxList = boxList.filter((item)=>item.width != 0);

        const option = {
            padding: inputData.padding,
            hGap: inputData.gap,
            vGap: inputData.gap,
            limitPerLine: inputData.isHorizon ? 2 : 1
        };

        const result = utils.calcPosition({
            option,
            boxList
        });
        return result;
    }
}

class FirstWindowUI {
    constructor() {
        this.container = document.querySelector(".container.first");

        this.logic = new FirstWindowLogic();

        this.secondUI = null;

        this.bindEvents();
        this.updatePreview();
    }

    setSecondUI(second) {
        this.secondUI = second;
    }

    getInputData() {
        const gap = parseInt(this.container.querySelector('#image-gap')?.value || '0');
        const padding = parseInt(this.container.querySelector('#total-padding')?.value || '0');
        const isHorizon = this.container.querySelector('#is-horizon')?.checked;

        const aWidth = parseInt(this.container.querySelector('#a-width')?.value || '0');
        let aHeight = parseInt(this.container.querySelector('#a-height')?.value || '0');
        const aUseRatio = this.container.querySelector('#a-use-ratio')?.checked;
        const aRatio = this.container.querySelector('#a-ratio')?.value;
        const aCustomW = parseFloat(this.container.querySelector('#a-custom-width')?.value || '0');
        const aCustomH = parseFloat(this.container.querySelector('#a-custom-height')?.value || '0');

        const bWidth = parseInt(this.container.querySelector('#b-width')?.value || '0');
        let bHeight = parseInt(this.container.querySelector('#b-height')?.value || '0');
        const bUseRatio = this.container.querySelector('#b-use-ratio')?.checked;
        const bRatio = this.container.querySelector('#b-ratio')?.value;
        const bCustomW = parseFloat(this.container.querySelector('#b-custom-width')?.value || '0');
        const bCustomH = parseFloat(this.container.querySelector('#b-custom-height')?.value || '0');

        return {
            aWidth,
            aHeight,
            aUseRatio,
            aRatio,
            aCustomW,
            aCustomH,
            bWidth,
            bHeight,
            bUseRatio,
            bRatio,
            bCustomW,
            bCustomH,
            gap,
            padding,
            isHorizon
        };
    }

    updatePreview() {
        const inputData = this.getInputData();

        const data = this.logic.calcPreviewData(inputData);

        const previewContainer = this.container.querySelector('#preview-conatainer');
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
    toggleRatio(image) {
        const useRatio = this.container.querySelector(`#${image}-use-ratio`)?.checked;
        const heightInput = this.container.querySelector(`#${image}-height`);
        const ratioSelectDiv = this.container.querySelector(`#${image}-ratio-select`);
        const customRatioDiv = this.container.querySelector(`#${image}-custom-ratio`);

        if (useRatio) {
            if (heightInput) heightInput.disabled = true;
            if (ratioSelectDiv) ratioSelectDiv.classList.remove('hidden');
        } else {
            if (heightInput) heightInput.disabled = false;
            if (ratioSelectDiv) ratioSelectDiv.classList.add('hidden');
            if (customRatioDiv) customRatioDiv.classList.add('hidden');
        }

        this.updatePreview();
    }

    handleRatioChange(image) {
        const ratioValue = this.container.querySelector(`#${image}-ratio`)?.value;
        const customDiv = this.container.querySelector(`#${image}-custom-ratio`);

        if (ratioValue === 'custom') {
            customDiv?.classList.remove('hidden');
        } else {
            customDiv?.classList.add('hidden');
        }

        this.updatePreview();
    }

    bindEvents() {
        const aUseRatio = this.container.querySelector('#a-use-ratio');
        const bUseRatio = this.container.querySelector('#b-use-ratio');
        aUseRatio?.addEventListener('change', () => this.toggleRatio('a'));
        bUseRatio?.addEventListener('change', () => this.toggleRatio('b'));

        const aRatioSelect = this.container.querySelector('#a-ratio');
        const bRatioSelect = this.container.querySelector('#b-ratio');
        aRatioSelect?.addEventListener('change', () => this.handleRatioChange('a'));
        bRatioSelect?.addEventListener('change', () => this.handleRatioChange('b'));

        this.container.querySelector("#next-btn").addEventListener("click", () => this.next());

        const inputs = this.container.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('input', () => this.updatePreview());
        });
    }
    hide() {
        this.container.classList.add("hidden");
    }
    show() {
        this.container.classList.remove("hidden");
    }

    next() {
        this.hide();
        this.secondUI.init(this.getInputData());
        this.secondUI.show();
    }
}

class SecondWindowLogic {
    /**
     * Calculates the preview layout data based on the provided configuration.
     *
     * @param {Object} inputData - The configuration object containing dimensions, ratios, and layout options.
     * @param {number} inputData.aWidth - The width of box A.
     * @param {number} inputData.aHeight - The height of box A.
     * @param {boolean} inputData.aUseRatio - Indicates whether to use a ratio for box A.
     * @param {string} inputData.aRatio - The ratio setting for box A (e.g., 'original', '1:1', '1:1.6', '1.6:1', or 'custom').
     * @param {number} inputData.aCustomW - Custom ratio width for box A (used when aRatio === 'custom').
     * @param {number} inputData.aCustomH - Custom ratio height for box A (used when aRatio === 'custom').
     * @param {number} inputData.bWidth - The width of box B.
     * @param {number} inputData.bHeight - The height of box B.
     * @param {boolean} inputData.bUseRatio - Indicates whether to use a ratio for box B.
     * @param {string} inputData.bRatio - The ratio setting for box B (e.g., 'original', '1:1', '1:1.6', '1.6:1', or 'custom').
     * @param {number} inputData.bCustomW - Custom ratio width for box B (used when bRatio === 'custom').
     * @param {number} inputData.bCustomH - Custom ratio height for box B (used when bRatio === 'custom').
     * @param {number} inputData.hGap - Gap (horizontal/vertical) between boxes.
     * @param {number} inputData.vGap - Gap (horizontal/vertical) between boxes.
     * @param {number} inputData.padding - Padding around the entire layout.
     * @param {boolean} inputData.isHorizon - If true, allows up to two boxes in one row; if false, stacks boxes vertically.
     * @returns {Object} An object containing layout data, including `outerWidth`, `outerHeight`, and `boxList` with position info.
     */
    calcPreviewData(inputData, blockList) {

        const option = {
            padding: inputData.padding,
            hGap: inputData.hGap,
            vGap: inputData.vGap,
            limitPerLine: inputData.limitPerLine,
        };

        console.log({
            option,
            boxList: blockList
        });

        const result = utils.calcPosition({
            option,
            boxList: blockList
        });
        console.log(result);
        return result;
    }

    /**
     * Flattens the nested box data by applying block's startPos offset
     * to each sub-box's startPos.
     *
     * @param {Object} data - The input object containing boxList of blocks.
     * @param {Array} data.boxList - The array of blocks (each block has its own boxList).
     * @param {number} data.outerWidth - The total width of the container.
     * @param {number} data.outerHeight - The total height of the container.
     * @returns {Object} An object with outerWidth, outerHeight, and a flattened boxList containing each sub-box's final position.
     */
    flattenBoxData(data) {
    const finalBoxList = [];
  
    // Iterate through each block in boxList
    data.boxList.forEach((block) => {
      // Each block also has a "boxList" which contains sub-boxes
      block.boxList.forEach((subBox) => {
        // Adjust subBox's startPos by adding the block's startPos offset
        const finalX = block.startPos.x + subBox.startPos.x;
        const finalY = block.startPos.y + subBox.startPos.y;
  
        // Push the adjusted sub-box to the final array
        finalBoxList.push({
          name: subBox.name,
          width: subBox.width,
          height: subBox.height,
          startPos: {
            x: finalX,
            y: finalY
          }
        });
      });
    });
  
    return {
      outerWidth: data.outerWidth,
      outerHeight: data.outerHeight,
      boxList: finalBoxList
    };
  }
}


class SecondWindowUI {
    constructor(selectedList) {
        this.selectedList = selectedList;
        this.container = document.querySelector(".container.second");

        this.logic = new SecondWindowLogic();

        this.inputData = {};

        this.bindEvents();
        this.first = null;
        // this.updatePreview();
        // this.convertSelectedList();
    }

    setFirstUI(first){
        this.first = first;
    }
    
    getRatio(imagePath) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                resolve(img.naturalHeight / img.naturalWidth);
            };
            img.onerror = (error) => {
                reject(new Error(`Failed to load image: ${imagePath}`));
            };
            img.src = `file:///${imagePath.replace(/\\/g, "/")}`;
        });
    }

    setOption(inputData) {
        this.inputData = inputData;
    }

    async init(inputData) {
        this.setOption(inputData);
        
        this.updatePreview(await this.getBlock());
    }

    
    async getBlock() {
        const convertedSelectedList = await this.convertSelectedList();
        console.log(convertedSelectedList)
        const blockList = this.makeBlock(convertedSelectedList);

        return blockList;
    }

    makeBlock(list) {
        const blockList = [];
        const inputData = this.inputData;
        const option = {
            padding: inputData.padding,
            hGap: inputData.gap,
            vGap: inputData.gap,
            limitPerLine: inputData.isHorizon ? 2 : 1
        };
        list.forEach((boxList)=>{
            const result = utils.calcPosition({
                option,
                boxList
            });
            result.width = result.outerWidth;
            result.height = result.outerHeight;
            blockList.push(result);
        })

        return blockList;
    }

    async convertSelectedList() {
        const selectedList = this.selectedList.filter((item)=>(item.filePath && item.imagePath) && (item.filePath != '' && item.imagePath != ''));
        const inputData = this.inputData;
        const result = await Promise.all(selectedList.map(async (item) => {
            let { aWidth, aHeight } = inputData;
            if (inputData.aUseRatio) {
                const ratioValue = inputData.aRatio;
                if (ratioValue === 'original') {
                    try {
                        const ratio = await this.getRatio(item.filePath);
                        aHeight = Math.floor(aWidth * ratio);
                      } catch (error) {
                        aHeight = aWidth;
                        console.error(error);
                      }
                } else if (ratioValue === '1:1') {
                    aHeight = aWidth;
                } else if (ratioValue === '1:1.6') {
                    aHeight = aWidth * 1.6;
                } else if (ratioValue === '1.6:1') {
                    aHeight = aWidth / 1.6;
                } else if (ratioValue === 'custom') {
                    const customW = inputData.aCustomW || 1;
                    const customH = inputData.aCustomH || 1;
                    aHeight = aWidth * (customH / customW);
                }
            }

            let { bWidth, bHeight } = inputData;
            if (inputData.bUseRatio) {
                const ratioValue = inputData.bRatio;
                if (ratioValue === 'original') {
                    try {
                        const ratio = await this.getRatio(item.imagePath);
                        bHeight = Math.floor(bWidth * ratio);
                      } catch (error) {
                        bHeight = bWidth;
                        console.error(error);
                      }
                } else if (ratioValue === '1:1') {
                    bHeight = bWidth;
                } else if (ratioValue === '1:1.6') {
                    bHeight = bWidth * 1.6;
                } else if (ratioValue === '1.6:1') {
                    bHeight = bWidth / 1.6;
                } else if (ratioValue === 'custom') {
                    const customW = inputData.bCustomW || 1;
                    const customH = inputData.bCustomH || 1;
                    bHeight = bWidth * (customH / customW);
                }
            }
            let boxList = [
                { name: item.filePath, width: aWidth, height: aHeight },
                { name: item.imagePath, width: bWidth, height: bHeight },
            ];

            boxList = boxList.filter((item)=>item.width != 0);

            return boxList;
        }));

        // console.log(result);
        return result;
    }

    getInputData() {
        const vGap = parseInt(this.container.querySelector('#image-vGap')?.value || '0');
        const hGap = parseInt(this.container.querySelector('#image-hGap')?.value || '0');
        const padding = parseInt(this.container.querySelector('#total-padding')?.value || '0');
        const limitPerLine = parseInt(this.container.querySelector('#limit-per-line')?.value || '1');

        return {
            padding,
            vGap,
            hGap,
            limitPerLine
        };
    }

    updatePreview(blockList) {
        const inputData = this.getInputData();

        let data = this.logic.calcPreviewData(inputData, blockList);
        console.log(data)
        data =  this.logic.flattenBoxData(data)
        console.log(data);

        const previewContainer = this.container.querySelector('#preview-conatainer');

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

            previewContainer.appendChild(boxDiv);
        });
    }


    bindEvents() {
        const inputs = this.container.querySelectorAll('input, select');

        this.container.querySelector("#prev-btn").addEventListener("click", ()=>this.prev());
        this.container.querySelector("#next-btn").addEventListener("click", ()=>this.next());
        this.container.querySelector('#browse-save').addEventListener("click", async () => {
            const folderPath = await window.api.openFolder();
            if (folderPath) {
                this.container.querySelector('#savePath').value = folderPath;
            }
        });

        inputs.forEach(input => {
            input.addEventListener('input', () => this.init(this.inputData));
        });
    }

    show() {
        this.container.classList.remove("hidden");
    }

    hide() {
        this.container.classList.add("hidden");
    }

    prev() {
        this.hide();
        this.first.show();
    }

    async next() {
        const inputData = this.getInputData();
        
        let data = this.logic.calcPreviewData(inputData, await this.getBlock());
        console.log(data)
        data = this.logic.flattenBoxData(data);
        const path = this.container.querySelector('#savePath').value;
        if(path == ''){
            alert("save path error");
            return;
        }
        window.api.sendMergeRequest(JSON.stringify(data), path)
        .then((result) => {
            console.log('Merge complete! File saved at:', result.file);
            alert("complete");
        })
        .catch((error) => {
            console.error('Merge failed:', error);
            alert("error");
        });
    }
}


