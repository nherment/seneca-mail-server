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
    debug:            options.debug  === undefined ? false : options.debug,
    disableDNSValidation: options.disableDNSValidation ===
      undefined ? false : options.disableDNSValidation
  })

  smtp.on('startData', function(connection) {
    seneca.log.info('Message from', connection.from, 'to', connection.to)
    seneca.act({role: 'mail-reader', cmd: 'connection', connection: connection})
  })

  smtp.on('data', function(connection, chunk){
    seneca.act({role: 'mail-reader', cmd: 'writeChunk', connection: connection, chunk: chunk})
  })

  smtp.on('validateSender', function(connection, email, callback) {
    connection.sender = EmailAddress.parseOneAddress(email)
    seneca.act({
      role: 'mail-reader',
      cmd: 'validateSender',
      connection: connection,
      sender: connection.sender
    }, function(err) {
      callback(err)
    })
  })

  smtp.on('validateRecipient', function(connection, email, callback) {
    connection.recipient = EmailAddress.parseOneAddress(email)
    var recipient = email.split('@')
    var local = recipient[0]
    var domain = recipient[1]
    seneca.act({
      role: 'mail-reader',
      cmd: 'validateRecipient',
      connection: connection,
      recipient: connection.recipient
    }, function(err) {
      callback(err)
    })
  })


  smtp.on('dataReady', function(connection, callback){
    seneca.act({role: 'mail-reader', cmd: 'writeEnd', connection: connection}, function(err) {
      callback(err)
    })
  })

  seneca.add({init:pluginName}, function(args, done) {
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
