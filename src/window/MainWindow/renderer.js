/** @todo dom 생성과 event추가 로직 분리 및 class의 역할 분배 */


import calendar from "../../UI/calendar.js"
import detailArea from "../../UI/detailArea.js"
import mainWindowContent from "../../UI/mainWindowContent.js";
import resizeBar from "../../UI/resizeBar.js";

/** @type {OsDirectoryWindow | HistoryDirectoryWindow} */
let mainDirectory = null;
let option;

function applyOptionGlobal(option) {
  initDirectoryInfo();
  document.body.classList.remove("dark", "white");
  document.body.classList.add(option.theme);
}

window.addEventListener('DOMContentLoaded', async () => {
  option = await window.api.getOption();
  applyOptionGlobal(option);  
  bindGlobalEvents();

  window.api.receive('option-changed', (_option) => {
    option = _option;
    applyOptionGlobal(option);
  });
});

async function initDirectoryInfo() {
  try {
    const dirpath = option.rootDirectory;
    if (!dirpath) {
      alert('Check the root directory.');
      return;
    }

    const result = await window.api.getAllDirectoryInfo(dirpath);
    if (!result.success) {
      alert('Check the root directory.');
      return;
    }
    renderDirectoryInfo(result.directoryInfo);
  } catch (e) {
    console.error(e);
  }
}


function bindGlobalEvents() {
  window.addEventListener("paste", (e)=>{
    if(mainDirectory instanceof OsDirectoryWindow) {
      mainDirectory.handlePasteEvent(e);
    }
  })

  resizeBar.bindGlobalEvents();
  const directoryLayout = document.querySelector("div#directory-layout");
  directoryLayout.append(resizeBar.createSizeChangeBar(document.querySelector("div#directory-info-container")));

  const startBtn = document.querySelector("div.start-btn");
  const historyRoot = document.querySelector("div.history-root-directory");
  const filterDone = document.querySelector("input#filter-done");
  const optionBtn = document.querySelector("div.option-open-btn");

  const addFolderBtn = document.querySelector("div.add-folder-btn");
  const moveFolderBtn = document.querySelector("div.move-folder-btn");
  
  const folderNameInput = document.querySelector("input#folder-name-input");
  const addFolderSubmitBtn = document.querySelector("button#submit-folder-btn");

  const selectAllInput = document.querySelector("input#select-all-input");
  const selectableInput = document.querySelector("input#selectable-toggle");


  if (selectAllInput) {
    selectAllInput.addEventListener("change", () => {
      if(selectAllInput.checked){
        mainWindowContent.chooseAllItem();
      } else {
        mainWindowContent.resetSelectedList();
      }
    });
  }
  if (selectableInput) {
    selectableInput.addEventListener("change", () => {
      mainWindowContent.toggleSelectAble();
    });
  }

  if (addFolderBtn) {
    addFolderBtn.addEventListener("click", async () => {
      if(!mainDirectory){
        return;
      }
      document.querySelector("div.folder-form").classList.remove("hidden");
      if (folderNameInput) {
        folderNameInput.value = "";
        folderNameInput.focus();
      }
    });
  }
  
  if (moveFolderBtn) {
    moveFolderBtn.addEventListener("click", async () => {
      if(!mainDirectory){
        return;
      }
      if(mainDirectory instanceof HistoryDirectoryWindow){
        mainDirectory.moveFolder();
      }
    });
  }

  if (folderNameInput) {
    folderNameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        addFolderSubmitBtn?.click();
      }
    });
  }
  if(addFolderSubmitBtn) {
    addFolderSubmitBtn.addEventListener("click", async () => {
      if(!mainDirectory){
        return;
      }
      const folderName = folderNameInput?.value;
      if (!folderName) {
        mainDirectory.handleError("Please enter a folder name.");
        return;
      }
      const result = await window.api.addFolder({folderName, basePath: mainDirectory.dirpath});
      if (result.success) {
        initDirectoryInfo();
        document.querySelector("div.folder-form").classList.add("hidden");
        mainDirectory.renderDirectoryContent();
      } else {
        mainDirectory.handleError(result.msg);
      }
    });
  }

  if (startBtn) {
    startBtn.addEventListener("click", () => {
      if (mainDirectory) {
        mainDirectory.startCroquis();
      }
    });
  }

  if (historyRoot) {
    historyRoot.addEventListener("click", () => {
      openDirectory({
        dirname: "history",
        dirpath: "",
      }, false);
    });
  }

  if (filterDone) {
    filterDone.addEventListener("change", () => {
      if (mainDirectory) {
        mainDirectory.renderDirectoryContent();
      }
    });
  }

  if(optionBtn){
    optionBtn.addEventListener("click", () => {
      window.api.send("open-option-window");
    });
  }


}

/**
 * @todo ui class로 빼기 
 * @param {import("../../type.js").DirectoryItem} directoryInfo 
 * @param {Boolean} isOs 
 */
function renderDirectoryInfo(directoryInfo, isOs = true) {
  const directoryList = directoryInfo.subDirectories;
  const type = isOs ? 'os' : 'history';
  const directoryEl = document.getElementById(type + '-directory');
  directoryEl.innerHTML = "";

  /**
   * 
   * @param {import("../../type.js").DirectoryItem} item 
   * @param {boolean} isOpen
   * @returns {Element}
   */
  const createTitleEl = (item, isOpen = true) => {
    const spanContainer = document.createElement("span");
    const folderIcon = document.createElement("span");
    spanContainer.className = "directory-title-container";
    folderIcon.className = isOpen ? "open" : "close";
    const span = document.createElement("span");
    span.className = "directory-title";
    span.innerHTML = `${item.dirname}`;
    span.title = `${item.dirpath}`;
    span.addEventListener("click", () => {
      openDirectory(item);
    });
    folderIcon.addEventListener("click", () => {
      if(folderIcon.classList.contains("open")){
        folderIcon.classList.remove("open");
        folderIcon.classList.add("close");
        spanContainer.parentElement.querySelector("ul")?.classList.add("hidden");
      } else{  
        folderIcon.classList.remove("close");
        folderIcon.classList.add("open");
        spanContainer.parentElement.querySelector("ul")?.classList.remove("hidden");
      }
    });
    spanContainer.append(folderIcon);
    spanContainer.append(span);
    return spanContainer;
  }

  directoryEl.append(createTitleEl(directoryInfo));

  /**
   * 
   * @param {import("../../type.js").DirectoryItem[]} directories
   * @returns 
   */
  const createDirectoryElement = (directories) => {
    const ul = document.createElement("ul");
    ul.className = "sub-directory .open";

    const liList = directories.map((item) => {
      const li = document.createElement("li");
      li.className = "sub-directory-item";
      if (item.subDirectories.length === 0) {
        li.append(createTitleEl(item, false));
      } else {
        li.append(createTitleEl(item, true));
        li.append(createDirectoryElement(item.subDirectories));
      }
      return li;
    });
    liList.forEach(el => {
      ul.append(el);
    });
    return ul;
  }
  directoryEl.append(createDirectoryElement(directoryList));
}

/**
 * 
 * @param {import("../../type.js").DirectoryItem} directoryInfo 
 * @param {boolean} isOs 
 */
async function openDirectory(directoryInfo, isOs = true) {
  try {
    mainDirectory = !isOs ? new HistoryDirectoryWindow(directoryInfo) : new OsDirectoryWindow(directoryInfo);
    await mainDirectory.init();
    mainDirectory.renderDirectoryContent();
  } catch (e) {
    console.error(e);
  }
}

//#region common window
class DirectoryWindow {
  constructor(directoryInfo) {
    this.selectedList = [];
    this.loading = false;
    this.dirname = directoryInfo.dirname;
    this.dirpath = directoryInfo.dirpath;
    this.contentList = [];
    /** @todo ui class로 빼기 */
    this.osContainer = document.querySelector("div.os-option-container");
    this.historyContainer = document.querySelector("div.history-container");
  }
  /**
  * 
  * @param {import("../../type.js").ContentItem[]} items 
  * @param {import("../../type.js").Option[]} optionList 
  */
  applyOption(items, optionList) {
    let newList = [...items];

    optionList
      .filter(option => option.type === 'filter' && option.value)
      .forEach(filterOption => {
        newList = newList.filter(filterOption.filter);
      });


    const sortOption = optionList.find(option => option.type === 'sort' && option.value);
    if (sortOption) {
      newList.sort(sortOption.sort);
    }
    return newList;
  }
  setCroquisSelectedList() {
    this.selectedList = mainWindowContent.getSelectedList().map(item => item.filePath);
  }
  startCroquis() {
    this.setCroquisSelectedList();
    if (this.selectedList.length == 0) {
      this.handleError("select one or more file")
      return;
    }

    window.api.send('send-selected-photos', this.selectedList);
  }
  errorLoadFileList(errorMsg) {
    alert(errorMsg)
  }


  handleError(message) {
    console.error(message);
    const errorDiv = document.createElement('div');
    errorDiv.id = 'error-popup';
    errorDiv.innerText = message;
    document.body.appendChild(errorDiv);

    void errorDiv.offsetWidth;
    errorDiv.classList.add('show');

    setTimeout(() => {
      errorDiv.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(errorDiv);
      }, 500);
    }, 3000);
  }
  onLoading() {
    this.loading = true;
  }
  offLoading() {
    this.loading = false;
  }

  /**
   * common renderDirectoryContentBase
   * @param {import("../../type.js").ContentItem[]} contentList
   * @returns {Element} div.subcontent-container
   * @todo ui class로 빼기 
   */
  renderDirectoryContentBase(contentList) {
    const mainContainer = document.querySelector("div#content-main-container");
    if (mainContainer) {
      mainContainer.innerHTML = "";

      const subContainer = mainWindowContent.createSubContentContainer(contentList);

      mainContainer.append(subContainer);
      return subContainer;
    }
    return null;
  }
}

//#endregion

//#region os window
class OsDirectoryWindow extends DirectoryWindow {
  async init() {
    await this.loadFileList();
    this.fileList = [];
    if (this.osContainer) {
      this.osContainer.style.display = 'flex';
    }
    if (this.historyContainer) {
      this.historyContainer.style.display = 'none';
    }
  }

  /** @todo ui class로 빼기 */
  loadRenderingOption() {
    const onlyNewEl = document.querySelector("input#filter-done");
    const onlyNew = onlyNewEl ? onlyNewEl.checked : false;

    return [{
      key: "onlyNew",
      value: onlyNew,
      type: "filter",
      filter: (v) => !(v.histories?.length && v.histories?.length > 0),
    }]
  }
  /**
   * load file list from db (promise), then save to this.fileList
   */
  async loadFileList() {
    this.onLoading();
    try {
      const result = await window.api.getDirectoryContents(this.dirpath);
      if (!result.success) {
        this.fileList = [];
        this.handleError(result.msg);
        return;
      }
      this.fileList = result.data;
      this.convertFileList(result.data);
    } catch (e) {
      this.handleError(e);
      this.fileList = [];
    } finally {
      this.offLoading();
    }
  }

  /**
   * convert fileList to contentList, then save to this.contentList (fileList => this.contentList)
   * @param {import("../../type.js").FileItem[]} fileList
   */
  convertFileList(fileList) {
    this.contentList = fileList.map((file) => {
      const tempContent = {
        type: file.isDirectory ? "directory" : "file",
        imageName: file.fileName,
        imagePath: file.filePath,
      };
      switch (tempContent.type) {
        case "directory":
          tempContent.dirname = file.fileName;
          tempContent.dirpath = file.filePath;
          tempContent.clickFunc = () => {
            openDirectory({
              dirname: tempContent.dirname,
              dirpath: tempContent.dirpath
            }, true);
          }
          break;
        case "file":
          tempContent.fileName = file.fileName;
          tempContent.filePath = file.filePath;
          tempContent.histories = file.histories;
          break;
      }
      return tempContent;
    })
  }
  /**
   * 
   * @param {Event} e
   * @returns 
   */
  async handleDropEvent(e) {
    this.onLoading();

    const htmlData = e.dataTransfer.getData('text/html');
    let url;
    if (htmlData) {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = htmlData;
      const img = tempDiv.querySelector("img");
      if (img?.src) {
        url = img.src;
      }
    }

    if (url) {
      console.log(url);
      window.api.send('handle-file-drop', {
        type: 'url',
        data: url,
        targetPath: this.dirpath,
      });
      this.offLoading();
      return;
    }


    const items = e.dataTransfer.items;

    for (let i = 0; i < items.length; i++) {
      const item = items[i].getAsFile();
      if (item) {
        const filePath = await window.api.showFilePath(item);
        window.api.send('handle-file-drop', {
          type: 'local',
          data: filePath,
          targetPath: this.dirpath,
        });
      }
    }
    this.offLoading();
  }
  /**
   * @param {Event} e
   */
  handlePasteEvent(e) {
    /** @type {DataTransferItemList} */
    const items = e.clipboardData?.items;
    if(!items){
      return;
    }
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      console.log(item);
      if (item.type.indexOf('image') !== -1) {
        const blob = item.getAsFile();

        const reader = new FileReader();
        reader.onload = (e) => {
          const imageDataUrl = e.target.result;
          window.api.send('handle-file-drop', {
            type: 'url',
            data: imageDataUrl,
            targetPath: this.dirpath,
          });
        };
        reader.readAsDataURL(blob);
      }
      continue;
    }
    
  }
  /** @todo ui class로 빼기 */
  renderDirectoryContent() {
    let newList = [...this.contentList];
    newList.sort((a, b) => {
      if (a.type === 'directory' && b.type !== 'directory') return -1;
      if (a.type !== 'directory' && b.type === 'directory') return 1;
      return 0;
    });
    const optionList = this.loadRenderingOption();
    newList = this.applyOption(newList, optionList);

    const subContainer = this.renderDirectoryContentBase(newList);
    if (subContainer) {
      subContainer.addEventListener('dragover', e => {
        e.stopPropagation();
        e.preventDefault();
      });
      subContainer.addEventListener('drop', e => {
        e.stopPropagation();
        e.preventDefault();
        this.handleDropEvent(e);
      });
    }
  }
}
//#endregion

//#region history window
class HistoryDirectoryWindow extends DirectoryWindow {
  async init() {

    /** @type {import("../../type.js").HistoryItem[]} */
    this.historyList = [];

    if (this.osContainer) {
      this.osContainer.style.display = 'none';
    }
    if (this.historyContainer) {
      this.historyContainer.style.display = 'block';
    }

    await this.loadHistoryLIst();
    if (!this.eventsBound) {
      this.bindEventToEl();
      this.eventsBound = true;
    }
  }
  /** @todo ui class로 빼기 */
  bindEventToEl() {
    const filterButton = document.querySelector("button#history-filter-button");
    const resetDateBtn = document.querySelector("button#reset-date-input");
    if (filterButton) {
      filterButton.addEventListener("click", () => {
        this.renderDirectoryContent();
      });
    }
    if (resetDateBtn) {
      resetDateBtn.addEventListener("click", () => {
        document.getElementById("history-date-input").value = "";
        this.renderDirectoryContent();
      });
    }
  }
  /** @todo ui class로 빼기 */
  renderDirectoryContent() {

    const options = this.loadRenderingOption();
    const calendarOption = options.map((option) => option.key !== "dateFilter"); //calendar optoin don't contain date filter option.

    const filteredContentList = this.applyOption(this.contentList, options);
    const calendarContentList = this.applyOption(this.contentList, calendarOption).filter((content)=>content.type == "history").map((content) => content.history);
    this.renderCalendar(calendarContentList, document.getElementById("history-date-input")?.value || undefined);
    this.renderDirectoryContentBase(filteredContentList);
  }
  /**
   * load history list from db (promise), then save to this.historyList
   */
  async loadHistoryLIst() {
    this.onLoading();
    try {
      const result = await window.api.getHistoryContents(this.dirpath);
      if (!result.success) {
        this.historyList = [];
        this.handleError(result.msg);
        return;
      }
      this.historyList = result.data;
      this.convertHistoryList(result.data);
    } catch (e) {
      this.handleError(e);
      this.historyList = [];
    } finally {
      this.offLoading();
    }
  }
  /**
   * convert historyList, then save to this.contentList (historyList => this.contentList)
   * @param {import("../../type.js").HistoryItem[]} historyList
   */
  convertHistoryList(historyList) {
    const handleClickFun = (history) => {
      if(mainWindowContent.SelectAble()){
        return;
      }
      this.showDetailAreaFromHistory(history);
    };
    this.contentList = historyList.map((history) => {
      /** @type {import("../../type.js").ContentItem} */
      console.log(history)
      const tempContent = {
        type: history.isDirectory ? "directory" : "history",
      }
      switch (tempContent.type) {
        case "directory":
          tempContent.dirname = history.folderName;
          tempContent.dirpath = history.id;
          tempContent.clickFunc = () => {
            openDirectory({
              dirname: tempContent.dirname,
              dirpath: tempContent.dirpath
            }, false);
          }
          break;
        case "history":
          tempContent.history = history,
          tempContent.imageName =  history.imageName,
          tempContent.imagePath =  history.imagePath,
          tempContent.date = history.date;
          tempContent.clickFunc = ()=>handleClickFun(history);
          break;
      }
      return tempContent;
    })
  }

  /**
   * Loads options from div.history-container
   * @todo ui class로 빼기 
   * @return {import("../../type.js").Option[]} 
  */
  loadRenderingOption() {
    const dateInput = this.historyContainer ? this.historyContainer.querySelector("input#history-date-input") : null;
    const sortSelect = this.historyContainer ? this.historyContainer.querySelector("select#sort-select") : null;

    return [
      {
        key: "dateFilter",
        type: "filter",
        value: dateInput ? dateInput.value.trim() : false,
        filter: (item) => {
          if (!dateInput || !dateInput.value.trim()) return false;
          return calendar.parseDateToYmd(new Date(item.date)).indexOf(dateInput.value.trim()) !== -1;
        }
      },
      {
        key: "dateAsc",
        type: "sort",
        value: sortSelect ? sortSelect.value === "dateAsc" : false,
        sort: (a, b) => new Date(a.date) - new Date(b.date)
      },
      {
        key: "dateDesc",
        type: "sort",
        value: sortSelect ? sortSelect.value === "dateDesc" : false,
        sort: (a, b) => new Date(b.date) - new Date(a.date)
      }
    ];
  }


  /**
   * show(open) DetailArea
   * @param {HistoryItem} history 
   * @todo ui class로 빼기 
   * 
   */
  showDetailAreaFromHistory(history) {
    const mainContainer = document.querySelector("div#content-main-container");
    detailArea.renderDetailAreaForHistory(history, mainContainer);
  }

  /**
   * renderCalendar to div#calendar
   * @param {import("../../type.js").HistoryItem[]} items 
   * @param {string} ymd yyyy-mm-dd
   * @todo ui class로 빼기 
   */
  renderCalendar(items, ymd) {
    const calendarContainer = document.querySelector("div#calendar");
    if (calendarContainer) {
      calendarContainer.innerHTML = "";

      const handleBlockClick = (ymd) => {
        ymd = ymd.split(' ')[0];
        const historyDateInput = document.querySelector("#history-date-input");
        if (historyDateInput) {
          historyDateInput.value = ymd;
        }
        this.renderDirectoryContent();
      }
      let date;
      if (ymd) {
        const parts = ymd.split("-");
        date = {
          year: parts[0],
          month: parts[1],
          day: parts[2],
        }
      }
      const element = calendar.createCalendar(items, handleBlockClick);
      calendarContainer.append(element);
    }
  }

  setHistorySelectedList() {
    this.selectedList = mainWindowContent.getSelectedList().map(item => item.imagePath);
  }

  moveFolder() {
    this.setHistorySelectedList();
    if(this.selectedList.length == 0){
      this.handleError("select at leat one history");
      return;
    }
    window.api.send("move-folder", this.selectedList);
  }
}

//#endregion

window.api.receive('file-drop-result', async (result) => {
  if (mainDirectory) {
    if (result.success) {
      console.log('Operation successful');
      await mainDirectory.init();
      mainDirectory.renderDirectoryContent();
    } else {
      console.error('Operation failed:', result.msg);
      mainDirectory.handleError(result.msg);
    }
    mainDirectory.offLoading();
  } else {
    console.error('mainDirectory is not defined.');
  }
});
