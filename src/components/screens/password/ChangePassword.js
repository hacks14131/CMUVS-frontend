import React, { useState } from 'react';
import {
  Button,
  Col,
  Container,
  FloatingLabel,
  Form,
  Row,
} from 'react-bootstrap';
// import axios from 'axios';
import Loading from '../../Loading/Loading';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';
import './ChangePassword.css';

const ChangePassword = () => {
  const [loading, setLoading] = useState(false);
  const [auth, setAuth] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordCondition, setPasswordCondition] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState(false);
  const [formValidated, setFormValidated] = useState(false);

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
          // fetch the student id and registation number
          console.log('processing');
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      {loading && <Loading />}
      {!loading && (
        <div className='page-container'>
          <Container className='square border border-2 border-dark px-5 pt-4 pb-3'>
            <center>
              <h4 className='resetPassword'>Reset Password</h4>
            </center>
            <hr />
            <Form
              noValidate
              validated={formValidated}
              onSubmit={checkUserPassword}
              className='mt-3'
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
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Password match
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
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Password must be composed of
                      at least 8 characters in length
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
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Password must be a
                      combination of uppercase character, lowercase character,
                      numbers, and special characters
                    </span>
                  </Col>
                </Row>
              </Container>
              <center className='mt-3'>
                <Button type='submit' variant='success' size='lg'>
                  SUBMIT
                </Button>
              </center>
            </Form>
          </Container>
        </div>
      )}
    </>
  );
};

export default ChangePassword;
