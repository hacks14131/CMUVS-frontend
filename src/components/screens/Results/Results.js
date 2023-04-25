import React, { useState, useEffect, useRef } from 'react';
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
import { Cell, Pie, PieChart } from 'recharts';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import defaultImage from '../../../defaultImage/defaultProfilePic.jpg';
import Loading from '../../Loading/Loading';
import './Results.css';

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [resultsData, setResultsData] = useState([]);
  const [displayStats, setDisplayStats] = useState(false);
  const [displayCandidateProfile, setDisplayCandidateProfile] = useState(false);
  const [pieData, setPieDate] = useState([
    { name: 'abstain/did not participate', value: 50 },
    { name: 'participants', value: 50 },
  ]);
  const [time, setTime] = useState(new Date());

  const positionIdentifier = useRef([]);
  positionIdentifier.current = [];

  //fetch propfile pic of each candidate
  const [selectedCandidate, setSelectedCandidate] = useState({
    name: '',
    college: '',
    department: '',
    party: '',
    profilePic: '',
    motto: '',
    platform: [],
  });

  const positionIndex = useRef(0);

  const RADIAN = Math.PI / 180;
  const COLORS = ['#B1babd', '#73de1a'];

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
      const electionID = location.state._id;
      const fetchAllElectionPositionURL = `http://localhost:5000/api/electionPosition/${electionID}`;
      const fetchAllElectionCandidateURL = `http://localhost:5000/api/electionCandidate/candidate/${electionID}`;
      const fetchAllVoteHistoryURL = `http://localhost:5000/api/userVoteHistory/${electionID}`;

      const getVoterParticipationQuantity = async (positionID) => {
        try {
          return new Promise((resolve) => {
            const getVoterParticipationQuantityURL = `http://localhost:5000/api/userVoteHistory/${electionID}/${positionID}`;

            axios.get(getVoterParticipationQuantityURL, config).then((docs) => {
              if (docs.data.votedCount) {
                resolve(docs.data.votedCount);
              } else {
                resolve(0);
              }
            });
          });
        } catch (error) {
          console.log(error);
        }
      };

      const getCandidateProfile = (user, candidateID, lastIndex) => {
        try {
          return new Promise((resolve) => {
            const getProfilePicURL = `http://localhost:5000/api/candidatePicture/${user}`;
            const getMottoURL = `http://localhost:5000/api/motto/${candidateID}`;
            const getPlatformURL = `http://localhost:5000/api/platform/${candidateID}`;
            let profilePicture = null;
            let convertedPic = null;
            let motto = null;
            let platform = [null];

            const getProfilePicPromise = axios.get(getProfilePicURL, config);
            const getMottoPromise = axios.get(getMottoURL, config);
            const getPlatformPromise = axios.get(getPlatformURL, config);

            Promise.all([
              getProfilePicPromise,
              getMottoPromise,
              getPlatformPromise,
            ]).then(
              ([
                getProfilePicPromiseResult,
                getMottoPromiseResult,
                getPlatformPromiseResult,
              ]) => {
                if (getProfilePicPromiseResult.data) {
                  profilePicture =
                    getProfilePicPromiseResult.data.profilePicture;
                  convertedPic = btoa(
                    new Uint8Array(profilePicture.data.data).reduce(function (
                      data,
                      byte
                    ) {
                      return data + String.fromCharCode(byte);
                    },
                    '')
                  );
                }
                if (getMottoPromiseResult.data) {
                  motto = getMottoPromiseResult.data;
                }
                if (getPlatformPromiseResult.data) {
                  platform = [...getPlatformPromiseResult.data];
                }
                resolve({
                  profile: convertedPic,
                  motto: motto,
                  platform: platform,
                });
                if (lastIndex) {
                  setLoading(false);
                }
              }
            );
          });
        } catch (error) {
          console.log(error);
        }
      };

      const fetchAllElectionPosition = axios.get(
        fetchAllElectionPositionURL,
        config
      );
      const fetchAllElectionCandidate = axios.get(
        fetchAllElectionCandidateURL,
        config
      );
      const fetchAllVoteHistory = axios.get(fetchAllVoteHistoryURL, config);

      Promise.all([
        fetchAllElectionPosition,
        fetchAllElectionCandidate,
        fetchAllVoteHistory,
      ])
        .then(
          ([
            fetchAllElectionPositionPromise,
            fetchAllElectionCandidatePromise,
            fetchAllVoteHistoryPromise,
          ]) => {
            setResultsData((prevState) => {
              let temp = fetchAllElectionPositionPromise.data.sort((a, b) =>
                a.positionNumber > b.positionNumber ? 1 : -1
              );
              for (let i = 0; i < temp.length; i++) {
                temp[i].candidates = [];

                getVoterParticipationQuantity(temp[i]._id)
                  .then((docs) => {
                    temp[i].voterParticipationQuantity = docs;
                  })
                  .catch((error) => console.log(error));

                for (
                  let j = 0;
                  j < fetchAllElectionCandidatePromise.data.length;
                  j++
                ) {
                  if (
                    temp[i]._id ===
                    fetchAllElectionCandidatePromise.data[j].positionID._id
                  ) {
                    temp[i].candidates.push(
                      fetchAllElectionCandidatePromise.data[j]
                    );
                  }
                }
              }
              for (let i = 0; i < temp.length; i++) {
                for (let j = 0; j < temp[i].candidates.length; j++) {
                  temp[i].candidates[j].voteCount = 0;
                  temp[i].candidates[j].profilePic = null;
                  //fetch profile here
                  let lastCandidate = false;

                  if (
                    i + 1 === temp.length &&
                    j + 1 === temp[temp.length - 1].candidates.length
                  ) {
                    lastCandidate = true;
                  }

                  getCandidateProfile(
                    temp[i].candidates[j].userID._id,
                    temp[i].candidates[j]._id,
                    lastCandidate
                  )
                    .then((docs) => {
                      temp[i].candidates[j].profilePic = docs.profile;
                      temp[i].candidates[j].motto = docs.motto;
                      temp[i].candidates[j].platform = [...docs.platform];
                    })
                    .catch((error) => console.log(error));
                  for (
                    let k = 0;
                    k < fetchAllVoteHistoryPromise.data.length;
                    k++
                  ) {
                    if (
                      temp[i].candidates[j]._id ===
                      fetchAllVoteHistoryPromise.data[k].votedCandidateID
                    ) {
                      temp[i].candidates[j].voteCount++;
                    }
                  }
                }
              }
              for (let i = 0; i < temp.length; i++) {
                temp[i].candidates.sort((a, b) =>
                  a.voteCount < b.voteCount ? 1 : -1
                );
              }
              let identifier = [];
              for (let i = 0; i < temp.length; i++) {
                identifier.push(1);
              }
              positionIdentifier.current = [...identifier];
              return temp;
            });
            setTime(new Date());
          }
        )
        .then(() => {
          // setLoading((prevState) => !prevState);
        })
        .catch((error) => {
          console.log(error);
        });

      return () => {
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

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }) => {
    try {
      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
      const x = cx + radius * Math.cos(-midAngle * RADIAN);
      const y = cy + radius * Math.sin(-midAngle * RADIAN);

      return (
        <text
          x={x}
          y={y}
          fill='white'
          textAnchor={x > cx ? 'start' : 'end'}
          dominantBaseline='central'
        >
          {`${(percent * 100).toFixed(0)}%`}
        </text>
      );
    } catch (error) {
      console.log(error);
    }
  };

  const getTime = () => {
    try {
      let year = time.getFullYear();
      return `${year} ${location.state.electionName} Results`;
    } catch (error) {}
  };

  const getSubHeader = () => {
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

      return `Partial, unofficial results aggregated from CMU-VS data as of ${month} ${day}, ${year} ${
        hours % 12 === 0 ? '12' : hours % 12
      }:${minutes < 10 ? '0' + minutes : minutes} ${hours > 12 ? 'PM' : 'AM'}`;
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
        <div className='results'>
          <center>
            <h3 className='resultTitle'>{getTime()}</h3>
          </center>
          <Container className='py-4'>
            <h5>{getSubHeader()}</h5>
            <Row xs={1} sm={1} md={2} lg={3} xl={3}>
              {Array.from({ length: resultsData.length }).map((_, i) => (
                <Col key={resultsData[i]._id} className='my-2'>
                  <Card className='my-1 h-100'>
                    <Card.Header
                      className='cardHeader'
                      style={{ backgroundColor: '#2f4050' }}
                    >
                      <Card.Title className='text-center'>
                        {resultsData[i].positionName}
                      </Card.Title>
                    </Card.Header>
                    <Card.Body>
                      <ListGroup variant='flush'>
                        {Array.from({
                          length: resultsData[i].candidates.length,
                        }).map((_, j) => (
                          <ListGroup.Item
                            key={resultsData[i].candidates[j]._id}
                          >
                            <Row>
                              <Col xs={1} className='my-2 mx-1'>
                                {resultsData[i].candidates[j].voteCount !==
                                0 ? (
                                  <div
                                    style={{ float: 'left' }}
                                    className='text-muted'
                                  >
                                    {getOrdinal(
                                      i,
                                      j,
                                      j === 0
                                        ? resultsData[i].candidates[j].voteCount
                                        : resultsData[i].candidates[j - 1]
                                            .voteCount,
                                      resultsData[i].candidates[j].voteCount
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
                                      setSelectedCandidate((prevState) => {
                                        let temp = { ...prevState };
                                        temp.college =
                                          resultsData[i].candidates[
                                            j
                                          ].userID.college;
                                        temp.department =
                                          resultsData[i].candidates[
                                            j
                                          ].userID.department;
                                        temp.profilePic =
                                          resultsData[i].candidates[
                                            j
                                          ].profilePic;
                                        temp.name = `${resultsData[i].candidates[j].userID.firstName} ${resultsData[i].candidates[j].userID.familyName}`;
                                        temp.party =
                                          resultsData[i].candidates[j].party;
                                        if (
                                          resultsData[i].candidates[j].motto
                                        ) {
                                          temp.motto =
                                            resultsData[i].candidates[
                                              j
                                            ].motto.motto;
                                        } else {
                                          temp.motto = '';
                                        }
                                        if (
                                          resultsData[i].candidates[j].platform
                                            .length !== 0
                                        ) {
                                          temp.platform = [];
                                          resultsData[i].candidates[
                                            j
                                          ].platform.map((plat) =>
                                            temp.platform.push(plat.platform)
                                          );
                                        } else {
                                          temp.platform = [];
                                        }
                                        return temp;
                                      });
                                      setDisplayCandidateProfile(true);
                                    }}
                                  >
                                    <span>
                                      <big>
                                        {`${resultsData[i].candidates[j].userID.firstName} ${resultsData[i].candidates[j].userID.familyName}`}
                                      </big>
                                    </span>
                                    <p className='text-muted'>
                                      {resultsData[i].candidates[j].party}
                                    </p>
                                  </Container>
                                </Row>
                                <Row>
                                  <div>
                                    <Col>
                                      <div>
                                        <span style={{ float: 'right' }}>
                                          {`${
                                            resultsData[i].candidates[j]
                                              .voteCount !== 0
                                              ? resultsData[i].candidates[j]
                                                  .voteCount === 1
                                                ? resultsData[i].candidates[j]
                                                    .voteCount + ' Vote'
                                                : resultsData[i].candidates[j]
                                                    .voteCount + ' Votes'
                                              : ''
                                          }`}
                                        </span>
                                      </div>
                                      <br />
                                      <ProgressBar
                                        animated
                                        variant='info'
                                        now={getProgressBarValue(
                                          resultsData[i].candidates[j]
                                            .voteCount,
                                          resultsData[i].expectedMaximumVoter
                                        )}
                                        onClick={() => {
                                          console.log('progress clicked');
                                        }}
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
                    <Card.Footer>
                      <Col className='text-center'>
                        <Button
                          variant='outline-info'
                          onClick={() => {
                            positionIndex.current = i;
                            setDisplayStats(true);
                            setPieDate((prevState) => {
                              let temp = [...prevState];
                              temp[0].value =
                                resultsData[positionIndex.current]
                                  .expectedMaximumVoter -
                                resultsData[positionIndex.current]
                                  .voterParticipationQuantity;
                              temp[1].value =
                                resultsData[
                                  positionIndex.current
                                ].voterParticipationQuantity;
                              return temp;
                            });
                          }}
                        >
                          Statistics
                        </Button>
                      </Col>
                    </Card.Footer>
                  </Card>
                </Col>
              ))}
            </Row>
          </Container>

          <Modal show={displayStats} backdrop='static' keyboard={false}>
            <Modal.Header className='justify-content-center'>
              <Modal.Title>
                {resultsData[positionIndex.current].positionName}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Row>
                <Col xs={12} sm={12} md={5} className='mt-1'>
                  <Row>
                    <p className='legendData'>
                      Total voter:{' '}
                      {resultsData[positionIndex.current].expectedMaximumVoter}
                    </p>
                  </Row>
                  <Row>
                    <p className='legendData'>
                      Participated voter/s:{' '}
                      {
                        resultsData[positionIndex.current]
                          .voterParticipationQuantity
                      }
                    </p>
                  </Row>
                  <Row>
                    <p className='legendData'>
                      Abstained/Inactive:{' '}
                      {resultsData[positionIndex.current].expectedMaximumVoter -
                        resultsData[positionIndex.current]
                          .voterParticipationQuantity}
                    </p>
                  </Row>
                </Col>
                <Col xs={12} sm={12} md={7}>
                  <Container>
                    <center>
                      <PieChart width={176} height={176}>
                        <Pie
                          data={pieData}
                          dataKey='value'
                          cx='50%'
                          cy='50%'
                          outerRadius={80}
                          fill='#8884d8'
                          labelLine={false}
                          label={renderCustomizedLabel}
                        >
                          {pieData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    </center>
                  </Container>
                </Col>
              </Row>
              <p style={{ fontSize: '20px', fontWeight: 'bold' }}>Legend</p>
              <Container>
                <Row>
                  <Col xs={2} md={1}>
                    <span className='dotActive'></span>
                  </Col>
                  <Col>
                    <p
                      style={{
                        fontSize: '15px',
                        fontWeight: '500',
                      }}
                    >
                      {` - Voted in ${
                        resultsData[positionIndex.current].positionName
                      } position`}
                    </p>
                  </Col>
                </Row>
                <Row>
                  <Col xs={2} md={1}>
                    <span className='dotInactive'></span>
                  </Col>
                  <Col>
                    <p
                      style={{
                        fontSize: '15px',
                        fontWeight: '500',
                      }}
                    >
                      {` - Abstained or did not participate`}
                    </p>
                  </Col>
                </Row>
              </Container>
            </Modal.Body>
            <Modal.Footer>
              <Button onClick={() => setDisplayStats(false)} variant='info'>
                Close
              </Button>
            </Modal.Footer>
          </Modal>
          <Modal
            show={displayCandidateProfile}
            backdrop='static'
            keyboard={false}
          >
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
                          width={150}
                          height={150}
                          alt={defaultImage}
                          src={
                            selectedCandidate.profilePic
                              ? `data:image/png; base64,${selectedCandidate.profilePic}`
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
                variant='success'
                onClick={() => {
                  setDisplayCandidateProfile(false);
                }}
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

export default Results;
