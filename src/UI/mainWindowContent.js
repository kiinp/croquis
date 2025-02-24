class MainWindowContent {
  constructor() {
    if (!MainWindowContent.instance) {
      this.selectedList = [];
      this.subContainer = null;
      this.selectAllInput = document.querySelector("#select-all-input");
      this.selectableInput = document.querySelector("#selectable-toggle");
      MainWindowContent.instance = this;
    }
    return MainWindowContent.instance;
  }
  /**
   * Create a sub content container for displaying items.
   * @param {import("../type").ContentItem[]} contentList - List of content items.
   * @returns {HTMLDivElement} The sub content container element.
   */
  createSubContentContainer(contentList) {
    this.initSelectedList();
    const subContainer = document.createElement("div");
    const contentContainer = document.createElement("div");
    const folderContainer = document.createElement("div");

    folderContainer.className = "content-folder-container";
    subContainer.className = "subcontent-container scroll-area show-scrollbar";
    if (this.SelectAble()) {
      subContainer.classList.add("selectable");
    }
    contentContainer.className = "content-container";
    const countElement = document.querySelector(".count");
    if (countElement) {
      countElement.innerHTML = `총: ${contentList.filter(item=>item.type == "history").length}`;
    }

    contentList.forEach((item, index) => {
      const itemDiv = document.createElement("div");
      switch (item.type) {
        case "directory":
          itemDiv.className = "content-item folder";
          itemDiv.innerHTML = `<span>${item.dirname}</span>`;
          folderContainer.append(itemDiv);
          break;
        case "file":
          itemDiv.className = "content-item file";
          const newOrder = this.getNewOrder();
          itemDiv.innerHTML = `
            <div class="select-item-container">
              <input loading="lazy" type="checkbox" checked id="content-item${index}" data-file-path="${item.filePath}" data-selected-order="${newOrder}"/>
              <span class="order">${newOrder}</span>
            </div>
            <label for="content-item${index}">
              <img src="${item.imagePath}" alt="${item.imageName}" class="image-preview" />
            </label>
          `;
          this.addSelectedItem({
            filePath: item.filePath,
            order: newOrder,
          });
          itemDiv.querySelector("input").addEventListener("change", (e) => this.toggleSelection(e.target));
          contentContainer.append(itemDiv);
          break;
        case "history":
          itemDiv.className = "content-item history";
          itemDiv.innerHTML = `
            <input type="checkbox" id="content-item${index}" data-image-path="${item.imagePath}"/>
            <label for="content-item${index}">
              <img src="${item.imagePath}" alt="${item.imageName}" class="image-preview" />
            </label>
          `;
          contentContainer.append(itemDiv);
          itemDiv.querySelector("input").addEventListener("change", (e) => this.toggleSelection(e.target));
          contentContainer.append(itemDiv);
          break;
        default:
          break;
      }

      /** @todo double call error fix */
      itemDiv.addEventListener("click", item.clickFunc);
    });
    subContainer.append(folderContainer);
    subContainer.append(contentContainer);
    this.subContainer = subContainer;
    return subContainer;
  }
  SelectAble() {
    if (!this.selectableInput) {
      return false;
    }
    return this.selectableInput?.checked;
  }
  toggleSelectAble() {
    if (this.subContainer) {
      this.subContainer.classList.remove("selectable");
      if (this.SelectAble())
        this.subContainer.classList.add("selectable");
    }
  }
  /**
   * Toggle the selection state of a file checkbox.
   * @param {HTMLInputElement} checkbox - The checkbox element.
   */
  toggleSelection = (checkbox) => {
    const filePath = checkbox.dataset.filePath;
    const imagePath = checkbox.dataset.imagePath;
    if (checkbox.checked) {
      const newOrder = this.getNewOrder();
      checkbox.dataset.selectedOrder = newOrder;
      this.addSelectedItem({ imagePath, filePath, order: newOrder });
    } else {
      const order = Number(checkbox.dataset.selectedOrder);
      this.removeSelectedItem({ imagePath, filePath, order });
      delete checkbox.dataset.selectedOrder;
    }
    this.updateOrderDisplay();
  }
  /**
   * Add an item to the selected list.
   * @param {{ filePath: string, order: number }} item - The item to add.
   */
  addSelectedItem(item) {
    this.selectedList.push(item);

    if (document.querySelectorAll(".select-item-container input:checked").length === document.querySelectorAll(".select-item-container input").length) {
      this.selectAllInput.checked = true;
    }
  }
  /**
   * Remove an item from the selected list and update subsequent orders.
   * @param {{ filePath: string, order: number }} item - The item to remove.
   */
  removeSelectedItem(item) {
    const removedOrder = Number(item.order);

    // Remove the item from selectedList.
    this.selectedList = this.selectedList.filter((el) => (el.filePath !== item.filePath || el.imagePath !== item.imagePath));

    // Get all checked file inputs and sort them by their order.
    const checkedInputs = Array.from(
      this.subContainer.querySelectorAll("div.content-item.file input:checked")
    ).sort((a, b) => Number(a.dataset.selectedOrder) - Number(b.dataset.selectedOrder));

    checkedInputs.forEach((input) => {
      const currentOrder = Number(input.dataset.selectedOrder);
      if (currentOrder > removedOrder) {
        input.dataset.selectedOrder = currentOrder - 1;
      }
    })

    // Update order in selectedList for items with order greater than the removed order.
    this.selectedList.forEach((el) => {
      if (el.order > removedOrder) {
        el.order = el.order - 1;
      }
    });

    this.selectAllInput.checked = false;
  }

  /**
   * Initialize the selected list.
   */
  initSelectedList() {
    this.selectedList = [];
    this.selectAllInput.checked = false;
  }

  /**
   * Update the displayed order numbers for all file items.
   */
  updateOrderDisplay() {
    document.querySelectorAll(".content-item input").forEach((checkbox) => {
      const orderSpan = checkbox.closest(".content-item").querySelector(".order");
      if(!orderSpan) return;
      if (checkbox.dataset.selectedOrder !== undefined) {
        orderSpan.textContent = `${checkbox.dataset.selectedOrder}`;
      } else {
        orderSpan.textContent = "";
      }
    });
  }

  /**
   * Get the next order number for a new selection.
   * @returns {number} The new order number.
   */
  getNewOrder() {
    return this.selectedList.length + 1;
  }
  /**
   * Retrieve the list of selected file paths.
   * @returns {import("../type").ContentItem[]} Array of file paths.
   */
  getSelectedList() {
    return this.selectedList;
  }

  /**
   * Reset the selected list by unchecking all file checkboxes.
   */
  resetSelectedList() {
    this.selectedList = [];
    if (this.subContainer) {
      this.subContainer.querySelectorAll("div.content-item input:checked").forEach((checkbox) => {
        checkbox.checked = false;
        this.toggleSelection(checkbox);
      });
    }
    this.selectAllInput.checked = false;
  }

  /**
   * Select all file items.
   */
  chooseAllItem() {
    this.resetSelectedList();
    if (this.subContainer) {
      this.subContainer.querySelectorAll("div.content-item input").forEach((checkbox) => {
        checkbox.checked = true;
        this.toggleSelection(checkbox);
      });
    }
    this.selectAllInput.checked = true;
  }
}

export default new MainWindowContent();
