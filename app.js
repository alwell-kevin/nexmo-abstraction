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

var verifyRequestId = null; // use in the check process
var TTS = ""; //use in voice playback
var VOICE = ""; //use in voice playback

app.use(bodyParser.json({
    type: 'application/json'
}));

//Submit a verification request
app.post('/verify/request', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');

    var NEXMO_TO_NUMBER = req.body.number
    console.log("req.body", JSON.stringify(req.body), req)
    nexmo.verify.request({
        number: NEXMO_TO_NUMBER,
        brand: "Nexmo"
    }, function (err, result) {
        if (err) {
            console.error(err);
        } else {
            verifyRequestId = result.request_id;
            console.log('request_id', verifyRequestId);

            return res.json({
                "status": 200,
                "verifyRequestId": verifyRequestId
            });
        }
    }, function (resp) {
        console.log("IN VERIFY REQUEST: ", resp)
    })
});

//Validate the response of a Verification Request

app.get('/verify/validate', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');

    var UNIQUE_ID_FROM_VERIFICATION_REQUEST = req.query.id
    var CODE_TO_CHECK = req.query.verifycode


    nexmo.verify.check({
        request_id: UNIQUE_ID_FROM_VERIFICATION_REQUEST,
        code: CODE_TO_CHECK
    }, function (err, result) {
        if (err) {
            console.error(err);
            res.sendStatus(501);
        } else {
            verifyRequestId = result.request_id;
            console.log('request_id', verifyRequestId);

            return res.sendStatus(200);
        }
    }, function (resp) {
        console.log("IN VERIFY REQUEST: ", resp)
    });
});

//Validate the response of a Verification Request

app.post('/voice/call', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');

    var TO_NUMBER = req.body.toNum
    TTS = req.body.message
    VOICE = req.body.voice

    nexmo.calls.create({
        to: [{
            type: 'phone',
            number: TO_NUMBER
        }],
        from: {
            type: 'phone',
            number: process.env.NEXMO_NUMBER
        },
        answer_url: ['https://developer.nexmo.com/ncco/tts.json']
    }, callback);

    function callback(resp) {
        console.log("IN CREATE CALL CALLBACK: ", resp)
    }

    res.sendStatus(200);
});



app.post('/answer', function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');

    var message = process.env['SUPPORT_MESSAGE'];
    var ncco = [{
            "action": "talk",
            "text": "This call is enabled by Nexmo Voice API.",
            "voiceName": "Amy"
        },
        {
            "action": "talk",
            "text": message,
            "voiceName": "Amy"
        }
    ];

    res.json(ncco);
})


app.post('/event', function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');

    res.sendStatus(200);
})


// Start server
app.listen(port, () => {
    console.log('Express server started on port ' + port);
})