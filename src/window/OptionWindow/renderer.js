let option;

window.addEventListener('DOMContentLoaded', async () => {
  option = await window.api.getOption();

  function applyOptionGlobal(option) {
    document.body.classList.remove("dark", "white");
    document.body.classList.add(option.theme);
  }
  applyOptionGlobal(option);
  window.api.receive('option-changed', (option) => {
    applyOptionGlobal(option);
  });
  const rootDirectoryInput = document.getElementById('rootDirectory');
  const browseRootButton = document.getElementById('browseRoot');
  const optionForm = document.getElementById('optionForm');
  const themeSelect = document.getElementById('theme');
  // const screenScaleSelect = document.getElementById('screenScale');

  rootDirectoryInput.value = option.rootDirectory;
  themeSelect.value = option.theme;
  // screenScaleSelect.value = option.screenScale;


  // When the user clicks the "Browse" button for rootDirectory,
  // open the folder dialog via IPC and set the input value.
  browseRootButton.addEventListener('click', async () => {
    const folderPath = await window.api.openFolder();
    if (folderPath) {
      rootDirectoryInput.value = folderPath;
    }
  });

  // Handle form submission: collect option values and send to main process.
  optionForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const rootDirectory = rootDirectoryInput.value;
    if (rootDirectory === '') {
      alert("Please select a root directory.");
      return;
    }
    const options = {
      rootDirectory: rootDirectoryInput.value,
      theme: themeSelect.value,
      // screenScale: Number(screenScaleSelect.value)
    };

    // Send the options to the main process and await confirmation.
    const result = await window.api.setOption(options);
    console.log(result);
    if (result && result.success) {
      alert("Options saved successfully!");
    } else {
      alert("Failed to save options.");
    }
  });
});
