// import React, { createContext, useContext, useState, useEffect } from 'react';

// const UserContext = createContext();

// const UserProvider = ({ children }) => {
//   const [validUser, setValidUser] = useState(() => {
//     const storedUser = localStorage.getItem('validUser');
//     return storedUser ? JSON.parse(storedUser) : false;
//   });
//   const login = (userData) => {
//     setValidUser(true);
//   };

//   const logout = () => {
//     setValidUser(false);
//   };

//   useEffect(() => {
//     localStorage.setItem('validUser', JSON.stringify(validUser));
//   }, [validUser]);

//   const userValue = {
//     validUser,
//     login,
//     logout,
//   };

//   return (
//     <UserContext.Provider value={userValue}>{children}</UserContext.Provider>
//   );
// };

// const useUser = () => {
//   const context = useContext(UserContext);

//   if (!context) {
//     throw new Error('useUser must be used within a user provider');
//   }
//   return context;
// };

// export { UserProvider, useUser };
