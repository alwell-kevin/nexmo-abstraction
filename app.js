require('dotenv').config()

const express = require('express');
const bodyParser = require('body-parser');
const port = process.env.PORT || 3000;
var cors = require('cors')
var app = express();
app.use(cors());


var Nexmo = require('nexmo');

var nexmo = new Nexmo({
    apiKey: process.env.NEXMO_API_KEY,
    apiSecret: process.env.NEXMO_API_SECRET,
    applicationId: process.env.NEXMO_APP_ID,
    privateKey: process.env.NEXMO_PRIVATE_KEY,
});

var verifyRequestId = null; // use in the check process
var NEXMO_TO_NUMBER = "";
var sessions = [];
var validatedNumbers = [];
app.use(bodyParser.json({
    type: 'application/json'
}));

//Submit a verification request
app.post('/verify/request', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With');

    NEXMO_TO_NUMBER = req.body.number
    console.log("req.body", req.body);

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
                "verifyRequestId": verifyRequestId,
                "result": result
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

    console.log("IN VERIFY: ", UNIQUE_ID_FROM_VERIFICATION_REQUEST, CODE_TO_CHECK);

    nexmo.verify.check({
        request_id: UNIQUE_ID_FROM_VERIFICATION_REQUEST,
        code: CODE_TO_CHECK
    }, function (err, result) {
        if (err) {
            console.error(err);
            res.json(err);
        } else {
            console.log("Validation result: ", result);
            verifyRequestId = result.request_id;
            console.log('validation result status: ', result.status);
            if (result.status === "0") {
                validatedNumbers.push(NEXMO_TO_NUMBER);
                return res.json({
                    "status": 200,
                    "verifyRequestId": verifyRequestId,
                    "request": "validated"
                });
            } else {
                return res.json({
                    "status": 500,
                    "request": "validation-failed-bad-req-id"
                });
            }
        }
    }, function (resp) {
        console.log("IN VERIFY REQUEST: ", resp)
    });
});

app.post('/voice/call', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
    //if (validatedNumbers.includes(req.body.toNum)) {

    var tts = req.body.message;
    var voice = req.body.voice;
    var num = req.body.toNum;
    storeMessage(num, tts, voice);
    console.log("to: ", num, "TTS: ", tts, "voice: ", voice);

    nexmo.calls.create({
        to: [{
            type: 'phone',
            number: num
        }],
        from: {
            type: 'phone',
            number: process.env.NEXMO_NUMBER
        },
        answer_url: ['https://nexmo-abstraction.herokuapp.com/answer']
    }, function callback(resp) {
        console.log("IN CREATE CALL CALLBACK: ", resp)
    });

    res.sendStatus(200);
    // } 
});


app.all('/answer', function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
    console.log("IN ANSWER!: ", req);

    getSession(req.query.to.toString()).then((session) => {

        var ncco = [{
                "action": "talk",
                "text": "This call is enabled by Nexmo Voice API.",
                "voiceName": session.voice
            },
            {
                "action": "talk",
                "text": session.message,
                "voiceName": session.voice
            }
        ];

        return res.json(ncco);
    })
})


app.post('/event', function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');

    res.sendStatus(200);
})


//Validate the response of a Verification Request

app.post('/verify/cancel', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');

    var UNIQUE_ID_FROM_VERIFICATION_REQUEST = req.body.id

    console.log("IN VERIFY cancel: ", UNIQUE_ID_FROM_VERIFICATION_REQUEST);
    nexmo.verify.control({
        request_id: UNIQUE_ID_FROM_VERIFICATION_REQUEST,
        cmd: 'cancel'
    }, function (resp) {
        console.log("Cancel Verify Resp: ", resp)
    });

    res.sendStatus(200);
});

function storeMessage(toNum, tts, voice) {

    sessions.forEach((session, index) => {
        if (toNum === session.num) {
            sessions.splice(index, 1);
        }
    })

    var session = {
        "num": toNum,
        "message": tts,
        "voice": voice
    }

    sessions.push(session);
}

function getSession(toNum) {
    return new Promise((resolve, reject) => {
        sessions.forEach((session) => {
            console.log("SESSION: ", session, "TONUM: ", toNum)
            if (toNum === session.num) {
                console.log("GOT SESSION: ", session);
                resolve(session)
            }
        })
    })
}

// Start server
app.listen(port, () => {
    console.log('Express server started on port ' + port);
})