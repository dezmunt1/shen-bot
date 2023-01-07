const handlerMessages = {
  messageAnimation: (content, messageId, allContent) => {
    const captions = content.caption ? content.caption : false
    const fileId = content.animation.file_id
    allContent.animation[messageId] = {fileId, caption: captions}
    return
  },
  messageAudio: (content, messageId, allContent) => {
    const captions = content.caption ? content.caption : false
    const fileId = content.audio.file_id
    allContent.audio[messageId] = {fileId, caption: captions}
    return
  },
  messagePhoto: (content, messageId, allContent) => {
    const photoArray = content.photo
    const captions = content.caption ? content.caption : false
    const readyArray = []
    photoArray.forEach(element => {
      const addObject = {}
      if (element.width <= 90) {
        addObject.size = 'small'
        addObject.fileId = element.file_id
      }
      if (90 < element.width && element.width <= 320) {
        addObject.size = 'medium'
        addObject.fileId = element.file_id
      }
      if (320 < element.width && element.width <= 800) {
        addObject.size = 'big'
        addObject.fileId = element.file_id
      }
      if (800 < element.width && element.width <= 1280) {
        addObject.size = 'big_plus'
        addObject.fileId = element.file_id
      }
      if (element.width > 1280) {
        addObject.size = 'full_size'
        addObject.fileId = element.file_id
      }
      addObject.caption = captions
      readyArray.push(addObject)
    })
    return allContent.photo[messageId] = readyArray
  },
  messageText: (content, messageId, allContent) => {
    const text = content.text
    if(text.match(/^(http:\/\/)|^(https:\/\/)/g)) {
      allContent.links[messageId] = text
    }
    return
  },
  messageVideo: (content, messageId, allContent) => {
    const captions = content.caption ? content.caption : false
    const fileId = content.video.file_id
    allContent.video[messageId] = {fileId, caption: captions}
    return
  },
  messageVideoNote: (content, messageId, allContent) => {
    const fileId = content.video_note.file_id
    allContent.videonote[messageId] = fileId
    return
  },
  messageVoiceNote: (content, messageId, allContent) =>{
    const fileId = content.voice.file_id
    allContent.voicenote[messageId] = fileId
    return
  },
}

export default handlerMessages
