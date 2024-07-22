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

mongoose.connect('mongodb+srv://khruthwik:khruthwik@khruthwik.m0mu0l8.mongodb.net/');

app.use(cors({
    credentials:true,
     origin: '*'
}));

app.use(express.json());
app.use(cookieparser());

const bcryptsalt = bcrypt.genSaltSync(10);

const jwtsecret = 'sdfdffskdpjofpodjsposdjfposdjpfojpsjfdfsf';

app.get('/test',(req,res)=>{
     res.json('all hruthwik');
});

app.get('/people',async (req,res)=>{
    const users = await usermod.find({},{'_id':1,username:1});
    res.json(users);
})

app.post('/logout',(req,res)=>{
    res.cookie('hitman','',{sameSite:'none',secure:true});
    res.sendStatus(200);
})

app.post('/login',async(req,res)=>{
     const {username,password} = req.body;
     try {
        
        const userdoc = await usermod.findOne({username});
        if(userdoc){
           const passok = bcrypt.compareSync(password,userdoc.password);
           if(passok){
            jwt.sign({userid:userdoc._id,username},jwtsecret,{},(err,token)=>{
                res.cookie('hitman',token,{sameSite:'none',secure:true}).json({
                    username,
                   id:userdoc._id,
                });
             })   
           }
        }
     } 
     catch (error) {
        res.json(error).status(400); 
     }
}); 

app.get('/profile',(req,res)=>{
    let thatcok = req.cookies?.hitman;
    console.log('reached into this');
    if(thatcok){
        jwt.verify(thatcok,jwtsecret,{},(err,userData)=>{
            if(err) throw err;
            res.json(userData);
        });
    }else{
        res.status(401).json('no token');
    }
});



app.post('/register',async (req,res)=>{
   const {username,password} = req.body;
   try {
    const hashedPassword = bcrypt.hashSync(password,bcryptsalt);
    const User = await usermod.create({username,password:hashedPassword});
    jwt.sign({userid:User._id,username},jwtsecret,{},(err,token)=>{
        if(err) throw err;
        console.log('reached 1');
        res.cookie('hitman',token,{sameSite:'none',secure:true}).status(201).json({
            username,
            id:User._id,
        });
        console.log('reached 2');
        console.log(req.cookies.hitman);
    }); 
   } catch (error) {
       res.status(402).json('not all ok');
   }
});

app.get('/messages/:thatid', async (req, res) => {
    let thatcok = req.cookies?.hitman;
    if (thatcok) {
        jwt.verify(thatcok, jwtsecret, async (err, userData) => {
            if (err) {
                return res.status(403).json('Token verification failed');
            }
            myid = userData.userid;

            const { thatid } = req.params;
            try {
                const msgs = await Message.find({
                    sender: { $in: [myid, thatid] },
                    recipient: { $in: [myid, thatid] }
                }).sort({ createdAt: 1 });

                return res.json(msgs);
            } catch (error) {
                return res.status(500).json('Error fetching messages');
            }
        });
    } else {
        res.status(401).json('No token');
    }
});




const server = app.listen(4000);

const wss = new ws.WebSocketServer({server});

wss.on('connection',(connection,req)=>{
  
   const cookies = req.headers.cookie;
   if(cookies){
      const hitmanstringcookie = cookies.split(';').find(str=>str.startsWith('hitman='));
      if(hitmanstringcookie){
        const hitman = hitmanstringcookie.split('=')[1];
        jwt.verify(hitman,jwtsecret,{},(err,userdata)=>{
           const {userid,username} = userdata;
           connection.userid = userid;
           connection.username = username;
           
        });
      }
   }
   connection.on('message',async(message)=>{
      const msgdata = JSON.parse(message.toString());
      const {recipient,text} = msgdata;
      if(recipient && text){
      const MessDoc = await Message.create({
            sender:connection.userid,
            recipient,
            text,
          });
        [...wss.clients].filter(c=>c.userid === recipient).forEach(c=>c.send(JSON.stringify({text,sender:connection.userid,recipient,_id:MessDoc._id})));
      }
   });
   [...wss.clients].forEach(client=>{
    client.send(JSON.stringify({
        online: [...wss.clients].map(c=>({userid:c.userid,username:c.username}))
    }));
   });
});


