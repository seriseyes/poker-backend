require('source-map-support').install();   // <= this is where the magic is done
const log4js = require('log4js');

/*
%d -> Date
%p -> level
%c -> default
%f -> filepath
%l -> line number
%m log message
 */

log4js.configure({
    appenders: {
        webpage: {
            type: 'console',//file || console
            filename: "c:/mitpc" + "/log/webpage.log",
            layout: {
                type: 'pattern', pattern: '%d %p %f:%l - %m'
            }
        }
    },
    categories: {
        default: {appenders: ['webpage'], level: 'info', enableCallStack: true}
    }
});
const log = log4js.getLogger();

module.exports = log;
