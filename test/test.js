
var port = 2525

var simplesmtp = require('simplesmtp')
var assert = require('assert')
var seneca = require('seneca')()
seneca.use('mail-reader')
seneca.use('mail-server', {port: port, secure: false})

describe('mail', function() {

  before(function(done) {
    seneca.ready(done)
  })

  var client

  beforeEach(function(done) {
    this.timeout(5000)
    client = simplesmtp.connect(port, 'localhost', {debug: false})
    client.on('idle', function() {
      client.removeAllListeners('idle')
      done()
    })
    client.on('error', function(err, stage) {
      console.error(stage, err)
      throw err
    })
  })

  it('receives', function(done) {
    this.timeout(10000)

    seneca.add({role: 'mail-reader', cmd: 'mail'}, function(args, cb) {
      console.log(args.mail)
      assert.equal(args.mail.subject, 'hello world')
      done()
    })


    client.useEnvelope({
      from: "me@nearform.com",
      to: ["root@nearform.com", "user@nearform.com"]
    });
    client.on("message", function(){
      client.write('Subject:hello world')
      client.write('\r\nDATA')
      client.write('subject')
      client.write('\r\n.')
      client.end()
    });
    client.on("ready", function(success, response){
      if(!success){
        console.error(response)
        done(response)
      }
    });
  })

})
