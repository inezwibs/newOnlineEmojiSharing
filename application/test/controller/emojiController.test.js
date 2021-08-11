let chai = require('chai');
let chaiHttp = require('chai-http')
let server = require('../../index')
//Assertion style
chai.should();
chai.use(chaiHttp);

describe('getSendEmojiPage', function() {

    it('should send success message', function(done) {
        console.log('Wrong password is provided');
        chai.request(server)
            .get('/sendEmoji')
            .then((err,response) => {
                response.should.have.status(200);
            done();
            });
        // assert.isNotNull(emojiController.getSendEmojiPage());
    });

})