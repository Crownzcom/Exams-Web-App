import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { NavLink } from "react-router-dom";
import { Badge, Navbar, Nav } from "react-bootstrap";
import { useAuth } from '../context/AuthContext'

const CustomNavbar = () => {
  const navigate = useNavigate()
  const { userInfo, sessionInfo, handleLogout } = useAuth();
  const [expanded, setExpanded] = useState(false);

  return (
    <Navbar
      bg="dark"
      variant="dark"
      expand="lg"
      className="shadow"
      sticky="top"
      expanded={expanded}
    >
      <Navbar.Brand as={NavLink} to="/" onClick={() => setExpanded(false)}>
        <img
          src="/img/logo.png"
          width="40"
          height="40"
          className="d-inline-block align-top"
          alt="React Bootstrap logo"
          style={{ borderRadius: '15px', marginLeft: '5px' }}
        />
        {/* CrownzCom */}
      </Navbar.Brand>
      <Navbar.Toggle
        aria-controls="basic-navbar-nav"
        onClick={() => setExpanded((expanded) => !expanded)}
      />
      <Navbar.Collapse id="basic-navbar-nav">
        <Nav className="ms-auto">
          {sessionInfo ? (
            <>
              <Nav.Link
                as={NavLink}
                to="/"
                onClick={() => setExpanded(false)}
              >
                Home
              </Nav.Link>
              <Nav.Link
                onClick={() => {
                  handleLogout();
                  setExpanded(false);
                }}
                as={NavLink}
                to="/sign-in"
              >
                Logout
              </Nav.Link>
              <Badge
                bg="primary"
                style={{ display: 'flex', justifyContent: 'center' }}
                onClick={() => { navigate('./profile') }}
              >
                <NavLink
                  className="nav-link"
                  to="/profile"
                  onClick={() => setExpanded(false)}
                >
                  {userInfo.firstName ? userInfo.firstName : 'Profile'}
                  {/* Profile */}
                </NavLink>
              </Badge>
            </>
          ) : (
            <>
              <Nav.Link
                as={NavLink}
                to="/sign-in"
                onClick={() => setExpanded(false)}
              >
                Login
              </Nav.Link>
              <Nav.Link
                as={NavLink}
                to="/sign-up"
                onClick={() => setExpanded(false)}
              >
                Sign up
              </Nav.Link>
            </>
          )}
          {/* <Nav.Link
            as={NavLink}
            to="/testing"
            onClick={() => setExpanded(false)}
          >
            Testing
          </Nav.Link> */}
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
};

export default CustomNavbar;
