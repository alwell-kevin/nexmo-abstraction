require('dotenv').config()

const express = require('express');
const bodyParser = require('body-parser');
const port = process.env.PORT || 3000;
const app = express();


var Nexmo = require('nexmo');

var nexmo = new Nexmo({
    apiKey: process.env.NEXMO_API_KEY,
    apiSecret: process.env.NEXMO_API_SECRET,
    applicationId: process.env.NEXMO_APP_ID,
    privateKey: process.env.NEXMO_PRIVATE_KEY,
});

app.use(bodyParser.json({
    type: 'application/json'
}));

//Submit a verification request
app.post('/verify/request', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');

    var NUMBER_TO_BE_VERIFIED = req.body.number
    var NAME_OF_THE_APP = req.body.app


    nexmo.verify.request({
        number: NUMBER_TO_BE_VERIFIED,
        brand: NAME_OF_THE_APP
    }, callback);

    res.sendStatus(200);
});

//Validate the response of a Verification Request

app.get('/verify/validate', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');

    var UNIQUE_ID_FROM_VERIFICATION_REQUEST = req.query.id
    var CODE_TO_CHECK = req.query.code


    nexmo.verify.check({
        request_id: UNIQUE_ID_FROM_VERIFICATION_REQUEST,
        code: CODE_TO_CHECK
    }, callback);


    res.sendStatus(200);
});

//Validate the response of a Verification Request

app.post('/voice/call', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');

    var username = req.body.username
    var admin = req.body.admin


    nexmo.calls.create({
        to: [{
            type: 'phone',
            number: TO_NUMBER
        }],
        from: {
            type: 'phone',
            number: process.env.NEXMO_NUMBER
        }
    }, callback);

    function callback(resp) {
        console.log("IN CREATE CALL CALLBACK: ", resp)
    }

    res.sendStatus(200);
});


app.post('/event', function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');

    // var message = process.env['SUPPORT_MESSAGE'];
    // var ncco = [{
    //         "action": "talk",
    //         "text": "This call is enabled by Nexmo Voice API.",
    //         "voiceName": "Amy"
    //     },
    //     {
    //         "action": "talk",
    //         "text": message,
    //         "voiceName": "Amy"
    //     }
    // ];

    res.sendStatus(200);
})


// Start server
app.listen(port, () => {
    console.log('Express server started on port ' + port);
})