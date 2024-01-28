import React, {useRef, useState} from "react"
import { verifyUser } from "../../functions/auth";
import { Warning } from "./Warning";
// import { useUser } from "../../functions/userContext";

export const Login = () =>{
    const password = useRef();
    const userName = useRef();
    const [warning, setWarning] = useState(false)
    // const {login} = useUser()
    const handlePassword = async (e) =>{
        e.preventDefault(); 
  
      const successfulLogin = await verifyUser(userName.current.value, password.current.value )
      console.log('successfulLogin', successfulLogin)

    //   if(successfulLogin.message === 'Login successful'){
    //     // login()
    //     return;
    //   } else{
    //     console.error('Login unsuccessful. Check the response:', successfulLogin);

    //     setWarning(true)
    //   }





    }

    return(
        <div>
        <h1>Login</h1>
        <form autoComplete="off">
            <input ref={userName}type="text" placeholder="username" /> 
            <input ref={password} type="text" placeholder="password" />
            <button onClick={handlePassword}>Submit</button>
        </form>
        {warning && <Warning />}
        </div>
    )
}