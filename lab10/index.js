var express = require("express");
var app = express();
var bodyParser = require('body-parser');
var session = require('express-session');
var methodOverride = require('method-override');
var bcrypt = require('bcrypt');
app.use(methodOverride('_method'));
var mysql = require('mysql');

app.use(express.static("public")); //folder for images, css, js
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
    secret: 'top secret code!',
    resave: true,
    saveUninitialized: true
}));


/* Configure MySQL DBMS */
const connection = mysql.createConnection({
    host: 'un0jueuv2mam78uv.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
    user: 'plv978x2lb5fojba',
    password: 'ekrsow448x5imx08',
    database: 'gbxlu3vil2g19bjb'
});
connection.connect();

// /* Configure MySQL DBMS */
// const connection = mysql.createConnection({
//     host: 'localhost',
//     user: 'ijabarkhel',
//     password: 'sql747@',
//     database: 'quotes_db'
// });
// connection.connect();


/* Middleware */
function isAuthenticated(req, res, next){
    if(!req.session.authenticated) res.redirect('/login');
    else next();
}

function checkUsername(username){
    let stmt = 'SELECT * FROM users WHERE username=?';
    return new Promise(function(resolve, reject){
       connection.query(stmt, [username], function(error, results){
           if(error) throw error;
           resolve(results);
       }); 
    });
}

function checkPassword(password, hash){
    return new Promise(function(resolve, reject){
       bcrypt.compare(password, hash, function(error, result){
          if(error) throw error;
          resolve(result);
       }); 
    });
}


/* Route Handlers */
app.get('/', function(req, res){
    res.render('search');
});

app.get('/name', function(req, res){
    res.render('name');
});

app.get('/quotesByName', function(req, res){
    var firstName = req.query.firstName;
    var lastName = req.query.lastName;
    var stmt = 'select * '+
                'from l9_author, l9_quotes where l9_author.authorId = l9_quotes.authorId '+
                'and firstName=\'' + firstName + '\''+
                ' and lastName=\'' + lastName + '\';';
    connection.query(stmt, function(error, found){
        if (error) throw error;
        if (found.length){
            var name = found[0].firstName + ' ' + found[0].lastName;
            res.render('quotes', {keyword: name, quotes: found, name: name});
        }
    });
});

app.get('/category', function(req, res){
    res.render('category');
});

app.get('/gender', function(req, res){
    res.render('gender');
});

app.get('/quotesByGender', function(req, res){
    var gender = req.query.gender;
    var stmt = 'select * from l9_quotes, l9_author where l9_author.authorId = l9_quotes.authorId ' +
                'and sex = \'' + gender + '\';';
                
    if(gender == 'M'){
        gender = "Male";
    }else{
        gender = "Female";
    }
    console.log(stmt);
    connection.query(stmt, function(error, found) {
        if(error) throw error;
        if (found.length) {
            console.log(found);
            res.render('quotes', {name: null, quotes: found, keyword: gender} );
        }
    });
});

app.get('/quotesByKeyword', function(req, res){
    var key = req.query.keyword;
    var stmt = 'select * from l9_quotes, l9_author where l9_author.authorId = l9_quotes.authorId ' +
                'and quote like \'%' + key + '%\';';
    console.log(stmt);
    connection.query(stmt, function(error, found) {
        if(error) throw error;
        if (found.length) {
            console.log(found);
            res.render('quotes', {name: null, quotes: found, keyword:key} );
        }
    });
    
});

app.get('/findQuotes', function(req, res){
    var keyword = req.query.byCategory;
    var stmt = 'select * from l9_quotes, l9_author where l9_author.authorId = l9_quotes.authorId ' +
                'and category=\'' + keyword + '\';';
    
    connection.query(stmt, function(error, found) {
        if(error) throw error;
        if (found.length) {
            console.log(found);
            res.render('quotes', {name: null, quotes: found, keyword:keyword} );
        }
    });
});

app.get('/quotes', function(req, res){
    res.render('quotes');
});

app.get('/keyword', function(req, res){
    res.render('keyword');
});

/* Create a new author - Get author information */
app.get('/new/author', function(req, res){
    res.render('new_author');
});

/* Create a new author - Add author into DBMS */
app.post('/new/author', function(req, res){
  connection.query('SELECT COUNT(*) FROM l9_author;', function(error, result){
      if(error) throw error;
      if(result.length){
            var authorId = result[0]['COUNT(*)'] + 1;
            var stmt = 'INSERT INTO l9_author ' +
                      '(authorId, firstName, lastName, dob, dod, sex, profession, country, biography) '+
                      'VALUES ' +
                      '(' + 
                      authorId + ',"' +
                      req.body.firstname + '","' +
                      req.body.lastname + '","' +
                      req.body.dob + '","' +
                      req.body.dod + '","' +
                      req.body.sex + '","' +
                      req.body.profession + '","' +
                      req.body.country + '","' +
                      req.body.biography + '"' +
                      ');';
            console.log(stmt);
            connection.query(stmt, function(error, result){
                if(error) throw error;
                res.redirect('/');
            })
      }
  });
});

app.get('/author', function(req, res){
    var firstName = req.query.firstName;
    var lastName = req.query.lastName;
    console.log(firstName);
    console.log(lastName);
    var stmt = 'select * '+
                'from l9_author '+
                'where firstName=\'' + firstName + '\''+
                ' and lastName=\'' + lastName + '\';';
    connection.query(stmt, function(error, found) {
        var author = null;
        if(error) throw error;
        if (found.length) {
            author = found[0];
            author.dob = author.dob.toString().split(' ').slice(0,4).join(' ');
            author.dod = author.dod.toString().split(' ').slice(0,4).join(' ');
            // res.render('author', {author: author} );
        }
        res.render('author', {author: author} );
        console.log(author);
    });
});

app.get('/quotes/:aid' , function(req, res){
    var stmt = 'select firstName, lastName, quote ' +
                'from l9_author, l9_quotes ' +
                'where l9_author.authorId = l9_quotes.authorId ' +
                'and l9_author.authorId=' + req.params.aid + ';';
    connection.query(stmt, function(error, found){
        if (error) throw error;
        if (found.length){
            var name = found[0].firstName + ' ' + found[0].lastName;
            res.render('quotes', {keyword: name, quotes: found, name: name});
        }
    });
});

/* Show an author record */
app.get('/author/:aid', isAuthenticated, function(req, res){
    var stmt = 'SELECT * FROM l9_author WHERE authorId=' + req.params.aid + ';';
    console.log(stmt);
    connection.query(stmt, function(error, results){
       if(error) throw error;
       if(results.length){
           var author = results[0];
           author.dob = author.dob.toString().split(' ').slice(0,4).join(' ');
           author.dod = author.dod.toString().split(' ').slice(0,4).join(' ');
           res.render('author', {author: author, key: false});
       }
    });
});

/* Edit an author record - Update an author in DBMS */
app.put('/author/:aid', function(req, res){
    console.log(req.body);
    var stmt = 'UPDATE l9_author SET ' +
                'firstName = "'+ req.body.firstname + '",' +
                'lastName = "'+ req.body.lastname + '",' +
                'dob = "'+ req.body.dob + '",' +
                'dod = "'+ req.body.dod + '",' +
                'sex = "'+ req.body.sex + '",' +
                'profession = "'+ req.body.profession + '",' +
                'portrait = "'+ req.body.portrait + '",' +
                'country = "'+ req.body.country + '",' +
                'biography = "'+ req.body.biography + '"' +
                'WHERE authorId = ' + req.params.aid + ";"
    //console.log(stmt);
    connection.query(stmt, function(error, result){
        if(error) throw error;
        res.redirect('/author/' + req.params.aid);
    });
});

/* Edit an author record - Display an author information */
app.get('/author/:aid/edit', isAuthenticated, function(req, res){
    var stmt = 'SELECT * FROM l9_author WHERE authorId=' + req.params.aid + ';';
    connection.query(stmt, function(error, results){
       if(error) throw error;
       if(results.length){
           var author = results[0];
           author.dob = author.dob.toISOString().split('T')[0];
           author.dod = author.dod.toISOString().split('T')[0];
           res.render('edit_author', {author: author});
       }
    });
});

/* Delete an author record */
app.get('/author/:aid/delete', function(req, res){
    var stmt = 'DELETE from l9_author WHERE authorId='+ req.params.aid + ';';
    connection.query(stmt, function(error, result){
        if(error) throw error;
        res.redirect('/');
    });
});

/* Delete an author record */
app.get('/delete/:aid', function(req, res){
    var authorId = req.params.aid;
    var stmt = 'SELECT * FROM l9_author WHERE authorId=' + authorId + ';';
    connection.query(stmt, function(error, results){
       if(error) throw error;
       if(results.length){
           var author = results[0];
           res.render('delete', {authorId: authorId, firstname: author.firstName, lastname: author.lastName});
       }
    });
});

/* Login Routes */
app.get('/login', function(req, res){
    res.render('login');
});

app.post('/login', async function(req, res){
    let isUserExist   = await checkUsername(req.body.username);
    let hashedPasswd  = isUserExist.length > 0 ? isUserExist[0].password : '';
    let passwordMatch = await checkPassword(req.body.password, hashedPasswd);
    if(passwordMatch){
        req.session.authenticated = true;
        req.session.user = isUserExist[0].username;
        var stmt = 'SELECT * FROM l9_author;';
        var authors = null;
        connection.query(stmt, function(error, results){
            if(error) throw error;
            if(results.length) authors = results;
            
            res.render('login_home', {authors: authors});
        });
    }
    else{
        res.render('login', {error: true});
    }
});

/* Register Routes */
app.get('/register', function(req, res){
    res.render('register');
});



app.post('/register', function(req, res){
    let salt = 10;
    bcrypt.hash(req.body.password, salt, function(error, hash){
        if(error) throw error;
        let stmt = 'INSERT INTO users (username, password) VALUES (?, ?)';
        let data = [req.body.username, hash];
        connection.query(stmt, data, function(error, result){
           if(error) throw error;
           res.render('login');
        });
    });
});

/* Logout Route */
app.get('/logout', function(req, res){
   req.session.destroy();
   res.redirect('/');
});


/* Welcome Route */
app.get('/login_home', isAuthenticated, function(req, res){
   res.render('login_home', {user: req.session.user}); 
});

app.get('*', function(req, res) {
    res.render('error');
});



//starting server
app.listen(process.env.PORT, process.env.IP, function(){
    console.log("Server has been started...");
});