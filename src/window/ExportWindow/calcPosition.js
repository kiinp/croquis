/**
 * 
 * @param {Object} data
 * @param {Object} data.option
 * @param {Number} data.option.padding
 * @param {Number} data.option.hGap // horizontal gap between images
 * @param {Number} data.option.vGap // vertical gap between images
 * @param {Number} data.option.limitPerLine
 * @param {Object[]} data.boxList  
 * @param {Number} data.boxList[].width
 * @param {Number} data.boxList[].height
 * @param {String} data.boxList[].name
 * @returns {Object} An object containing:
 *   - boxList {Object[]} Updated array of boxes with startPos property (each box's position).
 *   - outerWidth {Number} The overall width including all boxes and padding.
 *   - outerHeight {Number} The overall height including all boxes and padding.
 */
function calcPosition(data) {
    const { option, boxList } = data;

    const result = {
        boxList: [...boxList],
        outerWidth: 0,
        outerHeight: 0,
    };

    boxList.forEach((box, i) => {
        const colIndex = i % option.limitPerLine;
        const startPos = {
            x: 0,
            y: 0,
        };

        const aboveIndex = i - option.limitPerLine;
        if (aboveIndex >= 0) {
            startPos.y = result.boxList[aboveIndex].startPos.y + result.boxList[aboveIndex].height + option.vGap;
        } else {
            startPos.y = option.padding;
        }

        if (colIndex == 0) {
            startPos.x = option.padding;
        } else {
            startPos.x = result.boxList[i - 1].startPos.x + result.boxList[i - 1].width + option.hGap;
        }

        result.boxList[i].startPos = startPos;

        const endPos = {
            x: startPos.x + box.width + option.padding,
            y: startPos.y + box.height + option.padding,
        };

        if (endPos.x > result.outerWidth) result.outerWidth = endPos.x;
        if (endPos.y > result.outerHeight) result.outerHeight = endPos.y;
    })

    return result;
}


export default {
    calcPosition
}