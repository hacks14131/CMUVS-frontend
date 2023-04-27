import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  Button,
  Card,
  Col,
  Container,
  Figure,
  ListGroup,
  Modal,
  ProgressBar,
  Row,
} from 'react-bootstrap';
import defaultImage from '../../../defaultImage/defaultProfilePic.jpg';
import Loading from '../../Loading/Loading';
import './LiveElections.css';

const LiveElections = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [liveData, setLiveData] = useState([]);
  const [seeProfile, setSeeProfile] = useState(false);
  const [time, setTime] = useState(new Date());
  const [selectedCandidate, setSelectedCandidate] = useState({
    name: '',
    party: '',
    profilePic: '',
    motto: '',
    platform: [],
  });
  const positionIdentifier = useRef([]);

  /*
    Logic is to get the election number of the selected election card from the homepage and use that 
    election id to fetch the positions for that particular election and the candidates for each of
    those positions
  */

  useEffect(() => {
    if (location.state === null) {
      navigate('/home');
    } else {
      const token = sessionStorage.getItem('token');
      let source = axios.CancelToken.source();
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-type': 'application/json',
        },
        cancelToken: source.token,
      };

      const getCandidateProfilePic = async (
        userID,
        candidateID,
        lastCandidate
      ) => {
        try {
          return new Promise((resolve) => {
            const getProfilePicURL = `https://cmuvs-api.onrender.com/api/candidatePicture/${userID}`;
            const getMottoURL = `https://cmuvs-api.onrender.com/api/motto/${candidateID}`;
            const getPlatformURL = `https://cmuvs-api.onrender.com/api/platform/${candidateID}`;

            const getProfilePicPromise = axios.get(getProfilePicURL, config);
            const getMottoPromise = axios.get(getMottoURL, config);
            const getPlatformPromise = axios.get(getPlatformURL, config);

            Promise.all([
              getProfilePicPromise,
              getMottoPromise,
              getPlatformPromise,
            ])
              .then(
                ([
                  getProfilePicPromiseResult,
                  getMottoPromiseResult,
                  getPlatformPromiseResult,
                ]) => {
                  let profilePicture = null;
                  let motto = null;
                  let platform = [null];
                  if (getProfilePicPromiseResult.data) {
                    profilePicture =
                      getProfilePicPromiseResult.data.profilePicture.url;
                  }
                  if (getMottoPromiseResult.data) {
                    motto = getMottoPromiseResult.data;
                  }
                  if (getPlatformPromiseResult.data) {
                    platform = [...getPlatformPromiseResult.data];
                  }
                  resolve({
                    picture: profilePicture,
                    motto: motto,
                    platform: platform,
                  });
                  if (lastCandidate) {
                    setLoading(false);
                  }
                }
              )
              .catch((error) => setLoading(false));
          });
        } catch (error) {
          console.log(error);
        }
      };
      let interval = null;

      let time = 100;

      const electionID = location.state._id;
      const getAllElectionCandidatesURL = `https://cmuvs-api.onrender.com/api/electionCandidate/candidate/${electionID}`;
      const getAllElectionPositionsURL = `https://cmuvs-api.onrender.com/api/electionPosition/${electionID}`;
      const getAllVoteHistoryByElectionIDURL = `https://cmuvs-api.onrender.com/api/userVoteHistory/${electionID}`;

      const getAllElectionPositions = axios.get(
        getAllElectionPositionsURL,
        config
      );
      const getAllElectionCandidates = axios.get(
        getAllElectionCandidatesURL,
        config
      );
      const getAllVoteHistoryByElectionID = axios.get(
        getAllVoteHistoryByElectionIDURL,
        config
      );

      const firstRender = setTimeout(() => {
        time = 60000;
        Promise.all([
          getAllElectionPositions,
          getAllElectionCandidates,
          getAllVoteHistoryByElectionID,
        ])
          .then(
            ([
              getAllElectionPositionsResult,
              getAllElectionCandidatesResult,
              getAllVoteHistoryByElectionIDResult,
            ]) => {
              setLiveData((prevState) => {
                const voteHistory = [
                  ...getAllVoteHistoryByElectionIDResult.data,
                ];
                let candidates = [...getAllElectionCandidatesResult.data];
                let positions = getAllElectionPositionsResult.data.sort(
                  (a, b) => (a.positionNumber > b.positionNumber ? 1 : -1)
                );
                for (let i = 0; i < positions.length; i++) {
                  positions[i].candidates = [];
                  for (let j = 0; j < candidates.length; j++) {
                    if (positions[i]._id === candidates[j].positionID._id) {
                      let lastCandidate = false;
                      if (j + 1 === candidates.length) {
                        lastCandidate = true;
                      }
                      getCandidateProfilePic(
                        candidates[j].userID._id,
                        candidates[j]._id,
                        lastCandidate
                      ).then((docs) => {
                        candidates[j].profilePicture = docs.picture;
                        candidates[j].motto = docs.motto;
                        candidates[j].platform = docs.platform;
                      });
                      positions[i].candidates.push(candidates[j]);
                    }
                  }
                }
                for (let i = 0; i < positions.length; i++) {
                  for (let j = 0; j < positions[i].candidates.length; j++) {
                    positions[i].candidates[j].currentCount = 0;
                    positions[i].candidates[j].filled = false;
                    for (let k = 0; k < voteHistory.length; k++) {
                      if (
                        positions[i].candidates[j]._id ===
                        voteHistory[k].votedCandidateID
                      ) {
                        if (positions[i].candidates[j].currentCount) {
                          positions[i].candidates[j].currentCount++;
                        } else {
                          positions[i].candidates[j].currentCount = 1;
                          positions[i].candidates[j].filled = true;
                        }
                      }
                    }
                  }
                }
                for (let i = 0; i < positions.length; i++) {
                  positions[i].candidates.sort((a, b) =>
                    b.userID.familyName.localeCompare(a.userID.familyName)
                  );
                }
                for (let i = 0; i < positions.length; i++) {
                  positions[i].candidates.sort((a, b) =>
                    a.currentCount < b.currentCount ? 1 : -1
                  );
                }
                let posIndentifier = [];
                for (let i = 0; i < positions.length; i++) {
                  posIndentifier.push(1);
                }
                positionIdentifier.current = [...posIndentifier];
                return positions;
              });
              // setLoading(false);
            }
          )
          .then(() => {
            // setLoading(false);
          });
        setTime(new Date());
        interval = setInterval(() => {
          axios
            .get(getAllVoteHistoryByElectionIDURL, config)
            .then((getAllVoteHistoryByElectionIDResult) => {
              const voteHistory = [...getAllVoteHistoryByElectionIDResult.data];
              setLiveData((prevState) => {
                let temp = [...prevState];
                for (let i = 0; i < temp.length; i++) {
                  for (let j = 0; j < temp[i].candidates.length; j++) {
                    temp[i].candidates[j].currentCount = 0;
                    temp[i].candidates[j].filled = false;
                    for (let k = 0; k < voteHistory.length; k++) {
                      if (
                        temp[i].candidates[j]._id ===
                        voteHistory[k].votedCandidateID
                      ) {
                        temp[i].candidates[j].currentCount++;
                        temp[i].candidates[j].filled = true;
                      }
                    }
                  }
                }
                for (let i = 0; i < temp.length; i++) {
                  temp[i].candidates.sort((a, b) =>
                    b.userID.familyName.localeCompare(a.userID.familyName)
                  );
                }
                for (let i = 0; i < temp.length; i++) {
                  temp[i].candidates.sort((a, b) =>
                    a.currentCount < b.currentCount ? 1 : -1
                  );
                }
                let posIndentifier = [];
                for (let i = 0; i < temp.length; i++) {
                  posIndentifier.push(1);
                }
                positionIdentifier.current = [...posIndentifier];
                return temp;
              });
            });
          setTime(new Date());
        }, time);
      }, time);
      return () => {
        clearTimeout(firstRender);
        clearInterval(interval);
        source.cancel();
      };
    }
  }, [location, navigate]);

  const getProgressBarValue = (value, totalValue) => {
    try {
      return Math.round((value / totalValue) * 100);
    } catch (error) {
      console.log(error);
    }
  };

  const getTime = () => {
    try {
      let month = time.getMonth();
      switch (month) {
        case 0: {
          month = 'January';
          break;
        }
        case 1: {
          month = 'February';
          break;
        }
        case 2: {
          month = 'March';
          break;
        }
        case 3: {
          month = 'April';
          break;
        }
        case 4: {
          month = 'May';
          break;
        }
        case 5: {
          month = 'June';
          break;
        }
        case 6: {
          month = 'July';
          break;
        }
        case 7: {
          month = 'August';
          break;
        }
        case 8: {
          month = 'September';
          break;
        }
        case 9: {
          month = 'October';
          break;
        }
        case 10: {
          month = 'November';
          break;
        }
        default: {
          month = 'December';
          break;
        }
      }
      let day = time.getDate();
      let year = time.getFullYear();
      let hours = time.getHours();
      let minutes = time.getMinutes();
      return `Live Vote Count as of ${month} ${day}, ${year} ${
        hours % 12 === 0 ? '12' : hours % 12
      }:${minutes < 10 ? '0' + minutes : minutes}${hours > 12 ? ' PM' : ' AM'}`;
    } catch (error) {}
  };

  const getHeader = () => {
    try {
      return `Live Vote Count of the ${location.state.electionName}`;
    } catch (error) {}
  };

  const getOrdinal = (posIndex, candIndex, a, b) => {
    try {
      let number = candIndex + 1;
      if (candIndex === 0) {
        number = 1;
        positionIdentifier.current.splice(posIndex, 1, 2);
      } else {
        if (b !== a) {
          number = positionIdentifier.current[posIndex];
          positionIdentifier.current.splice(posIndex, 1, number + 1);
        } else {
          number = positionIdentifier.current[posIndex] - 1;
        }
      }

      let ord = 'th';
      if (number % 10 === 1 && number % 100 !== 11) {
        ord = 'st';
      } else if (number % 10 === 2 && number % 100 !== 12) {
        ord = 'nd';
      } else if (number % 10 === 3 && number % 100 !== 13) {
        ord = 'rd';
      }
      return `${number}${ord}`;
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      {loading && <Loading />}
      {!loading && (
        <div className='live'>
          <center>
            <h3 className='livecount'>{getHeader()}</h3>
          </center>

          <Container className='py-4'>
            <h5>{getTime()}</h5>
            <Row xs={1} sm={1} md={2} lg={3} xl={3}>
              {Array.from({ length: liveData.length }).map((_, i) => (
                <Col key={liveData[i]._id} className='mb-2'>
                  <Card className='my-2 h-100'>
                    <Card.Header
                      className='cardHeader'
                      style={{ backgroundColor: '#2f4050' }}
                    >
                      <Card.Title className='text-center'>
                        {liveData[i].positionName}
                      </Card.Title>
                    </Card.Header>
                    <Card.Body>
                      <ListGroup variant='flush'>
                        {Array.from({
                          length: liveData[i].candidates.length,
                        }).map((_, j) => (
                          <ListGroup.Item key={liveData[i].candidates[j]._id}>
                            <Row>
                              <Col xs={1} className='my-2 mx-1'>
                                {liveData[i].candidates[j].currentCount !==
                                0 ? (
                                  <div
                                    style={{ float: 'left' }}
                                    className='text-muted'
                                  >
                                    {getOrdinal(
                                      i,
                                      j,
                                      j === 0
                                        ? liveData[i].candidates[j].currentCount
                                        : liveData[i].candidates[j - 1]
                                            .currentCount,
                                      liveData[i].candidates[j].currentCount
                                    )}
                                  </div>
                                ) : (
                                  <div
                                    style={{ float: 'left' }}
                                    className='text-muted'
                                  ></div>
                                )}
                              </Col>
                              <Col>
                                <Row>
                                  <Container
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => {
                                      setSeeProfile(true);
                                      setSelectedCandidate((prevState) => {
                                        let temp = { ...prevState };
                                        temp.name = `${liveData[i].candidates[j].userID.familyName}, ${liveData[i].candidates[j].userID.firstName}`;
                                        temp.college =
                                          liveData[i].candidates[
                                            j
                                          ].userID.college;
                                        temp.department =
                                          liveData[i].candidates[
                                            j
                                          ].userID.department;
                                        temp.party =
                                          liveData[i].candidates[j].party;
                                        temp.profilePic =
                                          liveData[i].candidates[
                                            j
                                          ].profilePicture;
                                        if (liveData[i].candidates[j].motto) {
                                          temp.motto =
                                            liveData[i].candidates[
                                              j
                                            ].motto.motto;
                                        } else {
                                          temp.motto = '';
                                        }
                                        if (
                                          liveData[i].candidates[j].platform
                                            .length !== 0
                                        ) {
                                          temp.platform = [];
                                          liveData[i].candidates[
                                            j
                                          ].platform.map((plat) =>
                                            temp.platform.push(plat.platform)
                                          );
                                        } else {
                                          temp.platform = [];
                                        }

                                        return temp;
                                      });
                                    }}
                                  >
                                    <span>
                                      <big>{`${liveData[i].candidates[j].userID.firstName} ${liveData[i].candidates[j].userID.familyName}`}</big>
                                    </span>
                                    <p className='text-muted'>
                                      {liveData[i].candidates[j].party}
                                    </p>
                                  </Container>
                                </Row>
                                <Row>
                                  <div>
                                    <Col>
                                      <div>
                                        <span style={{ float: 'right' }}>
                                          {`${
                                            liveData[i].candidates[j]
                                              .currentCount !== 0
                                              ? liveData[i].candidates[j]
                                                  .currentCount === 1
                                                ? liveData[i].candidates[j]
                                                    .currentCount + ' Vote'
                                                : liveData[i].candidates[j]
                                                    .currentCount + ' Votes'
                                              : ''
                                          }`}
                                        </span>
                                      </div>
                                      <br />
                                      <ProgressBar
                                        animated
                                        variant='info'
                                        now={getProgressBarValue(
                                          liveData[i].candidates[j]
                                            .currentCount,
                                          liveData[i].expectedMaximumVoter
                                        )}
                                      />
                                    </Col>
                                  </div>
                                </Row>
                              </Col>
                            </Row>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Container>

          <Modal show={seeProfile} backdrop='static' keyboard={false}>
            <Modal.Header className='justify-content-center'>
              <Modal.Title>Candidate Profile</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Container>
                <Row>
                  <Col xs={12} sm={12} md={4} lg={4}>
                    <center>
                      <Figure>
                        <Figure.Image
                          alt={defaultImage}
                          src={
                            selectedCandidate.profilePic
                              ? selectedCandidate.profilePic
                              : defaultImage
                          }
                          thumbnail
                        />
                        {selectedCandidate.profilePic === null && (
                          <Figure.Caption>
                            Candidate have no picture
                          </Figure.Caption>
                        )}
                      </Figure>
                    </center>
                  </Col>
                  <Col
                    xs={12}
                    sm={12}
                    md={8}
                    lg={8}
                    style={{ padding: '0px' }}
                    className='py-auto'
                  >
                    <p
                      style={{
                        fontSize: '20px',
                        fontWeight: '100',
                        marginBottom: '1px',
                      }}
                    >
                      Name: {selectedCandidate.name}
                    </p>
                    <p
                      style={{
                        fontSize: '20px',
                        fontWeight: '100',
                        marginBottom: '1px',
                      }}
                    >
                      Party: {selectedCandidate.party}
                    </p>
                    <p
                      style={{
                        fontSize: '20px',
                        fontWeight: '100',
                        marginBottom: '1px',
                      }}
                    >
                      College: {selectedCandidate.college}
                    </p>
                    <p
                      style={{
                        fontSize: '20px',
                        fontWeight: '100',
                        marginBottom: '1px',
                      }}
                    >
                      Department: {selectedCandidate.department}
                    </p>
                  </Col>
                </Row>
              </Container>
              <hr />
              <Container>
                <Row>
                  <Col style={{ padding: '0px' }}>
                    <p
                      style={{
                        fontSize: '20px',
                        fontWeight: '500',
                        marginBottom: '1px',
                      }}
                    >
                      Motto
                    </p>
                    <Container>
                      <p style={{ marginBottom: '3px' }}>
                        {selectedCandidate.motto !== ''
                          ? selectedCandidate.motto
                          : 'No data found'}
                      </p>
                    </Container>
                    <p
                      style={{
                        fontSize: '20px',
                        fontWeight: '500',
                        marginBottom: '1px',
                      }}
                    >
                      Platform
                    </p>
                    {selectedCandidate.platform.length !== 0 ? (
                      <ListGroup variant='flush' as='ol' numbered>
                        {selectedCandidate.platform.map((plat, key) => (
                          <ListGroup.Item
                            key={key}
                            as='li'
                            style={{ fontWeight: '100' }}
                          >
                            {plat}
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    ) : (
                      <Container>No data found</Container>
                    )}
                  </Col>
                </Row>
              </Container>
            </Modal.Body>
            <Modal.Footer>
              <Button
                onClick={() => {
                  setSeeProfile(false);
                }}
                variant='success'
              >
                Close
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      )}
    </>
  );
};

export default LiveElections;
