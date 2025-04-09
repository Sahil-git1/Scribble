const { format } = require('date-fns')
const { v4: uuid } = require('uuid')
const fs = require('fs')
const fsPromises = require('fs').promises
const path = require('path')

const logEvents = async (message, logFileName)=>{
    const dateTime = `${format(new Date(), 'yyyy/MM/dd\tHH:mm:ss')}`
    const logItem = `${dateTime}\t${uuid()}\t${message}\n`
    try {
        if (!fs.existsSync(path.join(__dirname, '..', 'logs'))) {
            await fsPromises.mkdir(path.join(__dirname, '..', 'logs'))
        }
        await fsPromises.appendFile(path.join(__dirname, '..', 'logs', logFileName), logItem)
    }
    catch (e) {
        console.log(e)
    }
}

const logger = (rq, rs, next) => {
    logEvents(`${rq.method}\t${rq.url}\t${rq.headers.origin}`, 'reqLog.log')
    console.log(`${rq.method} ${rq.path}`)
    next()
}

module.exports = { logger, logEvents }