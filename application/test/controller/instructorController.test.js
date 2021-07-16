let chai = require('chai');
let chaiHttp = require('chai-http')
let server = require('../../index')
//Assertion style
chai.should();
chai.use(chaiHttp);

/**
 * when instructor logs out all cookies are cleared
 * when instructor does not log out all cookies are present
 *
 * when instructor logs in cookies are saved and should not have to log in again
 * when instructor is not logged in or cookies are not present, they should be asked to log in
 *
 *
 */
describe('getSendEmojiPage', function() {


})