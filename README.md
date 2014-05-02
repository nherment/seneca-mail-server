
expose a smtp server to receive emails into seneca


# options

  {
    SMTPBanner:       options.banner || 'seneca-smtp',
    name:             options.domain || 'nearform.com',
    secureConnection: options.secure === undefined ? true  : options.secure,
    debug:            options.debug  === undefined ? false : options.debug
  }


# Usage

TODO
