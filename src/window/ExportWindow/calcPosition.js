/**
 * Calculates the positions of boxes by placing each box in the column
 * with the smallest current end position (y).
 *
 * @param {Object} data
 * @param {Object} data.option
 * @param {Number} data.option.padding      // outer padding
 * @param {Number} data.option.hGap         // horizontal gap between columns
 * @param {Number} data.option.vGap         // vertical gap between boxes in a column
 * @param {Number} data.option.limitPerLine // total number of columns
 * @param {Object[]} data.boxList           // list of boxes
 * @param {Number} data.boxList[].width     // width of a box
 * @param {Number} data.boxList[].height    // height of a box
 * @param {String} data.boxList[].name      // name of a box
 * @returns {Object} An object containing:
 *   - boxList {Object[]} Updated array of boxes with startPos property.
 *   - outerWidth {Number} Overall width including boxes and padding.
 *   - outerHeight {Number} Overall height including boxes and padding.
 */
function calcPosition(data) {
    const { option, boxList } = data;

    // Initialize columns array to track each column's current Y position and max width.
    const columns = new Array(option.limitPerLine).fill(null).map(() => ({
        currentY: option.padding, // initial y position (top padding)
        maxWidth: 0,              // max width found in this column
        boxes: []                 // list of boxes assigned to this column (optional)
    }));

    // Create a copy of boxList to store the results.
    const resultBoxList = boxList.map(box => ({ ...box }));

    // Assign each box to the column with the smallest currentY.
    resultBoxList.forEach(box => {
        // Find the column index with the minimum currentY (lowest end position).
        let minColumnIndex = 0;
        let minY = columns[0].currentY;
        for (let i = 1; i < columns.length; i++) {
            if (columns[i].currentY < minY) {
                minY = columns[i].currentY;
                minColumnIndex = i;
            }
        }

        // Set the start position for the box.
        // x will be determined later based on the column's x position.
        box.columnIndex = minColumnIndex; // temporary property to store column index
        box.startPos = {
            x: 0, // placeholder, will be set later
            y: columns[minColumnIndex].currentY
        };

        // Update the column's currentY by adding the box's height and vertical gap.
        columns[minColumnIndex].currentY += box.height + option.vGap;

        // Update the maximum width for this column if needed.
        if (box.width > columns[minColumnIndex].maxWidth) {
            columns[minColumnIndex].maxWidth = box.width;
        }

        // Optionally, add the box to the column's list.
        columns[minColumnIndex].boxes.push(box);
    });

    // Compute the x positions for each column.
    // The first column's x position is the padding.
    const columnXPositions = [];
    columnXPositions[0] = option.padding;
    for (let i = 1; i < columns.length; i++) {
        // Each subsequent column's x is calculated based on the previous column's x position, max width, and horizontal gap.
        columnXPositions[i] = columnXPositions[i - 1] + columns[i - 1].maxWidth + option.hGap;
    }

    // Update each box's startPos.x based on the computed column x positions.
    resultBoxList.forEach(box => {
        box.startPos.x = columnXPositions[box.columnIndex];
        delete box.columnIndex; // remove temporary property
    });

    // Calculate the overall outerWidth.
    const outerWidth = columnXPositions[columnXPositions.length - 1] + columns[columns.length - 1].maxWidth + option.padding;

    // Calculate the overall outerHeight.
    // The currentY for each column includes an extra vGap after the last box, so we subtract it.
    let maxColumnY = columns[0].currentY;
    for (let i = 1; i < columns.length; i++) {
        if (columns[i].currentY > maxColumnY) {
            maxColumnY = columns[i].currentY;
        }
    }
    // If at least one box is placed, subtract the extra vGap; otherwise, use the top padding.
    const outerHeight = (boxList.length > 0 ? maxColumnY - option.vGap : option.padding) + option.padding;

    return {
        boxList: resultBoxList,
        outerWidth,
        outerHeight
    };
}

export default {
    calcPosition
}
