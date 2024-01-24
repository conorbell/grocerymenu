// import {  
//   createBrowserRouter,
//   Route, 

//   createRoutesFromElements,
//   RouterProvider
// } from "react-router-dom"
// import React from "react"
// //pages
// import Main from "./components/main"
// import Breakfast from "./components/pages/menus/Breakfast"
// import Lunch from "./components/pages/menus/Lunch"
// import Dinner from "./components/pages/menus/Dinner"
// import Checkout from "./components/pages/menus/Checkout"
// import { Signup } from "./components/pages/user/Signup"
// import { Login } from "./components/pages/user/Login"

// //layouts
// import { RootLayout } from "./layouts/RootLayout"
// import { UserLayout } from "./layouts/UserLayout"

// const router = createBrowserRouter(
//   createRoutesFromElements(

//     <Route path="/" element={<RootLayout />} >
//       <Route index element={<Home />}

//     <Route path="breakfast" element={<Breakfast />} />
//     <Route path="lunch" element={<Lunch />} />
//     <Route path="dinner" element={<Dinner />} />
//     <Route path="checkout" element={<Checkout />} />
//     <Route path="user" element={<UserLayout />}>
//       <Route path="signup" element={<Signup />} />
//       <Route path="login" element={<Login />} />
//     </Route>
//     </Route>

//   )
// )

// export const Rootes = () =>{

//     return(
//         <>

       

//         <RouterProvider router={router} />

        
//         </>
//     )
// }