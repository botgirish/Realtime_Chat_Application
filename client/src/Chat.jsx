import { useContext, useEffect, useRef, useState } from "react"
import Avatar from "./Avatar";
import { UserContext } from "./UserContext";
import { uniq, uniqBy } from "lodash";
import axios from "axios";


export default function Chat(){
    
    const [selecteduserid,setSelecteduserid] = useState(null);
    const [onlinepeople,setOnlinepeople] = useState({});
    const [offlinepeople,setOfflinepeople] = useState({});
    const [ws,setWs] = useState(null);
    const [newmsgtext,setnewmsgtext] = useState('');
    const [messages,setMessages] = useState([]);
    const divundermsg = useRef();


    const {id,setId,setUsername} = useContext(UserContext);


   useEffect(()=>{
    Connecttows();  
   },[]);


   function Connecttows(){
    const ws = new WebSocket('ws://localhost:4000');
    setWs(ws);
    ws.addEventListener('message',handlemessage);
    ws.addEventListener('close',()=>Connecttows);
   }


   function handlesubmitofnewmsg(ev){
    ev.preventDefault();
     ws.send(JSON.stringify({
          recipient:selecteduserid,
          text:newmsgtext,
     }));
     setnewmsgtext('');
     setMessages(prev => ([...prev,{text:newmsgtext,sender:id,recipient:selecteduserid,_id:Math.random()}]))
   }

   useEffect(()=>{
        const div = divundermsg.current;
        if(div){
          div.scrollIntoView({behavior:'smooth',block:'end'});
        }
   },[messages]);

   useEffect(()=>{
       axios.get('/people').then(res=>{
        const offlinepeopleArr = res.data
             .filter(p=> p._id !== id)
             .filter(p=>!Object.keys(onlinepeople).includes(p._id));
            const offlinepeople = {};
            offlinepeopleArr.forEach(p=>{
              offlinepeople[p._id]=p.username;
            });
            setOfflinepeople(offlinepeople);
        
       })
   },[onlinepeople])

   useEffect(() => {
    if (selecteduserid) {
        axios.get('/messages/' + selecteduserid)
            .then(res => {
                const msgs = res.data;
                setMessages(msgs);
            })
            .catch(err => {
                console.error(err);
            });
    }
}, [selecteduserid]);


   function handlepeople(peoplearray){
    const people = {};
    peoplearray.forEach(({userid,username}) => {
      people[userid] = username;
    });
    setOnlinepeople(people);
   }

   function HandleLogout(ev){
    ev.preventDefault();
    axios.post('/logout').then(res=>{
         setId(null);
         setUsername(null);
    })
   }

   function handlemessage(ev){
       ev.preventDefault();
      const messageData = JSON.parse(ev.data);
      console.log(messageData);
      if('online' in messageData){
        handlepeople(messageData.online);
      }else{
        setMessages(prev => ([...prev,{...messageData}]));
      }
   }

   const onlinepeoplereal = {...onlinepeople};
   delete onlinepeoplereal[id];

   
  const messageswithoutdupes = uniqBy(messages,'_id');
  console.log(messageswithoutdupes);

   

    return(
      
        <div className=" flex h-screen">


          {/* left */}
           <div className=" bg-black w-1/4 p-3 flex flex-col">
           <div className=" flex-grow">
  
          <div className="flex justify-center rounded-lg bg-black">
            <div><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-12 bg-yellow-300 mt-2 rounded-xl">
  <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
</svg>
</div>
<div className="  text-yellow-300 bg-black text-center p-4 rounded-md text-2xl font-bold font-serif">U&ME</div>
          </div>
          
              


          {Object.keys(onlinepeoplereal).map(userid=>(
            <div key={userid} onClick={()=>{setSelecteduserid(userid)}} className={"p-2 bg-yellow-300 hover:bg-yellow-400 cursor-pointer border-b rounded-md flex gap-2 items-center mt-2  " + (userid === selecteduserid ? 'bg-blue-300' : '')}>
              <Avatar online={true} username={onlinepeople[userid]} userid={userid}/>
              <span className=" font-mono">{onlinepeople[userid]}</span>
              </div>
          ))}
           {Object.keys(offlinepeople).map(userid=>(
            <div key={userid} onClick={()=>{setSelecteduserid(userid)}} className={"p-2 bg-yellow-300 hover:bg-yellow-400 cursor-pointer border-b rounded-lg flex gap-2 items-center mt-2 " + (userid === selecteduserid ? 'bg-blue-300' : '')}>
              <Avatar online={false} username={offlinepeople[userid]} userid={userid}/>
              <span className=" font-mono">{offlinepeople[userid]}</span>
              </div>
          ))}

           </div>

          
            <button onClick={HandleLogout} className=" bg-yellow-300 hover:bg-yellow-400 rounded-xl px-2 py-1 w-20 mx-auto font-mono ">Logout</button>
          
           
         
            </div>



            {/* right */}
           <div className=" bg-black border-l-2 border-gray-800 w-3/4 flex flex-col p-2">
           <div className="flex-grow bg-black rounded-md shadow-xl">
            {!selecteduserid && (
              <div className=" flex flex-grow h-full items-center justify-center">
               <div className=" text-gray-400 text-3xl"> &larr; Select a conversation!</div>
              </div>
            )}

            {!!selecteduserid && (
              <div className=" relative h-full">

                <div className=" overflow-y-scroll absolute inset-0">
                {messageswithoutdupes.map(message => (
                <div className= {(message.sender === id ? 'text-right' :'text-left')}>
                  <div className={" text-left inline-block px-4 py-2 my-1 rounded-md text-sm " + (message.sender === id ? 'bg-slate-400 mr-2 ml-3 font-mono' : 'bg-yellow-300 mr-10 ml-2 font-mono')}>
                    {message.text} <br/>
                    </div>
                </div>

                ))}
                <div ref={divundermsg}></div>
              </div> 

              </div>
              
            )}
           </div>

           {!!selecteduserid && (
            <form className=" flex gap-2 mt-2" onSubmit={handlesubmitofnewmsg}>
            <input value={newmsgtext} onChange={ev=>setnewmsgtext(ev.target.value)}  type="text" className=" flex-grow rounded-lg p-2 ml-1 bg-gray-800 text-slate-300" />
            <button type="submit" className=" bg-yellow-300 hover:bg-yellow-400 px-2 mr-5 rounded-md">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
            </svg>
            </button>
            </form>

           )}
           
           </div>
        </div>
    )
}