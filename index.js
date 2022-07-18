//ver 8.2 M
const express = require('express')
const aws = require('aws-sdk');
const fs = require('fs');
const session = require('express-session')
const { type } = require('os')
const path = require('path')
const { Pool } = require('pg');
const moment = require('moment');
const { render } = require('ejs');


 
 /**
  * Config DATABASE
  */
  var pool;
  pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
      //'postgres://postgres:Wzh990823@localhost/users'
    })

const PORT = process.env.PORT || 5000

app = express()

// understand json
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

// session info
app.use(session({
    name: 'session',
    secret: 'zordon',
    resave: false,
    saveUninitialized: false,
    maxAge: 30 * 60 * 1000  // 30 minutes
}))

app.use(express.static(path.join(__dirname, 'public')))
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.get('/', (req, res) => res.render('pages/login'))




app.get('/login', (req, res) => {
    res.render('pages/login')
})


app.get('/register', (req, res) => {
    res.render('pages/register')
})

//////////////////////////

app.get('/new_session', (req, res) => {
    if (req.session.uid) {
        res.render('pages/session/create_new_session')
    }else{
        res.redirect("/");
    }
})

app.post('/addSession', (req, res) => {
    if (req.session.uid) {
        var usr = req.body;

        var UID = req.session.uid;
        var title = req.body.new_session_title;
        var access_code = req.body.new_session_access_code;
        var start_time = req.body.new_session_start_time;
        var start_time_pa = Date.parse(start_time);
        
        var addSession = `INSERT INTO sessions (UID, Title,access_code,Session_type, Start_time) VALUES ('${UID}','${title}','${access_code}','wait', to_timestamp(${start_time_pa} / 1000.0))`;
        pool.query(addSession, (error,results)=>{
            if (error){
                res.end(error);
            }
            res.redirect('/list');
        })
    }
    else {
        res.redirect("/");
    }
})

app.get('/list', (req,res) => {
    if(req.session.uid){
        var UID = req.session.uid;
        pool.query('SELECT * From sessions where UID = $1', [UID], (error, results) =>{
        if(error){
            res.end(error);
        }
        var result = { 'rows': results.rows }
        for(let i = 0; i <results.rows.length; i++ ){
            var momentObj = moment(result.rows[i]['start_time']);
            var momentString = momentObj.format('MMMM Do YYYY, h:mm:ss a');
            result.rows[i]['start_time'] = momentString;
        }
        res.render('pages/session/list_session', result)
    })
    }
    else{
        res.redirect('/');
    }
    
}) 

app.get('/go_to_session_page/:id', (req,res)=>{
    if(req.session.uid){
        var sessionID = parseInt(req.params.id);
        //console.log(sessionID)
        pool.query('SELECT * From sessions where session_id = $1', [sessionID], (error, results) =>{
            if(error){
                res.end(error);
            }
            if(req.session.uid == results.rows[0]['uid']){
                var result = {'rows':results.rows};
                if(results.rows[0]['session_type'] == 'wait'){
                    for(let i = 0; i <results.rows.length; i++ ){
                        var momentObj = moment(result.rows[i]['start_time']);
                        var momentString = momentObj.format('MMMM Do YYYY, h:mm:ss a');
                        result.rows[i]['start_time'] = momentString;
                    }
                    res.render('pages/session/speaker_waiting_session',result);
                }///
                else if(results.rows[0]['session_type'] == 'live'){
                    for(let i = 0; i <results.rows.length; i++ ){
                        var momentObj = moment(result.rows[i]['start_time']);
                        var momentString = momentObj.format('MMMM Do YYYY, h:mm:ss a');
                        result.rows[i]['start_time'] = momentString;
                    }
                    res.render('pages/session/live_session',result);
                }
                else{
                    if(results.rows[0]['video_state'] == 'VIDEO_EXIST'){
                        res.redirect(`/session_replay/${sessionID}?`)
                    }
                    else{
                        res.redirect(`/session_upload/${sessionID}?`)
                    }
                }


                //     var session_notes;
                //     const session_video_url = results.rows[0]['video_url'];
                //     const session_start_time = results.rows[0]['start_time'];
                //     if(results.rows[0]['video_state'] == 'VIDEO_EXIST'){
                //         if (req.session.type == "admin" || req.session.type == "superadmin") {
                //             var getCommentQuery = 'Select * from  session_comment';
                //         }
                //         else {
                //             var getCommentQuery = `Select * from  session_comment WHERE uid = '${req.session.uid}'`;
                //         }
                //         pool.query(getCommentQuery, (error, session_page_note) => {
                //             session_notes = session_page_note;
                //             var page_data={session_video_url, session_notes,session_start_time}



                //             if (error)
                //                 res.end(error);
                //             var session_page_note = { 'rows': session_page_note.rows }
                //             if(session_page_note.rows.length > 0){
                //                 for(let i = 0; i <results.rows.length; i++ ){
                //                     var momentObj = moment(session_page_note.rows[i]['ts']);
                //                     var momentString = momentObj.format('MMMM Do YYYY, h:mm:ss a');
                //                     result.rows[i]['ts'] = momentString;
                //                 }
                               
                //             }
                //             req.session.session_id = sessionID;
                //             res.render('pages/session_replay.ejs', page_data);
                //         })

                //         console.log(results.rows[0]['video_url'])
                //         // const video_url = results.rows[0]['video_url']
                //         // const page_data = {result,video_url}

                //         // res.render('pages/session_replay.ejs', session_page_note);
                        
                        
                        
                //         /////////////////////////////////////
                //     }else{
                //         // res.redirect(`/session_upload/${sessionID}?`);
                //         res.redirect('/')
                //     }
                // }
                // //else{
                // ///check live   
                // //}
            }
            else{
                res.redirect('/home');
            }
        })
    }
    else{
        res.redirect("/");
    }
});

app.get('/cancel_session/:id', (req, res)=>{
    if(req.session.uid){
        var sessionID = parseInt(req.params.id);
        pool.query('DELETE From sessions where session_id = $1', [sessionID], (error, results) =>{
            if(error){
                res.end(error);
            }
            pool.query(`DELETE FROM session_comment WHERE session_id=$1`, [sessionID], function (error, result) {
                if (error) {
                    res.send(error);
                }
                res.redirect('/list');
            })
        });
    }
    else{
        res.redirect("/");
    }
});

app.post('/go_to_session/:id', (req,res)=>{
    if(req.session.uid){
        var sessionID = parseInt(req.params.id);
            pool.query('SELECT * From sessions where session_id = $1', [sessionID], (error, results) =>{
                if(error){
                    res.end(error);
                }
                var result = {'rows':results.rows};
                pool.query('SELECT NOW()', (error_2, results_2) =>{
                    if(error_2){
                        res.end(error_2);
                    }
                    //current time >= start time
                    if(results_2.rows[0]['now'] >= results.rows[0]['start_time']){
                        pool.query(`UPDATE sessions SET session_type = $1 where session_id = $2` , ['live',sessionID], (err, results1)=>{
                            if(err){
                                res.end(err);
                            }
                        })
                        for(let i = 0; i <results.rows.length; i++ ){
                            var momentObj = moment(result.rows[i]['start_time']);
                            var momentString = momentObj.format('MMMM Do YYYY, h:mm:ss a');
                            result.rows[i]['start_time'] = momentString;
                        }
                        res.render('pages/session/live_session',result);
                    }
                    else{
                        res.send("The session is not ready!")
                    }
                })
                
            })
    }
    else{
        res.redirect("/");
    }
});

app.post('/end_session/:id', (req,res)=>{
    if(req.session.uid){
        var sessionID = parseInt(req.params.id);
        pool.query(`UPDATE sessions SET session_type = $1 where session_id = $2` , ['remote',sessionID], (error, results) =>{
            if(error){
                res.end(error);
            }
            res.redirect('/list');
        })    
    }
    else{
        res.redirect("/");
    }
});

app.get('/create_account', (req, res) => {
    res.render('pages/create_account')
})

app.post('/create_account', (req, res) => {
    var usr = req.body
    pool.query('INSERT INTO usr (name, email, type, password) VALUES ($1, $2, $3, $4)',
        [usr.name, usr.email, 'user', usr.password], function (error, result) {
            if (error) {
                res.render('pages/incorrect')
            }
            res.render('pages/correct')
        })
})

app.get('/table', (req, res) => {
    if (req.session.uid) {
        if (req.session.type == "admin" || req.session.type == "superadmin") {
            pool.query('SELECT * From usr where type = $1 OR type = $2', ['user', 'admin'], (error, result) => {
                if (error) {
                    res.send(error);
                }
                var results = { 'rows': result.rows }
                res.render('pages/table', results)
            })
        }
        else {
            req.session.destroy();
            res.redirect("/");
        }
    }
    else {
        res.redirect("/");
    }

})

app.post('/delete/:id', function (req, res) {
    if (req.session.uid) {
        const uid = parseInt(req.params['id']);
        pool.query(`DELETE FROM usr WHERE uid=$1`, [uid], function (error, result) {
            if (error) {
                res.send(error);
            }
            if (req.session.uid == uid) {
                pool.query(`DELETE FROM session_comment WHERE uid=$1`, [uid], function (error, result) {
                    if (error) {
                        res.send(error);
                    }
                })
                req.session.destroy();
                res.redirect('/');
            }
            else {
                pool.query(`DELETE FROM session_comment WHERE uid=$1`, [uid], function (error, result) {
                    if (error) {
                        res.send(error);
                    }
                    res.redirect('/table');
                })
            }
        })
    }
    else {
        res.redirect('/');
    }
});

app.post('/auth', (req, res) => {
    let login_email = req.body.email;
    let login_password = req.body.password;
    if (login_email && login_password) {
        pool.query('SELECT * FROM usr WHERE email=$1 and password=$2', [login_email, login_password], (error, result) => {
            if (error) {
                res.send('error');
            }

            if (result.rows.length > 0) {
                if (result.rows[0]['type'] == "user") {
                    req.session.username = result.rows[0]['name'];
                    req.session.uid = result.rows[0]["uid"];
                    req.session.type = result.rows[0]['type'];
                    res.render('pages/home');
                }
                if (result.rows[0]['type'] == "admin" || result.rows[0]['type'] == "superadmin") {
                    req.session.username = result.rows[0]['name'];
                    req.session.uid = result.rows[0]["uid"];
                    req.session.type = result.rows[0]['type'];
                    res.redirect('/table');
                }
            }
            else {
                res.send("Incorrect Email or Password!");
            }
        })
    }
    else {
        res.send('Please enter Username and Password!');
    }
})

app.get('/view_comments', (req, res) => {
    if (req.session.uid) {
        if (req.session.type == "admin" || req.session.type == "superadmin") {
            pool.query('Select * from  session_comment', (error, results) => {
                if (error)
                    res.end(error);
                var result = { 'rows': results.rows}
                if(results.rows.length > 0){
                    for(let i = 0; i <results.rows.length; i++ ){
                        var momentObj = moment(result.rows[i]['ts']);
                        var momentString = momentObj.format('MMMM Do YYYY, h:mm:ss a');
                        result.rows[i]['ts'] = momentString;
                    }
                   
                }
                res.render('pages/table_comments', result);
            })
        }
        else {
            req.session.destroy();
            res.redirect("/");
        }
    }
    else {
        res.redirect("/");
    }
})

app.get('/add_admin', (req, res) => {
    if (req.session.uid) {
        if (req.session.type == "admin" || req.session.type == "superadmin") {
            res.render('pages/add_admin')
        }
        else {
            req.session.destroy();
            res.redirect("/");
        }
    }
    else {
        res.redirect("/");
    }
})

app.post('/create_addmin_account', (req, res) => {
    if (req.session.uid) {
        var usr = req.body
        pool.query('INSERT INTO usr (name, email, type, password) VALUES ($1, $2, $3, $4)',
            [usr.name, usr.email, 'admin', usr.password], function (error, result) {
                if (error) {
                    res.render('pages/incorrect')
                }
                res.redirect('/table');
            })
    }
    else {
        res.redirect("/");
    }
})

app.post('/delete_comment/:id', function (req, res) {
    if (req.session.uid) {
        const uid = parseInt(req.params['id']);
        pool.query(`DELETE FROM session_comment WHERE comment_id=$1`, [uid], function (error, result) {
            if (error) {
                res.send(error);
            }
            res.redirect('/view_comments');
        })
    }
    else {
        res.redirect("/");
    }

});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
})

app.get('/home', (req,res)=>{
    if(req.session.uid){
        delete req.session.session_id;
        delete req.session.session_type;
        res.render('pages/home');

    }
    else{
        res.redirect('/');
    }
});

// app.get('/video', (req, res) => {
//     //if user login and session exist load the page
//     if (req.session.uid) {
//         if (req.session.type == "admin" || req.session.type == "superadmin") {
//             var getCommentQuery = 'Select * from  session_comment';
//         }
//         else {
//             var getCommentQuery = `Select * from  session_comment WHERE uid = '${req.session.uid}'`;
//         }
//         pool.query(getCommentQuery, (error, results) => {
//             if (error)
//                 res.end(error);
//             var result = { 'rows': results.rows }
//             if(results.rows.length > 0){
//                 for(let i = 0; i <results.rows.length; i++ ){
//                     var momentObj = moment(result.rows[i]['ts']);
//                     var momentString = momentObj.format('MMMM Do YYYY, h:mm:ss a');
//                     result.rows[i]['ts'] = momentString;
//                 }
               
//             }
//             res.render('pages/video.ejs', result);
//         })
//     }
//     //if user not login, rediect to the main page
//     else {
//         res.redirect("/");
//     }
// })

/**
 * Admin user can ude this get directly jump to the session_video page they want
 * noneAdmin user must match req.session.session_id and request session id
 * 
 */


app.post('/session_note', (req, res) => {
    if (req.session.uid) {
        let login_sessionID = req.body.session;
        let login_access_code = req.body.access_code;
        if (login_sessionID && login_access_code) {
            pool.query('SELECT * FROM sessions WHERE session_id=$1 and access_code=$2', [login_sessionID, login_access_code], (error, results) => {
                if (error) {
                    res.end(error);
                }
                
                if (results.rows.length > 0) {
                    if (results.rows[0]['session_type'] == "live") {
                        // pool.query('SELECT NOW()', (error_2, results_2) =>{
                        //     if(error_2){
                        //         res.end(error_2);
                            // }
                            //current time >= start time\
                            req.session.session_id = login_sessionID;
                            req.session.session_type = results.rows[0]['session_type'];
                            // req.session.access_code = login_access_code;
                            res.redirect('/notes'); 
                        //})
                    }
                    else if(results.rows[0]['session_type'] == "wait"){
                        res.send('Please wait the session start!')
                    }
                    else{
                        res.redirect('/home');
                    }
                }
                else {
                    res.send("Incorrect session ID or Password!");
                }
            })
    }
    else {
        res.send('Please enter Session ID and Password!');
    }
    }
else {
    res.redirect("/");
}
})

app.get('/notes', (req,res)=>{
    if (req.session.uid ) {
        if(req.session.session_id && req.session.session_type == 'live')
        {
            pool.query(`Select * from  session_comment WHERE session_id = '${req.session.session_id}' and uid = '${req.session.uid}'`, (error2, results_2) => {
                if(error2){
                    res.end(error2);
                }
                var result = { 'rows': results_2.rows};
                if(results_2.rows.length > 0){
                    for(let i = 0; i <results_2.rows.length; i++ ){
                        var momentObj = moment(results_2.rows[i]['ts']);
                        var momentString = momentObj.format('MMMM Do YYYY, h:mm:ss a');
                        results_2.rows[i]['ts'] = momentString;
                    }
                }
                res.render('pages/notes', result);
            })
        }
        else{
            delete req.session.session_id;
            delete req.session.session_type;
            res.redirect("/home");
        }    
    }
    else{
        res.redirect("/");
    }
});

app.post('/addComment',(req,res)=>{
    if(req.session.uid){
        //console.log("post: Add Comment");
        var uid = req.session.uid;
        var name = req.session.username;
        var sessionID = req.session.session_id;
        var comment = req.body.new_comment_comment;
        var addComment = `INSERT INTO session_comment (session_id, name, uid, comment) VALUES ('${sessionID}','${name}','${uid}','${comment}')`;
        pool.query(addComment, (error,results)=>{
            if (error){
                res.end(error);
            }
            res.redirect('/notes');
        })   
    }
    else{
        res.redirect("/");
    } 
})

app.post('/review_session_note', (req, res) => {
    if (req.session.uid) {
        let login_sessionID = req.body.session;
        let login_access_code = req.body.access_code;
        if (login_sessionID && login_access_code) {
            pool.query('SELECT * FROM sessions WHERE session_id=$1 and access_code=$2', [login_sessionID, login_access_code], (error, results) => {
                if (error) {
                    res.end(error);
                }
                
                if (results.rows.length > 0) {
                    if (results.rows[0]['session_type'] == "remote") {
                        // pool.query('SELECT NOW()', (error_2, results_2) =>{
                        //     if(error_2){
                        //         res.end(error_2);
                        //     }
                            //current time >= start time\
                            req.session.session_id = login_sessionID;
                            req.session.session_type = results.rows[0]['session_type'];
                            // req.session.access_code = login_access_code;
                            res.redirect('/review_notes'); 
                        // })
                    }
                    else{
                        res.redirect('/home');
                    }
                }
                else {
                    res.send("Incorrect session ID or Password!");
                }
            })
    }
    else {
        res.send('Please enter Session ID and Password!');
    }
    }
else {
    res.redirect("/");
}
})


// app.post('/addReviewComment',(req,res)=>{
//     if(req.session.uid){
//         //console.log("post: Add Comment");
//         var uid = req.session.uid;
//         var name = req.session.username;
//         var sessionID = req.session.session_id;
//         var comment = req.body.new_comment_comment;
//         var addComment = `INSERT INTO session_comment (session_id, name, uid, comment) VALUES ('${sessionID}','${name}','${uid}','${comment}')`;
//         pool.query(addComment, (error,results)=>{
//             if (error){
//                 res.end(error);
//             }
//             res.redirect(`/session_replay/${sessionID}?`);
//         })   
//     }
//     else{
//         res.redirect("/");
//     } 
// })

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
        //var test = `insert into sessions (Start_time) values (to_timestamp(${Date.now()} / 1000.0))`

        