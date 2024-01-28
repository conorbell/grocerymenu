import { NavLink, Outlet } from "react-router-dom"
import React from "react"
import useSound from "use-sound"
import Al from '../../public/hoo-ah-a.mp3'
import fiya from '../../public/dickfire.mp3'

export const RootLayout = () => {

  const [play] = useSound(Al); 
  const [playDick] = useSound(fiya)
  return(
    <div className='root-layout'>
         <header>
            <div>
          <nav className="navContainer">
            <NavLink className="navLink" to='/' onMouseEnter={play} >Home</NavLink>
            <NavLink className="navLink" to='breakfast' onMouseEnter={play} >Breakfast</NavLink>
            <NavLink className="navLink" to='lunch'  onMouseEnter={play} >Lunch</NavLink>
            <NavLink className="navLink" to='dinner'  onMouseEnter={play} >Dinner</NavLink>
            <NavLink className="navLink" to='checkout'  onMouseEnter={play} >Checkout</NavLink>
            <NavLink className="navLink" to='user/login' onMouseEnter={playDick}>Users</NavLink>

          </nav>
          </div>
        </header>
        <main>
            <Outlet />
        </main>
    </div>
  )
}

