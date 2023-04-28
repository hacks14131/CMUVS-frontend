import React, { useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { bindActionCreators } from 'redux';

import { actionCreators } from '../../../redux';
import './LoginPage.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { Container, Row, Col, Card, CardBody } from 'reactstrap';
import Loading from '../../Loading/Loading';
import ErrorMessage from '../../ErrorMessage/ErrorMessage';
import { Button, FloatingLabel, Form, Modal } from 'react-bootstrap';
import logo from '../../../images/logo3.png';

const LoginPage = () => {
  const state = useSelector((state) => state.reducers.userLogReducer);

  const updateState = async (userData, college, department, yearLevel) => {
    try {
      const canvasserSource = axios.CancelToken.source();
      let config = {
        headers: {
          'Content-type': 'application/json',
        },
        cancelToken: canvasserSource.token,
      };
      // const adminSource = axios.CancelToken.source();
      // const checkForAdminRightsURL = `https://cmuvs-api.onrender.com/api/admin-check/${userData._id}`;

      // await axios
      //   .get(checkForAdminRightsURL, config)
      //   .then((checkForAdminRightsResult) => {
      //     if (checkForAdminRightsResult.data[0]._id) {
      //       sessionStorage.setItem('isAdmin', true);
      //     }
      //   })
      //   .catch((error) => {
      //     sessionStorage.setItem('isAdmin', false);
      //   });
      sessionStorage.setItem('isAdmin', false);
      const checkForCanvasserRightsURL = `https://cmuvs-api.onrender.com/api/canvasser-rights-check/${userData._id}`;
      config = {
        headers: {
          'Content-type': 'application/json',
        },
        cancelToken: canvasserSource.token,
      };

      await axios
        .get(checkForCanvasserRightsURL, config)
        .then((checkForCanvasserRightsResult) => {
          // console.log(checkForCanvasserRightsResult);
          if (checkForCanvasserRightsResult.data[0]._id) {
            sessionStorage.setItem('isCanvasser', true);
          }
        })
        .catch((error) => {
          sessionStorage.setItem('isCanvasser', false);
        });

      const candidateSource = axios.CancelToken.source();
      const checkForElectionCandidateRightsURL = `https://cmuvs-api.onrender.com/api/election-candidate-check/${userData._id}`;
      config = {
        headers: {
          'Content-type': 'application/json',
        },
        cancelToken: candidateSource.token,
      };

      await axios
        .get(checkForElectionCandidateRightsURL, config)
        .then((checkForElectionCandidateRightsResult) => {
          if (checkForElectionCandidateRightsResult.data._id) {
            sessionStorage.setItem('isCandidate', true);
          }
        })
        .catch((error) => {
          sessionStorage.setItem('isCandidate', false);
        });

      sessionStorage.setItem('userID', userData._id);
      sessionStorage.setItem('voteValidated', false);
      sessionStorage.setItem('studentID', userData.studentID);
      sessionStorage.setItem('token', userData.token);
      sessionStorage.setItem('auth', userData.auth);
      sessionStorage.setItem('college', college);
      sessionStorage.setItem('department', department);
      sessionStorage.setItem('yearLevel', yearLevel);
      logUser(true);
      setLoading(false);
      setError(false);
    } catch (error) {
      console.log('error catch block');
    }
  };

  const dispatch = useDispatch();
  const { logUser } = bindActionCreators(actionCreators, dispatch);

  const history = useNavigate();

  const [loginFormValidate, setLoginFormValidate] = useState(false);
  const [createAccValidated, setCreateAccValidated] = useState();
  const [createCMUVSAccount, setCreateCMUVSAccount] = useState(false);
  const [haveCMUVSAccount, setHaveCMUVSAccount] = useState(false);
  const [username, setUsername] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginFormDisplay, setLoginFormDisplay] = useState(true);
  const [signUpFormDisplay, setSignUpFormDisplay] = useState(false);
  const [formValidated, setFormValidated] = useState(false);
  // const [passwordLogin, setPasswordLogin] = useState('');
  const [showPassword1, setShowPassword1] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [userInfo, setUserInfo] = useState({
    firstName: '',
    familyName: '',
    studentID: '',
    registrationNumber: '',
    username: '',
    password: '',
    confirmPassword: '',
    passwordMatch: false,
    validPassword: false,
  });

  const passwordMatch = useRef(false);
  const validPassword = useRef(false);
  const studentData = useRef({
    _id: '',
    studentID: 0,
    firstName: '',
    middleName: '',
    familyName: '',
    college: '',
    department: '',
    program: '',
    yearLevel: 0,
    withPE: false,
  });

  const loginHandler = async (e) => {
    try {
      e.preventDefault();
      const form = e.currentTarget;
      setLoginFormValidate(true);
      if (!form.checkValidity()) {
        e.stopPropagation();
      } else {
        const config = {
          headers: {
            'Content-type': 'application/json',
          },
        };
        setLoading(true);

        await axios
          .post(
            'https://cmuvs-api.onrender.com/api/login',
            {
              username,
              accountPassword,
            },
            config
          )
          .then(async (res) => {
            if (res.data.auth) {
              const studentInfo = res.data;
              const _id = res.data._id;
              const studentID = res.data.studentID;
              const getUserLatestInfoURL = `https://cmuvs-api.onrender.com/api/voters/user/data/get`;
              let college = '';
              let department = '';
              let yearLevel = '';

              await axios
                .post(getUserLatestInfoURL, { _id, studentID }, config)
                .then(async (docs) => {
                  if (docs) {
                    const _id = docs.data._id;
                    college = docs.data.college;
                    department = docs.data.department;
                    yearLevel = docs.data.yearLevel;

                    if (
                      studentInfo.college !== college ||
                      studentInfo.department !== department ||
                      studentInfo.yearLevel !== yearLevel
                    ) {
                      const token = studentInfo.token;
                      const newConfig = {
                        headers: {
                          Authorization: `Bearer ${token}`,
                          'Content-type': 'application/json',
                        },
                      };
                      const patchUserInfoURL = `https://cmuvs-api.onrender.com/api/user/update-user-information/${_id}`;
                      await axios
                        .patch(
                          patchUserInfoURL,
                          { college, department, yearLevel },
                          newConfig
                        )
                        .then(() => {})
                        .catch((error) => console.log(error));
                    }
                  }
                })
                .catch((error) => console.log(error));
              await updateState(res.data, college, department, yearLevel);
            } else {
              setLoading(false);
              logUser(false);
              setAccountPassword('');
              setError(true);
            }
          });
        history('/home');
      }
    } catch (error) {
      const config = {
        headers: {
          'Content-type': 'application/json',
        },
      };
      await axios
        .get(
          `https://cmuvs-api.onrender.com/api/admin-check/${username}/${accountPassword}`,
          config
        )
        .then((docs) => {
          sessionStorage.setItem('userID', docs.data._id);
          sessionStorage.setItem('isAdmin', true);
          sessionStorage.setItem('token', docs.data.token);
          sessionStorage.setItem('auth', docs.data.auth);
          sessionStorage.setItem('isCandidate', false);
          sessionStorage.setItem('isCanvasser', false);
          sessionStorage.setItem('college', 'ALL');
          sessionStorage.setItem('department', 'ALL');
          logUser(true);
          setLoading(false);
          setError(false);
          history('/home');
        })
        .catch((error) => {
          setLoading(false);
          logUser(false);
          setAccountPassword('');
          setError(true);
        });
    }
  };

  const postCMUVSUserAccount = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-type': 'application/json',
        },
      };

      const postCMUVSUserAccountURL = `https://cmuvs-api.onrender.com/api/user`;
      const _id = studentData.current._id;
      const studentID = studentData.current.studentID;
      const firstName = studentData.current.firstName;
      const middleName = studentData.current.middleName;
      const familyName = studentData.current.familyName;
      const college = studentData.current.college;
      const department = studentData.current.department;
      const program = studentData.current.program;
      const yearLevel = studentData.current.yearLevel;
      const withPE = studentData.current.withPE;
      const username = userInfo.studentID + userInfo.familyName;
      const password = userInfo.password;

      await axios
        .post(
          postCMUVSUserAccountURL,
          {
            _id,
            studentID,
            firstName,
            middleName,
            familyName,
            college,
            department,
            program,
            yearLevel,
            withPE,
            username,
            password,
          },
          config
        )
        .then(() => {
          setSignUpFormDisplay(false);
          setLoginFormDisplay(true);
          setLoading(false);
        });
    } catch (error) {}
  };

  const checkDTODatabase = async () => {
    try {
      const config = {
        headers: {
          'Content-type': 'application/json',
        },
      };

      const checkDTODBURL = `https://cmuvs-api.onrender.com/api/voters/auth-user`;
      const studentID = userInfo.studentID;
      const firstName = userInfo.firstName;
      const familyName = userInfo.familyName;
      const registrationNumber = userInfo.registrationNumber;

      await axios
        .post(
          checkDTODBURL,
          { studentID, firstName, familyName, registrationNumber },
          config
        )
        .then((docs) => {
          studentData.current = docs.data;
          postCMUVSUserAccount();
        });
    } catch (error) {
      console.log(error);
    }
  };

  const createAccount = async (e) => {
    try {
      e.preventDefault();
      const form = e.currentTarget;

      //password validations
      if (userInfo.password === userInfo.confirmPassword) {
        passwordMatch.current = true;
      } else {
        passwordMatch.current = false;
      }
      if (
        userInfo.password.match(
          /^(?=.*?[A-Z])(?=(.*[a-z]){1,})(?=(.*[\d]){1,})(?=(.*[\W]){1,})(?!.*\s).{8,}$/
        ) &&
        userInfo.confirmPassword.match(
          /^(?=.*?[A-Z])(?=(.*[a-z]){1,})(?=(.*[\d]){1,})(?=(.*[\W]){1,})(?!.*\s).{8,}$/
        )
      ) {
        validPassword.current = true;
      } else {
        validPassword.current = false;
        setUserInfo((prevState) => {
          let temp = { ...prevState };
          temp.password = '';
          temp.confirmPassword = '';
          return temp;
        });
      }

      //action if form is valid
      if (
        form.checkValidity() === true &&
        passwordMatch.current === true &&
        validPassword.current === true
      ) {
        setLoading(true);
        setCreateAccValidated(true);
        checkDTODatabase();
      } else {
        setCreateAccValidated(true);
        e.stopPropagation();
      }
    } catch (error) {}
  };

  const validateDTODBUserCredentials = async (CMUVSValidation) => {
    try {
      if (CMUVSValidation) {
        //what to do if user already have an existing account in the cmuvs app database
        setLoading(false);
        setHaveCMUVSAccount(true);
      } else {
        //what to do if user do not have an existing account in the cmuvs app database
        setLoading(false);
        setCreateCMUVSAccount(true);
        setSignUpFormDisplay(false);
      }
    } catch (error) {}
  };

  const validateCMUVSUserCredentials = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-type': 'application/json',
        },
      };

      const checkCredentialsCMUVSURL = `https://cmuvs-api.onrender.com/api/user/sign-up-validator`;

      const firstName = userInfo.firstName;
      const familyName = userInfo.familyName;
      const studentID = userInfo.studentID;

      await axios
        .post(
          checkCredentialsCMUVSURL,
          { firstName, familyName, studentID },
          config
        )
        .then(() => {
          validateDTODBUserCredentials(true);
          setLoading(false);
        });
    } catch (error) {
      await validateDTODBUserCredentials(false);
    }
  };

  const createLoginCredential = async (e) => {
    try {
      setLoading(true);
      e.preventDefault();
      const form = e.currentTarget;
      if (!form.checkValidity()) {
        setFormValidated(true);
        e.stopPropagation();
      } else {
        setFormValidated(true);
        await validateCMUVSUserCredentials();
      }
    } catch (error) {
      console.log(error);
    }
  };

  // const createAdmin = async () => {
  //   try {
  //     const config = {
  //       headers: {
  //         'Content-type': 'application/json',
  //       },
  //     };
  //     const createAdminURL = `https://cmuvs-api.onrender.com/api/admin-check/${username}/${accountPassword}`;
  //     await axios
  //       .post(createAdminURL, config)
  //       .then((docs) => console.log(docs))
  //       .catch((error) => console.log(error));
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };

  if (state) {
    return <Navigate to='/home' />;
  } else {
    return (
      <div className='main'>
        {/* <Button variant='info' onClick={createAdmin}>
          Create Admin
        </Button> */}
        <Container>
          {error && (
            <ErrorMessage variant='danger'>
              {'Invalid username or password'}
            </ErrorMessage>
          )}
          {loading && <Loading />}
          <div className='inv'></div>
          {!loading && (
            <Row>
              <Col />
              {loginFormDisplay && (
                <Col lg='4'>
                  <Card
                    className='intro p-4'
                    body
                    style={{
                      backgroundColor: '#ececec',
                      borderColor: 'black',
                      borderWidth: '2px',
                    }}
                  >
                    <div>
                      <img
                        className='cmulogo'
                        src={logo}
                        alt=''
                        width='250'
                        height='150'
                      />
                    </div>

                    <h1 className='title'>CMU - VS</h1>
                    <h6 className='sub'>
                      Central Mindanao University - Voting System
                    </h6>
                    <hr
                      className='line'
                      style={{
                        backgroundColor: 'green',
                        height: '3px',
                      }}
                    />
                    <Card className='form' body color='primary'>
                      <CardBody>
                        <div className='h-auto d-inline-block'>
                          <Form
                            noValidate
                            validated={loginFormValidate}
                            onSubmit={loginHandler}
                          >
                            <Form.Group
                              className='mb-2'
                              controlId='formBasicEmail'
                            >
                              <Form.Control
                                required
                                type='text'
                                value={username}
                                placeholder='Enter username'
                                onChange={(e) => setUsername(e.target.value)}
                              />
                            </Form.Group>

                            <Form.Group
                              className='mb-2'
                              controlId='formBasicPassword'
                            >
                              <Form.Control
                                required
                                // type={passwordLogin ? 'text' : 'password'}
                                type='password'
                                value={accountPassword}
                                placeholder='Enter password'
                                onChange={(e) =>
                                  setAccountPassword(e.target.value)
                                }
                              />
                              {/* {accountPassword !== '' && (
                                <Container className='faIconMain'>
                                  <FontAwesomeIcon
                                    icon={passwordLogin ? faEyeSlash : faEye}
                                    onClick={() => {
                                      setPasswordLogin(
                                        (prevState) => !prevState
                                      );
                                    }}
                                  />
                                </Container>
                              )} */}
                            </Form.Group>

                            <Button
                              className='mb-3'
                              variant='success'
                              type='submit'
                            >
                              Login
                            </Button>
                          </Form>
                        </div>
                        {/* <Container className='text-muted'>
                          Don't have an account?{' '}
                          <u
                            className='text-primary'
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                              setError(false);
                              setLoginFormDisplay(false);
                              setSignUpFormDisplay(true);
                            }}
                          >
                            Sign up
                          </u>
                        </Container> */}
                      </CardBody>
                    </Card>
                  </Card>
                </Col>
              )}
              {signUpFormDisplay && (
                <Col lg='4'>
                  <Card
                    className='intro p-4'
                    body
                    style={{
                      backgroundColor: 'transparent',
                      borderColor: 'black',
                      borderWidth: '2px',
                    }}
                  >
                    <Card
                      className='intro p-4'
                      body
                      color='primary'
                      style={{
                        backgroundColor: 'transparent',
                        borderColor: 'black',
                        borderWidth: '2px',
                      }}
                    >
                      <h5 className='text-black'>Validation Form</h5>
                      <Form
                        noValidate
                        validated={formValidated}
                        onSubmit={createLoginCredential}
                      >
                        <Form.Group className='my-2'>
                          <FloatingLabel
                            label='First Name'
                            controlId='inputFirstName'
                          >
                            <Form.Control
                              required
                              type='text'
                              placeholder='Input First Name'
                              value={userInfo.firstName}
                              onChange={(e) => {
                                setUserInfo((prevState) => {
                                  let temp = { ...prevState };
                                  temp.firstName = e.target.value;
                                  return temp;
                                });
                              }}
                            />

                            <Form.Control.Feedback type='invalid'>
                              Please provide your first name.
                            </Form.Control.Feedback>
                          </FloatingLabel>
                        </Form.Group>
                        <Form.Group className='my-2'>
                          <FloatingLabel
                            label='Family Name'
                            controlId='inputFamilyName'
                          >
                            <Form.Control
                              required
                              type='text'
                              placeholder='Input Family Name'
                              value={userInfo.familyName}
                              onChange={(e) => {
                                setUserInfo((prevState) => {
                                  let temp = { ...prevState };
                                  temp.familyName = e.target.value;
                                  return temp;
                                });
                              }}
                            />

                            <Form.Control.Feedback type='invalid'>
                              Please provide your family name.
                            </Form.Control.Feedback>
                          </FloatingLabel>
                        </Form.Group>
                        <Form.Group className='my-2'>
                          <FloatingLabel
                            label='ID Number'
                            controlId='inputIDNumber'
                          >
                            <Form.Control
                              required
                              type='number'
                              min={1}
                              placeholder='Input ID Number'
                              value={userInfo.studentID}
                              onWheel={(e) => e.currentTarget.blur()}
                              onChange={(e) => {
                                setUserInfo((prevState) => {
                                  let temp = { ...prevState };
                                  temp.studentID = parseInt(e.target.value);
                                  return temp;
                                });
                              }}
                            />

                            <Form.Control.Feedback type='invalid'>
                              Please provide your student id number.
                            </Form.Control.Feedback>
                          </FloatingLabel>
                        </Form.Group>

                        <Button
                          type='submit'
                          className='float-end mb-3'
                          variant='danger'
                        >
                          Submit
                        </Button>
                      </Form>
                      <Container className='text-muted'>
                        Already have an account?{' '}
                        <u
                          className='text-primary'
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            setSignUpFormDisplay((prevState) => !prevState);
                            setLoginFormDisplay((prevState) => !prevState);
                            setFormValidated(false);
                          }}
                        >
                          Sign in
                        </u>
                      </Container>
                    </Card>
                  </Card>
                  <Modal
                    show={haveCMUVSAccount}
                    onHide={() => setHaveCMUVSAccount(false)}
                    size='lg'
                    backdrop='static'
                    keyboard={false}
                    centered
                    animation
                  >
                    <Modal.Header
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        fontWeight: 'bold',
                      }}
                    >
                      <h3>CMU-VS</h3>
                    </Modal.Header>
                    <Modal.Body>
                      <h5 className='text-red'>
                        It seems you already have an existing account for
                        CMU-VS. Please use that account to log in. Thank you
                      </h5>
                    </Modal.Body>
                    <Modal.Footer>
                      <Button
                        className='float-end'
                        variant='danger'
                        onClick={() => {
                          setHaveCMUVSAccount(false);
                          setSignUpFormDisplay((prevState) => !prevState);
                          setLoginFormDisplay((prevState) => !prevState);
                        }}
                      >
                        Close
                      </Button>
                    </Modal.Footer>
                  </Modal>
                </Col>
              )}{' '}
              {createCMUVSAccount && (
                <Col xs={12} sm={12} md={6} lg={4}>
                  <Card
                    className='intro p-4'
                    body
                    style={{
                      backgroundColor: 'transparent',
                      borderColor: 'black',
                      borderWidth: '2px',
                    }}
                  >
                    <h3 style={{ fontWeight: 'bold' }}>CREATE ACCOUNT</h3>

                    <Card className='form' body color='primary'>
                      <Form
                        noValidate
                        validated={createAccValidated}
                        onSubmit={createAccount}
                      >
                        <Form.Group>
                          <FloatingLabel label='Enrollment Registration #'>
                            <Form.Control
                              required
                              type='number'
                              min={1}
                              value={userInfo.registrationNumber}
                              placeholder='Enter your registration number'
                              onChange={(e) => {
                                setUserInfo((prevState) => {
                                  let temp = { ...prevState };
                                  temp.registrationNumber = parseInt(
                                    e.target.value
                                  );
                                  return temp;
                                });
                              }}
                            />
                            <Form.Control.Feedback type='invalid'>
                              Please input your enrollment registration number.
                            </Form.Control.Feedback>
                          </FloatingLabel>
                        </Form.Group>
                        <Form.Group className='my-3'>
                          <FloatingLabel
                            label='Default Username'
                            controlId='usernameInput'
                          >
                            <Form.Control
                              disabled
                              type='text'
                              placeholder='default username'
                              value={`${
                                userInfo.studentID
                              }_${userInfo.familyName.toLocaleLowerCase()}`}
                              onChange={(e) => {
                                setUserInfo((prevState) => {
                                  let temp = { ...prevState };
                                  temp.username =
                                    temp.studentID +
                                    '_' +
                                    temp.familyName.toLocaleLowerCase();
                                  return temp;
                                });
                              }}
                            />
                          </FloatingLabel>
                        </Form.Group>
                        <Form.Group className='my-3'>
                          <FloatingLabel
                            label='Password*'
                            controlId='passwordInput'
                          >
                            <Form.Control
                              required
                              type={showPassword1 ? 'text' : 'password'}
                              placeholder='Input Enrollment Registration Number'
                              value={userInfo.password}
                              onChange={(e) => {
                                setUserInfo((prevState) => {
                                  let temp = { ...prevState };
                                  temp.password = e.target.value;
                                  return temp;
                                });
                              }}
                            />
                            {userInfo.password !== '' && (
                              <Container className='faIcon'>
                                <FontAwesomeIcon
                                  icon={showPassword1 ? faEyeSlash : faEye}
                                  onClick={() => {
                                    setShowPassword1((prevState) => !prevState);
                                  }}
                                />
                              </Container>
                            )}
                          </FloatingLabel>
                        </Form.Group>
                        <Form.Group className='my-3'>
                          <FloatingLabel
                            label='Confirm Password*'
                            controlId='confirmPasswordInput'
                          >
                            <Form.Control
                              required
                              type={showPassword2 ? 'text' : 'password'}
                              placeholder='Input Enrollment Registration Number'
                              value={userInfo.confirmPassword}
                              onChange={(e) => {
                                setUserInfo((prevState) => {
                                  let temp = { ...prevState };
                                  temp.confirmPassword = e.target.value;
                                  return temp;
                                });
                              }}
                            ></Form.Control>

                            {userInfo.confirmPassword !== '' && (
                              <Container className='faIcon2'>
                                <FontAwesomeIcon
                                  icon={showPassword2 ? faEyeSlash : faEye}
                                  onClick={() => {
                                    setShowPassword2((prevState) => !prevState);
                                  }}
                                />
                              </Container>
                            )}

                            {/* <Form.Control.Feedback type='invalid'>
                              Password must be alphanumeric and must be at least
                              8 in characters length.
                            </Form.Control.Feedback> */}
                            {/* <Form.Control.Feedback type='invalid'>
                              {!passwordMatch.current ? 'Password does not match.'
                                : 'Please provide your password.'}
                            </Form.Control.Feedback> */}
                            {!passwordMatch.current ? (
                              <Form.Control.Feedback type='invalid'>
                                Password does not match.
                              </Form.Control.Feedback>
                            ) : (
                              <Form.Control.Feedback type='invalid'>
                                {!validPassword.current
                                  ? 'Passwords must be alphanumeric (uppercase, lowercase, numbers, and special characters) and be at least 8 characters long.'
                                  : 'Please provide a password.'}
                              </Form.Control.Feedback>
                            )}
                          </FloatingLabel>
                        </Form.Group>
                        <Button
                          className='float-end'
                          variant='danger'
                          type='submit'
                        >
                          SUBMIT
                        </Button>
                      </Form>
                    </Card>
                  </Card>
                </Col>
              )}
              <Col />
            </Row>
          )}
        </Container>
        {/* <Button
          onClick={() => {
            checkHeader();
          }}
        >
          check header
        </Button> */}
      </div>
    );
  }
};

export default LoginPage;
