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

        document.addEventListener("keydown", (event) => {
            if (event.ctrlKey && event.key === "c") {
                window.api.copyImageFromFilePath(this.croquis.getCurrentImagePath());
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