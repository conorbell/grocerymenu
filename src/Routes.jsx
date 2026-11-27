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
import Grocery from "./components/pages/Grocery"
import FullMenu from "./components/pages/FullMenu"
import { Login } from "./components/pages/user/Login"
import { Account } from "./components/pages/user/Account"
// dev-only sample profile page (stripped from production builds)
const ProfilePreview =
  process.env.NODE_ENV !== "production"
    ? require("./components/pages/user/ProfilePreview").ProfilePreview
    : null

//error boundary 
import { ErrorBoundary } from "./CustomErrorBoundary"
//Providers
import { ListProvider } from "./components/functions/ListContextWrapper"
import { ChatProvider } from "./components/functions/ChatContext"
//layouts
import { RootLayout } from "./layouts/RootLayout"
import { UserLayout } from "./layouts/UserLayout"

const router = createBrowserRouter(
  createRoutesFromElements(

    <Route path="/" element={<RootLayout />} errorElement={<ErrorBoundary />}>
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
    <Route path="grocery" element={<Grocery />} errorElement={<ErrorBoundary />} />
    <Route path="menu" element={<FullMenu />} errorElement={<ErrorBoundary />} />
    <Route path="checkout" element={<Checkout />} 
    errorElement={<ErrorBoundary />}
    />
    <Route path="user" element={<UserLayout />}
    errorElement={<ErrorBoundary />}
    
    >
       <Route index element={<Account />} />
      {ProfilePreview && <Route path="preview" element={<ProfilePreview />} />}
      <Route path="login" element={<Login />} 
      errorElement={<ErrorBoundary />}
      />
    </Route>
    </Route>

  )
)

export const App = () => (
  <ListProvider>
    <ChatProvider>
      <RouterProvider router={router} />
    </ChatProvider>
  </ListProvider>
)
