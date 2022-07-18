var chai = require("chai")
var chaiHttp = require("chai-http")
var server = require("../index")
var should = chai.should()

chai.use(chaiHttp)

describe('admin', function () {
    it('should add a new admin GET /add_admin', async () => {
        var res = await chai.request(server).get('/add_admin')
        res.should.be.json
        res.body.should.be.a('array')
    })
})


// describe('admin', function () {
//     it('should add a new admin on POST /add_admin', function (done) {
//         chai.request(server).post('/add_admin').send({ name: 'ian', email: "12@sfu.ca", type: "admin", password: "12345678" })
//             .end(function (error, res) {
//                 res.should.have.status(200);
//                 res.should.be.json;
//                 res.should.be.a('array');
//                 res.body[0].name.should.equal('ian')
//                 res.body[0].email.should.equal('12@sfu.ca')
//                 res.body[0].password.should.equal('12345678')
//                 done();
//             });
//     });
// });

// describe('Stuff', function () {
//     it('should list all stuff on GET /allstuff', async () => {
//         var res = await chai.request(server).get('/allstuff')
//         res.should.be.json
//         res.body.should.be.a('array')
//     })

//     it('should add a new stuff on POST /addstuff', async () => {
//         var res0 = await chai.request(server).get('/allstuff');
//         var num_stuff0 = res0.body.length;

//         var res1 = await chai.request(server).post('/addstuff')
//             .send({ fname: 'bobby', age: 12 });
//         var num_stuff1 = res1.body.length;

//         (num_stuff1 - num_stuff0).should.equal(1)
//         res1.should.have.status(200)

//     })
// })
