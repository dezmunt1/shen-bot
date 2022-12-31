const { delorianScenes } = require('./delorian/delorian.scene');
const { postmeScenes } = require('./postme.scene');
const { adminScenes } = require('./admin.scene');

const scenes = [...delorianScenes, ...postmeScenes, ...adminScenes];

module.exports = scenes;
