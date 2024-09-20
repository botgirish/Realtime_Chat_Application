import { useContext, useEffect, useRef, useState } from "react";
import Avatar from "./Avatar";
import { UserContext } from "./UserContext";
import { uniqBy } from "lodash";
import axios from "axios";

export default function Chat() {
  const [selectedGroupId, setSelectedGroupId] = useState(null);  // Added for group chat
  const [groups, setGroups] = useState([]);
  const [selecteduserid, setSelecteduserid] = useState(null);
  const [onlinepeople, setOnlinepeople] = useState({});
  const [offlinepeople, setOfflinepeople] = useState({});
  const [ws, setWs] = useState(null);
  const [newmsgtext, setnewmsgtext] = useState("");
  const [messages, setMessages] = useState([]);
  const [buttonn,setButtonn] = useState(true);
  const [obje,setObje] = useState({});
  const divundermsg = useRef();
  const chatbotId = "chatbot";

  const { id, setId, setUsername } = useContext(UserContext);

  // useEffect(() => {
  //   // Create a copy of the existing obje state
  //   const updatedObje = { ...obje };
  
  //   // Map through the group and set obje[id] = true for each item in the group
  //   Object.keys(obje).forEach((groupId) => {
  //     updatedObje[groupId] = true; // Set each group member's id to true
  //   });
  
  //   // Update the obje state
  //   setObje(updatedObje);
  
  //   // Check if the user is part of the group
  //   if (!updatedObje[id]) {
  //     // If the user is not in the group (either false or undefined), show "Join Group"
  //     setButtonn(true);
  //   } else {
  //     // If the user is part of the group, show "Leave Group"
  //     setButtonn(false);
  //   }
  // }, [id, groups, obje]);  // Include 'obje' as a dependency


  

  useEffect(() => {
    axios.get("/groups").then((res) => {
      setGroups(res.data);
    });
  }, []);

  useEffect(() => {
    Connecttows();
  }, []);

  function Connecttows() {
    const ws = new WebSocket("ws://localhost:4000");
    setWs(ws);
    ws.addEventListener("message", handlemessage);
    ws.addEventListener("close", () => Connecttows());
  }

  function handlesubmitofnewmsg(ev) {
    ev.preventDefault();
  
    const messageData = {
      recipient: selecteduserid || selectedGroupId,
      text: newmsgtext,
      sender: id,
      _id: Math.random(),  // Temporary ID
      group: !!selectedGroupId,  // Group flag
    };
  
    ws.send(JSON.stringify(messageData));
  
    if (!selectedGroupId) {
      setMessages((prev) => [...prev, messageData]);
    }
  
    setnewmsgtext("");
  }

  

  useEffect(() => {
    const div = divundermsg.current;
    if (div) {
      div.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]);

  useEffect(() => {
    axios.get("/people").then((res) => {
      const offlinepeopleArr = res.data
        .filter((p) => p._id !== id)
        .filter((p) => !Object.keys(onlinepeople).includes(p._id));
      const offlinepeople = {};
      offlinepeopleArr.forEach((p) => {
        offlinepeople[p._id] = p.username;
      });
      setOfflinepeople(offlinepeople);
    });
  }, [onlinepeople]);

  useEffect(() => {
    if (selecteduserid || selectedGroupId) {
      const url = selectedGroupId ? `/messages/${selectedGroupId}` : `/messages/${selecteduserid}`;
      axios
        .get(url)
        .then((res) => {
          const msgs = res.data;
          setMessages(msgs);
        })
        .catch((err) => {
          console.error(err);
        });
    }
  }, [selecteduserid, selectedGroupId]);  // Added group dependency

  function handlepeople(peoplearray) {
    const people = {};
    peoplearray.forEach(({ userid, username }) => {
      people[userid] = username;
    });
    setOnlinepeople(people);
  }

  function HandleLogout(ev) {
    ev.preventDefault();
    axios.post("/logout").then((res) => {
      setId(null);
      setUsername(null);
    });
  }

  useEffect(() => {
    // Check if there is group membership information in localStorage
    const storedMembership = localStorage.getItem("groupMembership");
    if (storedMembership) {
      const parsedObje = JSON.parse(storedMembership);
      setObje(parsedObje);

      // If the current user (id) is in the group, set the button to "Leave Group"
      if (parsedObje[id]) {
        setButtonn(false);  // Show "Leave Group" button
      } else {
        setButtonn(true);   // Show "Join Group" button
      }
    }
  }, [id]); // Add `id` to dependencies to make sure the logic runs when the user id is available

  // Rest of your component logic (Handlegrp, Handlegrpleft, etc.)

  function Handlegrp() {
    const groupName = 'HELLO AMIGOS';
  
    axios.post('/groupss', {
      name: groupName,
      members: [id]  // Add current user to the group
    })
    .then(response => {
      const group = response.data;
  
      // Update obje to mark all group members as true
      const updatedObje = { ...obje };
      group.members.forEach(memberId => {
        updatedObje[memberId] = true;  // Mark each member as part of the group
      });
  
      // Update state
      setObje(updatedObje);
  
      // Store in localStorage
      localStorage.setItem("groupMembership", JSON.stringify(updatedObje));
  
      // Check if the current user (id) is part of the group and toggle the button state
      if (updatedObje[id]) {
        alert(`You are added to '${groupName}'.`);
        setButtonn(false); // Show "Leave Group" button
      } else {
        setButtonn(true); // Show "Join Group" button
      }
    })
    .catch(error => {
      console.error('Failed to create group:', error);
      alert('Error creating group');
    });
  }

  function Handlegrpleft() {
    alert('You have left the group.');

    // Create a new obje without the current user in the group members list
    const updatedObje = { ...obje };
    delete updatedObje[id]; // Remove the current user from the group members in obje
  
    // Update the obje state
    setObje(updatedObje);
  
    // Store the updated group membership in localStorage
    localStorage.setItem("groupMembership", JSON.stringify(updatedObje));
  
    // Toggle the button to show "Join Group"
    setButtonn(true);
  
    // Optionally, send a request to the backend to remove the user from the group
    axios.post('/groups/leave', { userId: id }) 
      .then(response => {
        console.log('Successfully left the group');
      })
      .catch(error => {
        console.error('Error leaving the group:', error);
      });
  }
  


function handlemessage(ev) {
  const messageData = JSON.parse(ev.data);
  if ("online" in messageData) {
    handlepeople(messageData.online);
  } else {
    setMessages(prev => {
      // Avoid adding duplicate messages by checking for an existing message with the same _id
      const isDuplicate = prev.some(msg => msg._id === messageData._id);
      if (!isDuplicate) {
        return [...prev, messageData];
      }
      return prev;
    });
  }
}
  
  const onlinepeoplereal = { ...onlinepeople };
  delete onlinepeoplereal[id];

  const messageswithoutdupes = uniqBy(messages, '_id');

  return (
    <div className=" flex h-screen">
      {/* Left */}
      <div
        className="w-1/4 p-3 flex flex-col"
        style={{
          background: "linear-gradient(273deg, rgba(106,156,137,1) 0%, rgba(233,239,236,1) 60%)",
          color: "white", // Adjust text color if needed
          borderRight: "2px solid rgba(255, 255, 255, 0.2)", // Optional border
        }}
        
      >      
        <div className="flex-grow">
          <div className="flex justify-between rounded-lg items-center" style={{
    color: "",// Text color
    borderColor: "#6a8c89",  // Border color
  }}>
  
            

              <div className=" flex flex-row gap-1 items-center ml-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6 bg-[#20433e] rounded-full w-10 h-10 p-1">
  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
</svg>

              <div className=" text-[#16423c] text-lg px-2 border border-[#16423c] rounded-full"> {onlinepeople[id] || offlinepeople[id]}</div>
              </div>

              <div className=" flex p-2 items-center gap-1">
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-12 bg-[#16423c] mt-2 rounded-xl">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
              </svg>
              <div className="text-[#4b6663] bg text-center rounded-md text-xl font-bold font-serif">THERAWIN</div>
              </div>
             
            
          </div>

          {Object.keys(onlinepeoplereal).map((userid) => (
            <div
              key={userid}
              onClick={() => {
                setSelecteduserid(userid);
                setSelectedGroupId(null);
              }}
              className={"p-2 bg-[#6a8c89] hover:bg-[#4a6561] cursor-pointer border-b rounded-md flex gap-2 items-center mt-2 " + (userid === selecteduserid ? "bg-red-400" : "")}
            >
              <Avatar online={true} username={onlinepeople[userid]} userid={userid} />
              <span className="font-mono">{onlinepeople[userid]}</span>
            </div>
          ))}

          {Object.keys(offlinepeople).map((userid) => (
            <div
              key={userid}
              onClick={() => {
                setSelecteduserid(userid);
                setSelectedGroupId(null);
              }}
              className={"p-2 bg-[#6a8c89] hover:bg-[#4a6561] cursor-pointer border-b rounded-lg flex gap-2 items-center mt-2 " + (userid === selecteduserid ? "bg-red-400" : "")}
            >
              <Avatar online={false} username={offlinepeople[userid]} userid={userid} />
              <span className="font-mono">{offlinepeople[userid]}</span>
            </div>
          ))}

          {groups.map((group) => (
            <div
              key={group._id}
              onClick={() => {setSelectedGroupId(group._id); setSelecteduserid(false);}}
              className={"p-2 bg-[#6a8c89] hover:bg-[#4a6561] cursor-pointer border-b rounded-md flex gap-2 items-center mt-2 " + (group._id === selectedGroupId ? "bg-red-400" : "")}
            >
              <Avatar online={true} username={'Group'} />
              <span className="font-mono">{group.name}</span>
            </div>
          ))}
           {/* <div
            onClick={() => {
              setSelecteduserid(chatbotId); // Select Chatbot
              setSelectedGroupId(null);
            }}
            className={"p-2 bg-yellow-300 hover:bg-yellow-400 cursor-pointer border-b rounded-md flex gap-2 items-center mt-2 " + (chatbotId === selecteduserid ? "bg-red-400" : "")}
          >
            <Avatar online={true} username="Chatbot" />
            <span className="font-mono">Chatbot</span>
          </div> */}
        </div>
        <div className=" flex flex-row justify-normal">

        {(buttonn) && (
          <button onClick={Handlegrp} className=" bg-[#16423c] hover:bg-[#4a6561] rounded-xl px-4 py-1 mx-auto font-mono">Join-grp</button>
        )}
       {!buttonn && 
        <button onClick={Handlegrpleft} className=" bg-[#16423c] hover:bg-[#4a6561] rounded-xl px-4 py-1 mx-auto font-mono">Leave-grp</button>
        }
        <button onClick={HandleLogout} className="bg-[#16423c] hover:bg-[#4a6561] rounded-xl px-2 py-1 w-20 mx-auto font-mono">
          Logout
        </button>

        </div>
        
      </div>

      {/* Right */}
      <div className="border-l-2 w-3/4 flex flex-col p-2"
      style={{
        background: "linear-gradient(97deg, rgba(106,156,137,1) 0%, rgba(233,239,236,1) 94%)",
        color: "white", // Adjust text color if necessary
        borderRight: "2px solid rgba(255, 255, 255, 0.2)", // Optional border
      }}
      
      >
      <div
  className="flex-grow rounded-md shadow-xl"
  style={{
    background: "linear-gradient(97deg, rgba(106,156,137,1) 0%, rgba(233,239,236,1) 94%)",
    color: "white", // Adjust text color if necessary
    borderRight: "2px solid rgba(255, 255, 255, 0.2)", // Optional border
  }}
  
  
>          {!selecteduserid && !selectedGroupId && (
            <div className="flex flex-grow h-full items-center justify-center">
              <div className="text-gray-700 text-3xl"> &larr; Select a conversation!</div>
            </div>
          )}

{(!!selecteduserid || !!selectedGroupId) && (
  <div className="relative h-full">
    <div className="overflow-y-scroll absolute inset-0">
      {messageswithoutdupes.map((message) => (
        <div className={message.sender === id ? "text-right" : "text-left"}>
          {(message.sender !== id) && selectedGroupId && ( 
  // Ensure the sender exists in online or offline people
  (onlinepeople[message.sender] || offlinepeople[message.sender]) && (
    <div className="text-left px-3 py-1 text-sm font-semibold text-[#16423c] mt-2 rounded-full">
      - {onlinepeople[message.sender] || offlinepeople[message.sender]} {/* Sender's name */}
    </div>
  )
)}
          <div
            className={
              "text-left inline-block px-4 py-2 my-1 rounded-md text-sm text-[#16423c] " +
              (message.sender === id
                ? "bg-[#688d88] mr-2 ml-3 font-mono text-slate-100"
                : "bg-[#cadad2] mr-10 ml-2 font-mono")
            }
          >
            <div className="flex flex-row items-center">
              {message.text}
            </div>
          </div>
        </div>
      ))}
      <div ref={divundermsg}></div>
    </div>
  </div>
)}

        </div>

        {((selecteduserid) || (selectedGroupId && !buttonn)) && (
          <form className="flex gap-2 mt-2" onSubmit={handlesubmitofnewmsg}>
            <input
              value={newmsgtext}
              onChange={(ev) => setnewmsgtext(ev.target.value)}
              type="text"
              className="flex-grow rounded-lg p-2 ml-1 bg-transparent border border-[#16423c] text-slate-300 shadow-xl "
            />
            <button type="submit" className="bg-[#16423c] hover:bg-[#3b4a48] px-2 mr-5 rounded-md">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6 ">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
              </svg>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
