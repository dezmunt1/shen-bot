const { postmeMongoListener, default: mongoListener } = require('../utils/mongoDB/mongoListener')
const { Extra } = require('telegraf')


const replys = async (ctx, params) => { // main
    try {
      const channPostTrue = ctx.channelPost ? (ctx.channelPost.text.slice(8)).toLowerCase() : false

      if ( params === 'receivingСontent' ) {
        await ctx.reply('\u2060', {
          reply_markup: { inline_keyboard: [
            [{ text: '🔄 ЕЩЁ', callback_data: 'replyMore', hide: false}]
          ]},
          disable_notification: true
        })
        return undefined
      }

      if ( params === 'contentMore') {
        ctx.telegram.deleteMessage( ctx.chat.id, correctMessageId(ctx) - 1 )
      }

      ctx.telegram.deleteMessage( ctx.chat.id, correctMessageId(ctx) )
      
      const welcomeToPostme = await ctx.replyWithSticker( process.env.WAIT_STICK )
  
      const mediaTypes = await postmeMongoListener( {chatId: welcomeToPostme.chat.id}, 'getMediatypes' )

      ctx.session.postme = {
        chatId: welcomeToPostme.chat.id,
        messageId: welcomeToPostme.message_id,
        mediaTypes
      }
    
      if ((ctx.match && ctx.match[1].toLowerCase() === 'options') || params === 'options' || channPostTrue === 'options') {
        const { chatId, messageId } = ctx.session.postme
        ctx.deleteMessage(messageId)
        const sendOptions = await ctx.reply( 'Настроим репостер ⚙', {reply_markup:
            {inline_keyboard: [
                [{ text: '📃 Откуда репостим', callback_data: 'selectSource:0', hide: false}],
                [{ text: '📌 Выбрать чат как источник', callback_data: 'setSource', hide: false}],
                [{ text: '✔️ Выбрать тип контента', callback_data: 'typeSource:current', hide: false }],
                [{ text: '🗑 Удалить чат из источников', callback_data: 'delSource', hide: false }],
                [{ text: '👋 Выход 👋 ', callback_data: 'exitScene', hide: false }],
              ]
            }
          })
          ctx.session.postme = {...ctx.session.postme, chatId: sendOptions.chat.id ,messageId: sendOptions.message_id};
      }

      if ( ((params === 'content') || (params === 'contentMore')) && channPostTrue !== 'options' ) {
        getPost(ctx, params)
      }
    } catch (error) {
      console.error(error)
    }
};

const selectSource = async (ctx, options) => {
  try {
    const { chatId, messageId } = ctx.session.postme
    const page = options.page
    const activeResourses = await postmeMongoListener({
      page,
      limit: 5
    }, 'selectSource')

    const customExtra = {}
    let message = ''
    if ( !activeResourses && page === 0 ) {
      message = '🤖Список ресурсов пуст!'
      customExtra.parse_mode = 'HTML'
      setTimeout(() => {
        ctx.deleteMessage( messageId )
        ctx.session.postme = {}
      }, 1000 * 15)

    } else { 
      const cbButtons = genListResources(activeResourses, page)

      message = '<b>Выберите один из доступных ресурсов:</b>'
      Object.defineProperties( customExtra, {
        'reply_markup': {
          value: { 'inline_keyboard': cbButtons },
          enumerable: true
        },
        'parse_mode': {
          value: 'HTML',
          enumerable: true
        }
      })
    }

    await ctx.telegram.editMessageText( chatId, messageId, null, message , customExtra)
    
  } catch (error) {
    console.error(error)
  }
};

const selectedSource = async (ctx, listeningChatId) => {
  try {
    const { messageId } = ctx.session.postme;
    const optionsForDb = {
      messageId,
      listenerChatId: ctx.chat.id,
      listeningChatId
    }
    const isProtected = await postmeMongoListener( { listeningChatId }, 'protected')
    if (isProtected) {
      Object.assign(optionsForDb, isProtected)
    }
    ctx.scene.enter( 'postmeAuth', optionsForDb )
    ctx.session.postme = {}
  } catch (error) {
    console.error(error)
  }
}

const setSource = async (ctx, options) => {   
  try {
    const problem = options && options.problem
        ? options.problem
        : null
    const { chatId, messageId } = ctx.session.postme

    const sceneState = {
      chatId: ctx.chat.id,
      problem: problem,
      redis: ctx.redis,
      userbotExist: false
    }

    try {
      const userborov = await ctx.telegram.getChatMember(chatId, process.env.SHEN_VISOR);
      if ( problem !== 'private' && (userborov.status === "left" || userborov.status === "kicked") ) {
        throw new Error('User not found')
      }
      sceneState.problem = null
      sceneState.userbotExist = true
    } catch (error) {
      if (problem !== 'private') {
        sceneState.problem = 'chatType'
      }
    }

    ctx.scene.enter('setPassword', sceneState)
    ctx.deleteMessage(messageId)
    ctx.session.postme = {}

  } catch (error) {
    console.error( error )
  }
};

const typeSource = async (ctx, msgType) => {
  try {
    const { chatId, messageId } = ctx.session.postme;
    const optionsForDb = {
      chatId: ctx.chat.id,
      msgType
    };
      const contentTypes = await postmeMongoListener(optionsForDb, 'setMediatypes');


      const cbButtons = [
        [
          { text: `🖼 Фото ${checkBox(contentTypes.photo)}`, callback_data: 'typeSource:photo', hide: false },
          { text: `🎥 Видео/GIF ${checkBox(contentTypes.video)}`, callback_data: 'typeSource:video', hide: false },
          { text: `🔗 Ссылки ${checkBox(contentTypes.links)}`, callback_data: 'typeSource:links', hide: false }
        ],
        [
          { text: `♾ Любой ${checkBox(contentTypes.all)}`, callback_data: 'typeSource:all', hide: false },
          { text: `🎵 Аудио ${checkBox(contentTypes.audio)}`, callback_data: 'typeSource:audio', hide: false }
        ],
        [{ text: `🔰 Выход 🔰`, callback_data: 'deleteThisMsg', hide: false }]
      ];
      const customExtra = { reply_markup: {inline_keyboard: cbButtons}, parse_mode: 'HTML'};
      const message = 'Выберите какой контент вы готовы получать';

      ctx.telegram.editMessageText( chatId, messageId, null, message , customExtra);
  } catch (error) {
    console.error( error );
  }
  
};

const delSource = async (ctx) => {
  try {
    const { chatId, messageId } = ctx.session.postme;
    const optionsForDb = {
      chatId
    };

    const deleteRequest = await postmeMongoListener( optionsForDb, 'delete');

    const message = deleteRequest ? `Чат успешно удален` : 'Чата в источниках нет!';

    ctx.answerCbQuery( message, true )
    ctx.session.postme = {};
    ctx.deleteMessage(messageId);
  } catch (error) {
    console.error( error )
  }
};

const getPost = async (ctx, params) => {
  try {
    const { chatId, messageId, mediaTypes } = ctx.session.postme;
    const optionsForDb = {
      chatId,
      mediaTypes,
      params,
      redis: ctx.redis
    };

    const postRequest = await postmeMongoListener(optionsForDb, 'getPost');

    if (postRequest && typeof postRequest !== "string") {
      ctx.deleteMessage(messageId);
      ctx.session.postme = {};
      return undefined;
    }
    const message = postRequest ? postRequest : 'Контент не найден, попробуйте позже'

    ctx.deleteMessage(messageId)
    const newMessage = await ctx.telegram.sendMessage(chatId, message, Extra.HTML())
    ctx.session.postme = {};
    setTimeout(() => {
      ctx.deleteMessage(newMessage.message_id);
    }, 1000 * 30);
      
  } catch (error) {
    console.error(error)
  }
}       

module.exports = {
    replys,
    selectSource,
    selectedSource,
    setSource,
    delSource,
    typeSource,
    getPost,
}

function correctMessageId(ctx) {
  const messageId = ctx.callbackQuery
    ? ctx.callbackQuery.message.message_id
    : !ctx.message
      ? ctx.channelPost.message_id
      : ctx.message.message_id
  return messageId
}

function genListResources(arr, page) {
  const correctArray = arr.slice(0, 5)
  const cbBtns = []

  if (arr) {
    correctArray.forEach( resource => {
      const locked = resource.postme.passwordRequired
        let resourseType =
          resource.chatType === 'channel' ? '📣'
          : resource.chatType === 'group' ? '🗣'
          : resource.chatType === 'supergroup' ? '🗣'
          : resource.chatType === 'private' ? '👩🏻‍💻'
          : ' '
  
        resourseType = locked ? '🔐 ' + resourseType : resourseType 
        cbBtns.push( [
          {
            text: `${resourseType} ${resource.title || resource.username}`,
            callback_data: `selectedSource:${resource.chatID}`,
            hide: false
          }
        ]
      )
    })
  }

  const leftArrow = page === 0 ? '⏺' : '⬅️'
  const rightArrow = arr.length < 6 ? '⏺' : '➡️'

  const leftCbData = leftArrow === '⏺' ? 'plug' : `selectSource:${page - 1}`
  const rightCbData = rightArrow === '⏺' ? 'plug' : `selectSource:${page + 1}`

  cbBtns.push([
    {text: `${leftArrow}`, callback_data: leftCbData, hide: false},
    {text: `Page ${page + 1}`, callback_data: 'plug', hide: false},
    {text: `${rightArrow}`, callback_data: rightCbData, hide: false},
  ])
  cbBtns.push([
    {text: `👋 Выход 👋 `, callback_data: 'exitScene', hide: false},
  ])
  return cbBtns
}

function checkBox(bool) {
    return bool === true ? '✅' : '⬜️';
}
