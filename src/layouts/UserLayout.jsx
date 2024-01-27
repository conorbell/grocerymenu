import { NavLink, Outlet } from "react-router-dom"
import React from "react"
export const UserLayout = () =>{
    return(
        <div className="user-layout">
            <h2>Singin</h2>
            <nav>
                <NavLink to='s ignup'></NavLink>
                <NavLink to='login'></NavLink>
            </nav>

            <Outlet /> 
        </div>
    )

}