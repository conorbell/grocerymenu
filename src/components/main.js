import React from 'react';
// import free from '../../public/oldStuff/freelist.gif';

const Main = (props) => {
  return (
    <div>
      <h1>yes i am very excited to get groceries haha</h1>

      <div className="welcome">
        <div className="small ones">
          <img src={require('../../public/oldStuff/amazing_free_stuff.gif')} />
          <img src={require('../../public/oldStuff/office97.gif')} />
          <img src={require('../../public/oldStuff/pic.gif')} />
          <img src={require('../../public/oldStuff/tombbutton1.gif')} />
        </div>
        <img src={require('../../public/oldStuff/worms.gif')} />
        <img src={require('../../public/oldStuff/uhhh.gif')} />
        <img src={require('../../public/oldStuff/gotoworlda.gif')} />

        <h1>GET THEM FORKS READY!!!!</h1>
        <a>
          <img src={require('../../public/oldStuff/freelist.gif')} />
        </a>
        <p> I can't wait to go to the grocery store!</p>
        <p>You've made your last delivery kid.</p>
        <p>Sorry you got twisted up in this scene</p>
        <p>
          from where you're kneeling it must seem like an 18-carat run of bad
          luck
        </p>
        <p>truth is...the game was rigged from the start</p>
        <p></p>

        <img src={require('../../public/oldStuff/lower.jpg')} />
      </div>
    </div>
  );
};

export default Main;
