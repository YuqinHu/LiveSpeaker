const express = require('express')
const session = require('express-session')
const { type } = require('os')
const path = require('path')
const { Pool } = require('pg');

var pool;
pool = new Pool({
    connectionString: 'postgres://postgres:Hyq2033221722a@localhost/users',
    // ssl: {
    //     rejectUnauthorized: false
    // }
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
                    res.redirect('/home.html');
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
            pool.query('Select * from  session_comment', (error, result) => {
                if (error)
                    res.end(error);
                var result = { 'rows': result.rows }
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

app.get('/video', (req, res) => {
    //if user login and session exist load the page
    if (req.session.uid) {
        if (req.session.type == "admin" || req.session.type == "superadmin") {
            var getCommentQuery = 'Select * from  session_comment';
        }
        else {
            var getCommentQuery = `Select * from  session_comment WHERE uid = '${req.session.uid}'`;
        }
        pool.query(getCommentQuery, (error, result) => {
            if (error)
                res.end(error);
            var result = { 'rows': result.rows }
            res.render('pages/video', result);
        })
    }
    //if user not login, rediect to the main page
    else {
        res.redirect("/");
    }
})

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
})

app.post('/addComment', (req, res) => {
    if (req.session.uid) {
        //console.log("post: Add Comment");
        var uid = req.session.uid;
        var name = req.session.username;
        var comment = req.body.new_comment_comment;

        //https://usefulangle.com/post/187/nodejs-get-date-time
        let date_ob = new Date();
        let timestamp = Date.now();

        // current date
        // adjust 0 before single digit date
        let date = ("0" + date_ob.getDate()).slice(-2);

        // current month
        let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);

        // current year
        let year = date_ob.getFullYear();

        // current hours
        let hours = date_ob.getHours();

        // current minutes
        let minutes = date_ob.getMinutes();

        // current seconds
        let seconds = date_ob.getSeconds();


        //console.log(timestamp);

        var addComment = `INSERT INTO session_comment (name, uid, year, month, date, hours, minutes, seconds, comment) VALUES ('${name}','${uid}','${year}','${month}','${date}','${hours}','${minutes}','${seconds}','${comment}')`;

        pool.query(addComment, (error, results) => {
            if (error) {
                res.end(error);
            }
            else {
                res.redirect("/video");
            }
        })
    }
    else {
        res.redirect("/");
    }

})

app.listen(PORT, () => console.log(`Listening on ${PORT}`))
