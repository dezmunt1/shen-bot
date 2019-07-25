const mongoose = require('mongoose');

let i = 1;

const connect = (context) => {
    Object.assign(this, context)
    mongoose.connect(this.path, {useNewUrlParser: true});
    const db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:')); 
    db.once('open', console.log.bind(console, `Соединение c БД "${db.name}" установлено`));
    this.instanse = i++;
}

class Connect {
    constructor(path) {
        this.path = path;
        this.instanse = i;
        connect(this);
    }

    
}

module.exports = Connect;
