var chai = require("chai")
var chaiHttp = require("chai-http")
var server = require("../index")
var should = chai.should()
var expect = require('chai').expect
var mockSession = require('mock-session');
chai.use(chaiHttp)
const { isTypedArray } = require('util/types')
const { workerData } = require("worker_threads")



describe('redirect', function() {
    // 3 second timeout
    // this.timeout(3000); 
  
    it('should render login page when / is accessed', function(done) {
      chai.request(server)
        .get('/')
        .end(function (err, res) {
          res.should.have.status(200);
          res.should.be.a('object');
          done();
        });
    });
  
    it('should render a register page when /register is accessed', function(done) {
      chai.request(server)
        .get('/register')
        .end(function (err, res) {
          res.should.have.status(200);
          res.should.be.a('object');
          done();
        });
    });

    it('should render a database tabe page when /table is accessed', function(done) {
        chai.request(server)
          .get('/table')
          .end(function (err, res) {
            res.should.have.status(200);
            res.should.be.a('object');
            res.should.redirect;
            done();
        });
    });
      
    it('should render register page when /add_admin is accessed', function(done) {
        chai.request(server)
          .get('/add_admin')
          .end(function (err, res) {
            res.should.have.status(200);
            res.should.be.a('object');
            res.should.redirect;
            done();
        });
    });

    it('should render a session page when /go_to_session_page is accessed', function(done) {
        chai.request(server)
          .get('/go_to_session_page/:id')
          .end(function (err, res) {
            res.should.have.status(200);
            res.should.be.a('object');
            res.should.redirect;
            done();
        });
    });

    it('should render a session_page when /session_replay', function(done) {
        chai.request(server)
          .get('/session_replay/:id')
          .end(function (err, res) {
            res.should.have.status(200);
            res.should.be.a('object');
            res.should.redirect;
            done();
        });
    });
    
    it('should render a session_page page when /table is accessed', function(done) {
            chai.request(server)
              .get('/session_note/:id')
              .end(function (err, res) {
                res.should.have.status(404);
                res.should.be.a('object');
                done();
            });
        });

    it('should render a session_page page when /table is accessed', function(done) {
        chai.request(server)
            .get('/notes/:id')
            .end(function (err, res) {
            res.should.have.status(404);
            res.should.be.a('object');
            done();
        });
    });


}); 


describe('User', function () {
    user_sample = {
        name: 'ian',
        email: 'example@sfu.ca',
        password: '123456789',
      }
    
    // it('should add a new user on POST /create_account', function (done) {
    //     chai.request(server).post('/create_account').send(user_sample)
    //         .end(function (error, res) {
    //             should.equal(error, null);
    //             res.should.have.status(200);
    //             res.should.be.json;
    //             res.body.should.be.a('array');
    //             // expect(res.body.name).to.equal('ian')
    //             res.body[0].name.should.equal('ian')
    //             res.body[0].email.should.equal('example@sfu.ca')
    //             res.body[0].password.should.equal('123456789')
    //             // res.body[0].type.should.equal('user')
    //             done();
    //         });
    // });

    it('should add single user on post request for /create_acount', async()=> {
        var res0 = await chai.request(server).get('/getAllUser');
        var num_user_before = res0.body.length;
        
        var res1 = await chai.request(server).post('/create_account').send(user_sample);
        res1.should.have.status(200)

        var res2 = await chai.request(server).get('/getAllUser');
        var num_user_after = res2.body.length;


        (num_user_after - num_user_before).should.equal(1)
        res1.should.have.status(200)

    });

    // can't test because of req.session condition in index.js, will fix it on iteration 3
    // it('should delete a single user on post request for /delete/:id', async()=> {
    //     let cookie = mockSession('my-session', 'my-secret', {"count":1});
    //     var res0 = await chai.request(server).get('/getAllUser');
    //     var num_user_before = res0.body.length;
        
    //     // var res1 = await chai.request(server).post('/create_account').send(user_sample);
    //     // res1.should.have.status(200)

    //     const id = 121
    //     var res2 = await chai.request(server).post('/delete/'+id).set('cookie',[cookie]);
    //     res2.should.have.status(200)

    //     var res3 = await chai.request(server).get('/getAllUser');
    //     var num_user_after = res3.body.length;


    //     (num_user_after - num_user_before).should.equal(1)
    //     res3.should.have.status(200)

    // });

    it("should log in as user", function(done) {
        chai.request(server)
            .post('/auth').send(user_sample)
            .end(function(err, res) {
                console.log(res.body)
                res.should.have.status(200);
                done();
            });
    });

    it("user cannot login as admin", function(done){
        chai.request(server)
            .post('/admin').send(user_sample)
            .end(function(err, res) {
                res.should.have.status(404);
                done();
            });
    })

    
});

describe('admin', function(){
    user_sample = {
        name: 'ian',
        email: 'example@sfu.ca',
        password: '123456789',
        type: 'admin'
      }

    it("admin login", (done)=>{
        chai.request(server)
        .post('/auth').send(user_sample)
        .end(function(err, res) {
            res.should.have.status(200);
            done();
        });

    });

    it("admin access database", (done)=>{
        chai.request(server)
        .post('/auth').send(user_sample)
        .end(function(err, res) {
            res.should.have.status(200);

            chai.request(server)
            .get('/table').send(user_sample)
            .end(function(err,res2){
                res2.should.have.status(200);
                done();
            });
        });
    });

    it("admin access comment", (done)=>{
        chai.request(server)
        .get('/view_comments')
        .end(function(err,res){
            res.should.have.status(200);
            done();
        });
    });

    it("admin delete user", (done)=>{
        chai.request(server)
        .post('/delete/:id').send(user_sample)
        .end(function(err,res2){
            res2.should.have.status(200);
            done();
        });
    });
});


// can't test because of req.session condition in index.js, will fix it on iteration 3
describe('session', function() {
    comment_sample = {
        uid : '2',
        name : 'qqq',
        sessionID : '5',
        comment : "Hello"
    }

    // it('should add single user on post request for /create_acount', async()=> {
    //     var res0 = await chai.request(server).get('/getAllUser');
    //     var num_user_before = res0.body.length;
        
    //     var res1 = await chai.request(server).post('/create_account').send(user_sample);
    //     res1.should.have.status(200)

    //     var res2 = await chai.request(server).get('/getAllUser');
    //     var num_user_after = res2.body.length;


    //     (num_user_after - num_user_before).should.equal(1)
    //     res1.should.have.status(200)

    // });



    // it('should add single comment on post request for /addcomment', async()=> {
    //     var res0 = await chai.request(server).get('/getAllcomment');
    //     var num_user_before = res0.body.length;
        
    //     var res1 = await chai.request(server).post('/addComment').send(comment_sample);
    //     res1.should.have.status(200)

    //     var res2 = await chai.request(server).get('/getAllcomment');
    //     var num_user_after = res2.body.length;


    //     (num_user_after - num_user_before).should.equal(1)
    //     res1.should.have.status(200)

    // });






    // it('should delete a single user on post request for /create_acount', async()=> {
    //     var res0 = await chai.request(server).get('/getAllUser');
    //     var num_user_before = res0.body.length;
    //     var id = 100;
    //     var res1 = await chai.request(server).post('/create_account').send(user_sample);
    //     res1.should.have.status(200)

    //     var res2 = await chai.request(server).post('/delete/:id' + id);
    //     console.log(res2.body)
    //     res2.should.have.status(200)

    //     var res3 = await chai.request(server).get('/getAllUser');
    //     var num_user_after = res3.body.length;


    //     (num_user_after - num_user_before).should.equal(0)
    //     res1.should.have.status(200)

    // });

    // it("should log in as user", function(done) {
    //     chai.request(server)
    //         .post('/auth').send(user_sample)
    //         .end(function(err, res) {
    //             console.log(res.body)
    //             res.should.have.status(200);
    //             done();
    //         });
    // });

    // it("user cannot login as admin", function(done){
    //     chai.request(server)
    //         .post('/admin').send(user_sample)
    //         .end(function(err, res) {
    //             res.should.have.status(404);
    //             done();
    //         });
    // })


// describe('Functional Test <Sessions>:', function () {
//     it('should create user session for valid user', function (done) {
//       request(server)
//         .post('/v1/sessions')
//         .set('Accept','application/json')
//         .send({"email": "user_test@example.com", "password": "123"})
//         .expect('Content-Type', /json/)
//         .expect(200)
//         .end(function (err, res) {
//           res.body.id.should.equal('1');
//           res.body.short_name.should.equal('Test user');
//           res.body.email.should.equal('user_test@example.com');
//           // Save the cookie to use it later to retrieve the session
//           Cookies = res.headers['set-cookie'].pop().split(';')[0];
//           done();
//         });
//     });
});

//describe('Comment', function () {
//    comment_sample = {
//        uid : '2',
//        name : 'qqq',
//        sessionID : '5',
//        comment : "Hello"
//      }
//
//    it('should add single comment on post request for /addComment', async()=> {
//        var res0 = await chai.request(server).get('/getAllComment');
//        var num_comment_before = res0.body.length;
//
//        var res1 = await chai.request(server).post('/addComment').send(comment_sample);
//        res1.should.have.status(200)
//        res1.should.redirect
//        var res2 = await chai.request(server).get('/getAllComment');
//        var num_comment_after = res2.body.length;
//
//        (num_comment_after - num_comment_before).should.equal(1)
//        res1.should.have.status(200)
//    });
//
//    it('should delete a single user on post request for /create_acount', async()=> {
//        var res0 = await chai.request(server).get('/getAllComment');
//        var num_user_before = res0.body.length;
//        var id = 100;
//        var res1 = await chai.request(server).post('/addComment').send(comment_sample);
//        res1.should.have.status(200)
//
//        var res2 = await chai.request(server).post('/delete/:id' + id);
//        res2.should.have.status(200)
//
//        var res3 = await chai.request(server).get('/getAllComment');
//        var num_user_after = res3.body.length;
//
//
//        (num_user_after - num_user_before).should.equal(0)
//        res1.should.have.status(200)
//
//    });
//});

