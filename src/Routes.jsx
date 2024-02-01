import {  
  createBrowserRouter,
  Route, 

  createRoutesFromElements,
  RouterProvider
} from "react-router-dom"
import React, {useState} from "react"
//pages
import Main from "./components/main"
import Breakfast from "./components/pages/menus/Breakfast"
import Lunch from "./components/pages/menus/Lunch"
import Dinner from "./components/pages/menus/Dinner"
import Checkout from "./components/pages/menus/Checkout"
import { Login } from "./components/pages/user/Login"
import { CreateMeal } from "./components/CreateMeal"

//error boundary 
import { ErrorBoundary } from "./CustomErrorBoundary"
//Providers
import { ListProvider } from "./components/functions/ListContextWrapper"
// import { UserProvider } from "./components/functions/userContext"
//layouts
import { RootLayout } from "./layouts/RootLayout"
import { UserLayout } from "./layouts/UserLayout"

const router = createBrowserRouter(
  createRoutesFromElements(

    <Route path="/" element={<RootLayout />} >
      <Route index element={<Main />} />

    <Route path="breakfast" element={<Breakfast />}
    errorElement={<ErrorBoundary />}
    />
    <Route path="lunch" element={<Lunch />} 
    errorElement={<ErrorBoundary />}
    />
    <Route path="dinner" element={<Dinner />} 
    errorElement={<ErrorBoundary />}
    />
    <Route path="checkout" element={<Checkout />} 
    errorElement={<ErrorBoundary />}
    />
    <Route path="user" element={<UserLayout />}
    errorElement={<ErrorBoundary />}
    
    >
       <Route index element={<Main />} /> 
      <Route path="login" element={<Login />} 
      errorElement={<ErrorBoundary />}
      />
    </Route>
    </Route>

  )
)

export const App = () =>{
  
  const [showComponent, setShowComponent] = useState(false);

  const handleButtonClick = () => {
    setShowComponent((prevComp) => !prevComp)
   
  }


    return(
        <>

       <ListProvider>
        <RouterProvider router={router} />
        <div className="createMealButton">
        <button onClick={handleButtonClick}>Create meal</button>
        {showComponent && <CreateMeal />}
        </div>
        </ListProvider>

        </>
    )
}