import React, { useRef, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Modal,
  ListGroup,
  Figure,
} from 'react-bootstrap';
import './Vote.css';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faWindowClose } from '@fortawesome/free-solid-svg-icons';

import Loading from '../../Loading/Loading';

function Vote() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [positions, setPositions] = useState([]);
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const [candidateProfile, setCandidateProfile] = useState([]);
  const positionAndCandidate = useRef([]);
  const [checkboxHistory, setCheckboxHistory] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const screenWidth = useRef(window.innerWidth);
  const IPv4 = useRef();
  const deviceModel = useRef();

  useEffect(() => {
    const electionInfo = location.state;
    const token = sessionStorage.getItem('token');
    const college = sessionStorage.getItem('college');
    const yearLevel = sessionStorage.getItem('yearLevel');
    const source = axios.CancelToken.source();
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-type': 'application/json',
      },
      cancelToken: source.token,
    };

    if (location.state === null) {
      navigate('/home');
    } else {
      getDeviceName();
      const currentDate = new Date();
      const closingDate = new Date(location.state.electionClosingDate);
      const electionStatus = location.state.electionStatus;
      if (currentDate > closingDate || electionStatus === 'Finished') {
        navigate('/home');
      }

      const electionID = location.state._id;
      const fetchElectionPositionsURL = `http://localhost:5000/api/electionPosition/${electionID}`;
      const fetchElectionCandidatesURL = `http://localhost:5000/api/electionCandidate/candidate/${electionID}`;
      // const candidateProfilePic = `http://localhost:5000/api/candidatePicture/`;
      // const candidateMottoURL = `http://localhost:5000/api/motto/`;
      // const candidatePlatformURL = `http://localhost:5000/api/platform`;

      const fetchElectionPositions = () => {
        const fetchPositions = axios.get(fetchElectionPositionsURL, config);
        const fetchElectionCandidates = axios.get(
          fetchElectionCandidatesURL,
          config
        );
        Promise.all([fetchPositions, fetchElectionCandidates])
          .then(([positionsPromise, candidatesPromise]) => {
            setPositions((prevState) => {
              const candi = [...candidatesPromise.data];
              const temp = positionsPromise.data.sort((a, b) =>
                a.positionNumber > b.positionNumber ? 1 : -1
              );
              for (let i = 0; i < temp.length; i++) {
                temp[i].candidates = [];
                for (let j = 0; j < candi.length; j++) {
                  if (temp[i]._id === candi[j].positionID._id) {
                    temp[i].candidates.push(candi[j]);
                  }
                }
              }

              const filteredPositionsAndCandidates = temp.filter((pos) => {
                if (electionInfo.electionLevel === 'University') {
                  if (
                    pos.allowedCollege === 'ALL' ||
                    pos.allowedCollege === college
                  ) {
                    return pos;
                  } else {
                    return null;
                  }
                } else if (electionInfo.electionLevel === 'College') {
                  if (
                    pos.allowedYearLevel === 'ALL' ||
                    pos.allowedYearLevel === yearLevel
                  ) {
                    return pos;
                  } else {
                    return null;
                  }
                } else {
                  if (
                    pos.allowedYearLevel === 'ALL' ||
                    pos.allowedYearLevel === yearLevel
                  ) {
                    return pos;
                  } else {
                    return null;
                  }
                }
              });
              positionAndCandidate.current = filteredPositionsAndCandidates;
              return filteredPositionsAndCandidates;
            });
          })
          .then(() => {
            // console.log(positionAndCandidate.current.length);
            // console.log(positionAndCandidate.current);
            const positionAndCandidateClone = [...positionAndCandidate.current];
            let candidateDataHolder = [];
            let candidateProfilePicURL = '';
            let candidateMottoURL = '';
            let candidatePlatformURL = '';

            for (let i = 0; i < positionAndCandidateClone.length; i++) {
              const positionData = {
                positionName: positionAndCandidateClone[i].positionName,
                candidates: [],
              };
              candidateDataHolder.push(positionData);
              for (
                let j = 0;
                j < positionAndCandidateClone[i].candidates.length;
                j++
              ) {
                candidateProfilePicURL = `http://localhost:5000/api/candidatePicture/${positionAndCandidateClone[i].candidates[j].userID._id}`;
                candidateMottoURL = `http://localhost:5000/api/motto/${positionAndCandidateClone[i].candidates[j]._id}`;
                candidatePlatformURL = `http://localhost:5000/api/platform/${positionAndCandidateClone[i].candidates[j]._id}`;

                Promise.all([
                  axios.get(candidateProfilePicURL, config),
                  axios.get(candidateMottoURL, config),
                  axios.get(candidatePlatformURL, config),
                ])
                  .then(
                    ([
                      candidateProfilePicResult,
                      candidateMottoResult,
                      candidatePlatformResult,
                    ]) => {
                      let candidateProfileDetails = {
                        name: `${positionAndCandidateClone[i].candidates[j].userID.familyName}, ${positionAndCandidateClone[i].candidates[j].userID.firstName}`,
                        party: positionAndCandidateClone[i].candidates[j].party,
                        profilePicture: null,
                        motto: '',
                        platform: [],
                      };
                      // console.log('successful fetch');
                      // console.log(candidateProfilePicResult.data);
                      // console.log(candidateMottoResult.data);
                      // console.log(candidatePlatformResult.data);
                      if (candidateProfilePicResult.data !== null) {
                        const profilePicture =
                          candidateProfilePicResult.data.profilePicture;
                        const convertedPic = btoa(
                          new Uint8Array(profilePicture.data.data).reduce(
                            function (data, byte) {
                              return data + String.fromCharCode(byte);
                            },
                            ''
                          )
                        );
                        candidateProfileDetails.profilePicture = convertedPic;
                      }
                      if (candidateMottoResult.data !== null) {
                        candidateProfileDetails.motto =
                          candidateMottoResult.data.motto;
                      }
                      if (
                        candidatePlatformResult.data !== null &&
                        candidatePlatformResult.data.length !== 0
                      ) {
                        candidatePlatformResult.data.map((candiMotto) => {
                          candidateProfileDetails.platform.push(
                            candiMotto.platform
                          );
                          return '';
                        });
                      }
                      candidateDataHolder[i].candidates.push(
                        candidateProfileDetails
                      );
                    }
                  )
                  .catch((error) => {});
              }
            }
            positionAndCandidate.current = candidateDataHolder;
            setCandidateProfile((prevState) => [...candidateDataHolder]);
          })
          .then(() => {
            setLoading((prevState) => false);
          })
          .catch((error) => console.log(error));
      };

      fetchElectionPositions();
    }

    return () => {
      source.cancel();
    };
  }, [location, navigate]);

  const getDeviceName = async () => {
    try {
      let device = 'unknown';
      const ua = {
        'Generic Linux': /Linux/i,
        Android: /Android/i,
        BlackBerry: /BlackBerry/i,
        Bluebird: /EF500/i,
        'Chrome OS': /CrOS/i,
        Datalogic: /DL-AXIS/i,
        Honeywell: /CT50/i,
        iPad: /iPad/i,
        iPhone: /iPhone/i,
        iPod: /iPod/i,
        macOS: /Macintosh/i,
        Windows: /IEMobile|Windows/i,
        Zebra: /TC70|TC55/i,
      };
      Object.keys(ua).map(
        (v) => navigator.userAgent.match(ua[v]) && (device = v)
      );
      await axios.get('https://geolocation-db.com/json/').then((docs) => {
        IPv4.current = docs.data.IPv4;
        deviceModel.current = device;
      });
    } catch (error) {
      console.log(error);
    }
  };

  const checkboxStatus = (id) => {
    try {
      if (checkboxHistory[currentCarouselIndex]) {
        if (checkboxHistory[currentCarouselIndex].ids.includes(id)) {
          return true;
        }
      }
      return false;
    } catch (error) {
      console.log(error);
    }
  };

  const handleUncheck = (event, id, candidate, positionName) => {
    try {
      let newState = checkboxHistory[currentCarouselIndex].ids.filter(
        (checkID) => checkID !== id
      );
      setCheckboxHistory((prevState) => {
        let temp = [...prevState];
        temp[currentCarouselIndex].ids = [...newState];
        updateVotingData(event, candidate, positionName);
        return temp;
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleCheck = (
    event,
    id,
    maxVote,
    candidate,
    positionName,
    postNumber,
    status
  ) => {
    try {
      setCheckboxHistory((prevState) => {
        let temp = [...prevState];
        if (!temp[currentCarouselIndex]) {
          temp[currentCarouselIndex] = { ids: [id] };
          return temp;
        } else if (temp[currentCarouselIndex].ids.length >= maxVote) {
          return temp;
        } else {
          temp[currentCarouselIndex] = {
            ids: [...temp[currentCarouselIndex].ids, id],
          };

          return temp;
        }
      });
      if (!status) {
        updateVotingData(event, candidate, positionName, postNumber, maxVote);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const updateVotingData = (e, candidate, posName, postNumber, maximumVote) => {
    try {
      let positionVoteCountTracker = 0;
      votingData.forEach((data) => {
        if (data.positionName === posName) {
          positionVoteCountTracker++;
        }
      });
      if (e.target.checked) {
        if (
          !votingData.includes(candidate) &&
          maximumVote > positionVoteCountTracker
        ) {
          setVotingData((prevState) => {
            let temp = [...prevState];
            temp.push(candidate);
            temp[temp.length - 1].positionName = posName;
            temp[temp.length - 1].positionNumber = postNumber;
            return temp;
          });
        }
      } else {
        if (votingData.includes(candidate)) {
          setVotingData((prevState) => {
            let temp = [...prevState];
            let updatedArray = temp.filter((candi) => {
              if (candi._id !== candidate._id) {
                return candi;
              }
              return '';
            });
            return updatedArray;
          });
        }
      }
      setVotingData((prevState) => {
        let temp = [...prevState];
        const sortedVotingData = temp.sort((a, b) =>
          a.positionNumber > b.positionNumber ? 1 : -1
        );
        return sortedVotingData;
      });
    } catch (error) {
      console.log(error);
    }
  };

  /* 
        Vote page logic is to get the election id# from the home component where the user can see the list
        of election/s that he/she is allowed to participate in and pass it into this component to be then use
        that election id to be able to fetch the necessay data needed for this election (positions, and candidates)
    */

  /*
        First we need to get the id of the election that the user selected in the home page and used that election id
        to get the list of positions and candidates for this particular election
    */

  /* 
        Remember to sort the electionData by the position number props in ascending order
    */

  /*
    variable to handle showing modal for voted candidates of the voter
  */
  const [showVotedModal, setShowVotedModal] = useState(false);

  /*
    Variable to handle showing modal for voter's voter receipt
  */
  // const [showVoterVoteReceipt, setShowVoterVoteReceipt] = useState(false);

  /* 
    After the voter is done filling out the form and have confirmed his/her votes. First is we need to use the API
    for creating a userVoteHistory (POST request) then get the id of the created userVoteHistory instance. After 
    successfully getting the ID then we can populate the userVoteHistoryID props of the voterVotingDate variable then 
    proceed in registering the voted candidates of the voter.
  */

  const [votingData, setVotingData] = useState([]);

  /* 
    function that will handle the submit of vote if the user confirmed his/her vote
  */
  const handleVotingFormSubmit = (e) => {
    try {
      e.preventDefault();
      setShowVotedModal((prevState) => true);
    } catch (error) {
      console.log(error);
    }
  };

  /*
    fucntion use for hiding the modal for voted details
  */
  const hideVotedDetails = () => {
    try {
      setShowVotedModal((prevState) => false);
    } catch (error) {
      console.log(error);
    }
  };

  const registerVote = async () => {
    try {
      const userID = sessionStorage.getItem('userID');
      const electionID = location.state._id;
      const postUserVoteHistoryURL =
        'http://localhost:5000/api/userVoteHistory';

      let postUserVoteHistoryPromise = [];
      for (let i = 0; i < votingData.length; i++) {
        postUserVoteHistoryPromise.push(
          postVote(
            postUserVoteHistoryURL,
            electionID,
            userID,
            votingData[i]._id,
            IPv4.current,
            deviceModel.current
          )
        );
      }
      Promise.all(postUserVoteHistoryPromise)
        .then(() => {
          setLoading((prevState) => !prevState);
          navigate('/home');
        })
        .catch((error) => console.log(error));
    } catch (error) {
      console.log(error);
    }
  };

  const postVote = async (
    url,
    electionID,
    userID,
    votedCandidateID,
    ip,
    device
  ) => {
    try {
      const source = axios.CancelToken.source();
      const token = sessionStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-type': 'application/json',
        },
        cancelToken: source.token,
      };

      await axios
        .post(
          url,
          {
            electionID,
            userID,
            votedCandidateID,
            IPv4: ip,
            deviceModel: device,
          },
          config
        )
        .then()
        .catch((error) => console.log(error));
    } catch (error) {
      console.log(error);
    }
  };

  const generateVoteReceipt = async () => {
    try {
      setShowVotedModal((prevState) => false);
      setLoading((prevState) => !prevState);
      await registerVote().then();
    } catch (error) {
      console.log(error);
    }

    // setShowVoterVoteReceipt((prevState) => true);
  };

  return (
    <>
      {loading && <Loading />}
      {!loading && (
        <div className='votingFormWrapper'>
          <div>
            <center>
              <h2 className='voteTitle'>
                {location.state.electionName} Voting Form
              </h2>
            </center>
          </div>
          <Container className='votingForm'>
            <Container className='border border-dark'>
              <p className='positionTitle'>
                {positions[currentCarouselIndex].candidates.length !== 1
                  ? `${positions[currentCarouselIndex].positionName} Candidate -`
                  : `${positions[currentCarouselIndex].positionName} Candidates -`}
                <u
                  style={{ cursor: 'pointer', color: 'rgb(88, 87, 87)' }}
                  onClick={() => {
                    setShowProfile(true);
                  }}
                >
                  {positions[currentCarouselIndex].candidates.length !== 1
                    ? 'View profiles?'
                    : 'View profile?'}
                </u>
              </p>
              <p className='selectTitle'>
                <mark className='red'>Note: </mark>You can select a minimum of 0
                and maximum of {positions[currentCarouselIndex].maximumVotes}{' '}
                candidate/s for this position
              </p>
              <Container>
                <Row className='justify-content-md-center'>
                  <Col md='auto'>
                    <Form>
                      {Array.from({
                        length:
                          positions[currentCarouselIndex].candidates.length,
                      }).map((_, i) => (
                        <Form.Group
                          key={`${positions[currentCarouselIndex].positionName}-${i}`}
                        >
                          {' '}
                          <Form.Check
                            type='checkbox'
                            label={`${positions[currentCarouselIndex].candidates[i].userID.familyName}, ${positions[currentCarouselIndex].candidates[i].userID.firstName} - ${positions[currentCarouselIndex].candidates[i].party}`}
                            onChange={(e) => {
                              let status = checkboxStatus(
                                `${positions[currentCarouselIndex].positionName}-${i}`
                              );

                              if (e.target.checked) {
                                handleCheck(
                                  e,
                                  `${positions[currentCarouselIndex].positionName}-${i}`,
                                  positions[currentCarouselIndex].maximumVotes,
                                  positions[currentCarouselIndex].candidates[i],
                                  positions[currentCarouselIndex].positionName,
                                  positions[currentCarouselIndex]
                                    .positionNumber,
                                  status
                                );
                              } else {
                                handleUncheck(
                                  e,
                                  `${positions[currentCarouselIndex].positionName}-${i}`,
                                  positions[currentCarouselIndex].candidates[i],
                                  positions[currentCarouselIndex].positionName
                                );
                              }
                            }}
                            checked={checkboxStatus(
                              `${positions[currentCarouselIndex].positionName}-${i}`
                            )}
                          />
                        </Form.Group>
                      ))}
                    </Form>
                  </Col>
                </Row>
              </Container>
            </Container>

            <Container>
              <Row>
                <Col xs={{ span: 4, offset: 2 }} md={{ span: 2, offset: 4 }}>
                  <div className='d-grid gap-2 mt-3'>
                    <Button
                      disabled={currentCarouselIndex === 0 ? true : false}
                      variant='outline-secondary'
                      onClick={() => {
                        setCurrentCarouselIndex((prevState) => prevState - 1);
                      }}
                    >
                      PREV
                    </Button>
                  </div>
                </Col>
                <Col xs={{ span: 4, offset: 0 }} md={{ span: 2, offset: 0 }}>
                  <div className='d-grid gap-2 mt-3'>
                    <Button
                      disabled={
                        positions.length - 1 === currentCarouselIndex
                          ? true
                          : false
                      }
                      variant='outline-secondary'
                      onClick={() => {
                        if (positions.length - 2 === currentCarouselIndex) {
                        }
                        setCurrentCarouselIndex((prevState) => prevState + 1);
                      }}
                    >
                      NEXT
                    </Button>
                  </div>
                </Col>
              </Row>
              {/* {positions.length - 1 > currentCarouselIndex && (
                <Button
                  disabled={
                    positions.length - 1 === currentCarouselIndex ? true : false
                  }
                  variant='secondary'
                  onClick={() => {
                    if (positions.length - 2 === currentCarouselIndex) {
                    }
                    setCurrentCarouselIndex((prevState) => prevState + 1);
                  }}
                >
                  NEXT
                </Button>
              )} */}
              {positions.length - 1 === currentCarouselIndex && (
                <Row>
                  <Col
                    xs={{ span: 12, offset: 0 }}
                    md={{ span: 2, offset: 10 }}
                  >
                    <div className='d-grid gap-2 mt-3'>
                      <Button
                        onClick={(e) => {
                          handleVotingFormSubmit(e);
                        }}
                        variant='outline-success'
                      >
                        Submit
                      </Button>
                    </div>
                  </Col>
                </Row>
              )}
            </Container>
            <Modal
              show={showVotedModal}
              onHide={hideVotedDetails}
              backdrop='static'
              keyboard={false}
              centered
            >
              <Modal.Header className='justify-content-center'>
                <Modal.Title>
                  <big>Vote Summary</big>
                </Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <ListGroup variant='flush'>
                  {Array.from({
                    length: votingData.length,
                  }).map((_, i) => (
                    <ListGroup.Item key={`vote-${i}`}>
                      {votingData[i].positionName}:{' '}
                      {`${votingData[i].userID.familyName}, ${votingData[i].userID.firstName} (${votingData[i].party})`}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
                <ListGroup variant='flush'>
                  {Array.from({ length: positions.length }).map((_, i) => {
                    let abstained = true;
                    votingData.map((data) => {
                      if (positions[i].positionName === data.positionName) {
                        abstained = false;
                        return true;
                      }
                      return true;
                    });
                    if (abstained) {
                      return (
                        <ListGroup.Item
                          key={`${positions[i].positionName}-${i}`}
                          className='text-warning'
                        >
                          {positions[i].positionName} - abstained
                        </ListGroup.Item>
                      );
                    }
                    return true;
                  })}
                </ListGroup>
              </Modal.Body>
              <Modal.Footer className='justify-content-end'>
                <span className='note'>
                  <small>
                    Note: Double check vote summary, if you wish to edit your
                    vote then click 'EDIT' otherwise, click 'SEND' to register
                    vote.
                  </small>
                </span>
                <Button variant='outline-info' onClick={hideVotedDetails}>
                  Edit
                </Button>
                <Button variant='outline-success' onClick={generateVoteReceipt}>
                  Send
                </Button>
              </Modal.Footer>
            </Modal>

            <Modal
              show={showProfile}
              onHide={() => {
                setShowProfile(false);
              }}
              backdrop='static'
              keyboard='false'
              centered
              size='lg'
              fullscreen={screenWidth.current < 581 ? true : false}
            >
              <Modal.Header className='justify-content-center' closeButton>
                <Modal.Title>
                  {candidateProfile[currentCarouselIndex].positionName}{' '}
                  candidate/s
                </Modal.Title>

                {/* <FontAwesomeIcon
                  icon={faWindowClose}
                  style={{ cursor: 'pointer' }}
                  className='fa-2x'
                  onClick={() => {
                    setShowProfile(false);
                  }}
                /> */}
              </Modal.Header>
              <Modal.Body>
                <ListGroup>
                  {Array.from({
                    length:
                      candidateProfile[currentCarouselIndex].candidates.length,
                  }).map((_, i) => (
                    <ListGroup.Item
                      key={`${candidateProfile[currentCarouselIndex]}-${i}`}
                    >
                      <Row className={screenWidth.current < 581 ? 'px-5' : ''}>
                        <Col>
                          {candidateProfile[currentCarouselIndex].candidates[i]
                            .profilePicture !== null && (
                            <Figure className='align-middle'>
                              <Figure.Image
                                width={150}
                                height={80}
                                alt='50x50'
                                src={`data:image/png; base64,${candidateProfile[currentCarouselIndex].candidates[i].profilePicture}`}
                              />
                            </Figure>
                          )}
                        </Col>
                      </Row>
                      <span>
                        <big>
                          Name:
                          <u>
                            {
                              candidateProfile[currentCarouselIndex].candidates[
                                i
                              ].name
                            }
                          </u>
                        </big>
                      </span>{' '}
                      <br />
                      <span>
                        <big>
                          Party:{' '}
                          <u>
                            {
                              candidateProfile[currentCarouselIndex].candidates[
                                i
                              ].party
                            }
                          </u>
                        </big>
                      </span>
                      <br />
                      <span>
                        <big>
                          Motto:{' '}
                          <u>
                            {candidateProfile[currentCarouselIndex].candidates[
                              i
                            ].motto !== ''
                              ? candidateProfile[currentCarouselIndex]
                                  .candidates[i].motto
                              : 'Candidate have not added his/her motto'}
                          </u>
                        </big>
                      </span>
                      <br />
                      <span>
                        <big>
                          Platform/s:{' '}
                          {candidateProfile[currentCarouselIndex].candidates[i]
                            .platform.length === 0 &&
                            'Candidate have not added his/her platform/s'}
                        </big>
                      </span>
                      <ListGroup as='ol' numbered>
                        {candidateProfile[currentCarouselIndex].candidates[
                          i
                        ].platform.map((platform) => (
                          <ListGroup.Item key={platform}>
                            {platform}
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Modal.Body>
            </Modal>
            {/* <Modal
              show={showVoterVoteReceipt}
              onHide={HideVoteReceiptDetails}
              backdrop='static'
              keyboard={false}
              centered
            >
              <Modal.Header>
                <Modal.Title>
                  <h3>Voting Receipt</h3>
                </Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Card style={{ width: '18rem' }}>
                  <ListGroup variant='flush'>
                    <ListGroup.Item>
                      User Vote History ID: xxxxxx
                    </ListGroup.Item>
                    <ListGroup.Item>Election ID: xxxxxxxx</ListGroup.Item>
                    <ListGroup.Item>User ID: xxxxxxxxx</ListGroup.Item>
                  </ListGroup>
                </Card>
              </Modal.Body>
              <Modal.Footer>
                <Button variant='info'>HOME</Button>
              </Modal.Footer>
            </Modal> */}
          </Container>
        </div>
      )}
    </>
  );
}

export default Vote;
