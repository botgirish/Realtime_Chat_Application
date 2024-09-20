import { useContext, useState } from "react";
import axios from "axios";
import { UserContext } from "./UserContext";
import backgroundImage from './assets/flat-lay-clean-office-desk.jpg';
export default function Register(){

    const [username,setUsername] = useState('');
    const [password,setPassword] = useState('');
    const {setUsername:setLoggedinusername,setId} = useContext(UserContext);
    const [isloggedorregister,setIsloggedorregister] = useState('register');

    async function handleregister(ev){
        ev.preventDefault();
        const url = isloggedorregister === 'register' ? 'register' : 'login'
        const {data} = await axios.post(url,{username,password});
        setLoggedinusername(username);
        setId(data.id);
     }

    return(
        <div 
        className="flex items-center h-screen"
        style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
        }}
     >
            <form className=" mx-auto w-72" onSubmit={handleregister}>
            <input value={username} onChange={ev=>setUsername(ev.target.value)} className=" text-center font-serif rounded-md p-3 block w-full mb-2 hover:shadow-md hover:bg-slate-100" type="text" placeholder="username"></input>
            <input value={password} onChange={ev=>setPassword(ev.target.value)} className="text-center font-serif rounded-md p-3 block w-full mb-2 hover:shadow-md hover:bg-slate-100" type="password" placeholder="password" />
            <button className="bg-blue-200 font-serif rounded-md p-3 w-full hover:shadow-md">
                {isloggedorregister === 'register' ? 'Register' : 'Login'}
            </button>
            <div className=" font-serif p-2 text-center">
                {isloggedorregister === 'register' && (
                    <div>
                    Already a Member!! 
                <button className=" underline" onClick={()=>{setIsloggedorregister('login')}}>Login</button> Here
                    </div>
                    )}
                    {isloggedorregister === 'login' && (
                        <div>
                            Don't have an Account!! 
                            <button className=" underline" onClick={()=>{setIsloggedorregister('register')}}>Register</button> Here!
                        </div>
                    )}
            </div>
          </form>
       </div>
          
      
    );
}