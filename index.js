const express = require('express')
const bodyParser = require('body-parser')
const crypto = require('crypto')
const cors = require('cors')
const jwt = require('jsonwebtoken');
const rp = require('request-promise');

const app = express()
const port = process.env.PORT || 4000

app.use(bodyParser.json(), cors())
app.options('*', cors());

app.post('/api/signature', (req, res) => {
console.log(req.body);
  const timestamp = new Date().getTime() - 30000
  const msg = Buffer.from(req.body.api_key + req.body.meetingNumber + timestamp + req.body.role).toString('base64')
  const hash = crypto.createHmac('sha256', req.body.api_key_secret).update(msg).digest('base64')
  const signature = Buffer.from(`${req.body.api_key}.${req.body.meetingNumber}.${timestamp}.${req.body.role}.${hash}`).toString('base64')
  res.json({
    signature: signature
  })
})

app.post('/api/zoomfeature/meetings', async (req, res) => {
    const zoomAccessToken = jwt.sign(req.body.playload, req.body.api_secret);
    var options = {
        uri: "https://api.zoom.us/v2/users", 
        qs: {
            status: 'active' 
        },
        auth: {
            'bearer': zoomAccessToken
        },
        headers: {
            'User-Agent': 'Zoom-api-Jwt-Request',
            'content-type': 'application/json'
        },
        json: true
    };
    rp(options)
        .then(response => {
            if(response.users) {
                const userId = response.users[0].id;
                var options1 = {
                    method: 'POST',
                    uri: `https://api.zoom.us/v2/users/${userId}/meetings`,
                    auth: {
                        'bearer': zoomAccessToken
                    },
                    headers: {
                        'User-Agent': 'Zoom-api-Jwt-Request',
                        'content-type': 'application/json'
                    },
                    json: true,
                    body: {
                        'settings': {
                            'approval_type': 0,
                            'host_video': true,
                            'join_before_host': true,
                            'mute_upon_entry': true,
                            'participant_video': true
                        }
                    }
                };
                
                rp(options1)
                    .then((response) => {
                        if(response) {
                            res.json({
                                meeting: response
                            })
                        } else {
                            console.log(response);
                        }
                    }).catch(err => {
                        console.log(err);
                    });

            } else {    
                console.log(response);
            }
        }).catch(err => {
            console.log(err);
        });
})

app.listen(port, () => console.log(`Zoom Web Meeting SDK Sample Signature Node.js on port ${port}!`))
