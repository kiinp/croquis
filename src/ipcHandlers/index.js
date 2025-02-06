const optionHandler = require('./optionHandlers');
const directoryHandler = require('./directoryHandlers');
const fileHandler = require('./fileDropHandlers');
const dbHandler = require('./dbHandlers');
const captureHandler = require('./captureHandlers');
const windowHandler = require('./windowHandlers');
const croquisHandler = require('./croquisHandlers');



module.exports = {
    optionHandler,
    directoryHandler,
    fileHandler,
    dbHandler,
    captureHandler,
    windowHandler,
    croquisHandler
}