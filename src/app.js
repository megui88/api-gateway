let express = require('express');
let logger = require('morgan');
let bodyParser = require('body-parser');
let oauthServer = require('oauth2-server');
let Request = oauthServer.Request;
let Response = oauthServer.Response;
let routes = require('./resources/routes');

let app = express();


app.use(logger('dev'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use((req, res, next) => {
    req.oauth = new Request(req);
    res.oauth = new Response(res);
    next();
});
app.oauth = new oauthServer({
    model: require('./resources/model'),
    grants: ['password'],
    debug: true
});

/* Oauth endpoint */
app.all('/oauth/token', (req, res, next) => {
    app.oauth
        .token(req.oauth, res.oauth)
        .then((token) => {
            return res.json({
                "access_token": token.accessToken,
                "refresh_token": token.refreshToken,
                "token_type": 'bearer',
                "expires_in": 3600,
            })
        }).catch((err) => {
        console.log(err);
        return res.status(err.code).json(err)
    });
});

/* add crud and additional routes */
app.use(routes);

/*  Magic of the api gateway */
app.get('/', (req, res) => {
    app.oauth.authenticate(req.oauth, res.oauth)
        .then(() => {
            res.send('Secret area');
        })
        .catch((err) => {
            return res.status(err.code).json(err)
        });
});

// catch 404 and forward to error handler
app.use((req, res, next) => {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use((err, req, res, next) => {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : '';

    // render the error page
    res.status(err.status || 500);
    res.json({'error': err});
});

module.exports = app;