var chai = require("chai")
var chaiHttp = require("chai-http")
var server = require("../index_t")
var should = chai.should()
var expect = require('chai').expect
// var mockSession = require('mock-session')
const session = require('express-session')
chai.use(chaiHttp)
const { isTypedArray } = require('util/types')
const { workerData } = require("worker_threads")





describe('Redirect Test', function() {
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
        id = 1
        chai.request(server)
          .get('/go_to_session_page/' + id)
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


describe('User Test', function () {
    user_sample = {
        name: 'ian',
        email: 'example@sfu.ca',
        password: '123456789',
    }

    it('should add single user on post request for /create_acount, and type should be user', async()=> {
        var res0 = await chai.request(server).get('/getAllUser');
        var num_user_before = res0.body.length;
        //console.log(num_user_before)
        
        var res1 = await chai.request(server).post('/create_account').send(user_sample);

        var res2 = await chai.request(server).get('/getAllUser');
        var num_user_after = res2.body.length;
        //console.log(num_user_after)

        (num_user_after - num_user_before).should.equal(1)

        var res_type = await chai.request(server).get('/getLastType');
        res_type.body.rows[0].type.should.equal('user')
        res1.should.have.status(200)

    });


    it("should log in as user", function(done) {
        chai.request(server)
            .post('/auth').send(user_sample)
            .end(function(err, res) {
                // console.log(res.body)
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


describe('Admin Test', function(){
    admin_sample = {
        name: 'Jack',
        email: 'example@gmail.ca',
        password: '123456789',
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
    
    it('should add single admin on post request for /create_addmin_account, and type should be admin', async()=> {
        
        var res0 = await chai.request(server).get('/getAllUser');
        var num_user_before = res0.body.length;
        // console.log(num_user_before)
        
        var res1 = await chai.request(server).post('/create_addmin_account').send(admin_sample);
        //console.log(res0.body)

        var res2 = await chai.request(server).get('/getAllUser');
        var num_user_after = res2.body.length;
        // console.log(num_user_after)

        (num_user_after - num_user_before).should.equal(1)

        var res_type = await chai.request(server).get('/getLastType');
        // console.log(res_type.body.rows[0].type)
        res_type.body.rows[0].type.should.equal('admin')

        res1.should.have.status(200)
    });

    it('should delete a single user/admin on post request for /delete/:id', async()=> {
        var res0 = await chai.request(server).get('/getAllUser');
        var num_user_before = res0.body.length;

        // delete the last user which created in User describe
        var res_id = await chai.request(server).get('/getLastUid');
        var id = res_id.body.rows[0].uid
        await chai.request(server).post('/delete/'+id);


        var res3 = await chai.request(server).get('/getAllUser');
        var num_user_after = res3.body.length;

        (num_user_before - num_user_after).should.equal(1)
        res3.should.have.status(200)
    });

    it("admin delete user", (done)=>{
        chai.request(server)
        .post('/delete/:id')
        .end(function(err,res2){
            res2.should.have.status(200);
            done();
        });
    });
});


describe('Session Test', function() {
    session_sample = {
        uid : '1',
        new_session_title : 'server_test',
        new_session_access_code : '123456',
        new_session_start_time : '2022-08-12 00:00:00'
    }

    it('should add single session on post request for /addSession', async()=> {
        var res0 = await chai.request(server).get('/getAllSession');
        var num_user_before = res0.body.length;
        //console.log(num_user_before)
        
        var res1 = await chai.request(server).post('/addSession').send(session_sample);

        var res2 = await chai.request(server).get('/getAllSession');
        var num_user_after = res2.body.length;
        //console.log(num_user_after)

        (num_user_after - num_user_before).should.equal(1)
        res1.should.have.status(200)
    });


    it('the type of session should be changed to remote for /end_session/:id', async()=> {
        var res_id = await chai.request(server).get('/getLastSessionId');
        var id = res_id.body.rows[0].session_id
        var res = await chai.request(server).post('/end_session/'+id)

        var res_type = await chai.request(server).get('/getSessionType');
        res_type.body.rows[0].session_type.should.equal('remote')
        res.should.have.status(200)
    });

    it('should delete a single session on post request for /cancel_session/:id', async()=> {
        var res0 = await chai.request(server).get('/getAllSession');
        //console.log(res0.body.length)
        var num_user_before = res0.body.length;

        // delete the last session which created above
        var res_id = await chai.request(server).get('/getLastSessionId');
        var id = res_id.body.rows[0].session_id
        await chai.request(server).get('/cancel_session/'+id);
        
        var res3 = await chai.request(server).get('/getAllSession');
        //console.log(res3.body.length)
        var num_user_after = res3.body.length;

        (num_user_before - num_user_after).should.equal(1)
        res3.should.have.status(200)
    });

});




describe('Comment Test', function () {
    comment_sample = {
       uid : '1',
       username : 'ian',
       session_id : '1',
       new_comment_comment : "Hello World"
     }

   it('should add single comment on post request for /addComment', async()=> {
       var res0 = await chai.request(server).get('/getAllComment');
       var num_comment_before = res0.body.length;

       var res1 = await chai.request(server).post('/addComment').send(comment_sample);
       res1.should.have.status(200)
       var res2 = await chai.request(server).get('/getAllComment');
       var num_comment_after = res2.body.length;

       (num_comment_after - num_comment_before).should.equal(1)
       res1.should.have.status(200)
   });

   it('should delete a single user on post request for /delete_comment', async()=> {
        var res0 = await chai.request(server).get('/getAllComment');
        var num_user_before = res0.body.length;
        //console.log(res0.body.length)
       
        var res_id = await chai.request(server).get('/getLastCommentId');
        var id = res_id.body.rows[0].comment_id
        

        var res1 = await chai.request(server).post('/delete_comment/' + id);
        res1.should.have.status(200)

        var res2 = await chai.request(server).get('/getAllComment');
        var num_user_after = res2.body.length;
        //console.log(res2.body.length)


        (num_user_before- num_user_after).should.equal(1)

   });
});




describe('Send Comment Test', function () {
    share_comment = {
        from_email : 'send@sfu.ca',
        to_email : 'receive@sfu.ca',
        comment : 'Shared Hello World',
        comment_time: '2022-08-12 00:00:00',
        session_id : '2',
        comment_id : '100000',
        from_uid: '4',
        to_uid: '2'
    }

    it('should send a single comment to another user on post request for /sendemail', async()=> {
        var res0 = await chai.request(server).get('/getAllSendComment');
        var num_before = res0.body.length;

        var res1 = await chai.request(server).post('/sendemail').send(share_comment);
        res1.should.have.status(200)

        var res2 = await chai.request(server).get('/getAllSendComment');
        var num_after = res2.body.length;
        (num_after - num_before).should.equal(1)
    });
   
    it('should delete a single sended comment from the receiver side on post request for /delete_share_comment', async()=> {
        var res0 = await chai.request(server).get('/getAllSendComment');
        var num_before = res0.body.length;
        // console.log("num_before: ", num_before)

        // delete the sended comment
        var res_id = await chai.request(server).get('/getLastSharedCommentId');
        var id = res_id.body.rows[0].comment_id
        await chai.request(server).post('/delete_share_note/' + id);

        var res2 = await chai.request(server).get('/getAllSendComment');
        var num_after = res2.body.length;

        (num_before- num_after).should.equal(1)
    });
 
});

describe('frendlist Test', function () {
    user1 = {
        name: 'host',
        email: 'my@sfu.ca',
        password: '123456789',
    }

    user2 = {
        name: 'friend',
        email: 'friend@sfu.ca',
        password: '123456789',
    }

    session_sample = {
        uid : '1',
        new_session_title : 'send_test',
        new_session_access_code : '123456',
        new_session_start_time : '2022-08-12 00:00:00'
    }
      
    comment_sample = {
        uid : '1',
        username : 'sender',
        session_id : '1',
        new_comment_comment : "Hello World"
    }
    
    share_comment_sample = {
        from_email : 'send@sfu.ca',
        to_email : 'receive@sfu.ca',
        comment : 'Hello World',
        comment_time: '2022-08-12 00:00:00',
        session_id : '1',
        comment_id : '1',
        from_uid: '1',
        to_uid: '2'
    }

    frendlist_sample = {
        uid : 100000,
        new_contact_email: 'friend@sfu.ca'
    }

    it('should add a single friend/contact on post request for /addfriend', async()=> {
        //create two sample user
        await chai.request(server).post('/create_account').send(user1);
        await chai.request(server).post('/create_account').send(user2);

        var res0 = await chai.request(server).get('/getAllFriend');
        var num_before = res0.body.length;

        var res1 = await chai.request(server).post('/addfriend').send(frendlist_sample);
        res1.should.have.status(200)

        var res2 = await chai.request(server).get('/getAllFriend');
        var num_after = res2.body.length;
        (num_after - num_before).should.equal(1)
    });
   
    it('should delete a single friend on post request for /delete_friend', async()=> {
        var res0 = await chai.request(server).get('/getAllFriend');
        var num_before = res0.body.length;
        // console.log("num_before:", num_before)

        //delete the added friend
        var res_id = await chai.request(server).get('/getLastFriendId');
        var id = res_id.body.rows[0].friend_id
        //console.log("id:", id)
        var res1 = await chai.request(server).post('/delete_friend/' + id);
        res1.should.have.status(200)

        var res2 = await chai.request(server).get('/getAllFriend');
        var num_after = res2.body.length;
        (num_before- num_after).should.equal(1)
        
        //delete created sample users
        var res_id = await chai.request(server).get('/getLastUid');
        var id = res_id.body.rows[0].uid
        await chai.request(server).post('/delete/'+id);
        var res_id2 = await chai.request(server).get('/getLastUid');
        var id2 = res_id2.body.rows[0].uid
        await chai.request(server).post('/delete/'+id2);
    });
    
});