import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Loading from '../../Loading/Loading';
import {
  Button,
  Card,
  Container,
  FloatingLabel,
  Form,
  Modal,
  Table,
} from 'react-bootstrap';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();

  const seeElections = () => {
    try {
      navigate('/see-elections', {
        state: { electionList: election, votingState: votedElection },
      });
    } catch (error) {
      console.log(error);
    }
  };

  const [loading, setLoading] = useState(true);
  const [election, setElection] = useState([]);
  const [votedElection, setVotedElection] = useState([]);
  const universityElectionQuantity = useRef(0);
  const collegeElectionQuantity = useRef(0);
  const departmentElectionQuantity = useRef(0);
  const axiosReqID = useRef();
  const [showValidationForm, setShowValidationForm] = useState(false);
  const [userRegistrationNumber, setUserRegistrationNumber] = useState(0);
  const [userIDNumber, setUserIDNumber] = useState(0);
  const [formValidation, setFormValidation] = useState(false);
  const [validationFailed, setValidationFailed] = useState(false);
  const isAdmin = useRef(sessionStorage.getItem('isAdmin'));
  // const [isAdmin, setIsAdmin] = useState(false);
  // const [isCanvasser, setIsCanvasser] = useState(false);
  // const [isCandidate, setIsCandidate] = useState(false);

  const checkVoteStatus = async (copy, electionIdentifier) => {
    try {
      axiosReqID.current = axios.CancelToken.source();
      const token = sessionStorage.getItem('token');
      const userID = sessionStorage.getItem('userID');
      const electionID = copy[electionIdentifier]._id;
      const currentDate = new Date();
      const electionClosingDate = new Date(
        copy[electionIdentifier].electionClosingDate
      );
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-type': 'application/json',
        },
        cancelToken: axiosReqID.current.token,
      };
      const getVoteStatusURL = `https://cmuvs-api.onrender.com/api/userVoteHistory/status/${userID}/${electionID}`;
      await axios.get(getVoteStatusURL, config).then((res) => {
        if (
          res.data === null &&
          copy[electionIdentifier].electionStatus !== 'Finished' &&
          currentDate < electionClosingDate
        ) {
          setVotedElection((prevState) => {
            let temp = [...prevState];
            temp[electionIdentifier] = false;
            return temp;
          });
        } else {
          setVotedElection((prevState) => {
            let temp = [...prevState];
            temp[electionIdentifier] = true;
            return temp;
          });
        }
      });
    } catch (error) {}
  };

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    let interval = null;
    let time = 100;
    axiosReqID.current = axios.CancelToken.source();

    const timer = setTimeout(() => {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-type': 'application/json',
        },
        cancelToken: axiosReqID.current.token,
      };
      const fetchElections = () => {
        const userCollege = sessionStorage.getItem('college');
        const userDepartment = sessionStorage.getItem('department');
        const universityURL = 'https://cmuvs-api.onrender.com/api/election';
        const collegeURL = `https://cmuvs-api.onrender.com/api/election/college/${userCollege}`;
        const departmentURL = `https://cmuvs-api.onrender.com/api/election/department/${userDepartment}`;
        const getCollegeAndDepartmentListURL = `https://cmuvs-api.onrender.com/api/voters/list`;

        const universityElection = axios.get(universityURL, config);

        const collegeElection = axios.get(collegeURL, config);

        const departmentElection = axios.get(departmentURL, config);

        const getCollegeAndDepartmentListPromise = axios.get(
          getCollegeAndDepartmentListURL,
          config
        );

        Promise.all([
          universityElection,
          collegeElection,
          departmentElection,
          getCollegeAndDepartmentListPromise,
        ])
          .then(
            ([
              fetchUniversityElection,
              fetchCollegeElection,
              fetchDepartmentElection,
              getCollegeAndDepartmentListResult,
            ]) => {
              universityElectionQuantity.current = 0;
              collegeElectionQuantity.current = 0;
              departmentElectionQuantity.current = 0;
              for (let i = 0; i < fetchUniversityElection.data.length; i++) {
                if (
                  fetchUniversityElection.data[i].electionStatus === 'On-going'
                ) {
                  universityElectionQuantity.current =
                    universityElectionQuantity.current + 1;
                }
              }
              for (let i = 0; i < fetchCollegeElection.data.length; i++) {
                if (
                  fetchCollegeElection.data[i].electionStatus === 'On-going'
                ) {
                  collegeElectionQuantity.current =
                    collegeElectionQuantity.current + 1;
                }
              }
              for (let i = 0; i < fetchDepartmentElection.data.length; i++) {
                if (
                  fetchDepartmentElection.data[i].electionStatus === 'On-going'
                ) {
                  departmentElectionQuantity.current =
                    departmentElectionQuantity.current + 1;
                }
              }

              //   universityElectionQuantity.current =
              //   fetchUniversityElection.data.length;
              // collegeElectionQuantity.current =
              //   fetchCollegeElection.data.length;
              // departmentElectionQuantity.current =
              //   fetchDepartmentElection.data.length;

              // const today = new Date().getTime();
              // for (let i = 0; i < fetchUniversityElection.data.length; i++) {
              //   if (
              //     today <
              //     new Date(
              //       fetchUniversityElection.data[i].electionClosingDate
              //     ).getTime()
              //   ) {
              //     universityElectionQuantity.current =
              //       universityElectionQuantity.current + 1;
              //   }
              // }
              // for (let i = 0; i < fetchCollegeElection.data.length; i++) {
              //   if (
              //     today <
              //     new Date(
              //       fetchCollegeElection.data[i].electionClosingDate
              //     ).getTime()
              //   ) {
              //     collegeElectionQuantity.current =
              //       collegeElectionQuantity.current + 1;
              //   }
              // }
              // for (let i = 0; i < fetchDepartmentElection.data.length; i++) {
              //   if (
              //     today <
              //     new Date(
              //       fetchDepartmentElection.data[i].electionClosingDate
              //     ).getTime()
              //   ) {
              //     departmentElectionQuantity.current =
              //       departmentElectionQuantity.current + 1;
              //   }
              // }

              // collegeElectionQuantity.current =
              //   fetchCollegeElection.data.length;
              // departmentElectionQuantity.current =
              //   fetchDepartmentElection.data.length;
              if (!getCollegeAndDepartmentListResult.data.message) {
                sessionStorage.setItem(
                  'College and Department List',
                  JSON.stringify(getCollegeAndDepartmentListResult.data)
                );
              }
              let sortedDates = [
                ...fetchUniversityElection.data,
                ...fetchCollegeElection.data,
                ...fetchDepartmentElection.data,
              ];
              sortedDates = sortedDates.sort((a, b) =>
                new Date(a.electionClosingDate) >
                new Date(b.electionClosingDate)
                  ? 1
                  : -1
              );
              setElection((prevState) => {
                let temp = [...sortedDates];
                for (let i = 0; i < temp.length; i++) {
                  temp[i].electionOpeningDate = new Date(
                    temp[i].electionOpeningDate
                  );
                  temp[i].electionClosingDate = new Date(
                    temp[i].electionClosingDate
                  );
                }
                for (let i = 0; i < temp.length; i++) {
                  checkVoteStatus(temp, i);
                }
                return temp;
              });
            }
          )
          .then(() => {
            setLoading((prevState) => false);
          })
          .catch((error) => {
            if (axios.isCancel(error)) {
            } else {
              console.log('API req cancelled due to unmounting of component');
              throw error;
            }
          });
      };

      //method call to retrieve elections
      fetchElections();

      time = 3600000;
      interval = setInterval(() => {
        const fetchElections = () => {
          const userCollege = sessionStorage.getItem('college');
          const userDepartment = sessionStorage.getItem('department');
          const universityURL = 'https://cmuvs-api.onrender.com/api/election';
          const collegeURL = `https://cmuvs-api.onrender.com/api/election/college/${userCollege}`;
          const departmentURL = `https://cmuvs-api.onrender.com/api/election/department/${userDepartment}`;

          const universityElection = axios.get(universityURL, config);

          const collegeElection = axios.get(collegeURL, config);

          const departmentElection = axios.get(departmentURL, config);

          Promise.all([universityElection, collegeElection, departmentElection])
            .then(
              ([
                fetchUniversityElection,
                fetchCollegeElection,
                fetchDepartmentElection,
              ]) => {
                universityElectionQuantity.current = 0;
                collegeElectionQuantity.current = 0;
                departmentElectionQuantity.current = 0;

                for (let i = 0; i < fetchUniversityElection.data.length; i++) {
                  if (
                    fetchUniversityElection.data[i].electionStatus ===
                    'On-going'
                  ) {
                    universityElectionQuantity.current =
                      universityElectionQuantity.current + 1;
                  }
                }
                for (let i = 0; i < fetchCollegeElection.data.length; i++) {
                  if (
                    fetchCollegeElection.data[i].electionStatus === 'On-going'
                  ) {
                    collegeElectionQuantity.current =
                      collegeElectionQuantity.current + 1;
                  }
                }
                for (let i = 0; i < fetchDepartmentElection.data.length; i++) {
                  if (
                    fetchDepartmentElection.data[i].electionStatus ===
                    'On-going'
                  ) {
                    departmentElectionQuantity.current =
                      departmentElectionQuantity.current + 1;
                  }
                }

                // universityElectionQuantity.current =
                //   fetchUniversityElection.data.length;
                // collegeElectionQuantity.current =
                //   fetchCollegeElection.data.length;
                // departmentElectionQuantity.current =
                //   fetchDepartmentElection.data.length;
                let sortedDates = [
                  ...fetchUniversityElection.data,
                  ...fetchCollegeElection.data,
                  ...fetchDepartmentElection.data,
                ];
                sortedDates = sortedDates.sort((a, b) =>
                  new Date(a.electionClosingDate) >
                  new Date(b.electionClosingDate)
                    ? 1
                    : -1
                );
                setElection((prevState) => {
                  let temp = [...sortedDates];
                  for (let i = 0; i < temp.length; i++) {
                    temp[i].electionOpeningDate = new Date(
                      temp[i].electionOpeningDate
                    );
                    temp[i].electionClosingDate = new Date(
                      temp[i].electionClosingDate
                    );
                  }
                  for (let i = 0; i < temp.length; i++) {
                    checkVoteStatus(temp, i);
                  }
                  return temp;
                });
                // setLoading((prevState) => false);
              }
            )
            .then(() => {
              setLoading((prevState) => false);
            })
            .catch((error) => {
              if (axios.isCancel(error)) {
                console.log('API request cancelled');
              } else {
                console.log(error);
                throw error;
              }
            });
        };

        //method call to retrieve elections
        fetchElections();
      }, time);
    }, time);

    //continue here
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      axiosReqID.current.cancel();
    };
  }, []);

  const getSessionstorageValue = () => {
    try {
      if (sessionStorage.getItem('voteValidated') === 'true') {
        return true;
      }
      return false;
    } catch (error) {
      console.log(error);
    }
  };

  // const checkElectionQuantity = () => {
  //   try {
  //     if (
  //       (universityElectionQuantity.current === 0) &
  //         (collegeElectionQuantity.current === 0) &&
  //       departmentElectionQuantity.current === 0
  //     ) {
  //       return true;
  //     }
  //     return false;
  //   } catch (error) {}
  // };

  const validateVoter = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-type': 'application/json',
        },
      };
      const validateVoterURL = `https://cmuvs-api.onrender.com/api/voters/validate/voter`;
      const studentID = userIDNumber;
      const registrationNumber = userRegistrationNumber;
      const _id = sessionStorage.getItem('userID');

      await axios
        .post(validateVoterURL, { _id, studentID, registrationNumber }, config)
        .then((docs) => {
          if (docs.data) {
            sessionStorage.setItem('voteValidated', true);
            setLoading(false);
          } else {
            sessionStorage.setItem('voteValidated', false);
          }
          setShowValidationForm(false);
        });
    } catch (error) {
      //setShowValidationForm into false
      //show a new modal which will say 'Student with the following credentials was not found or not enrolled'
      setShowValidationForm(false);
      setValidationFailed(true);
      setUserRegistrationNumber(0);
      setUserIDNumber(0);
      sessionStorage.setItem('voteValidated', false);
      setLoading(false);
    }
  };

  const validateStudentCredential = async (e) => {
    try {
      e.preventDefault();
      const form = e.currentTarget;
      if (form.checkValidity() === false) {
        setFormValidation(true);
        e.stopPropagation();
      } else {
        setFormValidation(true);
        await validateVoter();
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
          {/* <Button variant='danger' onClick={createAdmin}>
            create admin
          </Button> */}
          {/* <Button variant='info' onClick={checkAdmin}>
            Check admin
          </Button> */}
          <Container className='py-4'>
            <Card
              className='card1 text-center'
              //border='dark'
              style={{
                backgroundColor: '#fafafa',
                // borderColor: 'black',
                // borderWidth: '2px',
              }}
            >
              <Card.Title>
                <h1
                  className='text-center my-4'
                  style={{
                    fontWeight: 'bold',
                    fontSize: '35px',
                  }}
                >
                  Central Mindanao University Voting System
                </h1>
              </Card.Title>
              <Card.Text className='text-muted text-danger'>
                {getSessionstorageValue() === true
                  ? 'Note: You can now view and participate to any available election'
                  : 'Note: You need to validate your account first before you can view or participate to any election.'}
              </Card.Text>
              <h1>
                {/* {console.log(sessionStorage.getItem('voteValidated'))} */}
                {(getSessionstorageValue() === true ||
                  isAdmin.current === 'true') && (
                  <Button
                    // disabled={checkElectionQuantity()}
                    variant='success'
                    onClick={(e) => {
                      seeElections();
                    }}
                  >
                    See Election
                  </Button>
                )}
                {getSessionstorageValue() === false &&
                  isAdmin.current === 'false' && (
                    <Button
                      variant='danger'
                      onClick={(e) => {
                        setShowValidationForm(true);
                      }}
                    >
                      Validate
                    </Button>
                  )}
              </h1>
              <Card.Footer className='text-muted'>
                <Table
                  responsive
                  bordered
                  hover
                  variant='dark'
                  className='my-4'
                >
                  <thead>
                    <tr>
                      <th>Election</th>
                      <th>On-going Elections</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>University Level Election</td>
                      <td>{universityElectionQuantity.current}</td>
                    </tr>
                    <tr>
                      <td>
                        {isAdmin.current === 'true'
                          ? 'College Level Election'
                          : sessionStorage.getItem('college')}
                      </td>
                      <td>{collegeElectionQuantity.current}</td>
                    </tr>
                    <tr>
                      <td>
                        {isAdmin.current === 'true'
                          ? 'Department Level Election'
                          : `Department of ${sessionStorage.getItem(
                              'department'
                            )}`}
                      </td>
                      <td>{departmentElectionQuantity.current}</td>
                    </tr>
                  </tbody>
                </Table>
              </Card.Footer>
            </Card>
            <Modal
              show={showValidationForm}
              backdrop='static'
              keyboard={false}
              centered
            >
              <Modal.Header>
                <Modal.Title>
                  <h3 className='text-center'>Validation Form</h3>
                </Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Form
                  noValidate
                  validated={formValidation}
                  onSubmit={validateStudentCredential}
                >
                  <Form.Group>
                    <FloatingLabel label='Enrollment Registration Number'>
                      <Form.Control
                        required
                        type='number'
                        min={1}
                        placeholder='Enrollment Registration Number'
                        value={userRegistrationNumber}
                        onChange={(e) => {
                          setUserRegistrationNumber(e.target.value);
                        }}
                        onWheel={(e) => e.currentTarget.blur()}
                      />
                      <Form.Control.Feedback type='invalid'>
                        Please provide your enrollment registration number.
                      </Form.Control.Feedback>
                    </FloatingLabel>
                  </Form.Group>
                  <Form.Group>
                    <FloatingLabel label='Student ID Number'>
                      <Form.Control
                        required
                        type='number'
                        min={1}
                        placeholder='ID Number'
                        value={userIDNumber}
                        onChange={(e) => {
                          setUserIDNumber(e.target.value);
                        }}
                        onWheel={(e) => e.currentTarget.blur()}
                      />
                      <Form.Control.Feedback type='invalid'>
                        Please provide your student id number.
                      </Form.Control.Feedback>
                    </FloatingLabel>
                  </Form.Group>

                  <Button
                    variant='info'
                    className='float-end  mt-2 mx-1'
                    type='submit'
                  >
                    validate
                  </Button>
                  <Button
                    variant='danger'
                    className='float-end mt-2 mx-1'
                    onClick={() => {
                      setShowValidationForm(false);
                    }}
                  >
                    Close
                  </Button>
                </Form>
              </Modal.Body>
            </Modal>
            <Modal
              show={validationFailed}
              onHide={() => setValidationFailed(false)}
            >
              <Modal.Header className='justify-content-center'>
                <Modal.Title>Validation Failed</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <h5>
                  Invalid student credentials or student might not be currently
                  enroll.
                </h5>
              </Modal.Body>
              <Modal.Footer>
                <Button
                  variant='danger'
                  onClick={() => {
                    setValidationFailed(false);
                  }}
                >
                  Close
                </Button>
              </Modal.Footer>
            </Modal>
          </Container>
        </div>
      )}
    </>
  );
};

export default Home;
