import React, { useRef } from 'react';
import { useDispatch } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Container, Nav, Navbar, NavDropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { NavLink, Link } from 'react-router-dom';
import logo from '../../images/logo1.png';

import { actionCreators } from '../../redux';

import './Header.css';

const Header = (props) => {
  const dispatch = useDispatch();
  const { logUser } = bindActionCreators(actionCreators, dispatch);

  const isAdmin = useRef(
    sessionStorage.getItem('isAdmin') === 'true' ? true : false
  );
  const isCanvasser = useRef(
    sessionStorage.getItem('isCanvasser') === 'true' ? true : false
  );
  const isCandidate = useRef(
    sessionStorage.getItem('isCandidate') === 'true' ? true : false
  );

  const history = useNavigate();
  const isLogin = props.isLogin;

  if (isLogin) {
    return (
      <Navbar className='Navigator' collapseOnSelect expand='lg' sticky='top'>
        <Container>
          <Link to='home'>
            <img className='logo' src={logo} alt='' width='150' height='80' />
          </Link>
          <Navbar.Brand className='text-center'>
            <div className='home'>
              <NavLink to='home'>
                <mark className='green'>CMU</mark>
                <mark className='yellow'>- VS</mark>
              </NavLink>
            </div>
          </Navbar.Brand>

          <Navbar.Toggle aria-controls='responsive-navbar-nav' />
          <Navbar.Collapse id='navbar responsive-navbar-nav'>
            <Nav className='me-auto'>
              <Nav.Link className='home1' as={Link} to='/home'>
                HOME
              </Nav.Link>
              {(isCanvasser.current || isAdmin.current) && (
                <NavDropdown
                  title={<span className='text-white my-auto'>ADMIN</span>}
                  id='collasible-nav-dropdown'
                >
                  {/* <NavDropdown.Item
                  as={Link}
                  to='/createCollege-Department-Program'
                >
                  Add College/Department/Program
                </NavDropdown.Item> */}
                  {isAdmin.current && (
                    <NavDropdown.Item as={Link} to='/populate-user-via-csv'>
                      Import Students
                    </NavDropdown.Item>
                  )}
                  {isAdmin.current && (
                    <NavDropdown.Item as={Link} to='/electionCreation'>
                      Add Election
                    </NavDropdown.Item>
                  )}
                  {isAdmin.current && (
                    <NavDropdown.Item as={Link} to='/conclude-election'>
                      Conclude/Extend Election
                    </NavDropdown.Item>
                  )}
                  {isCanvasser.current && (
                    <NavDropdown.Item as={Link} to='/canvass-election'>
                      Canvass Election
                    </NavDropdown.Item>
                  )}
                  {isAdmin.current && (
                    <NavDropdown.Item as={Link} to='/election-history'>
                      Election History
                    </NavDropdown.Item>
                  )}
                </NavDropdown>
              )}
            </Nav>

            <Nav>
              {isCandidate.current && (
                <Nav.Link className='home1' as={Link} to='/my-profile'>
                  Profile
                </Nav.Link>
              )}

              <Nav.Link
                className='home1'
                onClick={() => {
                  logUser(false);
                  sessionStorage.removeItem('userID');
                  sessionStorage.removeItem('studentID');
                  sessionStorage.removeItem('auth');
                  sessionStorage.removeItem('token');
                  sessionStorage.removeItem('college');
                  sessionStorage.removeItem('department');
                  sessionStorage.removeItem('College and Department List');
                  sessionStorage.removeItem('voteValidated');
                  sessionStorage.removeItem('yearLevel');
                  sessionStorage.removeItem('isAdmin');
                  sessionStorage.removeItem('isCanvasser');
                  sessionStorage.removeItem('isCandidate');
                  history('/login');
                }}
              >
                Logout
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    );
  } else {
    return <div></div>;
  }
};

export default Header;
