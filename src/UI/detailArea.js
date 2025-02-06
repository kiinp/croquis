import calendar from "../UI/calendar.js"
import resizeBar from "./resizeBar.js";

/**
 * render detail area for history
 * @param {import("../type").HistoryItem} history 
 * @param {Element} mainContainer
 */
const renderDetailAreaForHistory = (history, mainContainer) => {
    let detailContainer = document.getElementById("history-detail-container");
    const detailContent = document.createElement("div");
    detailContent.className = "detail-content";
    if (!detailContainer) {
      detailContainer = document.createElement("div");
      detailContainer.id = "history-detail-container";
      mainContainer.append(detailContainer);
    }
    detailContainer.innerHTML = "";
    const [realMin, realSec] = calendar.getTimeMinAndSecFromSec(Math.floor(history.realTime));
    const [maxMin, maxSec] = calendar.getTimeMinAndSecFromSec(Math.floor(history.maxTime));
    detailContent.innerHTML = `
                <div>
                   날짜: <span class="date"></span>
                </div>

                <div>
                    <span class="time">${realMin}m ${realSec}s / ${maxMin}m ${maxSec}s</span>
                </div>

                <div class="compare-container">
                    <div class="compare-item">
                        <img src="${history.filePath}" alt="${history.fileName}">
                        <div class="info">
                            <div title="${history.fileName}">File Name: <div class="name">${history.fileName}</div></div>
                            <div title="${history.filePath}">File Path: <div class="path">${history.filePath}</div></div>
                        </div>
                    </div>

                    <div class="compare-item">
                        <img src="${history.imagePath}" alt="File Image">
                        <div class="info">
                            <div title="${history.imageName}">Image Name: <div class="name">${history.imageName}</div></div>
                            <div title="${history.imagePath}">Image Path: <div class="path">${history.imagePath}</div></div>
                        </div>
                    </div>
                </div>
      `;
    detailContainer.append(resizeBar.createSizeChangeBar(detailContent, "left"));
    detailContainer.append(detailContent);
}

export default {renderDetailAreaForHistory};