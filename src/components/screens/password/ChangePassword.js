import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { bindActionCreators } from 'redux';
import { actionCreators } from '../../../redux';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Col,
  Container,
  FloatingLabel,
  Form,
  Modal,
  Row,
} from 'react-bootstrap';
import axios from 'axios';
import Loading from '../../Loading/Loading';
import ErrorMessage from '../../ErrorMessage/ErrorMessage';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck,
  faXmark,
  faLock,
  faUnlock,
} from '@fortawesome/free-solid-svg-icons';
import './ChangePassword.css';

const ChangePassword = () => {
  const dispatch = useDispatch();
  const { logUser } = bindActionCreators(actionCreators, dispatch);
  const history = useNavigate();
  const [loading, setLoading] = useState(false);
  const [auth, setAuth] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordCondition, setPasswordCondition] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState(false);
  const [formValidated, setFormValidated] = useState(false);
  const [error, setError] = useState(false);
  const [fillOut, setFillOut] = useState(false);

  // useEffect(() => {
  //   setScreenWidth(window.screen.width);
  //   console.log(window.screen.width);
  // }, []);

  const passwordValidation = (str) => {
    try {
      const pattern = new RegExp(
        '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[-+_!@#$%^&*.,?]).+$'
      );

      if (!str || str.length === 0) {
        setPasswordCondition(false);
      } else {
        if (pattern.test(str)) {
          setPasswordCondition(true);
        } else {
          setPasswordCondition(false);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const checkUserPassword = async (e) => {
    try {
      e.preventDefault();
      const form = e.currentTarget;
      if (form.checkValidity() === false) {
        e.stopPropagation();
      }
      setFormValidated(true);
      if (form.checkValidity()) {
        if (
          oldPassword.length > 0 &&
          newPassword.length > 7 &&
          passwordMatch &&
          passwordCondition
        ) {
          setFillOut(true);
          setLoading(true);
          // fetch the student id and registation number
          const token = sessionStorage.getItem('token');
          let source = axios.CancelToken.source();
          const studentID = sessionStorage.getItem('studentID');
          const accountPassword = oldPassword;
          const matchUserOldPasswordURL = `https://cmuvs-api.onrender.com/api/user/reset-password`;
          const config = {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-type': 'application/json',
            },
            CancelToken: source.token,
          };
          await axios.post(
            matchUserOldPasswordURL,
            { studentID, accountPassword, newPassword },
            config
          );
          setLoading(false);
          setAuth(true);
        }
      }
    } catch (error) {
      setLoading(false);
      setError(true);
      setTimeout(() => {
        window.location.reload(true);
      }, 500);
    }
  };

  const logoutUser = () => {
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
  };

  return (
    <>
      {loading && <Loading />}
      {!loading && (
        <div className='page-container'>
          <Container
            className='formBox square border border-1 border-dark px-5 pt-4 pb-3'
            style={{
              maxWidth: '540px',
            }}
          >
            {error && (
              <ErrorMessage variant='danger'>{'Invalid password'}</ErrorMessage>
            )}
            <center>
              {error && fillOut && (
                <FontAwesomeIcon className='text-danger fa-4x' icon={faLock} />
              )}
              {!error && !auth && (
                <FontAwesomeIcon className='text-danger fa-4x' icon={faLock} />
              )}
              {auth && (
                <FontAwesomeIcon
                  className='text-success fa-4x'
                  icon={faUnlock}
                />
              )}

              <h4 className='resetPassword mt-2'>Update Password</h4>
            </center>
            <hr />
            <Form
              noValidate
              validated={formValidated}
              onSubmit={checkUserPassword}
              className='mt-4'
            >
              <Form.Group className='mb-2'>
                <FloatingLabel label='Enter current password'>
                  <Form.Control
                    required
                    placeholder='Enter current password*'
                    type='password'
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                  />
                </FloatingLabel>
              </Form.Group>
              <Form.Group className='mb-2'>
                <FloatingLabel label='Enter new password'>
                  <Form.Control
                    required
                    placeholder='Enter new password'
                    type='password'
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (confirmPassword === e.target.value) {
                        setPasswordMatch(true);
                      } else {
                        setPasswordMatch(false);
                      }
                      passwordValidation(e.target.value);
                    }}
                  />
                </FloatingLabel>
              </Form.Group>
              <Form.Group>
                <FloatingLabel label='Confirm new password'>
                  <Form.Control
                    required
                    placeholder='Confirm new password'
                    type='password'
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (newPassword === e.target.value) {
                        setPasswordMatch(true);
                      } else {
                        setPasswordMatch(false);
                      }
                    }}
                  />
                </FloatingLabel>
              </Form.Group>
              <br />
              <Container>
                <Row>
                  <Col xs={12}>
                    <span>
                      {passwordMatch ? (
                        <FontAwesomeIcon
                          icon={faCheck}
                          className='text-success fa-1x'
                          style={{
                            position: 'absolute',
                            marginTop: '3px',
                          }}
                        />
                      ) : (
                        <FontAwesomeIcon
                          icon={faXmark}
                          className='text-danger fa-1x'
                          style={{
                            position: 'absolute',
                            marginTop: '3px',
                          }}
                        />
                      )}
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                      <small>Password match</small>
                    </span>
                  </Col>
                  <Col xs={12}>
                    {newPassword.length > 7 ? (
                      <FontAwesomeIcon
                        icon={faCheck}
                        className='text-success fa-1x'
                        style={{
                          position: 'absolute',
                          marginTop: '3px',
                        }}
                      />
                    ) : (
                      <FontAwesomeIcon
                        icon={faXmark}
                        className='text-danger fa-1x'
                        style={{
                          position: 'absolute',
                          marginTop: '3px',
                        }}
                      />
                    )}
                    <span>
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                      <small>
                        Password must be composed of at least 8 characters in
                        length
                      </small>
                    </span>
                  </Col>
                  <Col>
                    <span>
                      {passwordCondition ? (
                        <FontAwesomeIcon
                          icon={faCheck}
                          className='text-success fa-1x'
                          style={{
                            position: 'absolute',
                            marginTop: '3px',
                          }}
                        />
                      ) : (
                        <FontAwesomeIcon
                          icon={faXmark}
                          className='text-danger fa-1x'
                          style={{
                            position: 'absolute',
                            marginTop: '3px',
                          }}
                        />
                      )}
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                      <small>
                        Password must be a combination of uppercase character,
                        lowercase character, numbers, and special characters
                      </small>
                    </span>
                  </Col>
                </Row>
              </Container>
              <center className='mt-3'>
                <Button type='submit' variant='success' size='lg'>
                  RESET PASSWORD
                </Button>
              </center>
            </Form>
          </Container>
          <Modal
            show={auth}
            keyboard={false}
            centered
            onHide={() => {
              setAuth(false);
              logoutUser();
            }}
          >
            <Modal.Header closeButton>
              <Modal.Title className='ms-auto'>CMU-VS</Modal.Title>
            </Modal.Header>
            <Modal.Footer>
              <span className='note'>
                <small>
                  Note: Your old password has been updated successfully. You
                  will be redirected to the login page.
                </small>
              </span>
            </Modal.Footer>
          </Modal>
        </div>
      )}
    </>
  );
};

export default ChangePassword;
