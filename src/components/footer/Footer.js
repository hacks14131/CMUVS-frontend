import React from 'react';
import './Footer.css';

const Footer = (props) => {
  const isLogin = props.isLogin;

  if (isLogin) {
    return (
      <footer>
        <div className='footer'>
          <center>
            Copyright &copy; Central Mindanao University - Voting System
          </center>
        </div>
      </footer>
    );
  } else {
    return <></>;
  }
};

export default Footer;
