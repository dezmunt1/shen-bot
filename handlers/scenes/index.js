const { delorianScenes } = require('./delorian.scene')
const { postmeScenes } = require('./postme.scene')

const scenes = [
  ...delorianScenes,
  ...postmeScenes
]

module.exports = scenes