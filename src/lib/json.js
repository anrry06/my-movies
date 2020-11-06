const fs = require('fs');

class Json {
    constructor(jsonPath){
        this.jsonPath = jsonPath;
        this.data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        
        return this;
    }

    save(data){
        this.data = data || this.data;
        fs.writeFileSync(this.jsonPath, JSON.stringify(this.data));
    }
};

module.exports = Json;