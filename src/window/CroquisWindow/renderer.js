import calendar from "../../UI/calendar.js"


window.api.receive('send-data-to-croquis', (data) => {
    document.getElementById('close-btn').addEventListener('click', () => {
        window.api.send('close-window'); // Main 프로세스에 창 닫기 요청
    });
    // 창 최소화 버튼 클릭
    document.getElementById('minimize-btn').addEventListener('click', () => {
        window.api.send('minimize-window'); // Main 프로세스에 창 최소화 요청
    });


    const croquisWindow = new Croquis(data.imageList, data.option);
});


class Croquis {
    /**
     * 
     * @param {string[]} imageList imagePath list
     * @param {import("../../type").CroquisOption} option 
     */
    constructor(imageList, option = {}) {
        this.croquisUI = new CroquisUI(this);
        this.imageList = imageList;
        this.option = option;
        this.currentIndex = 0;
        this.startTime = 0;
        this.elapsedTime = 0;
        this.isStop = true;
        this.isSkipping = false;
        this.historyIdList = [];
        this.timerRequestId = null;
        this.folderId = 1;
        this.isAutoSkipped = false;

        this.applyOption();
        this.startCurrentIndex();
    }
    applyOption() {
        window.api.send("resize-window", { width: this.option.window.width, height: this.option.window.height });
    }
    /**
     * init alreadySave, currentImage, resetTimer
     */
    startCurrentIndex() {
        //change image
        this.croquisUI.changeImageEl(this.getCurrentImagePath());
        this.alreadySave = false;
        this.isAutoSkipped = false;
        this.resetTimer();
        this.startTimer();
    }
    //save startTime, start updateTimer animation
    startTimer() {
        if (!this.isStop) return;

        this.isStop = false;
        this.startTime = performance.now() - this.elapsedTime;
        this.updateTimer();
        this.croquisUI.updateStopBtn(false);
    }
    //save elapsedTime, cancel updateTimer animation
    stopTimer() {
        if (this.isStop) return;

        this.isStop = true;
        this.elapsedTime = performance.now() - this.startTime;
        cancelAnimationFrame(this.timerRequestId);
        this.croquisUI.updateStopBtn(true);
    }
    resetTimer() {
        this.isStop = true;
        this.elapsedTime = 0;
        cancelAnimationFrame(this.timerRequestId);
    }
    async updateTimer() {
        if (this.isStop) return;

        this.elapsedTime = performance.now() - this.startTime;

        let currentTime = calendar.getTimeMinAndSecFromSec(this.getCurrentTime());
        let maxTime = calendar.getTimeMinAndSecFromSec(this.option.timer.maxTime);

        this.croquisUI.updateTimerEl({ currentTime, maxTime });
        if (!this.isAutoSkipped && this.checkEndTimer()) {
            await this.skip(true);
            return;
        }

        this.timerRequestId = requestAnimationFrame(() => this.updateTimer());
    }
    //compare currentTime and maxTime
    checkEndTimer() {
        const sec = this.getCurrentTime();
        return sec > this.option.timer.maxTime;
    }

    /**
     * get current time(sec) from elapsedTime
     * @returns {number} current time(sec)
     */
    getCurrentTime() {
        return this.elapsedTime / 1000;
    }



    /**
     * return current image path from currentIndex
     * @returns {string}
     */
    getCurrentImagePath() {
        return this.imageList[this.currentIndex];
    }
    /**
     * resize-window by image's width and height;
     * @param {Element} image current imageEl 
     */
    async resizeWindowByImage(image) {
        const { naturalWidth, naturalHeight } = image;

        const { width, height } = await window.api.getWindowSize();

        const ratio = naturalWidth / naturalHeight;
        window.api.send("resize-window", { width: height * ratio, height });
    }
    /**
     * 
     * @param {boolean} isAuto called by endTimer? 
     * @returns 
     */
    async skip(isAuto = true) {
        if (this.isSkipping) {
            return;
        }
        if (isAuto && this.isAutoSkipped) {
            return;
        }
        if (isAuto) {
            this.isAutoSkipped = true;
        }
        this.isSkipping = true;

        this.stopTimer();
        if (isAuto && !this.option.auto.skip) {
            this.isSkipping = false;
            this.startTimer();
            return;
        }
        if (isAuto && this.option.auto.skip) {
            if (this.option.auto.save) {
                const saveResult = await this.save(true);
                if (!saveResult) {
                    alert("save failed");
                    this.isSkipping = false;
                    this.startTimer();
                    return;
                }
            }
        }
        this.isSkipping = false;
        this.next();
    }
    next() {
        if (this.currentIndex < this.imageList.length - 1) {
            this.currentIndex++;
            this.startCurrentIndex();
        }
    }
    prev() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.startCurrentIndex();
        }
    }
    async save(isAuto = false) {
        if (this.alreadySave) return true;
        this.alreadySave = true;

        try {
            const historyId = await this.saveHistory();
            if (!historyId) {
                throw new Error("fail to save history");
            }

            if (isAuto && !this.option.auto.capture) {
                return true;
            }

            if (this.option.capture || this.option.auto.capture) {
                const now = Date.now();
                window.api.send("start-selection", { windowId: now, savePath: this.option.savePath });

                const capturePromise = new Promise((resolve, reject) => {
                    window.api.once("capture-completed", (result) => {
                        if (!result.success) {
                            reject(new Error(data.msg));
                            return;
                        }
                        const imagePath = result.data;
                        this.saveImageToHistoryId(imagePath, historyId);
                        resolve();
                    });
                });

                const endSelectionPromise = new Promise((resolve) => {
                    window.api.once("end-selection", () => {
                        resolve();
                    });
                });

                await Promise.all([capturePromise, endSelectionPromise]);
            }
            return true;
        } catch (error) {
            console.error("failed save:", error);
            this.alreadySave = false;
            return false;
        }
    }

    /**
     * save history without image 
     * @returns {number} - historyId; if null, fail to save;
     */
    async saveHistory() {
        console.log(this.getCurrentImagePath())
        const result = await window.api.saveHistory({
            date: new Date() + "",
            maxTime: this.option.timer.maxTime,
            realTime: this.getCurrentTime(),
            folderId: this.folderId
        }, this.getCurrentImagePath());
        if (!result.success) {
            return null;
        }
        const historyId = result.data;
        this.historyIdList.push(historyId);

        return historyId;
    }
    saveImageToHistoryId(imagePath, historyId) {
        window.api.saveImage(historyId, imagePath);
    }
}

class CroquisUI {
    constructor(croquis) {
        this.croquis = croquis;
        this.mainContainer = document.querySelector("div.main-container");
        this.imageEl = this.mainContainer.querySelector("img.current-image");
        this.timeEl = this.mainContainer.querySelector("span.timer");
        this.uiContainer = document.querySelector("div.ui-container");
        this.bindEventToUI();
    }

    bindEventToUI() {
        this.uiContainer.querySelector("div.prev-btn").addEventListener("click", () => {
            this.croquis.prev();
        });
        this.uiContainer.querySelector("div.next-btn").addEventListener("click", () => {
            this.croquis.next();
        });
        this.uiContainer.querySelector("div.start-btn").addEventListener("click", () => {
            if (!this.croquis.isStop) return;
            this.croquis.startTimer();
        });
        this.uiContainer.querySelector("div.stop-btn").addEventListener("click", () => {
            if (this.croquis.isStop) return;
            this.croquis.stopTimer();
        });
        this.uiContainer.querySelector("div.save-btn").addEventListener("click", () => {
            if (this.croquis.alreadySave) return;
            this.croquis.save(false);
        });

        this.imageEl.setAttribute('draggable', 'true');
        this.imageEl.addEventListener('dragstart', (event) => {
            // src가 file:// 로 시작하는 로컬 파일일 경우
            if (img.src.startsWith('file://')) {
              // 이미지가 완전히 로드된 상태여야 합니다.
              if (!img.complete) {
                console.warn('이미지가 아직 로드되지 않았습니다.');
                return;
              }
        
              // Canvas를 이용하여 이미지를 data URL로 변환
              const canvas = document.createElement('canvas');
              canvas.width = img.naturalWidth;
              canvas.height = img.naturalHeight;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0);
        
              // 파일 확장자에 따라 MIME 타입 결정 (기본은 png)
              let mimeType = 'image/png';
              if (/\.(jpe?g)$/i.test(img.src)) {
                mimeType = 'image/jpeg';
              }
        
              // Canvas에서 data URL 생성
              const dataURL = canvas.toDataURL(mimeType);
        
              // file:// URL에서 파일명 추출 (URL 객체를 사용)
              const urlObj = new URL(img.src);
              const fileName = decodeURIComponent(urlObj.pathname.split('/').pop());
        
              // Electron의 DownloadURL 형식: "MIME타입:파일명:dataURL"
              const downloadURL = `${mimeType}:${fileName}:${dataURL}`;
        
              event.dataTransfer.setData('DownloadURL', downloadURL);
            }
          });
    }
    /**
     * 
     * @param {string} src imagePath 
     */
    changeImageEl(src) {
        this.imageEl.src = src;
    }
    /**
     * 
     * @param {object} time
     * @param {number[]} time.currentTime [min, sec] current timer value
     * @param {number[]} time.maxTime [min, sec] option maxTime value  
     */
    updateTimerEl(time) {
        const [min, sec] = time.currentTime;
        const [maxMin, maxSec] = time.maxTime;
        this.timeEl.textContent = `${min}m ${sec}s / ${maxMin}m ${maxSec}s`;
    }
    /**
     * @param {boolean} isStop 
     */
    updateStopBtn(isStop) {
        if (isStop) {
            document.querySelector("div.start-btn").classList.add("show");
            document.querySelector("div.stop-btn").classList.remove("show");
        } else {
            document.querySelector("div.start-btn").classList.remove("show");
            document.querySelector("div.stop-btn").classList.add("show");
        }
    }
}