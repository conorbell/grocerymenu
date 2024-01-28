import { NavLink, Outlet } from "react-router-dom"
import React from "react"
export const UserLayout = () =>{
    return(
        <div className="user-layout">
            <nav>
                <NavLink to='login'></NavLink>
            </nav>

            <Outlet /> 
        </div>
    )

}