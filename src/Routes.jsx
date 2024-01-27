import {  
  createBrowserRouter,
  Route, 

  createRoutesFromElements,
  RouterProvider
} from "react-router-dom"
import React from "react"
//pages
import Main from "./components/main"
import Breakfast from "./components/pages/menus/Breakfast"
import Lunch from "./components/pages/menus/Lunch"
import Dinner from "./components/pages/menus/Dinner"
import Checkout from "./components/pages/menus/Checkout"
import { Signup } from "./components/pages/user/Signup"
import { Login } from "./components/pages/user/Login"

//error boundary 
import { ErrorBoundary } from "./CustomErrorBoundary"
//List Provider
import { ListProvider } from "./components/functions/ListContext"
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
      <Route path="signup" element={<Signup />}
      errorElement={<ErrorBoundary />}
      />
      <Route path="login" element={<Login />} 
      errorElement={<ErrorBoundary />}
      />
    </Route>
    </Route>

  )
)

export const App = () =>{

    return(
        <>

       <ListProvider>

        <RouterProvider router={router} />
        </ListProvider>

        
        </>
    )
}