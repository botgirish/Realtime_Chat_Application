import { useContext } from "react";
import Register from "./Register";
import { UserContext } from "./UserContext";
import Chat from "./Chat";

export default function(){
   const {username,id} =  useContext(UserContext);

   if(username && id){
    return (
        <Chat/>
    )
    
   }

    return(
        <Register/>
    )
}