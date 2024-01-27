import React from 'react';
// import free from '../../public/oldStuff/freelist.gif';

const Main = (props) => {
  return (
    <div>
      <h1>yes i am very excited to get groceries haha</h1>

      <div className="welcome">
        <h1>GET THEM FORKS READY!!!!</h1>
        <img src={require('../../public/oldStuff/lower.jpg')} />
      </div>
    </div>
  );
};

export default Main;
