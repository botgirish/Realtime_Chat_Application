const express = require('express');
const app = express();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const usermod = require('./models/Usermodel');
const cors = require('cors');
const cookieparser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const ws = require('ws');
const Message = require('./models/Message');
const Group = require('./models/Group');
const {Configuration,OpenAI} = require('openai');
mongoose.connect('mongodb+srv://khruthwik:khruthwik@khruthwik.m0mu0l8.mongodb.net/');

app.use(cors({
    credentials: true,
    origin: '*'
}));

app.use(express.json());
app.use(cookieparser());


//   const openai = new OpenAI(client);

//   app.post('/chatbot', async (req, res) => {
//     const { text } = req.body;
  
//     try {
//       // Send the user's message to OpenAI's API (or another AI service)
//       const response = await openai.createChatCompletion({
//         model: "gpt-3.5-turbo",  // or whichever model you're using
//         prompt: text,
//         max_tokens: 150,  // Limit tokens as needed
//       });
  
//       // Extract the AI-generated text from the response
//       const reply = response.data.choices[0].text.trim();
  
//       // Return the chatbot's reply to the frontend
//       res.json({ reply });
  
//     } catch (error) {
//       console.error("Error with AI chatbot:", error);
//       res.status(500).json({ error: "Failed to process the message" });
//     }
//   });

const bcryptsalt = bcrypt.genSaltSync(10);
const jwtsecret = 'sdfdffskdpjofpodjsposdjfposdjpfojpsjfdfsf';

app.get('/test', (req, res) => {
    res.json('all hruthwik');
});

// Fetch all users for private chats
app.get('/people', async (req, res) => {
    const users = await usermod.find({}, { '_id': 1, username: 1 });
    res.json(users);
});

// Fetch all groups for group chats
app.get('/groups', async (req, res) => {
    const groups = await Group.find({}, { '_id': 1, name: 1 });  // Assuming groups have _id and name
    res.json(groups);
});

// Logout user
app.post('/logout', (req, res) => {
    res.cookie('hitman', '', { sameSite: 'none', secure: true });
    res.sendStatus(200);
});

app.post('/groupss', async (req, res) => {
    const { name, members } = req.body;
    if (!name || !Array.isArray(members) || members.length === 0) {
        return res.status(400).json('Invalid group data');
    }
    try {
        let group = await Group.findOne({ name });
        if (group) {
            const updatedMembers = Array.from(new Set([...group.members, ...members])); 
            group.members = updatedMembers;
            await group.save();
            return res.status(200).json(group);
        } else {
            group = await Group.create({
                name,
                members
            });
            return res.status(201).json(group);
        }
    } catch (error) {
        console.error('Error handling group request:', error);
        res.status(500).json('Error handling group request');
    }
});

// User login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const userdoc = await usermod.findOne({ username });
        if (userdoc) {
            const passok = bcrypt.compareSync(password, userdoc.password);
            if (passok) {
                jwt.sign({ userid: userdoc._id, username }, jwtsecret, {}, (err, token) => {
                    res.cookie('hitman', token, { sameSite: 'none', secure: true }).json({
                        username,
                        id: userdoc._id,
                    });
                });
            }
        }
    } catch (error) {
        res.json(error).status(400);
    }
});

// Fetch user profile
app.get('/profile', (req, res) => {
    let thatcok = req.cookies?.hitman;
    if (thatcok) {
        jwt.verify(thatcok, jwtsecret, {}, (err, userData) => {
            if (err) throw err;
            res.json(userData);
        });
    } else {
        res.status(401).json('no token');
    }
});

// User registration
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = bcrypt.hashSync(password, bcryptsalt);
        const User = await usermod.create({ username, password: hashedPassword });
        jwt.sign({ userid: User._id, username }, jwtsecret, {}, (err, token) => {
            if (err) throw err;
            res.cookie('hitman', token, { sameSite: 'none', secure: true }).status(201).json({
                username,
                id: User._id,
            });
        });
    } catch (error) {
        res.status(402).json('not all ok');
    }
});

// Fetch messages (for both individual users and groups)
app.get('/messages/:thatid', async (req, res) => {
    let thatcok = req.cookies?.hitman;
    if (thatcok) {
        jwt.verify(thatcok, jwtsecret, async (err, userData) => {
            if (err) return res.status(403).json('Token verification failed');
            
            const myid = userData.userid;
            const { thatid } = req.params;

            try {
                let msgs;
                // Check if it's a group or private chat
                const isGroup = await Group.findById(thatid);
                if (isGroup) {
                    msgs = await Message.find({ recipient: thatid }).sort({ createdAt: 1 });  // Group messages
                } else {
                    msgs = await Message.find({
                        sender: { $in: [myid, thatid] },
                        recipient: { $in: [myid, thatid] }
                    }).sort({ createdAt: 1 });
                }

                return res.json(msgs);
            } catch (error) {
                return res.status(500).json('Error fetching messages');
            }
        });
    } else {
        res.status(401).json('No token');
    }
});

// WebSocket server setup for real-time messaging
const server = app.listen(4000);
const wss = new ws.WebSocketServer({ server });

wss.on('connection', (connection, req) => {
    const cookies = req.headers.cookie;
    if (cookies) {
        const hitmanstringcookie = cookies.split(';').find(str => str.startsWith('hitman='));
        if (hitmanstringcookie) {
            const hitman = hitmanstringcookie.split('=')[1];
            jwt.verify(hitman, jwtsecret, {}, (err, userdata) => {
                const { userid, username } = userdata;
                connection.userid = userid;
                connection.username = username;
            });
        }
    }

    connection.on('message', async (message) => {
        const msgdata = JSON.parse(message.toString());
        const { recipient, text, group } = msgdata;

        if (recipient && text) {
            const MessDoc = await Message.create({
                sender: connection.userid,
                recipient,
                text,
                group: !!group,  // Indicating whether it's a group message
            });

            // Broadcast the message to either group or individual recipient
            if (group) {
                // Broadcast to all members of the group
                [...wss.clients]
                    .filter(c => c.userid && c.username)  // Only to authenticated users
                    .forEach(c => {
                        try {
                            c.send(JSON.stringify({
                                text,
                                sender: connection.userid,
                                recipient,
                                group: true,  // Group message flag
                                _id: MessDoc._id,
                            }));
                        } catch (error) {
                            console.error("Error sending group message:", error);
                        }
                    });
            } else {
                // Broadcast to individual recipient
                [...wss.clients]
                    .filter(c => c.userid === recipient)
                    .forEach(c => {
                        
                            c.send(JSON.stringify({
                                text,
                                sender: connection.userid,
                                recipient,
                                group: false,  // Not a group message
                                _id: MessDoc._id,
                            }));
                        
                    });
            }
        }
    });

    // Notify all clients of the updated online users list
    [...wss.clients].forEach(client => {
        client.send(JSON.stringify({
            online: [...wss.clients]
                .filter(c => c.userid && c.username)
                .map(c => ({ userid: c.userid, username: c.username }))
        }));
    });
});
