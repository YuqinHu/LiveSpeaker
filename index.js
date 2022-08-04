//ver i3 t2 b
var cors = require('cors')
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
 * Config OSS (AWS S3)
 */
const BUCKET_REGION = process.env.BUCKET_REGION;
const OSS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const OSS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const S3_BUCKET = process.env.S3_BUCKET;
const OSS_ENDPOINT = process.env.OSS_ENDPOINT;

aws.config.update({
    region: BUCKET_REGION,
    accessKeyId: OSS_KEY_ID,
    secretAccessKey: OSS_KEY
});

/**
 * Config DATABASE
 */
var pool;
pool = new Pool({
    //connectionString: 'postgres://postgres:Wzh990823@localhost/users'
    connectionString: process.env.DATABASE_URL,
    ssl:{
        rejectUnauthorized: false
    }

})

const PORT = process.env.PORT || 5000

app = express()

// understand json
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use("/", cors());
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


////////////////////////////////////////////////
//////////////UPLOAD FILE AND VIDEO/////////////
////////////////////////////////////////////////

/**
 * Function relate to OSS (AWS S3)
 */
//OSS GET
app.get('/oss/sign-s3', (req, res) => {
    if (req.session.uid) {
        const s3 = new aws.S3();
        const fileName = req.query['file-name'];
        const fileType = req.query['file-type'];
        const s3Params = {
            Bucket: S3_BUCKET,
            Key: fileName,
            Expires: 60,
            ContentType: fileType,
            ACL: 'public-read'
        };

        s3.getSignedUrl('putObject', s3Params, (err, data) => {
            if (err) {

                return res.end();
            }
            const returnData = {
                signedRequest: data,
                url: `https://${S3_BUCKET}.${OSS_ENDPOINT}/${fileName}`
            };
            res.write(JSON.stringify(returnData));
            res.end();
        });
    }
});

//OSS (AWS S3) STANDARD UPLOAD
app.get('/oss/uploader/sign', async (req, res) => {
    if (req.session.uid) {
        const s3 = new aws.S3();
        const { key, type } = req.query;
        const url = s3.getSignedUrl('putObject', {
            Bucket: S3_BUCKET,
            Key: key,
            Expires: 3600,
            ContentType: type,
        });
        res.send({ url });
    }
});

//OSS (AWS S3) SESSION VIDEO UPLOADER
app.get('/oss/uploader/session_video/sign', async (req, res) => {
    if (req.session.uid) {
        const random = [...Array(30)].map(() => Math.random().toString(36)[2]).join('');
        const s3 = new aws.S3();
        const { key, type, vid } = req.query;
        const video_key = `session_video/session${vid}/uid${req.session.uid}/${random}/${key}`;

        //add video URL and OSS PATH to database
        var addvideo =
            `UPDATE sessions 
        SET video_path = 'session_video/session${vid}/uid${req.session.uid}/${random}/${key}',
        video_url = 'https://${S3_BUCKET}.${OSS_ENDPOINT}/session_video/session${vid}/uid${req.session.uid}/${random}/${key}' 
        where session_id = ${vid}`;
        pool.query(addvideo, (error, results) => {
            if (error) {
                res.end(error);
            }
        })

        //get an upload url and send to client
        const url = s3.getSignedUrl('putObject', {
            Bucket: S3_BUCKET,
            Key: video_key,
            Expires: 3600,
            ContentType: type,
        });
        res.send({ url });
    }
});

//OSS (AWS S3) SESSION ATTACHMENT FILE UPLOADER
app.get('/oss/uploader/session_attachment/sign', async (req, res) => {
    if (req.session.uid) {
        const random = [...Array(30)].map(() => Math.random().toString(36)[2]).join('');
        const s3 = new aws.S3();
        const { key, type } = req.query;
        const attachment_key = `session_attachment/uid${req.session.uid}/${random}/${key}`;
        const file_path = `session_attachment/uid${req.session.uid}/${random}/${key}`;
        const file_url = `https://${S3_BUCKET}.${OSS_ENDPOINT}/session_attachment/uid${req.session.uid}/${random}/${key}`

        req.session.file_path = file_path;
        req.session.file_url = file_url;
        req.session.file_state = "EMPTY";

        //get an upload url and send to client
        const url = s3.getSignedUrl('putObject', {
            Bucket: S3_BUCKET,
            Key: attachment_key,
            Expires: 3600,
            ContentType: type,
        });
        res.send({ url });
    }
});

//get a login info (for get_session_info.js)
app.get('/get_login_info', (req, res) => {
    res.send(req.session);
});
 
//get attachment info
app.get('/get_attachment_info/:id', (req, res) => {
    if (req.session.uid) {
        var sessionID = parseInt(req.params.id);
        var file_path;
        var file_url;
        var file_state

        pool.query('SELECT * From sessions where session_id = $1', [sessionID], (error, result) => {
            if (error) {
                res.end(error);
            }
            file_path = result.rows[0]['file_path'];
            file_url = result.rows[0]['file_url'];
            file_state = result.rows[0]['file_state'];
            const attachment_info = {file_state, file_path, file_url} 
            res.send(attachment_info);
        })    

    }else{
    res.end();
    }
});

//get current attachment info
app.get('/get_current_attachment_info', (req, res) => {
    if (req.session.uid) {
        var sessionID = req.session.session_id
        var file_path;
        var file_url;
        var file_state

        pool.query('SELECT * From sessions where session_id = $1', [sessionID], (error, result) => {
            if (error) {
                res.end(error);
            }
            file_path = result.rows[0]['file_path'];
            file_url = result.rows[0]['file_url'];
            file_state = result.rows[0]['file_state'];
            const attachment_info = {file_state, file_path, file_url} 
            res.send(attachment_info);
        })    

    }else{
    res.end();
    }
});

//set video as uploaded
app.post('/UPLOADER/mark_upload', (req, res) => {
    if (req.session.uid) {
        var sessionID = req.body.session_id;
        let marked = `UPDATE sessions SET video_state = 'VIDEO_EXIST' where session_id = ${sessionID}`;
        pool.query(marked, (error, results) => {
            if (error) {
                res.end(error);
            }
        })
        res.end();
    } res.end();
})

//set attachment as uploaded
app.post('/UPLOADER/mark_attachment_upload', (req, res) => {
    if (req.session.uid) {
        req.session.file_state = "EXIST";
        res.end();
    } res.end();
})


//GET video upload page
app.get('/session_upload/:id', (req, res) => {
    if (req.session.uid) {
        var sessionID = parseInt(req.params.id);
        pool.query('SELECT * From sessions where session_id = $1', [sessionID], (error, results) => {
            if (error) {
                res.end(error);
            }
            var result = { 'rows': results.rows };
            res.render('pages/upload/upload.ejs', result);
        })
    }
    else {
        res.redirect("/");
    }
});


////////////////////////////////////////////////
//////////////LOGIN AND REGISTER////////////////
////////////////////////////////////////////////

app.get('/login', (req, res) => {
    res.render('pages/login')
})


app.get('/register', (req, res) => {
    res.render('pages/register')
})


app.get('/create_account', (req,res)=>{
    res.render('pages/register')
})

app.post('/create_account', async (req, res) => {
    var usr = req.body
    pool.query('SELECT * FROM usr where email = $1',[usr.email], (err, result1)=>{
        if(err){
            res.end(err);
        }
        if(result1.rows.length == 0){
            pool.query('INSERT INTO usr (name, email, type, password) VALUES ($1, $2, $3, $4)',
            [usr.name, usr.email, 'user', usr.password], function (error, result) {
                if (error) {
                    res.render('pages/incorrect')
                }
                res.render('pages/correct')
        })
        }
        else{
            res.render('pages/incorrect_email.ejs')
        }
    })
    
})

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
                    req.session.email = result.rows[0]['email'];
                    req.session.uid = result.rows[0]["uid"];
                    req.session.type = result.rows[0]['type'];
                    res.render('pages/home');
                }
                if (result.rows[0]['type'] == "admin" || result.rows[0]['type'] == "superadmin") {
                    // req.session.username = result.rows[0]['name'];
                    // req.session.uid = result.rows[0]["uid"];
                    // req.session.type = result.rows[0]['type'];
                    // res.redirect('/table');
                    req.session.email = result.rows[0]['email'];
                    req.session.username = result.rows[0]['name'];
                    req.session.uid = result.rows[0]["uid"];
                    req.session.type = result.rows[0]['type'];
                    res.render('pages/home');
                }
            }
            else {
                res.render('pages/incorrect_email.ejs');
                // res.send("Incorrect Email or Password!");
            }
        })
    }
    else {
        res.render('pages/no_email_or_pass.ejs');
        // res.send('Please enter Username and Password!');
    }
})



////////////////////////////////////////////////
//////////////ADMIN PAGE FUNCTION///////////////
////////////////////////////////////////////////


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
                    pool.query(`DELETE FROM share_comment WHERE to_uid=$1`, [uid], function (error2, result2) {
                        if(error2){
                            res.end(error2);
                        }
                    })
                    pool.query(`DELETE FROM friend WHERE uid=$1 OR friend_id = $1`, [uid], function (error3, result2) {
                        if(error3){
                            res.end(error3);
                        }
                    })
                })
                req.session.destroy();
                res.redirect('/');
            }
            else {
                pool.query(`DELETE FROM session_comment WHERE uid=$1`, [uid], function (error, result) {
                    if (error) {
                        res.send(error);
                    }
                    pool.query(`DELETE FROM share_comment WHERE to_uid=$1`, [uid], function (error2, result2) {
                        if(error2){
                            res.end(error2);
                        }
                        
                    })
                    pool.query(`DELETE FROM friend WHERE uid=$1 OR friend_id = $1`, [uid], function (error3, result2) {
                        if(error3){
                            res.end(error3);
                        }
                    })
                    res.redirect('/table');
                })
            }
        })
    }
    else {
        res.redirect('/');
    }
});



app.get('/view_comments', (req, res) => {
    if (req.session.uid) {
        if (req.session.type == "admin" || req.session.type == "superadmin") {
            pool.query('Select * from  session_comment', (error, results) => {
                if (error)
                    res.end(error);
                var result = { 'rows': results.rows }
                if (results.rows.length > 0) {
                    for (let i = 0; i < results.rows.length; i++) {
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

app.get('/admin_add_user', (req, res) => {
    if (req.session.uid) {
        if (req.session.type == "admin" || req.session.type == "superadmin") {
            res.render('pages/admin_add_user.ejs')
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

app.post('/create_user_account', (req, res) => {
    if (req.session.uid) {
        var usr = req.body
        pool.query('INSERT INTO usr (name, email, type, password) VALUES ($1, $2, $3, $4)',
            [usr.name, usr.email, 'user', usr.password], function (error, result) {
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
            pool.query(`DELETE FROM share_comment WHERE comment_id=$1`, [uid], function (error2, result2) {
                if(error2){
                    res.end(error2);
                }
                res.redirect('/view_comments');
            })
        })
    }
    else {
        res.redirect("/");
    }

});


////////////////////////////////////////////////
//////////////CREATE LIVE SESSION FUNCTION//////
////////////////////////////////////////////////


app.get('/new_session', (req, res) => {
    if (req.session.uid) {
        res.render('pages/session/create_new_session')
    } else {
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

        var file_path = "/error/cannot_get_attachment.html";
        var file_url = "/error/cannot_get_attachment.html";
        var file_state = "EMPTY";

        if(req.session.file_path){file_path = req.session.file_path}
        if(req.session.file_url){file_url = req.session.file_url}
        if(req.session.file_state){file_state = req.session.file_state}


        var addSession = 
        `INSERT INTO sessions (UID, Title,access_code,Session_type, file_path, file_url, file_state,Start_time) 
        VALUES ('${UID}','${title}','${access_code}','wait', '${file_path}', '${file_url}', '${file_state}',to_timestamp(${start_time_pa} / 1000.0)) RETURNING session_id`;


        if(req.session.file_path){delete req.session.file_path}
        if(req.session.file_url){delete req.session.file_url}
        if(req.session.file_state){delete req.session.file_state}



        pool.query(addSession, (error, results) => {
            if (error) {
                res.end(error);
            }
            session_id = results.rows[0]['session_id'];

            res.redirect('/list');
        })
    }
    else {
        res.redirect("/");
    }
}) 

app.get('/list', (req, res) => {
    if (req.session.uid) {
        var UID = req.session.uid;
        pool.query('SELECT * From sessions where UID = $1', [UID], (error, results) => {
            if (error) {
                res.end(error);
            }
            var result = { 'rows': results.rows }
            for (let i = 0; i < results.rows.length; i++) {
                var momentObj = moment(result.rows[i]['start_time']);
                var momentString = momentObj.format('MMMM Do YYYY, h:mm:ss a');
                result.rows[i]['start_time'] = momentString;
            }
            res.render('pages/session/list_session', result)
        })
    }
    else {
        res.redirect('/');
    }

})

app.get('/go_to_session_page/:id', (req, res) => {
    if (req.session.uid) {
        var sessionID = parseInt(req.params.id);

        pool.query('SELECT * From sessions where session_id = $1', [sessionID], (error, results) => {
            if (error) {
                res.end(error);
            }
            if (req.session.uid == results.rows[0]['uid']) {
                var result = { 'rows': results.rows };
                if (results.rows[0]['session_type'] == 'wait') {
                    for (let i = 0; i < results.rows.length; i++) {
                        var momentObj = moment(result.rows[i]['start_time']);
                        var momentString = momentObj.format('MMMM Do YYYY, h:mm:ss a');
                        result.rows[i]['start_time'] = momentString;
                    }
                    res.render('pages/session/speaker_waiting_session', result);
                }///
                else if (results.rows[0]['session_type'] == 'live') {
                    for (let i = 0; i < results.rows.length; i++) {
                        var momentObj = moment(result.rows[i]['start_time']);
                        var momentString = momentObj.format('MMMM Do YYYY, h:mm:ss a');
                        result.rows[i]['start_time'] = momentString;
                    }
                    res.render('pages/session/live_session', result);
                }
                else {
                    if (results.rows[0]['video_state'] == 'VIDEO_EXIST') {
                        res.redirect(`/session_replay/${sessionID}?`)
                    }
                    else {
                        res.redirect(`/session_upload/${sessionID}?`)
                    }
                }
            }
            else {
                res.redirect('/home');
            }
        })
    }
    else {
        res.redirect("/");
    }
});

app.get('/cancel_session/:id', (req, res) => {
    if (req.session.uid) {
        var sessionID = parseInt(req.params.id);
        pool.query('DELETE From sessions where session_id = $1', [sessionID], (error, results) => {
            if (error) {
                res.end(error);
            }
            pool.query(`DELETE FROM session_comment WHERE session_id=$1`, [sessionID], function (error, result) {
                if (error) {
                    res.send(error);
                }
                pool.query(`DELETE FROM share_comment WHERE session_uid=$1`, [sessionID], function (error2, result2) {
                    if(error2){
                        res.end(error2);
                    }
                    res.redirect('/list');
                })
            })
            
        });
    }
    else {
        res.redirect("/");
    }
});

app.post('/go_to_session/:id', (req, res) => {
    if (req.session.uid) {
        var sessionID = parseInt(req.params.id);
        pool.query('SELECT * From sessions where session_id = $1', [sessionID], (error, results) => {
            if (error) {
                res.end(error);
            }
            var result = { 'rows': results.rows };
            pool.query('SELECT NOW()', (error_2, results_2) => {
                if (error_2) {
                    res.end(error_2);
                }
                //current time >= start time
                if (results_2.rows[0]['now'] >= results.rows[0]['start_time']) {
                    pool.query(`UPDATE sessions SET session_type = $1 where session_id = $2`, ['live', sessionID], (err, results1) => {
                        if (err) {
                            res.end(err);
                        }
                    })
                    for (let i = 0; i < results.rows.length; i++) {
                        var momentObj = moment(result.rows[i]['start_time']);
                        var momentString = momentObj.format('MMMM Do YYYY, h:mm:ss a');
                        result.rows[i]['start_time'] = momentString;
                    }
                    res.render('pages/session/live_session', result);
                }
                else {
                    res.redirect('/session_not_ready');

                    // res.send("The session is not ready!")
                }
            })

        })
    }
    else {
        res.redirect("/");
    }
});

app.post('/end_session/:id', (req, res) => {
    if (req.session.uid) {
        var sessionID = parseInt(req.params.id);
        pool.query(`UPDATE sessions SET session_type = $1 where session_id = $2`, ['remote', sessionID], (error, results) => {
            if (error) {
                res.end(error);
            }
            res.redirect('/list');
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

app.get('/home', (req, res) => {
    if (req.session.uid) {
        delete req.session.session_id;
        delete req.session.session_type;
        res.render('pages/home');

    }
    else {
        res.redirect('/');
    }
});

app.get('/session_replay/:id', (req, res) => {
    if (req.session.uid) {
        var sessionID = parseInt(req.params.id);
        var session_que = `SELECT * From sessions where session_id = '${sessionID}'`

        pool.query(session_que, (error, results) => {
            if (error) {
                res.end(error);
            }
            var result = { 'rows': results.rows };
            if (results.rows[0]['session_type'] == 'wait' || results.rows[0]['session_type'] == 'live') {
                res.end();
            }
            else {
                const session_video_url = results.rows[0]['video_url'];
                if (results.rows[0]['video_state'] == 'VIDEO_EXIST') {
                    var page_data = {session_video_url}
                    req.session.session_id = sessionID;
                    res.render('pages/session_replay.ejs', page_data);

                } else {
                    res.redirect("/error/session_cannot_replay.html")

                }
            }
        })
    }
    else {
        res.redirect("/");
    }
});


////////////////////////////////////////////////
//////////////JOIN lIVE SESSION FUNCTON/////////
////////////////////////////////////////////////


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
                        req.session.session_id = login_sessionID;
                        req.session.session_type = results.rows[0]['session_type'];
                        res.redirect('/notes');

                    }
                    else if (results.rows[0]['session_type'] == "wait") {
                        res.render('/error/session_not_start.ejs');
                        // res.send('Please wait the session start!')
                    }
                    else {
                        res.redirect('/session_not_ready');
                    }
                }
                else {
                    res.redirect('/incorret_sid_pd');
                }
            })
        }
        else {
            res.render('/incorret_sid_pd');
            // res.send('Please enter Session ID and Password!');
        }
    }
    else {
        res.redirect("/");
    }
})

app.get('/notes', (req, res) => {
    if (req.session.uid) {
        if (req.session.session_id && req.session.session_type == 'live') {
            pool.query(`Select * from  session_comment WHERE session_id = '${req.session.session_id}' and uid = '${req.session.uid}'`, (error2, results_2) => {
                if (error2) {
                    res.end(error2);
                }
                var result = { 'rows': results_2.rows };
                if (results_2.rows.length > 0) {
                    for (let i = 0; i < results_2.rows.length; i++) {
                        var momentObj = moment(results_2.rows[i]['ts']);
                        var momentString = momentObj.format('MMMM Do YYYY, h:mm:ss a');
                        results_2.rows[i]['ts'] = momentString;
                    }
                }
                res.render('pages/notes', result);
            })
        }
        else {
            delete req.session.session_id;
            delete req.session.session_type;
            res.redirect("/home");
        }
    }
    else {
        res.redirect("/");
    }
});

app.post('/addComment', (req, res) => {
    if (req.session.uid) {
        var uid = req.session.uid;
        var name = req.session.username;
        var sessionID = req.session.session_id;
        var comment = req.body.new_comment_comment;
        var addComment = `INSERT INTO session_comment (session_id, name, uid, comment) VALUES ('${sessionID}','${name}','${uid}','${comment}')`;
        pool.query(addComment, (error, results) => {
            if (error) {
                res.end(error);
            }
            res.redirect('/notes');
        })
    }
    else {
        res.redirect("/");
    }
})

app.post('/delete_comment_live/:id', function (req, res) {
    if (req.session.uid) {
        const uid = parseInt(req.params['id']);
        pool.query(`DELETE FROM session_comment WHERE comment_id=$1`, [uid], function (error, result) {
            if (error) {
                res.send(error);
            }
            res.redirect('/notes');
        })
    }
    else {
        res.redirect("/");
    }
});

////////////////////////////////////////////////
//////////////VIEW REMOTE SESSION FUNCTON///////
////////////////////////////////////////////////

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
                        if (results.rows[0]['uid'] == req.session.uid) {
                            req.session.session_id = login_sessionID;
                            req.session.session_type = results.rows[0]['session_type'];
                            res.redirect(`/session_replay/${req.session.session_id}?`)
                        }
                        else {
                            req.session.session_id = login_sessionID;
                            req.session.session_type = results.rows[0]['session_type'];
                            res.redirect('/review_notes');
                        }
                     
                    }
                    else {
                        res.redirect('/session_not_ready');
                    }
                }
                else {
                    res.redirect("/incorret_sid_pd");
                }
            })
        }
        else {
            res.render('/incorret_sid_pd');
            // res.send('Please enter Session ID and Password!');
        }
    }
    else {
        res.redirect("/");
    }
});


app.get('/review_notes', (req, res) => {
    
    if (req.session.uid) {
        if (req.session.session_id && req.session.session_type == "remote") {
            pool.query(`SELECT * from session_comment where session_id = '${req.session.session_id}' AND uid = '${req.session.uid}'`, async (error_1, results_1) => {
                if (error_1) {
                    res.end(error_1);
                }
                var user_share_comments = `SELECT * FROM share_comment WHERE to_email = '${req.session.email}' AND session_uid = '${req.session.session_id}'`
                pool.query(user_share_comments, (error3, results_2) => {
                    if (error3) {
                        res.end(error3);
                    }
                    if (results_1.rows.length > 0 && results_2.rows.length > 0) {
                   
                        var user_review_note_query = `SELECT  s_session_id, s_title,s_access_code, s_session_type, s_uid,c_comment_id, c_name, 
                        c_uid, c_comment, c_ts,s_start_time, s_video_url ,  s_video_state, diff, TO_CHAR(diff,'HH24:MI:SS') as diff_string
                        from
                        (select 
                        s.session_id as s_session_id, s.title as s_title,s.access_code as s_access_code, s.session_type as s_session_type, s.uid as s_uid, c.comment_id as c_comment_id, c.name as c_name, 
                        c.uid as c_uid, c.comment as c_comment, c.ts as c_ts,s.start_time as s_start_time, s.video_url as s_video_url , s.video_state as s_video_state,
                        c.ts - s.start_time as diff
                        from sessions s join session_comment c 
                        on s.session_id = '${req.session.session_id}' AND s.session_id = c.session_id) as a where c_uid = '${req.session.uid}'`;
                        
                                pool.query(user_review_note_query, (error2, results) => {
                                    if (error2) {
                                        res.end(error2);
                                    }
                                    var session_notes = {
                                        'rows': results.rows,
                                        'share_rows': results_2 ? (results_2.rows || []) : [],
                                    };
                                    
                                    var session_video_url = results.rows[0]['s_video_url'];
                                    var page_data = { session_video_url, session_notes }
                                    res.render('pages/user_session_replay.ejs', page_data);
                                })
                        
                    }
                    else if( results_1.rows.length > 0 && results_2.rows.length == 0){
                
                        var user_review_note_query = `SELECT  s_session_id, s_title,s_access_code, s_session_type, s_uid,c_comment_id, c_name, 
                        c_uid, c_comment, c_ts,s_start_time, s_video_url ,  s_video_state, diff, TO_CHAR(diff,'HH24:MI:SS') as diff_string
                        from
                        (select 
                        s.session_id as s_session_id, s.title as s_title,s.access_code as s_access_code, s.session_type as s_session_type, s.uid as s_uid, c.comment_id as c_comment_id, c.name as c_name, 
                        c.uid as c_uid, c.comment as c_comment, c.ts as c_ts,s.start_time as s_start_time, s.video_url as s_video_url , s.video_state as s_video_state,
                        c.ts - s.start_time as diff
                        from sessions s join session_comment c 
                        on s.session_id = '${req.session.session_id}' AND s.session_id = c.session_id) as a where c_uid = '${req.session.uid}'`;
                        
                        pool.query(user_review_note_query, (error2, results) => {
                            if (error2) {
                                res.end(error2);
                            }
                            var session_notes = {
                            'rows': results.rows,
                            'share_rows': results_2 ? (results_2.rows || []) : [],
                            };
                            var session_video_url = results.rows[0]['s_video_url'];
                            var page_data = { session_video_url, session_notes }
                            res.render('pages/user_session_replay.ejs', page_data);
                        })
                    }
                    else if ( results_1.rows.length == 0 && results_2.rows.length > 0){
                        var user_share_note_query  = `SELECT  video_url from sessions where session_id = '${req.session.session_id}'`;
                        pool.query(user_share_note_query, (error2, results) => {
                            if (error2) {
                                res.end(error2);
                            }
                            var session_notes = {
                            'rows': [],
                            'share_rows': results_2 ? (results_2.rows || []) : [],
                            };
                            var session_video_url = results.rows[0]['video_url'];
                            var page_data = { session_video_url, session_notes }
                            res.render('pages/user_session_replay.ejs', page_data);

                        })
                    }
                    else {
                        res.redirect(`/session_replay/${req.session.session_id}?`)
                    }
                })
            });

        }
        else {
            delete req.session.session_id;
            delete req.session.session_type;
            res.redirect("/home");
        }
    }
    else {
        res.redirect("/");
    }
});


app.post('/delete_comment_remote/:id', function (req, res) {
    if (req.session.uid) {
        const uid = parseInt(req.params['id']);
        pool.query(`DELETE FROM session_comment WHERE comment_id=$1`, [uid], function (error, result) {
            if (error) {
                res.send(error);
            }
            res.redirect('/review_notes');
        })
    }
    else {
        res.redirect("/");
    }
});


//add & delete friend and friendlist share notes
app.post('/sendemail', async (req, res) => {
    if (req.session.uid) {
        const to_email = req.body.to_email;
        const comment = req.body.comment;
        const comment_time = req.body.comment_time;
        const from = req.session.email;
        const session_uid = req.session.session_id;
        const q_common_id = req.body.comment_id;
        const q_from_uid = req.body.from_uid;
        var get_to_email_uid = `SELECT uid from usr WHERE email = '${to_email}'`
        pool.query(get_to_email_uid,  (err, result_1)=>{
            if(err){
                res.end(err);
            }
            if(result_1.rows.length > 0){
            const q_to_uid = result_1.rows[0]['uid']
            var sql = `INSERT INTO share_comment (from_email, to_email, comment, comment_time, session_uid, comment_id, from_uid, to_uid) VALUES ('${from}', '${to_email}', '${comment}', '${comment_time}', ${session_uid},${q_common_id}, ${q_from_uid}, ${q_to_uid})`

            pool.query(sql, (error, results) => {
                if (error) {
                    res.end(error);
                }
                res.redirect('/review_notes');
            })
        }else{
            res.redirect('/contacts_cannot_find_user')
        }
        })
    }
    else {
        res.redirect('/');
    }
})

app.post('/delete_share_note/:id', function (req, res) {
    if (req.session.uid) {
        const uid = parseInt(req.params['id']);
        pool.query(`DELETE FROM share_comment WHERE comment_id=$1`, [uid], function (error, result) {
            if (error) {
                res.send(error);
            }
            res.redirect('/review_notes');
        })
    }
    else {
        res.redirect("/");
    }
});


app.get('/friendlist', (req, res) => {
    if (req.session.uid) {
        var ID = req.session.uid;
        pool.query('SELECT * From friend where uid = $1', [ID], (error, results) => {
            if (error) {
                res.end(error);
            }
            var result = { 'rows': results.rows }

            res.render('pages/friend', result)
        })
    }
    else {
        res.redirect('/');
    }
})


app.post('/addfriend', (req, res) => {
    let email = req.body.new_contact_email;
    if (email) {
        pool.query('SELECT * FROM usr WHERE email=$1', [email], (error, result) => {
            if (error) {
                res.send('error');
            }

            if (result.rows.length > 0) {
                var id = result.rows[0]["uid"];
                var uid = req.session.uid;
                var name = result.rows[0]["name"];
                var email = result.rows[0]["email"];
                var addFriend = `INSERT INTO friend (uid, friend_id,name, email) VALUES ('${uid}','${id}','${name}','${email}')`;
                pool.query(addFriend, (error, results) => {
                    if (error) {
                        res.end(error);
                    }
                    res.redirect('/friendlist');
                })
            }
            else {
                res.redirect('/contacts_cannot_find_user');
            }
        })
    }
})

app.post('/delete_friend/:id', function (req, res) {
    if (req.session.uid) {
        const uid = parseInt(req.params['id']);
        pool.query(`DELETE FROM friend WHERE friend_id=$1`, [uid], function (error, result) {
            if (error) {
                res.send(error);
            }
            res.redirect('/friendlist');
        })
    }
    else {
        res.redirect("/");
    }
});

/////end

////ver i3 t2 b
////////////////////////////should be delete later
app.get('/sidebartest', (req, res) => {
    
    res.render('pages/sidebar_test_2.ejs');

});

app.get('/oldhome', (req, res) => {
    
    res.render('pages/home_old.ejs');
});

app.get('/hometest', (req, res) => {
    
    res.render('pages/home_test.ejs');

});

app.get('/join_live_session', (req, res) => {
    if (req.session.uid) {
        res.render('pages/join_live_session.ejs');
    }
    else {
        res.redirect("/");
    }
});



app.get('/review_session', (req, res) => {
    if (req.session.uid) {
        res.render('pages/review_session.ejs');
    }
    else {
        res.redirect("/");
    }
});

app.get('/incorret_sid_pd', (req, res) => {
    if (req.session.uid) {
        res.render('pages/error/incorret_sid_pd.ejs');
    }
    else {
        res.redirect("/");
    }
});

app.get('/session_not_ready', (req, res) => {
    if (req.session.uid) {
        res.render('pages/error/session_not_ready.ejs');
    }
    else {
        res.redirect("/");
    }
});

app.get('/contacts_cannot_find_user', (req, res) => {
    if (req.session.uid) {
        res.render('pages/error/contacts_cannot_find_user.ejs');
    }
    else {
        res.redirect("/");
    }
});

//ver i3 t2 b
app.get("/get_email_name_type",(req,res)=>{
    if (req.session.uid) {

        // const uid = req.session.uid

  
        let getENTQuery = `SELECT * FROM usr where uid = ${req.session.uid}`;
 
            pool.query(getENTQuery,(error, result)=>{
            if(error)
                res.end(error);
 

                const email = result.rows[0]["email"];
                const type = result.rows[0]["type"];
                const name = result.rows[0]["name"];
                const user_data = {email, type, name};
                res.send(user_data);


        });
    }
    else{
        res.end();
    }

});


app.listen(PORT, () => console.log(`Listening on ${PORT}`));
module.exports = app;
        //var test = `insert into sessions (Start_time) values (to_timestamp(${Date.now()} / 1000.0))`

