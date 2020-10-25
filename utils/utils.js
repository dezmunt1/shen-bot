const bcrypt = require('bcryptjs')

module.exports['hashPassword'] = async (password = '123') => {
  const soltRound = +process.env.HASH_SALT
  const solt = await bcrypt.genSalt(soltRound)
  const hash = await bcrypt.hash( password, solt )
  return hash
}
module.exports['hashPasswordSync'] = (password = '123') => {
  const soltRound = +process.env.HASH_SALT
  const solt = bcrypt.genSaltSync(soltRound)
  const hash = bcrypt.hashSync( password, solt )
  return hash
}
module.exports['checkHashPassword'] = async (password, hash) => {
  const check = await bcrypt.compare( password, hash )
  return check
}
