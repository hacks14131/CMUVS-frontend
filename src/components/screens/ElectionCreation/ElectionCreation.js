import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Alert,
  Button,
  Col,
  Container,
  FloatingLabel,
  Form,
  FormGroup,
  ListGroup,
  Modal,
  Row,
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faEdit } from '@fortawesome/free-solid-svg-icons';
import DateTimePicker from 'react-datetime-picker';

import Loading from '../../Loading/Loading';

import './ElectionCreation.css';
// import { Error } from 'mongoose';

function ElectionCreation() {
  const history = useNavigate();
  /*
    fetching the list of colleges, departments, and program should be done via API call 
    to ensure that the list is always updated. Below variable is for frontend testing purpose only
  */

  useEffect(() => {
    setCollegeAndDepList((prevState) => {
      const temp = JSON.parse(
        sessionStorage.getItem('College and Department List')
      );
      return temp;
    });
    //set items to retain previos value even after page refresh
    //election
    //initialElectionPosition
    //canvass officer
    if (sessionStorage.getItem('election') !== null) {
      setElection(JSON.parse(sessionStorage.getItem('election')));
    }
    if (sessionStorage.getItem('initialElectionPosition') !== null) {
      setInitialElectionPosition(
        JSON.parse(sessionStorage.getItem('initialElectionPosition'))
      );
    }
    if (sessionStorage.getItem('canvassOfficer') !== null) {
      setCanvassOfficer(JSON.parse(sessionStorage.getItem('canvassOfficer')));
    }
    if (sessionStorage.getItem('departmentParent') !== null) {
      setDepartmentParent(
        JSON.parse(sessionStorage.getItem('departmentParent'))
      );
    }

    setLoading((prevState) => !prevState);
    return () => {
      sessionStorage.removeItem('election');
      sessionStorage.removeItem('initialElectionPosition');
      sessionStorage.removeItem('canvassOfficer');
      sessionStorage.removeItem('departmentParent');
    };
  }, []);

  const registerElection = async (e) => {
    try {
      e.preventDefault();
      const token = sessionStorage.getItem('token');
      setLoading((prevState) => !prevState);
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-type': 'application/json',
        },
      };

      const postElectionCanvassURL =
        'https://cmuvs-api.onrender.com/api/electionCanvass';
      const postEletionPositionURL =
        'https://cmuvs-api.onrender.com/api/electionPosition';
      //let expectedVoterURL = 'https://cmuvs-api.onrender.com/api/voters/expected-voter-number';

      let electionPositionsPromise = [];
      let electionID = '';

      const { electionName, electionLevel, electionScope, electionStatus } =
        election;
      const {
        openingDate: electionOpeningDate,
        closingDate: electionClosingDate,
      } = dateReadable;
      await axios
        .post(
          'https://cmuvs-api.onrender.com/api/election',
          {
            electionName,
            electionLevel,
            electionScope,
            electionStatus,
            electionOpeningDate,
            electionClosingDate,
          },
          config
        )
        .then((res) => {
          electionID = res.data.electionID;
        })
        .catch((error) => {
          console.log(error);
          console.error(error);
          console.log(error.message);
        });
      for (let i = 0; i < initialElectionPosition.length; i++) {
        const expectedVoterURL = `https://cmuvs-api.onrender.com/api/voters/expected-voter-number/${initialElectionPosition[i].allowedCollege}/${initialElectionPosition[i].allowedYearLevel}`;
        let expectedMaximumVoter = null;
        await axios
          .get(expectedVoterURL, config)
          .then((docs) => {
            if (docs) {
              expectedMaximumVoter = docs.data;
            } else {
              expectedMaximumVoter = 0;
            }
          })
          .catch((error) => console.log(error));

        electionPositionsPromise.push(
          postPosition(
            postEletionPositionURL,
            electionID,
            initialElectionPosition[i].positionName,
            initialElectionPosition[i].positionNumber,
            initialElectionPosition[i].allowedCollege,
            initialElectionPosition[i].allowedYearLevel,
            initialElectionPosition[i].maximumVotes,
            expectedMaximumVoter
          )
        );
      }

      await Promise.all(electionPositionsPromise)
        .then(() => {
          postCandidates(electionID);
        })
        .then(async () => {
          await postElectionCanvass(postElectionCanvassURL, electionID, config);
        })
        .catch((error) => console.log(error));
    } catch (error) {
      console.log(error);
    }
  };

  const postElectionCanvass = async (postURL, electionID, config) => {
    try {
      const canvassOfficerURL =
        'https://cmuvs-api.onrender.com/api/canvassingOfficer';
      let canvassOfficerPromise = [];
      let response = '';
      const canvassStatus = 'Pending';
      await axios
        .post(postURL, { electionID, canvassStatus }, config)
        .then((res) => {
          response = res.data._id;
        })
        .then(async () => {
          for (let i = 0; i < canvassOfficer.length; i++) {
            canvassOfficerPromise.push(
              postCanvassingOfficer(
                canvassOfficerURL,
                response,
                canvassOfficer[i].userID,
                'Pending',
                config
              )
            );
          }
          await Promise.all(canvassOfficerPromise)
            .then()
            .catch((error) => {
              console.log(error);
            });
        });
    } catch (error) {
      console.log(error);
    }
  };

  const postCanvassingOfficer = async (
    canvassOfficerURL,
    electionCanvassID,
    userID,
    taskStatus,
    config
  ) => {
    try {
      let canvassingOfficerID = '';
      let canvassPositionPromise = [];
      await axios
        .post(
          canvassOfficerURL,
          { userID, electionCanvassID, taskStatus },
          config
        )
        .then(async (res) => {
          //reach this point
          canvassingOfficerID = res.data.officerID;
          for (let i = 0; i < canvassOfficer.length; i++) {
            for (
              let j = 0;
              j < canvassOfficer[i].assignedPosition.length;
              j++
            ) {
              canvassPositionPromise.push(
                postCanvassPosition(
                  'https://cmuvs-api.onrender.com/api/canvassPosition',
                  canvassingOfficerID,
                  canvassOfficer[i].assignedPosition[j],
                  config
                )
              );
            }
          }
        })
        .catch((error) => {
          console.log(error);
        });
      await Promise.all(canvassPositionPromise)
        .then(() => {
          setLoading((prevState) => !prevState);
          //display modal here
          setDisplayElectionDetailsModel(false);
          setShowCreationSuccessful(true);
          // alert('Election Created Successfully');
          // history('/home');
        })
        .catch((error) => {
          console.log(error);
        });
    } catch (error) {
      console.log(error);
    }
  };

  //last task was to find out why API canvassPosition is not being used

  const postCanvassPosition = async (
    postCanvassPositionURL,
    canvassingOfficerID,
    positionToCanvass,
    config
  ) => {
    try {
      await axios
        .post(
          postCanvassPositionURL,
          { canvassingOfficerID, positionToCanvass },
          config
        )
        .then()
        .catch((error) => {
          console.log(error);
        });
    } catch (error) {
      console.log(error);
    }
  };

  const postCandidates = async (electionID) => {
    try {
      let postCandidatePromise = [];
      for (let i = 0; i < initialElectionPosition.length; i++) {
        let positionID = null;
        await getPositionID(electionID, initialElectionPosition[i].positionName)
          .then((res) => {
            positionID = res;
          })
          .catch((error) => console.log(Error));
        for (let j = 0; j < initialElectionPosition[i].candidates.length; j++) {
          postCandidatePromise.push(
            postElectionCandidate(
              initialElectionPosition[i].candidates[j].userID,
              electionID,
              positionID,
              initialElectionPosition[i].candidates[j].party
            )
          );
        }
      }
      await Promise.all(postCandidatePromise)
        .then()
        .catch((error) => console.log(error));
    } catch (error) {
      console.log(error);
    }
  };

  const getPositionID = async (electionID, positionName) => {
    try {
      const token = sessionStorage.getItem('token');
      const position = positionName;
      let positionID = '';
      const getURL = `https://cmuvs-api.onrender.com/api/electionPosition/positions/${electionID}/${position}`;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-type': 'application/json',
        },
      };

      await axios
        .get(getURL, config)
        .then((res) => {
          positionID = res.data[0]._id;
        })
        .catch((error) => console.log(error));
      return positionID;
    } catch (error) {
      console.log(error);
    }
  };

  const postElectionCandidate = async (
    userID,
    electionID,
    positionID,
    party
  ) => {
    try {
      const token = sessionStorage.getItem('token');
      const postCandidateURL =
        'https://cmuvs-api.onrender.com/api/electionCandidate';
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-type': 'application/json',
        },
      };
      await axios
        .post(
          postCandidateURL,
          { userID, electionID, positionID, party },
          config
        )
        .then()
        .catch((error) => console.log(error));
    } catch (error) {
      console.log(error);
    }
  };

  const postPosition = async (
    postURL,
    electionID,
    positionName,
    positionNumber,
    allowedCollege,
    allowedYearLevel,
    maximumVotes,
    expectedMaximumVoter
  ) => {
    try {
      const token = sessionStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-type': 'application/json',
        },
      };
      await axios
        .post(
          postURL,
          {
            electionID,
            positionName,
            positionNumber,
            allowedCollege,
            allowedYearLevel,
            maximumVotes,
            expectedMaximumVoter,
          },
          config
        )
        .then();
    } catch (error) {
      console.log(error);
    }
  };

  const checkCanvasser = async (e) => {
    e.preventDefault();
    try {
      const form = e.currentTarget;
      let validCheckbox = true;

      canvassOfficer.map((officer) => {
        if (officer.assignedPosition.length === 0) {
          validCheckbox = false;
          return false;
        } else {
          validCheckbox = true;
          return true;
        }
      });

      if (form.checkValidity() === false) {
        e.stopPropagation();
        setDisplayElectionDetailsModel((prevState) => false);
        alert('Please input value for all fields');
      } else if (form.checkValidity() && validCheckbox === false) {
        e.stopPropagation();
        setDisplayElectionDetailsModel((prevState) => false);
        setCanvassOfficer((prevState) => {
          const temp = [...prevState];
          for (let i = 0; i < temp.length; i++) {
            temp[i].assignedPosition = [];
          }
          return temp;
        });
        alert(
          'Please assign at least one position for every canvassing officer'
        );
      } else if (form.checkValidity() && validCheckbox) {
        setPreviewDetails(true);
        setCanvasserValidated((prevState) => true);
        setDisplayElectionDetailsModel((prevState) => true);
        setAddElectionCanvasser((prevState) => true);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const [canvassOfficer, setCanvassOfficer] = useState([
    {
      fullName: '',
      userID: '',
      assignedPosition: [],
    },
  ]);
  const [collegeAndDepList, setCollegeAndDepList] = useState(null);
  const [canvasserValidated, setCanvasserValidated] = useState(false);
  const [addElectionCanvasser, setAddElectionCanvasser] = useState(false);

  const [loading, setLoading] = useState(true);
  const [createPass, setCreatePass] = useState(false);
  const [dateReadable, setDateReadable] = useState({
    openingDate: '',
    closingDate: '',
  });
  const [displayElectionDetailsModel, setDisplayElectionDetailsModel] =
    useState(false);

  const [showCreationSuccessful, setShowCreationSuccessful] = useState(false);
  const [departmentParent, setDepartmentParent] = useState('');
  const [currentPositionIndex, setCurrentPositionIndex] = useState(0);
  const [candidateValidated, setCandidateValidated] = useState(false);
  const [positionvalidate, setPositionvalidate] = useState(false);
  const [validated, setValidated] = useState(false);
  const [numOfPosition, setNumOfPosition] = useState('1');
  const [initialElectionPosition, setInitialElectionPosition] = useState([]);
  const [formReady, setFormReady] = useState(false);
  const [initializePosition, setInitializePosition] = useState(false);
  const [initializeCandidate, setInitializeCandidate] = useState(false);
  const [initialState, setInitialState] = useState(true);
  const [election, setElection] = useState({
    electionName: '',
    electionLevel: '',
    electionScope: '',
    electionStatus: 'On-going',
    electionOpeningDate: '',
    electionOpeningTime: '',
    electionClosingDate: '',
    electionClosingTime: '',
  });
  const [suggestions, setSuggestions] = useState([]);
  const [previewDetails, setPreviewDetails] = useState(false);

  const onSuggesthandler = (type, text, first, second) => {
    try {
      if (type === 'candidate') {
        setInitialElectionPosition((prevState) => {
          let temp = [...prevState];
          temp[first].candidates[second].fullName = text;
          sessionStorage.setItem(
            'initialElectionPosition',
            JSON.stringify(temp)
          );
          return temp;
        });
      } else {
        setCanvassOfficer((prevState) => {
          let temp = [...prevState];
          temp[first].fullName = text;
          sessionStorage.setItem('canvassOfficer', JSON.stringify(temp));
          return temp;
        });
      }
      setSuggestions([]);
    } catch (error) {}
  };

  const onTextChange = (type, text, first, second) => {
    try {
      let matches = [];
      if (text.length > 0) {
        if (type === 'candidate') {
          if (election.electionLevel === 'University') {
            matches = collegeAndDepList.map((college) =>
              college.students.filter((student) => {
                const regex = new RegExp(`${text}`, 'gi');
                return student.FullName.match(regex);
              })
            );
          } else if (election.electionLevel === 'College') {
            matches = collegeAndDepList
              .filter((college) => college._id === election.electionScope)
              .map((studentList) =>
                studentList.students.filter((student) => {
                  const regex = new RegExp(`${text}`, 'gi');
                  return student.FullName.match(regex);
                })
              );
          } else {
            matches = collegeAndDepList
              .filter((college) => college._id === departmentParent)
              .map((studentList) =>
                studentList.students
                  .filter(
                    (student) => student.department === election.electionScope
                  )
                  .filter((data) => {
                    const regex = new RegExp(`${text}`, 'gi');
                    return data.FullName.match(regex);
                  })
              );
          }
          let finalMatches = [];
          for (let i = 0; i < matches.length; i++) {
            finalMatches = [...finalMatches, ...matches[i]];
          }
          setSuggestions([...finalMatches]);
          setInitialElectionPosition((prevState) => {
            let temp = [...prevState];
            temp[first].candidates[second].fullName = text;
            return temp;
          });
        } else {
          if (election.electionLevel === 'University') {
            matches = collegeAndDepList.map((college) =>
              college.students.filter((student) => {
                const regex = new RegExp(`${text}`, 'gi');
                return student.FullName.match(regex);
              })
            );
          } else if (election.electionLevel === 'College') {
            matches = collegeAndDepList
              .filter((college) => college._id === election.electionScope)
              .map((studentList) =>
                studentList.students.filter((student) => {
                  const regex = new RegExp(`${text}`, 'gi');
                  return student.FullName.match(regex);
                })
              );
          } else {
            matches = collegeAndDepList
              .filter((college) => college._id === departmentParent)
              .map((studentList) =>
                studentList.students
                  .filter(
                    (student) => student.department === election.electionScope
                  )
                  .filter((data) => {
                    const regex = new RegExp(`${text}`, 'gi');
                    return data.FullName.match(regex);
                  })
              );
          }
          let finalMatches = [];
          for (let i = 0; i < matches.length; i++) {
            finalMatches = [...finalMatches, ...matches[i]];
          }
          setSuggestions([...finalMatches]);
          setCanvassOfficer((prevState) => {
            let temp = [...prevState];
            temp[first].fullName = text;
            return temp;
          });
        }
      }
    } catch (error) {}
  };

  const getCanvassOfficerUserID = (index, value) => {
    try {
      for (let i = 0; i < collegeAndDepList.length; i++) {
        for (let j = 0; j < collegeAndDepList[i].students.length; j++) {
          if (value === collegeAndDepList[i].students[j].FullName) {
            setCanvassOfficer((prevState) => {
              let temp = [...prevState];
              temp[index].userID = collegeAndDepList[i].students[j].id;
              return temp;
            });
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getCandidateUserID = (first, second, value) => {
    try {
      for (let i = 0; i < collegeAndDepList.length; i++) {
        for (let j = 0; j < collegeAndDepList[i].students.length; j++) {
          // console.log(collegeAndDepList[i].students[j].FullName);
          // console.log(value);
          if (value === collegeAndDepList[i].students[j].FullName) {
            setInitialElectionPosition((prevState) => {
              let temp = [...prevState];
              temp[first].candidates[second].userID =
                collegeAndDepList[i].students[j].id;
              return temp;
            });
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getElectionScope = () => {
    try {
      if (election.electionLevel === 'University') {
        return 'All Registered Voter';
      } else if (election.electionLevel === 'College') {
        return `College of ${election.electionScope}`;
      } else {
        return `Department of ${election.electionScope}`;
      }
    } catch (error) {
      console.log(error);
    }
  };

  const labelYearLevel = (yearLevel) => {
    try {
      switch (yearLevel) {
        case '1': {
          return 'exclusive for 1st Year';
        }
        case '2': {
          return 'exclusive for 2nd Year';
        }
        case '3': {
          return 'exclusive for 3rd Year';
        }
        case '4': {
          return 'exclusive for 4th Year';
        }
        case '5': {
          return 'exclusive for 5th Year';
        }
        case '6': {
          return 'exclusive for 6th Year';
        }
        default: {
          return 'All year level';
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const labelOfficer = (officer) => {
    try {
      let label = '';
      officer.assignedPosition.map((position, index, arr) => {
        if (index === arr.length - 1) {
          label = label + officer.assignedPosition[index];
          return label;
        } else {
          label = label + officer.assignedPosition[index] + ', ';
          return label;
        }
      });
      return label;
    } catch (error) {
      console.log(error);
    }
  };

  const labelCandidate = (candidate, i, j) => {
    try {
      if (candidate.party) return candidate.party;
      else {
        setInitialElectionPosition((prevState) => {
          let temp = [...prevState];
          temp[i].candidates[j].party = 'Independent';
          return temp;
        });
        return 'Independent';
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleDateDisplay = (value) => {
    try {
      const monthNames = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];
      if (value === 'open') {
        const year = dateReadable.openingDate.getFullYear();
        const month = monthNames[dateReadable.openingDate.getMonth()];
        const day = dateReadable.openingDate.getDate();
        const hour = dateReadable.openingDate.getHours();
        const hourFinal = hour >= 13 ? hour - 12 : hour;
        const minutes =
          dateReadable.openingDate.getMinutes() <= 9
            ? `0${dateReadable.openingDate.getMinutes()}`
            : dateReadable.openingDate.getMinutes();
        const greeting = hour >= 12 ? 'P.M' : 'A.M';

        return `${month} ${day}, ${year} - ${hourFinal}:${minutes} ${greeting}`;
      } else {
        const year = dateReadable.closingDate.getFullYear();
        const month = monthNames[dateReadable.closingDate.getMonth()];
        const day = dateReadable.closingDate.getDate();
        const hour = dateReadable.closingDate.getHours();
        const hourFinal = hour >= 13 ? hour - 12 : hour;
        const minutes =
          dateReadable.closingDate.getMinutes() <= 9
            ? `0${dateReadable.closingDate.getMinutes()}`
            : dateReadable.closingDate.getMinutes();
        const greeting = hour >= 12 ? 'P.M' : 'A.M';

        return `${month} ${day}, ${year} - ${hourFinal}:${minutes} ${greeting}`;
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleModalClose = () => {
    try {
      setCreatePass(false);
      setDisplayElectionDetailsModel((prevState) => false);
    } catch (error) {
      console.log(error);
    }
  };

  const handleCandidateRegister = (e) => {
    try {
      e.preventDefault();
      const form = e.currentTarget;
      if (form.checkValidity() === false) {
        setCandidateValidated((prevState) => false);
        e.stopPropagation();
      }
      setCandidateValidated((prevState) => true);
      if (form.checkValidity()) {
        if (currentPositionIndex < initialElectionPosition.length - 1) {
          setCandidateValidated(false);
          setCurrentPositionIndex((prevState) => prevState + 1);
        } else {
          setInitializeCandidate((prevState) => !prevState);
          setAddElectionCanvasser((prevState) => !prevState);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleAddingOfCandidates = (e) => {
    try {
      e.preventDefault();

      const form = e.currentTarget;
      if (form.checkValidity() === false) {
        e.stopPropagation();
      }
      setPositionvalidate((prevState) => true);
      if (form.checkValidity()) {
        setInitializePosition((prevState) => false);
        setInitializeCandidate((prevState) => true);
      }
    } catch (error) {
      console.log(error);
    }
  };

  /* Form handler for creating the basic details of an election */
  const positionFormhandler = (e) => {
    try {
      e.preventDefault();

      setDateReadable((prevState) => {
        const temp = { ...prevState };
        temp.openingDate = new Date(
          election.electionOpeningDate + ', ' + election.electionOpeningTime
        );
        return temp;
      });
      setDateReadable((prevState) => {
        const temp = { ...prevState };
        temp.closingDate = new Date(
          election.electionClosingDate + ', ' + election.electionClosingTime
        );
        return temp;
      });

      const form = e.currentTarget;
      const temp = parseInt(numOfPosition);

      if (form.checkValidity() === false) {
        e.stopPropagation();
      }

      setValidated(true);

      if (temp > 0) {
        if (form.checkValidity()) {
          setInitialState((prevState) => !prevState);
          //comment
          // setFormReady(prevState => true);
          if (initialElectionPosition.length === 0) {
            setInitialElectionPosition((prevState) => {
              const newcandidate = {
                fullName: '',
                party: '',
                userID: '',
                search: false,
              };
              let temp = [
                {
                  positionName: '',
                  allowedCollege: '',
                  allowedYearLevel: 0,
                  maximumVotes: 1,
                  positionNumber: 0,
                  candidates: [newcandidate],
                },
              ];
              return temp;
            });
          }
          setInitializePosition((prevState) => !prevState);
          setNumOfPosition(temp);
          if (election.electionLevel === 'University') {
            setElection((prevState) => {
              const electionCopy = { ...prevState };
              electionCopy.electionScope = 'University';
              return electionCopy;
            });
          }
        } else {
          alert('Please provide value for all fields');
          setFormReady(false);
        }
      } else {
        if (isNaN(temp)) {
          alert('Please input valid value for the required fields');
          setFormReady(false);
        } else {
          alert(`Please input a number for 'election position number field'`);
          setFormReady(false);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <div className='bodyCE'>
        <center className='mb-4'>
          {election.electionName !== '' && election.electionLevel !== '' && (
            <h2 className='createElec'>{`${election.electionName} (${election.electionLevel} Level)`}</h2>
          )}
          {election.electionName === '' && election.electionLevel === '' && (
            <h2 className='createElec'>Create Election</h2>
          )}
        </center>
        <Container className='create'>
          {loading && <Loading />}
          {initialState && !formReady && loading === false && (
            <Form
              noValidate
              validated={validated}
              onSubmit={positionFormhandler}
            >
              <Form.Group controlId='formElectionName'>
                <FloatingLabel
                  label='Election Name*'
                  controlId='floatingElectionName'
                >
                  <Form.Control
                    required
                    value={election.electionName}
                    type='text'
                    placeholder='Input election name*'
                    onChange={(e) => {
                      setElection((prevState) => {
                        sessionStorage.setItem(
                          'election',
                          JSON.stringify({
                            ...prevState,
                            electionName: e.target.value,
                          })
                        );
                        return { ...prevState, electionName: e.target.value };
                      });
                    }}
                  />
                  <Form.Control.Feedback type='invalid'>
                    Please provide an election name.
                  </Form.Control.Feedback>
                </FloatingLabel>
              </Form.Group>

              <div className='d-grid gap-2 mt-3'>
                <Form.Group controlId='formElectionLevel'>
                  <FloatingLabel
                    label='Election Level*'
                    controlId='floatingElectionLevel'
                  >
                    <Form.Control
                      required
                      value={election.electionLevel}
                      as='select'
                      onChange={(e) => {
                        setElection((prevState) => {
                          sessionStorage.setItem(
                            'election',
                            JSON.stringify({
                              ...prevState,
                              electionLevel: e.target.value,
                            })
                          );
                          return {
                            ...prevState,
                            electionLevel: e.target.value,
                          };
                        });
                      }}
                    >
                      <option key={'empty'} value={''}>
                        --
                      </option>
                      <option key={'University'} value={'University'}>
                        University
                      </option>
                      <option key={'College'} value={'College'}>
                        College
                      </option>
                      <option key={'Department'} value={'Department'}>
                        Department
                      </option>
                    </Form.Control>
                    <Form.Control.Feedback type='invalid'>
                      Please select an election level.
                    </Form.Control.Feedback>
                  </FloatingLabel>
                </Form.Group>

                {election.electionLevel === 'College' && loading === false && (
                  <Form.Group className='d-grid gap-2 mt-2'>
                    <FloatingLabel
                      label='Election Scope (name of college)*'
                      controlId='floatingElectionScope'
                    >
                      <Form.Control
                        required
                        value={election.electionScope}
                        as='select'
                        onChange={(e) => {
                          setElection((prevState) => {
                            sessionStorage.setItem(
                              'election',
                              JSON.stringify({
                                ...prevState,
                                electionScope: e.target.value,
                              })
                            );
                            return {
                              ...prevState,
                              electionScope: e.target.value,
                            };
                          });
                        }}
                      >
                        <option key='empty' value={''}>
                          --
                        </option>
                        {Array.from({ length: collegeAndDepList.length }).map(
                          (_, i) => (
                            <option
                              key={collegeAndDepList[i]._id}
                              value={collegeAndDepList[i]._id}
                            >
                              {collegeAndDepList[i]._id}
                            </option>
                          )
                        )}
                      </Form.Control>
                      <Form.Control.Feedback type='invalid'>
                        Please select a college name
                      </Form.Control.Feedback>
                    </FloatingLabel>
                  </Form.Group>
                )}
                {election.electionLevel === 'Department' &&
                  loading === false && (
                    <Container className='d-grid gap-2 mt-2'>
                      <Form.Group>
                        <FloatingLabel
                          label='Select College'
                          controlId='selectedDepartmentParent'
                        >
                          <Form.Control
                            required
                            as='select'
                            value={departmentParent}
                            onChange={(e) => {
                              setDepartmentParent(e.target.value);
                              sessionStorage.setItem(
                                'departmentParent',
                                JSON.stringify(e.target.value)
                              );
                            }}
                          >
                            <option key='empty' value={''}>
                              --
                            </option>
                            {Array.from({
                              length: collegeAndDepList.length,
                            }).map((_, i) => (
                              <option
                                key={collegeAndDepList[i]._id}
                                value={collegeAndDepList[i]._id}
                              >
                                {collegeAndDepList[i]._id}
                              </option>
                            ))}
                          </Form.Control>
                        </FloatingLabel>
                      </Form.Group>
                      <Form.Group>
                        <FloatingLabel
                          label='Election Scope (name of department)*'
                          controlId='selectedDepartmentScope'
                        >
                          <Form.Control
                            required
                            as='select'
                            value={election.electionScope}
                            onChange={(e) => {
                              setElection((prevState) => {
                                let temp = { ...prevState };
                                temp.electionScope = e.target.value;
                                sessionStorage.setItem(
                                  'election',
                                  JSON.stringify(temp)
                                );
                                return temp;
                              });
                            }}
                          >
                            <option key={'empty'} value={''}>
                              --
                            </option>

                            {collegeAndDepList.map((college) => {
                              if (college._id === departmentParent) {
                                return college.departments.map((department) => (
                                  <option
                                    key={`${college._id}-${department}`}
                                    value={department}
                                  >
                                    {department}
                                  </option>
                                ));
                              } else return null;
                            })}
                          </Form.Control>
                        </FloatingLabel>
                      </Form.Group>
                    </Container>
                  )}
              </div>
              <Row>
                <Col sm={6} md={6}>
                  <div className='d-grid gap-2 mt-3'>
                    Election Opening Date
                    <DateTimePicker
                      required
                      onChange={(value) => {
                        if (value) {
                          let day = value.getDate();
                          let month = value.getMonth() + 1;
                          month = month < 10 ? `0${month}` : month;
                          let year = value.getFullYear();
                          let hour = value.getHours();
                          let minute = value.getMinutes();
                          const date = `${year}-${month}-${day}`;
                          const time = `${hour}:${minute}`;
                          setElection((prevState) => {
                            sessionStorage.setItem(
                              'election',
                              JSON.stringify({
                                ...prevState,
                                electionOpeningDate: date,
                                electionOpeningTime: time,
                              })
                            );
                            return {
                              ...prevState,
                              electionOpeningDate: date,
                              electionOpeningTime: time,
                            };
                          });
                        } else {
                          setElection((prevState) => {
                            return {
                              ...prevState,
                              electionOpeningDate: '',
                              electionOpeningTime: '',
                            };
                          });
                        }
                      }}
                      value={
                        election.electionOpeningDate === ''
                          ? null
                          : new Date(
                              election.electionOpeningDate +
                                ', ' +
                                election.electionOpeningTime
                            )
                      }
                      name='opening date'
                    />
                  </div>
                </Col>
                <Col sm={6} md={6}>
                  <div className='d-grid gap-2 mt-3'>
                    Election Closing Date
                    <DateTimePicker
                      required
                      onChange={(value) => {
                        if (value) {
                          let day = value.getDate();
                          let month = value.getMonth() + 1;
                          month = month < 10 ? `0${month}` : month;
                          let year = value.getFullYear();
                          let hour = value.getHours();
                          let minute = value.getMinutes();
                          const date = `${year}-${month}-${day}`;
                          const time = `${hour}:${minute}`;
                          setElection((prevState) => {
                            sessionStorage.setItem(
                              'election',
                              JSON.stringify({
                                ...prevState,
                                electionClosingDate: date,
                                electionClosingTime: time,
                              })
                            );
                            return {
                              ...prevState,
                              electionClosingDate: date,
                              electionClosingTime: time,
                            };
                          });
                        } else {
                          setElection((prevState) => {
                            return {
                              ...prevState,
                              electionClosingDate: '',
                              electionClosingTime: '',
                            };
                          });
                        }
                      }}
                      value={
                        election.electionClosingDate === ''
                          ? null
                          : new Date(
                              election.electionClosingDate +
                                ', ' +
                                election.electionClosingTime
                            )
                      }
                    />
                  </div>
                </Col>
              </Row>
              {!previewDetails && (
                <Container>
                  <Row>
                    <Col
                      xs={{ span: 5, offset: 3 }}
                      md={{ span: 4, offset: 4 }}
                    >
                      <div className='d-grid gap-2 mt-3'>
                        <Button variant='info' size='lg' type='submit'>
                          Next
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </Container>
              )}
              {previewDetails && (
                <Container>
                  <Row>
                    <Col
                      xs={{ span: 8, offset: 2 }}
                      md={{ span: 4, offset: 4 }}
                    >
                      <div className='d-grid gap-2 mt-3'>
                        <Button
                          variant='info'
                          size='lg'
                          onClick={() => {
                            setInitialState(false);
                            setFormReady(true);
                            setAddElectionCanvasser(true);
                            setDisplayElectionDetailsModel(true);
                          }}
                        >
                          Preview Details
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </Container>
              )}
            </Form>
          )}
          {initializePosition && !loading && (
            <Container>
              <Alert variant='primary'>
                Please input election position in descending order
              </Alert>

              <Container className='m-2'>
                <Form
                  noValidate
                  validated={positionvalidate}
                  onSubmit={handleAddingOfCandidates}
                >
                  <Form.Group>
                    {Array.from({
                      length: initialElectionPosition.length,
                    }).map((_, i) => (
                      <Row key={i} className='border border-secondary my-3 p-3'>
                        <Col xs={10} sm={10} md={10} lg={10}>
                          <FloatingLabel label='Position Name*'>
                            <Form.Control
                              required
                              type='text'
                              placeholder='Position Name*'
                              value={initialElectionPosition[i].positionName}
                              onChange={(e) => {
                                setInitialElectionPosition((prevState) => {
                                  let temp = [...prevState];
                                  temp[i].positionName = e.target.value;
                                  temp[i].positionNumber = i;
                                  if (election.electionLevel === 'University') {
                                    temp[i].allowedYearLevel = 'ALL';
                                  } else if (
                                    election.electionLevel === 'College'
                                  ) {
                                    temp[i].allowedCollege =
                                      election.electionScope;
                                  } else {
                                    temp[i].allowedCollege = departmentParent;
                                  }
                                  sessionStorage.setItem(
                                    'initialElectionPosition',
                                    JSON.stringify(temp)
                                  );
                                  return temp;
                                });
                              }}
                            />
                            <Form.Control.Feedback type='invalid'>
                              Please provide an election position or remove this
                              field
                            </Form.Control.Feedback>
                          </FloatingLabel>
                        </Col>
                        <Col xs={1} sm={1} md={1} lg={1} className='px-3'>
                          <div className='mx-auto'>
                            <FontAwesomeIcon
                              icon={faTrash}
                              className='text-danger fa-1x my-4'
                              style={{ cursor: 'pointer' }}
                              onClick={(e) => {
                                const index = i;
                                setInitialElectionPosition((prevState) => {
                                  let copy = [...prevState];
                                  if (copy.length > 1) {
                                    copy.splice(index, 1);
                                  }
                                  sessionStorage.setItem(
                                    'initialElectionPosition',
                                    JSON.stringify(copy)
                                  );
                                  return copy;
                                });
                              }}
                            />
                          </div>
                        </Col>
                        {election.electionLevel === 'University' && (
                          <Col xs={10}>
                            <Form.Group className='my-2'>
                              <FloatingLabel label='Select Allowed College'>
                                <Form.Control
                                  required
                                  as='select'
                                  value={
                                    initialElectionPosition[i].allowedCollege
                                  }
                                  onChange={(e) => {
                                    setInitialElectionPosition((prevState) => {
                                      const temp = [...prevState];
                                      temp[i].allowedCollege = e.target.value;
                                      sessionStorage.setItem(
                                        'initialElectionPosition',
                                        JSON.stringify(temp)
                                      );
                                      return temp;
                                    });
                                  }}
                                >
                                  <option key='empty' value=''>
                                    --
                                  </option>
                                  <option key='All Colleges' value={'ALL'}>
                                    All College
                                  </option>
                                  {collegeAndDepList.map((college) => {
                                    return (
                                      <option
                                        key={`position-${college._id}`}
                                        value={college._id}
                                      >
                                        {college._id}
                                      </option>
                                    );
                                  })}
                                </Form.Control>
                                <Form.Text className='text-muted'>
                                  Select "All College" if all voters can vote
                                  for this position
                                </Form.Text>
                                <Form.Control.Feedback type='invalid'>
                                  Please select the name of voters college that
                                  is allowed to vote in this particular
                                  position.
                                </Form.Control.Feedback>
                              </FloatingLabel>
                            </Form.Group>
                          </Col>
                        )}
                        {election.electionLevel !== 'University' && (
                          <Col xs={10}>
                            <Form.Group className='my-2'>
                              <FloatingLabel label='Input Allowed Year Level'>
                                <Form.Control
                                  required
                                  as='select'
                                  placeholder='Input Allowed College'
                                  value={initialElectionPosition[i].yearLevel}
                                  onChange={(e) => {
                                    setInitialElectionPosition((prevState) => {
                                      const temp = [...prevState];
                                      temp[i].allowedYearLevel = e.target.value;
                                      sessionStorage.setItem(
                                        'initialElectionPosition',
                                        JSON.stringify(temp)
                                      );
                                      return temp;
                                    });
                                  }}
                                >
                                  <option key='empty' value=''>
                                    --
                                  </option>
                                  <option key='ALL' value='ALL'>
                                    All Year Level
                                  </option>
                                  <option key='1' value='1'>
                                    1
                                  </option>
                                  <option key='2' value='2'>
                                    2
                                  </option>
                                  <option key='3' value='3'>
                                    3
                                  </option>
                                  <option key='4' value='4'>
                                    4
                                  </option>
                                  <option key='5' value='5'>
                                    5
                                  </option>
                                  <option key='6' value='6'>
                                    6
                                  </option>
                                </Form.Control>
                                <Form.Text className='text-muted'>
                                  Select "ALL Year Level" if all voters can vote
                                  for this position
                                </Form.Text>
                                <Form.Control.Feedback type='invalid'>
                                  Please select the allowed voters year level to
                                  vote for this position
                                </Form.Control.Feedback>
                              </FloatingLabel>
                            </Form.Group>
                          </Col>
                        )}
                        <Col xs={10}>
                          <Form.Group>
                            <FloatingLabel label='vote for up to'>
                              <Form.Control
                                required
                                type='number'
                                min={1}
                                placeholder='vote for up to'
                                value={initialElectionPosition[i].maximumVotes}
                                onWheel={(e) => e.currentTarget.blur()}
                                onChange={(e) => {
                                  setInitialElectionPosition((prevState) => {
                                    const temp = [...prevState];

                                    temp[i].maximumVotes = e.target.value;
                                    sessionStorage.setItem(
                                      'initialElectionPosition',
                                      JSON.stringify(temp)
                                    );
                                    return temp;
                                  });
                                }}
                              />
                              <Form.Text className='text-muted'>
                                Input maximum number of votes for this position.
                              </Form.Text>
                              <Form.Control.Feedback type='invalid'>
                                Please input at least 1 for this field.
                              </Form.Control.Feedback>
                            </FloatingLabel>
                          </Form.Group>
                        </Col>
                      </Row>
                    ))}
                  </Form.Group>
                  <Row>
                    <Col
                      xs={{ span: 8, offset: 2 }}
                      md={{ span: 2, offset: 10 }}
                    >
                      <div className='d-grid gap-2'>
                        <Button
                          className='my-2'
                          variant='outline-secondary'
                          size='lg'
                          onClick={(e) => {
                            setInitialElectionPosition((prevState) => {
                              let temp = [...prevState];
                              const newCandidate = {
                                fullName: '',
                                party: '',
                                userID: '',
                                search: false,
                              };
                              const newPosition = {
                                positionName: '',
                                allowedCollege: '',
                                allowedYearLevel: 0,
                                positionNumber: 0,
                                maximumVotes: 1,
                                candidates: [newCandidate],
                              };
                              temp.push(newPosition);
                              sessionStorage.setItem(
                                'canvassOfficer',
                                JSON.stringify(temp)
                              );
                              return temp;
                            });
                          }}
                        >
                          ADD POSITION
                        </Button>
                      </div>
                    </Col>
                  </Row>
                  <br />
                  {!previewDetails && (
                    <Container>
                      <Row>
                        <Col
                          xs={{ span: 3, offset: 2 }}
                          md={{ span: 2, offset: 4 }}
                        >
                          <div className='d-grid gap-2'>
                            <Button
                              variant='info'
                              size='lg'
                              onClick={() => {
                                setInitializePosition(
                                  (prevState) => !prevState
                                );
                                setFormReady((prevState) => false);
                                setInitialState((prevState) => true);
                                setValidated(false);
                              }}
                            >
                              PREV
                            </Button>
                          </div>
                        </Col>
                        <Col
                          xs={{ span: 3, offset: 1 }}
                          md={{ span: 2, offset: 0 }}
                          className='ml-1'
                        >
                          <div className='d-grid gap-2'>
                            <Button variant='info' size='lg' type='submit'>
                              NEXT
                            </Button>
                          </div>
                        </Col>
                      </Row>
                    </Container>
                  )}
                  {previewDetails && (
                    <Container>
                      <Row>
                        <Col
                          xs={{ span: 10, offset: 1 }}
                          md={{ span: 4, offset: 4 }}
                        >
                          <div className='d-grid gap-2 mt-3'>
                            <Button
                              variant='info'
                              size='lg'
                              onClick={() => {
                                setInitializePosition(false);
                                setAddElectionCanvasser(true);
                                setDisplayElectionDetailsModel(true);
                              }}
                            >
                              Preview Details
                            </Button>
                          </div>
                        </Col>
                      </Row>
                    </Container>
                  )}
                </Form>
              </Container>
            </Container>
          )}
          {/* last work. Add buttons for dynamic approach in adding candidates for an election position then change use variable for storing candidate and position then try submitting votes*/}
          {initializeCandidate && (
            <Container>
              <Form
                noValidate
                validated={candidateValidated}
                onSubmit={handleCandidateRegister}
              >
                <h3 className='text-center my-3'>
                  <b>
                    {initialElectionPosition[
                      currentPositionIndex
                    ].positionName.toUpperCase()}
                  </b>
                </h3>

                {Array.from({
                  length:
                    initialElectionPosition[currentPositionIndex].candidates
                      .length,
                }).map((_, i) => (
                  <Row
                    key={`${initialElectionPosition[currentPositionIndex].positionName}-${i}`}
                  >
                    <Col xs={1} className='px-3 my-auto pl-3'>
                      <Container className='mx-auto p-1'>
                        <FontAwesomeIcon
                          key={`${initialElectionPosition[currentPositionIndex].positionName}-${i}`}
                          icon={faTrash}
                          className='text-danger fa-2x my-4'
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            let newState = [...initialElectionPosition];
                            if (
                              newState[currentPositionIndex].candidates.length >
                              1
                            ) {
                              newState[currentPositionIndex].candidates.splice(
                                i,
                                1
                              );
                            }
                            sessionStorage.setItem(
                              'initialElectionPosition',
                              JSON.stringify(newState)
                            );
                            setInitialElectionPosition(newState);
                          }}
                        />
                      </Container>
                    </Col>
                    <Col
                      xs={{ span: 9, offset: 1 }}
                      md={{ span: 10, offset: 0 }}
                    >
                      <Container className='border border-secondary my-3 p-3'>
                        <Row className='mt-1'>
                          <Col className='mb-3' xs={12} sm={12} md={12} lg={12}>
                            <FormGroup>
                              <FloatingLabel label='Full Name'>
                                <Form.Control
                                  required
                                  type='text'
                                  placeholder='Full Name'
                                  onChange={(e) => {
                                    onTextChange(
                                      'candidate',
                                      e.target.value,
                                      currentPositionIndex,
                                      i
                                    );
                                    setInitialElectionPosition((prevState) => {
                                      let temp = [...prevState];
                                      temp[currentPositionIndex].candidates[
                                        i
                                      ].fullName = e.target.value;
                                      temp[currentPositionIndex].candidates[
                                        i
                                      ].search = true;
                                      sessionStorage.setItem(
                                        'initialElectionPosition',
                                        JSON.stringify(temp)
                                      );
                                      return temp;
                                    });
                                  }}
                                  onBlur={(e) => {
                                    setTimeout(() => {
                                      setInitialElectionPosition(
                                        (prevState) => {
                                          let temp = [...prevState];
                                          let match = false;
                                          collegeAndDepList.map((college) =>
                                            college.students.filter(
                                              (student) => {
                                                if (
                                                  student.FullName ===
                                                  e.target.value
                                                ) {
                                                  match = true;
                                                }
                                                return true;
                                              }
                                            )
                                          );
                                          if (match) {
                                            temp[
                                              currentPositionIndex
                                            ].candidates[i].fullName =
                                              e.target.value;
                                          } else {
                                            temp[
                                              currentPositionIndex
                                            ].candidates[i].fullName = '';
                                          }
                                          temp[currentPositionIndex].candidates[
                                            i
                                          ].search = false;
                                          sessionStorage.setItem(
                                            'initialElectionPosition',
                                            JSON.stringify(temp)
                                          );
                                          return temp;
                                        }
                                      );
                                      getCandidateUserID(
                                        currentPositionIndex,
                                        i,
                                        e.target.value
                                      );
                                      setSuggestions([]);
                                    }, 100);
                                  }}
                                  value={
                                    initialElectionPosition[
                                      currentPositionIndex
                                    ].candidates[i].fullName
                                  }
                                />
                                {/* {console.log(suggestions)} */}
                                {initialElectionPosition[currentPositionIndex]
                                  .candidates[i].search && (
                                  <div
                                    style={{
                                      position: 'absolute',
                                      zIndex: '5',
                                      background: 'white',
                                      width: '100%',
                                    }}
                                  >
                                    {suggestions.map((suggestion, j) => {
                                      if (j < 5) {
                                        return (
                                          <div
                                            className='suggestion mx-2 my-2'
                                            key={j}
                                            // onClick={() =>
                                            //   onSuggesthandler(
                                            //     'candidate',
                                            //     suggestion.FullName,
                                            //     currentPositionIndex,
                                            //     i
                                            //   )
                                            // }
                                            onPointerDown={(e) =>
                                              onSuggesthandler(
                                                'candidate',
                                                suggestion.FullName,
                                                currentPositionIndex,
                                                i
                                              )
                                            }
                                          >
                                            {suggestion.FullName}
                                          </div>
                                        );
                                      } else {
                                        return true;
                                      }
                                    })}
                                  </div>
                                )}
                                {/* <Form.Control.Feedback type='invalid'>
                                  Please select a candidate for this position or
                                  remove this field.
                                </Form.Control.Feedback> */}
                              </FloatingLabel>
                            </FormGroup>
                          </Col>
                        </Row>
                        <Row className='my-1'>
                          <Col xs={12} sm={12} md={12} lg={12}>
                            <FormGroup>
                              <FloatingLabel label='PARTY'>
                                <Form.Control
                                  type='text'
                                  placeholder='PARTY'
                                  value={
                                    initialElectionPosition[
                                      currentPositionIndex
                                    ].candidates[i].party
                                  }
                                  onChange={(e) => {
                                    setInitialElectionPosition((prevState) => {
                                      let temp = [...prevState];
                                      temp[currentPositionIndex].candidates[
                                        i
                                      ].party = e.target.value;
                                      sessionStorage.setItem(
                                        'initialElectionPosition',
                                        JSON.stringify(temp)
                                      );
                                      return temp;
                                    });
                                  }}
                                />
                              </FloatingLabel>
                            </FormGroup>
                          </Col>
                        </Row>
                      </Container>
                    </Col>
                  </Row>
                ))}
                <Row>
                  <Col xs={{ span: 6, offset: 4 }} md={{ span: 2, offset: 9 }}>
                    <div className='d-grid gap-2'>
                      <Button
                        key={`${initialElectionPosition[currentPositionIndex].positionName}-${initialElectionPosition[currentPositionIndex].candidates.length}`}
                        variant='outline-secondary'
                        onClick={() => {
                          let newState = [...initialElectionPosition];
                          newState[currentPositionIndex].candidates.push({
                            fullName: '',
                            party: '',
                            userID: '',
                          });
                          sessionStorage.setItem(
                            'initialElectionPosition',
                            JSON.stringify(newState)
                          );
                          setInitialElectionPosition(newState);
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </Col>
                </Row>
                <br />
                {!previewDetails && (
                  <Container>
                    <Row>
                      <Col
                        xs={{ span: 3, offset: 3 }}
                        md={{ span: 2, offset: 4 }}
                      >
                        <div className='d-grid gap-2'>
                          <Button
                            variant='info'
                            size='lg'
                            onClick={() => {
                              if (currentPositionIndex > 0) {
                                setCurrentPositionIndex(
                                  (prevState) => prevState - 1
                                );
                              } else {
                                setPositionvalidate(false);
                                setInitializeCandidate(
                                  (prevState) => !prevState
                                );
                                setInitializePosition(
                                  (prevState) => !prevState
                                );
                              }
                            }}
                          >
                            PREV
                          </Button>
                        </div>
                      </Col>
                      <Col
                        xs={{ span: 3, offset: 1 }}
                        md={{ span: 2, offset: 0 }}
                      >
                        <div className='d-grid gap-2'>
                          <Button type='submit' variant='info' size='lg'>
                            NEXT
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </Container>
                )}
                {previewDetails && (
                  <Container>
                    <Row>
                      <Col
                        xs={{ span: 8, offset: 3 }}
                        md={{ span: 4, offset: 4 }}
                      >
                        <div className='d-grid gap-2 mt-3'>
                          <Button
                            variant='info'
                            size='lg'
                            onClick={() => {
                              setInitializeCandidate(false);
                              setAddElectionCanvasser(true);
                              setDisplayElectionDetailsModel(true);
                            }}
                          >
                            Preview Details
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </Container>
                )}
              </Form>
            </Container>
          )}

          {addElectionCanvasser && loading === false && (
            <Container>
              <Alert variant='primary'>Adding of Election Canvasser</Alert>
              <Form
                noValidate
                validated={canvasserValidated}
                onSubmit={checkCanvasser}
              >
                {Array.from({ length: canvassOfficer.length }).map((_, i) => (
                  <Row key={`canvassOfficer#${i}`} className='p-3 mt-1'>
                    <Col sm={12} md={12}>
                      <Form.Group>
                        <FloatingLabel label='Full Name'>
                          <Form.Control
                            required
                            type='text'
                            placeholder='Full Name'
                            value={canvassOfficer[i].fullName}
                            onChange={(e) => {
                              onTextChange('canvasser', e.target.value, i, i);
                              setCanvassOfficer((prevState) => {
                                let temp = [...prevState];
                                temp[i].fullName = e.target.value;
                                temp[i].assignedPosition = [];
                                for (
                                  let j = 0;
                                  j < initialElectionPosition.length;
                                  j++
                                ) {
                                  temp[i].assignedPosition.push(
                                    initialElectionPosition[j].positionName
                                  );
                                }
                                sessionStorage.setItem(
                                  'canvassOfficer',
                                  JSON.stringify(temp)
                                );
                                return temp;
                              });
                            }}
                            onBlur={(e) => {
                              setTimeout(() => {
                                setCanvassOfficer((prevState) => {
                                  let temp = [...prevState];
                                  let match = false;
                                  collegeAndDepList.map((college) =>
                                    college.students.filter((student) => {
                                      if (student.FullName === e.target.value) {
                                        match = true;
                                      }
                                      return true;
                                    })
                                  );
                                  if (match) {
                                    temp[i].fullName = e.target.value;
                                  } else {
                                    temp[i].fullName = '';
                                  }
                                  sessionStorage.setItem(
                                    'canvassOfficer',
                                    JSON.stringify(temp)
                                  );
                                  return temp;
                                });

                                getCanvassOfficerUserID(i, e.target.value);
                                setSuggestions([]);
                              }, 100);
                            }}
                          />
                          {suggestions && (
                            <div
                              style={{
                                position: 'absolute',
                                zIndex: '5',
                                background: 'white',
                                width: '100%',
                              }}
                            >
                              {suggestions.map((suggestion, index) => {
                                if (index < 5) {
                                  return (
                                    <div
                                      className='suggestion mx-2 my-2'
                                      key={index}
                                      // onClick={() =>
                                      //   onSuggesthandler(
                                      //     'canvasser',
                                      //     suggestion.FullName,
                                      //     i,
                                      //     i
                                      //   )
                                      // }
                                      onPointerDown={() =>
                                        onSuggesthandler(
                                          'canvasser',
                                          suggestion.FullName,
                                          i,
                                          i
                                        )
                                      }
                                    >
                                      {suggestion.FullName}
                                    </div>
                                  );
                                } else {
                                  return true;
                                }
                              })}
                            </div>
                          )}
                          <Form.Control.Feedback type='invalid'>
                            Please input value for this field.
                          </Form.Control.Feedback>
                        </FloatingLabel>
                      </Form.Group>
                    </Col>
                  </Row>
                ))}

                <div>
                  <Row>
                    <Col
                      xs={{ span: 6, offset: 0 }}
                      md={{ span: 2, offset: 4 }}
                    >
                      <div className='d-grid gap-2'>
                        <Button
                          variant='info'
                          size='lg'
                          onClick={() => {
                            setCandidateValidated(false);
                            setAddElectionCanvasser((prevState) => {
                              return false;
                            });
                            setInitializeCandidate((prevState) => !prevState);
                          }}
                        >
                          Previous
                        </Button>
                      </div>
                    </Col>
                    <Col
                      xs={{ span: 6, offset: 0 }}
                      md={{ span: 2, offset: 0 }}
                    >
                      <div className='d-grid gap-2'>
                        <Button variant='info' size='lg' type='submit'>
                          view Details
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </div>
              </Form>
              <Modal
                show={displayElectionDetailsModel}
                onHide={handleModalClose}
                backdrop='static'
                keyboard={false}
                centered
                size='lg'
              >
                <Modal.Header className='justify-content-center'>
                  <Modal.Title>{election.electionName}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <Container className='mb-2'>
                    <Row className='mt-1 mx-1'>
                      <Col>
                        <FontAwesomeIcon
                          icon={faEdit}
                          className='text-success fa-1x'
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            handleModalClose();
                            setInitialState(true);
                            setFormReady(false);
                            setAddElectionCanvasser(false);
                          }}
                        />{' '}
                        <big>Election Details</big>
                      </Col>
                    </Row>
                    <Row>
                      <Container>
                        <ListGroup className='mx-4 mb-2' variant='flush'>
                          <ListGroup.Item>
                            <big>Opening Date: {handleDateDisplay('open')}</big>
                          </ListGroup.Item>
                          <ListGroup.Item>
                            <big>
                              Closing Date: {handleDateDisplay('close')}
                            </big>
                          </ListGroup.Item>
                          <ListGroup.Item>
                            <big>Election Level: {election.electionLevel}</big>
                          </ListGroup.Item>
                          <ListGroup.Item>
                            <big>Election Scope: {getElectionScope()}</big>
                          </ListGroup.Item>
                        </ListGroup>
                      </Container>
                      <hr />
                    </Row>
                  </Container>
                  <Container className='mb-2'>
                    <Row className='mt-1 mx-1'>
                      <Col>
                        <FontAwesomeIcon
                          icon={faEdit}
                          className='text-success fa-1x'
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            handleModalClose();
                            setAddElectionCanvasser(true);
                          }}
                        />{' '}
                        <big>Canvass Officer Details</big>
                      </Col>
                    </Row>
                    <Row>
                      <Container>
                        <ListGroup className='mx-4 mb-2' variant='flush'>
                          {Array.from({ length: canvassOfficer.length }).map(
                            (_, i) => (
                              <ListGroup.Item
                                key={`canvassOfficer#${i + 1}`}
                                className='text-dark'
                              >
                                <big>
                                  {i + 1}. {canvassOfficer[i].fullName}
                                  {' - '}({labelOfficer(canvassOfficer[i])})
                                </big>
                              </ListGroup.Item>
                            )
                          )}
                        </ListGroup>
                      </Container>
                    </Row>
                    <hr />
                  </Container>

                  <Container>
                    <Row xs={12} className='mt-1 mx-1'>
                      <Col>
                        <big>
                          <center>Election Candidates</center>
                        </big>
                      </Col>
                    </Row>
                    {Array.from({
                      length: initialElectionPosition.length,
                    }).map((_, i) => (
                      <Row
                        key={`${initialElectionPosition[i].positionName}-(${i})`}
                        className='mt-1 mx-1'
                      >
                        <Container className='mb-2'>
                          <FontAwesomeIcon
                            icon={faEdit}
                            className='text-success fa-1x'
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                              handleModalClose();
                              // console.log('edit position candidates');
                              setAddElectionCanvasser(false);
                              setCurrentPositionIndex(i);
                              setInitializeCandidate(true);
                            }}
                          />{' '}
                          <big>{initialElectionPosition[i].positionName}</big>
                          {' - '}
                          {'('}
                          {labelYearLevel(
                            initialElectionPosition[i].allowedYearLevel
                          )}
                          {')'}
                          {Array.from({
                            length:
                              initialElectionPosition[i].candidates.length,
                          }).map((_, j) => (
                            <ListGroup
                              key={`${initialElectionPosition[i].candidates}(${j})`}
                              className='mx-4'
                              variant='flush'
                            >
                              <ListGroup.Item className='text-dark'>
                                <big>
                                  {j + 1}.{' '}
                                  {
                                    initialElectionPosition[i].candidates[j]
                                      .fullName
                                  }{' '}
                                  -{' '}
                                  {labelCandidate(
                                    initialElectionPosition[i].candidates[j],
                                    i,
                                    j
                                  )}
                                </big>
                              </ListGroup.Item>
                            </ListGroup>
                          ))}
                        </Container>
                      </Row>
                    ))}
                    <hr />
                  </Container>
                  <Container className='mb-2'>
                    <Row className='mt-1 mx-1'>
                      <Col>
                        <center>
                          <FontAwesomeIcon
                            icon={faEdit}
                            className='text-success fa-1x'
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                              handleModalClose();
                              setPreviewDetails(true);
                              setInitializePosition(true);
                              setAddElectionCanvasser(false);
                            }}
                          />{' '}
                          <big>Update Election Positions</big>
                        </center>
                      </Col>
                    </Row>
                  </Container>
                </Modal.Body>
                <Modal.Footer>
                  {/* <Button variant='secondary' onClick={handleModalClose}>
                    Edit
                  </Button> */}
                  <Button
                    variant='success'
                    disabled={createPass}
                    onClick={registerElection}
                  >
                    Confirm
                  </Button>
                </Modal.Footer>
              </Modal>
              <Modal
                show={showCreationSuccessful}
                backdrop='static'
                keyboard={false}
              >
                <Modal.Header>
                  <Modal.Title>Election created successfully</Modal.Title>
                </Modal.Header>
                <Modal.Body>Click "Confirm" to navigate to home.</Modal.Body>
                <Modal.Footer>
                  <Button
                    variant='info'
                    onClick={() => {
                      history('/home');
                    }}
                  >
                    Confirm
                  </Button>
                </Modal.Footer>
              </Modal>
            </Container>
          )}
        </Container>
      </div>
    </>
  );
}

export default ElectionCreation;
