var pluginName = 'smtp'

var simplesmtp = require('simplesmtp')
var EmailAddress = require('email-addresses')

module.exports = function(options) {

  var seneca = this

  var port = options.port || 25

  var smtp = simplesmtp.createServer({
    SMTPBanner:       options.banner || 'seneca-smtp',
    name:             options.domain || 'nearform.com',
    secureConnection: options.secure === undefined ? true  : options.secure,
    debug:            options.debug  === undefined ? false : options.debug
  })

  smtp.on('startData', function(connection) {
    console.log('startData')
    seneca.log.info('Message from', connection.from, 'to', connection.to)
    seneca.act({role: 'mail-reader', cmd: 'connection', connection: connection})
  })

  smtp.on('data', function(connection, chunk){
    console.log('data')
    seneca.act({role: 'mail-reader', cmd: 'writeChunk', connection: connection, chunk: chunk})
  })

  smtp.on('validateSender', function(connection, email, callback) {

    seneca.act({
      role: 'mail-reader',
      cmd: 'validateSender',
      connection: connection,
      sender: EmailAddress.parseOneAddress(email)
    }, function(err) {
      callback(err)
    })
  })

  smtp.on('validateRecipient', function(connection, email, callback) {
    var recipient = email.split('@')
    var local = recipient[0]
    var domain = recipient[1]
    seneca.act({
      role: 'mail-reader',
      cmd: 'validateRecipient',
      connection: connection,
      recipient: EmailAddress.parseOneAddress(email)
    }, function(err) {
      callback(err)
    })
  })


  smtp.on('dataReady', function(connection, callback){
    console.log('dataReady')
    seneca.act({role: 'mail-reader', cmd: 'writeEnd', connection: connection}, function(err) {
      callback(err)
    })
  })

  seneca.add({init:pluginName}, function(args, done) {
    console.log('starting smtp server on port', port)
    smtp.listen(port, function(err) {
      if(err) {
        console.error('failed to start smtp server', err)
      } else {
        console.log('started smtp server on port', port)
      }
      done(err)
    })
  })

  return {
    name: pluginName
  }

}
