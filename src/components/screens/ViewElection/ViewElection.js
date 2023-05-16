import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Loading from '../../Loading/Loading';
import {
  Button,
  ButtonGroup,
  Card,
  CardGroup,
  Col,
  Container,
  Form,
  ListGroup,
  Modal,
  Row,
  Table,
} from 'react-bootstrap';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import './ViewElection.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';

const ViewElection = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [elections, setElections] = useState([]);
  const [resultElection, setResultElection] = useState([]);
  const [resultElectionCopy, setResultElectionCopy] = useState([]);
  // const [resultCanvassed, setResultCanvassed] = useState([]);
  const [canvassedElections, setCanvassedElections] = useState([]);
  const [votingStatus, setVotingStatus] = useState([]);
  const [electionFilter, setElectionFilter] = useState([]);
  const [electionSortFilter, setElectionSortFilter] = useState('');
  const [selectedCanvassedElection, setSelectedCanvassedElection] = useState({
    electionName: '',
    electionLevel: '',
    result: [],
  });
  const [searchElection, setSearchElection] = useState('');
  const [filterElection, setFilterElection] = useState(false);
  const [showCanvassedResultInformation, setShowCanvassedResultInformation] =
    useState(false);
  const isAdmin = useRef(sessionStorage.getItem('isAdmin'));
  const currentYear = useRef();

  const viewResult = (selectedElection) => {
    navigate('/results', { state: selectedElection });
  };
  const vote = (selectedElection) => {
    navigate('/vote', { state: selectedElection });
  };
  const viewLive = (selectedElection) => {
    navigate('/live-election', { state: selectedElection });
  };

  useEffect(() => {
    let updateInformationInterval = null;
    let initialInformationInterval = null;
    let intervalInitial = null;
    let interval = null;
    let fethCanvassElectionInitial = null;
    let fethCanvassElection = null;
    if (location.state) {
      const userID = sessionStorage.getItem('userID');
      const college = sessionStorage.getItem('college');
      const department = sessionStorage.getItem('department');
      const axiosID = axios.CancelToken.source();
      const token = sessionStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-type': 'application/json',
        },
        cancelToken: axiosID.token,
      };
      const today = new Date();
      currentYear.current = today.getFullYear();
      // setVotingStatus([...location.state.votingState]);
      // let vottingStatusTemp = [...location.state.votingState];
      // console.log(location.state.votingState);
      let filteredElection = [...location.state.electionList];

      const updateInformation = () => {
        try {
          fethCanvassElection = setInterval(async () => {
            clearInterval(intervalInitial);
            clearTimeout(initialInformationInterval);
            // console.log('runnig update method');
            const fetchCanvassElectionURL = `https://cmuvs-api.onrender.com/api/electionCanvass/get-canvassed-elections/${college}/${department}`;
            const canvassedElectionTemp = await axios.get(
              fetchCanvassElectionURL,
              config
            );
            if (canvassedElectionTemp) {
              let canvassedLatest = [...canvassedElectionTemp.data];
              let unfiltered = [...filteredElection];
              // let voteStatus = [...filteredElection];
              // setCanvassedElections((prevState) => {
              let canvassedElectionsTemp = [...canvassedLatest];
              for (let i = 0; i < canvassedElectionsTemp.length; i++) {
                unfiltered = unfiltered.filter(
                  (election) =>
                    canvassedElectionsTemp[i].electionID._id !== election._id
                );
              }
              //   return [...temp];
              // });
              filteredElection = [...unfiltered];
              let vottingStatusTemp = [];
              for (let i = 0; i < filteredElection.length; i++) {
                const getVoteStatusURL = `https://cmuvs-api.onrender.com/api/userVoteHistory/status/${userID}/${filteredElection[i]._id}`;
                const currentDate = new Date().getTime();
                const docs = await axios.get(getVoteStatusURL, config);
                if (
                  docs.data === null &&
                  currentDate <
                    filteredElection[i].electionClosingDate.getTime()
                ) {
                  vottingStatusTemp.push(false);
                } else {
                  vottingStatusTemp.push(true);
                }
              }
              setVotingStatus([...vottingStatusTemp]);
              let countdownDate = [];
              interval = setInterval(() => {
                // console.log('updated clock running');
                for (let i = 0; i < filteredElection.length; i++) {
                  countdownDate.push(
                    filteredElection[i].electionClosingDate.getTime()
                  );
                }
                const now = new Date().getTime();
                let distance = [];
                for (let i = 0; i < filteredElection.length; i++) {
                  distance.push(countdownDate[i] - now);
                }

                for (let i = 0; i < filteredElection.length; i++) {
                  const days = Math.floor(distance[i] / (1000 * 60 * 60 * 24));
                  const hours = Math.floor(
                    (distance[i] % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
                  );
                  const minutes = Math.floor(
                    (distance[i] % (1000 * 60 * 60)) / (1000 * 60)
                  );
                  const seconds = Math.floor(
                    (distance[i] % (1000 * 60)) / 1000
                  );

                  filteredElection[i].daysLeft = days;
                  filteredElection[i].hoursLeft = hours;
                  filteredElection[i].minutesLeft = minutes;
                  filteredElection[i].secondsLeft = seconds;

                  setElections([...filteredElection]);
                }
                setLoading(false);
              }, 1000);
              setCanvassedElections([...canvassedElectionsTemp]);
            }
          }, 60000);
        } catch (error) {}
      };

      initialInformationInterval = setTimeout(async () => {
        try {
          // console.log('fetching initial information');
          // fethCanvassElectionInitial = setInterval(async () => {
          const fetchCanvassElectionURL = `https://cmuvs-api.onrender.com/api/electionCanvass/get-canvassed-elections/${college}/${department}`;
          const canvassedElectionTemp = await axios.get(
            fetchCanvassElectionURL,
            config
          );
          if (canvassedElectionTemp) {
            let canvassedLatest = [...canvassedElectionTemp.data];
            let unfiltered = [...filteredElection];
            // setCanvassedElections((prevState) => {
            let canvassedElectionsTemp = [...canvassedLatest];
            for (let i = 0; i < canvassedElectionsTemp.length; i++) {
              unfiltered = unfiltered.filter(
                (election) =>
                  canvassedElectionsTemp[i].electionID._id !== election._id
              );
            }
            // return [...temp];
            // });
            filteredElection = [...unfiltered];
            let vottingStatusTemp = [];
            for (let i = 0; i < filteredElection.length; i++) {
              const getVoteStatusURL = `https://cmuvs-api.onrender.com/api/userVoteHistory/status/${userID}/${filteredElection[i]._id}`;
              const currentDate = new Date().getTime();
              const docs = await axios.get(getVoteStatusURL, config);
              if (
                docs.data === null &&
                currentDate < filteredElection[i].electionClosingDate.getTime()
              ) {
                vottingStatusTemp.push(false);
              } else {
                vottingStatusTemp.push(true);
              }
            }
            setVotingStatus([...vottingStatusTemp]);
            let countdownDate = [];
            intervalInitial = setInterval(() => {
              for (let i = 0; i < filteredElection.length; i++) {
                countdownDate.push(
                  filteredElection[i].electionClosingDate.getTime()
                );
              }
              const now = new Date().getTime();
              let distance = [];
              for (let i = 0; i < filteredElection.length; i++) {
                distance.push(countdownDate[i] - now);
              }

              for (let i = 0; i < filteredElection.length; i++) {
                const days = Math.floor(distance[i] / (1000 * 60 * 60 * 24));
                const hours = Math.floor(
                  (distance[i] % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
                );
                const minutes = Math.floor(
                  (distance[i] % (1000 * 60 * 60)) / (1000 * 60)
                );
                const seconds = Math.floor((distance[i] % (1000 * 60)) / 1000);

                filteredElection[i].daysLeft = days;
                filteredElection[i].hoursLeft = hours;
                filteredElection[i].minutesLeft = minutes;
                filteredElection[i].secondsLeft = seconds;

                setElections([...filteredElection]);
              }
              setLoading(false);
            }, 1000);
            setCanvassedElections([...canvassedElectionsTemp]);
          }
          // }, 1000);
        } catch (error) {}
      }, 1000);

      updateInformationInterval = setTimeout(() => {
        updateInformation();
      }, 20000);
    }

    return () => {
      clearTimeout(initialInformationInterval);
      clearTimeout(updateInformationInterval);
      clearInterval(intervalInitial);
      clearInterval(interval);
      clearInterval(fethCanvassElectionInitial);
      clearInterval(fethCanvassElection);
    };
  }, [location]);

  const checkElectionDeadline = (targetElection, type) => {
    try {
      const electionClosingDate = targetElection.electionClosingDate;
      const currentDate = new Date();

      const msBetweenDates = Math.abs(
        electionClosingDate.getTime() - currentDate.getTime()
      );

      //convert ms to hours
      const hourBetweenDates = msBetweenDates / (60 * 60 * 1000);
      if (type === 'border') {
        if (hourBetweenDates < 8) {
          return 'danger';
        } else {
          return 'dark';
        }
      } else {
        if (hourBetweenDates < 8) {
          return 'warning';
        } else {
          return '';
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const checkVote = (voteStatus, electionStatus, closingDate) => {
    try {
      const rightNow = new Date().getTime();
      if (isAdmin.current === 'true') {
        return true;
      } else {
        if (
          voteStatus === true ||
          electionStatus === 'Finished' ||
          rightNow >= closingDate.getTime()
        ) {
          return true;
        }
        return false;
      }
    } catch (error) {
      console.log(error);
    }
  };

  const checkElectionLiveStatus = (status, election) => {
    try {
      const rightNow = new Date().getTime();
      if (isAdmin.current === 'true') {
        return false;
      } else {
        if (election.electionStatus === 'Finished') {
          return true;
        } else {
          if (status && rightNow < election.electionClosingDate.getTime()) {
            return false;
          }
        }
      }
      // else if (status && rightNow < election.electionClosingDate.getTime()) {
      //   return false;
      // }
      return true;
    } catch (error) {
      console.log(error);
    }
  };

  const disableResultButton = (deadline, status) => {
    if (status === 'Finished') {
      return false;
    }
    const rightNow = new Date().getTime();
    if (isAdmin.current === 'true') {
      return false;
    } else if (deadline < rightNow) {
      return false;
    } else {
      return true;
    }
  };

  const fetchCanvassedResult = async (canvassID, name, level) => {
    try {
      const token = sessionStorage.getItem('token');
      let source = axios.CancelToken.source();
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-type': 'application/json',
        },
        CancelToken: source.token,
      };
      const fetchCanvassedResultURL = `https://cmuvs-api.onrender.com/api/election-canvass/get-canvass-result/${canvassID}`;
      const canvassedResult = await axios.get(fetchCanvassedResultURL, config);
      if (canvassedResult) {
        const result = JSON.parse(canvassedResult.data.resultInformation);
        const canvassDate = new Date(canvassedResult.data.canvassDate);
        let year = canvassDate.getFullYear();
        let month = canvassDate.getMonth();
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
        let day = canvassDate.getDate();
        let hour = canvassDate.getHours();
        let minutes = canvassDate.getMinutes();
        let displayedDate = `${month} ${day}, ${year}`;
        let displayTime = `${hour % 12}:${
          minutes < 10 ? '0' + minutes : minutes
        } ${hour > 12 ? 'pm' : 'am'}`;
        // console.log(typeof canvassDate);
        const getCanvassingOfficerInformationURL = `https://cmuvs-api.onrender.com/api/canvassingOfficer/info/${canvassID}`;
        const getCanvassingOfficerInformation = await axios.get(
          getCanvassingOfficerInformationURL,
          config
        );
        if (getCanvassingOfficerInformation) {
          const canvasserFullName = `${getCanvassingOfficerInformation.data.userID.firstName} ${getCanvassingOfficerInformation.data.userID.familyName}`;
          setSelectedCanvassedElection({
            electionName: name,
            electionLevel: level,
            displayedDate,
            displayTime,
            result,
            canvasserFullName,
          });
        }
        setShowCanvassedResultInformation(true);
      }
      setLoading(false);
    } catch (error) {
      alert('an error occured, please refresh the page');
      setLoading(false);
      console.log(error);
    }
  };

  const getPercentage = (garnered, total) => {
    try {
      let percentage = (garnered * 100) / total;
      if (percentage % 1 === 0) {
        return `${percentage}%`;
      } else {
        return `${percentage.toFixed(2)}%`;
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleSearch = (e) => {
    try {
      e.preventDefault();
      if (searchElection !== '') {
        const searchResult = elections.filter((election) =>
          election.electionName
            .toLowerCase()
            .includes(searchElection.toLowerCase())
        );
        if (searchResult.length !== 0) {
          setResultElection([...searchResult]);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const applyFilter = () => {
    try {
      // initialize variable to be used
      // check if a filter is added
      // store elections that match the filter
      // sort according to the applied sort order

      let filteredEl = [];
      let searchResultEl = [];

      if (resultElectionCopy.length === 0) {
        searchResultEl = [...elections];
      } else {
        searchResultEl = [...resultElectionCopy];
      }

      for (let i = 0; i < electionFilter.length; i++) {
        const filterMatchElections = searchResultEl.filter(
          (el) => el.electionLevel === electionFilter[i]
        );
        filteredEl = [...filteredEl, ...filterMatchElections];
      }

      if (electionFilter.length === 0) {
        filteredEl = [...searchResultEl];
      }

      switch (electionSortFilter) {
        case 'ASC':
          filteredEl = filteredEl.sort((a, b) =>
            a.electionName.toLowerCase() > b.electionName.toLowerCase() ? 1 : -1
          );
          break;
        case 'DSC':
          filteredEl = filteredEl.sort((a, b) =>
            a.electionName.toLowerCase() > b.electionName.toLowerCase() ? -1 : 1
          );
          break;
        case 'DCASC':
          filteredEl = filteredEl.sort((a, b) =>
            a.electionOpeningDate > b.electionOpeningDate ? -1 : 1
          );
          break;
        case 'DCDSC':
          filteredEl = filteredEl.sort((a, b) =>
            a.electionOpeningDate > b.electionOpeningDate ? 1 : -1
          );
          break;
        default:
      }

      setResultElection([...filteredEl]);
      setFilterElection(false);
      setElectionSortFilter('');
      setElectionFilter([]);
    } catch (error) {
      console.log(error);
    }
  };

  if (location.state === null) {
    return <Navigate to='/home' />;
  } else {
    return (
      <>
        {loading && <Loading />}
        {!loading && (
          <div className='view'>
            {elections.length !== 0 && (
              <div className='titleDiv'>
                <Container className='title'>
                  <header>
                    <Form onSubmit={handleSearch} className='search'>
                      <input
                        className='searchInput'
                        placeholder='Search Election ...'
                        type='text'
                        id='searchInput'
                        onChange={(e) => {
                          setSearchElection(e.target.value);
                          if (e.target.value === '') {
                            setResultElection([]);
                          } else {
                            const searchResult = elections.filter((election) =>
                              election.electionName
                                .toLowerCase()
                                .includes(e.target.value.toLowerCase())
                            );
                            setResultElection([...searchResult]);
                            setResultElectionCopy([...searchResult]);
                          }
                        }}
                      />

                      <button type='submit' className='searchButton'>
                        <FontAwesomeIcon
                          icon={faMagnifyingGlass}
                          size='lg'
                          style={{
                            color: '#2f4050',
                            cursor: 'pointer',
                          }}
                        />
                      </button>
                    </Form>
                  </header>

                  <Row>
                    <FontAwesomeIcon
                      icon={faFilter}
                      size='lg'
                      flip
                      style={{
                        color: '#2f4050',
                        cursor: 'pointer',
                        marginTop: '20px',
                      }}
                      onClick={() => {
                        setFilterElection(true);
                      }}
                    />
                  </Row>
                </Container>
                <h1 className='componentTitle'>
                  {`${
                    elections.length === 1
                      ? 'On-going Election'
                      : 'On-going Elections'
                  } ${currentYear.current}`}
                </h1>
              </div>
            )}
            <Container>
              {resultElection.length !== 0 && (
                <Row xd={1} md={2} l={3} xl={3} className='g-5'>
                  {Array.from({ length: resultElection.length }).map((_, i) => (
                    <Col key={resultElection[i]._id}>
                      <CardGroup>
                        <Card>
                          <Card.Body
                            className='cardBody'
                            style={{ minHeight: '88px' }}
                          >
                            <Card.Title className='cardTitle text-center'>
                              {resultElection[i].electionName}
                            </Card.Title>
                          </Card.Body>
                          <ListGroup
                            className='list-group-flush'
                            style={{ minHeight: '270px' }}
                          >
                            <ListGroup.Item action>
                              Election Status:{' '}
                              {resultElection[i].electionStatus}
                            </ListGroup.Item>
                            <ListGroup.Item action>
                              Election Level: {resultElection[i].electionLevel}
                            </ListGroup.Item>
                            <ListGroup.Item action>
                              Election Scope: {resultElection[i].electionScope}
                            </ListGroup.Item>
                            <ListGroup.Item action>
                              School Year: {resultElection[i].schoolYear}
                            </ListGroup.Item>
                            <ListGroup.Item
                              action
                              variant={checkElectionDeadline(
                                resultElection[i],
                                'listGroup'
                              )}
                              className='nearDeadline'
                            >
                              Election Closing Date:{' '}
                              {resultElection[
                                i
                              ].electionClosingDate.toDateString()}
                            </ListGroup.Item>
                            <ListGroup.Item
                              variant={checkElectionDeadline(
                                resultElection[i],
                                'listGroup'
                              )}
                              className='nearDeadline'
                            >
                              {`Election Closing Time: ${
                                resultElection[
                                  i
                                ].electionClosingDate.getHours() % 12
                              }:${
                                resultElection[
                                  i
                                ].electionClosingDate.getMinutes() === 0
                                  ? '00'
                                  : resultElection[
                                      i
                                    ].electionClosingDate.getMinutes()
                              } ${
                                resultElection[
                                  i
                                ].electionClosingDate.getHours() > 11
                                  ? 'pm'
                                  : 'am'
                              }`}
                            </ListGroup.Item>
                          </ListGroup>
                          <Card.Footer>
                            <ButtonGroup className='button'>
                              <Button
                                variant='outline-primary'
                                onClick={() => {
                                  vote(resultElection[i]);
                                }}
                                disabled={checkVote(
                                  votingStatus[i],
                                  resultElection[i].electionStatus,
                                  resultElection[i].electionClosingDate
                                )}
                              >
                                VOTE
                              </Button>
                              <Button
                                variant='outline-info'
                                disabled={disableResultButton(
                                  resultElection[
                                    i
                                  ].electionClosingDate.getTime(),
                                  resultElection[i].electionStatus
                                )}
                                onClick={() => {
                                  viewResult(resultElection[i]);
                                }}
                              >
                                RESULT
                              </Button>
                              <Button
                                variant='outline-danger'
                                disabled={checkElectionLiveStatus(
                                  votingStatus[i],
                                  resultElection[i]
                                )}
                                onClick={() => {
                                  viewLive(resultElection[i]);
                                }}
                              >
                                LIVE
                              </Button>
                            </ButtonGroup>
                          </Card.Footer>
                        </Card>
                      </CardGroup>
                    </Col>
                  ))}
                </Row>
              )}
              {resultElection.length === 0 && (
                <Row xd={1} md={2} l={3} xl={3} className='g-5'>
                  {Array.from({ length: elections.length }).map((_, i) => (
                    <Col key={elections[i]._id}>
                      <CardGroup>
                        <Card>
                          <Card.Body
                            className='cardBody'
                            style={{ minHeight: '88px' }}
                          >
                            <Card.Title className='cardTitle text-center'>
                              {elections[i].electionName}
                            </Card.Title>
                          </Card.Body>
                          <ListGroup
                            className='list-group-flush'
                            style={{ minHeight: '270px' }}
                          >
                            <ListGroup.Item action>
                              Election Status: {elections[i].electionStatus}
                            </ListGroup.Item>
                            <ListGroup.Item action>
                              Election Level: {elections[i].electionLevel}
                            </ListGroup.Item>
                            <ListGroup.Item action>
                              Election Scope: {elections[i].electionScope}
                            </ListGroup.Item>
                            <ListGroup.Item action>
                              School Year: {elections[i].schoolYear}
                            </ListGroup.Item>
                            <ListGroup.Item
                              action
                              variant={checkElectionDeadline(
                                elections[i],
                                'listGroup'
                              )}
                              className='nearDeadline'
                            >
                              Election Closing Date:{' '}
                              {elections[i].electionClosingDate.toDateString()}
                            </ListGroup.Item>
                            <ListGroup.Item
                              action
                              variant={checkElectionDeadline(
                                elections[i],
                                'listGroup'
                              )}
                              className='nearDeadline'
                            >
                              {/* {console.log(elections)} */}
                              {`Time Left: ${
                                elections[i].daysLeft > 0
                                  ? elections[i].daysLeft === 1
                                    ? elections[i].daysLeft + ' day'
                                    : elections[i].daysLeft + ' days'
                                  : ''
                              }${elections[i].daysLeft > 0 ? ', ' : ''}${
                                elections[i].hoursLeft > 0
                                  ? elections[i].hoursLeft === 1
                                    ? elections[i].hoursLeft + ' hour'
                                    : elections[i].hoursLeft + ' hours'
                                  : ''
                              }${elections[i].hoursLeft > 0 ? ', ' : ''}${
                                elections[i].minutesLeft > 0
                                  ? elections[i].minutesLeft === 1
                                    ? elections[i].minutesLeft + ' minute'
                                    : elections[i].minutesLeft + ' minutes'
                                  : ''
                              }${
                                elections[i].minutesLeft > 0 &&
                                elections[i].secondsLeft > 0
                                  ? ', '
                                  : ''
                              }${
                                elections[i].secondsLeft > 0
                                  ? elections[i].secondsLeft === 1
                                    ? elections[i].secondsLeft + ' second'
                                    : elections[i].secondsLeft + ' seconds'
                                  : ''
                              }`}
                              {elections[i].daysLeft < 0 &&
                              elections[i].hoursLeft < 0 &&
                              elections[i].minutesLeft < 0 &&
                              elections[i].secondsLeft < 0
                                ? 'Election Closed'
                                : ''}
                            </ListGroup.Item>
                          </ListGroup>
                          <Card.Footer>
                            <ButtonGroup className='button'>
                              <Button
                                variant='outline-primary'
                                onClick={() => {
                                  vote(elections[i]);
                                }}
                                disabled={checkVote(
                                  votingStatus[i],
                                  elections[i].electionStatus,
                                  elections[i].electionClosingDate
                                )}
                              >
                                VOTE
                              </Button>
                              <Button
                                variant='outline-info'
                                disabled={disableResultButton(
                                  elections[i].electionClosingDate.getTime(),
                                  elections[i].electionStatus
                                )}
                                onClick={() => {
                                  viewResult(elections[i]);
                                }}
                              >
                                RESULT
                              </Button>
                              <Button
                                variant='outline-danger'
                                disabled={checkElectionLiveStatus(
                                  votingStatus[i],
                                  elections[i]
                                )}
                                onClick={() => {
                                  viewLive(elections[i]);
                                }}
                              >
                                LIVE
                              </Button>
                            </ButtonGroup>
                          </Card.Footer>
                        </Card>
                      </CardGroup>
                    </Col>
                  ))}
                </Row>
              )}
            </Container>

            {canvassedElections.length !== 0 && (
              <div>
                <div className='titleDiv mt-5'>
                  <h1 className='componentTitle'>
                    {`Canvassed ${
                      canvassedElections.length === 1 ? 'Election' : 'Elections'
                    } ${currentYear.current}`}
                  </h1>
                </div>
                <Container>
                  <Row xd={1} md={2} l={3} xl={3} className='g-5'>
                    {canvassedElections.map((canvassed, canvassedIndex) => (
                      <Col key={canvassedIndex}>
                        <CardGroup>
                          <Card>
                            <Card.Body
                              className='cardBody'
                              style={{ minHeight: '88px' }}
                            >
                              <Card.Title className='cardTitle text-center'>
                                {canvassed.electionID.electionName}
                              </Card.Title>
                            </Card.Body>
                            <ListGroup
                              className='list-group-flush'
                              style={{ minHeight: '175px' }}
                            >
                              <ListGroup.Item action>
                                Election Level:{' '}
                                {canvassed.electionID.electionLevel}
                              </ListGroup.Item>
                              <ListGroup.Item action>
                                Election Scope:{' '}
                                {canvassed.electionID.electionScope}
                              </ListGroup.Item>
                              <ListGroup.Item action>
                                School Year: {canvassed.electionID.schoolYear}
                              </ListGroup.Item>
                            </ListGroup>
                            <Card.Footer className='text-center'>
                              <Button
                                variant='outline-info'
                                onClick={() => {
                                  setLoading(true);
                                  fetchCanvassedResult(
                                    canvassed._id,
                                    canvassed.electionID.electionName,
                                    canvassed.electionID.electionLevel
                                  );

                                  // console.log(canvassed);
                                  // console.log(typeof canvassed.canvassDate);
                                }}
                              >
                                View Result
                              </Button>
                            </Card.Footer>
                          </Card>
                        </CardGroup>
                      </Col>
                    ))}
                  </Row>
                </Container>
              </div>
            )}
            <Modal
              show={showCanvassedResultInformation}
              fullscreen={true}
              onHide={() => {
                setShowCanvassedResultInformation(false);
              }}
            >
              <Modal.Header closeButton>
                <Modal.Title className='ms-auto'>
                  Official Canvass Result of{' '}
                  {selectedCanvassedElection.electionName}
                </Modal.Title>
              </Modal.Header>
              <Modal.Body>
                {selectedCanvassedElection.electionLevel !== 'Department' && (
                  <Container>
                    {/* {console.log(selectedCanvassedElection.result)} */}
                    {selectedCanvassedElection.result.map((position, index) => (
                      <div key={index} className='text-center'>
                        <span>
                          <big>{position.positionName}</big>
                        </span>
                        <Table bordered hover>
                          <thead>
                            <tr>
                              {position.fields.map((name) => {
                                if (name !== 'Candidate ID') {
                                  return <td key={name}>{name}</td>;
                                }
                                return true;
                              })}
                            </tr>
                          </thead>
                          <tbody>
                            {position.electionWinner.map(
                              (candidate, candidateIndex) => (
                                <tr key={candidateIndex} className='bg-success'>
                                  {candidate.map((fieldValue) => {
                                    if (fieldValue.header !== 'Candidate ID') {
                                      return (
                                        <td key={fieldValue.header}>
                                          {fieldValue.value}
                                        </td>
                                      );
                                    }
                                    return true;
                                  })}
                                </tr>
                              )
                            )}
                            {position.otherCandidate.map(
                              (candidate, candidateIndex) => {
                                return (
                                  <tr key={candidateIndex}>
                                    {candidate.map((fieldValue) => {
                                      if (
                                        fieldValue.header !== 'Candidate ID'
                                      ) {
                                        return (
                                          <td key={fieldValue.header}>
                                            {fieldValue.value}
                                          </td>
                                        );
                                      }
                                      return true;
                                    })}
                                  </tr>
                                );
                              }
                            )}
                          </tbody>
                        </Table>
                        <br />
                      </div>
                    ))}
                  </Container>
                )}
                {selectedCanvassedElection.electionLevel === 'Department' && (
                  <Container>
                    {selectedCanvassedElection.result.map((position, index) => (
                      <div className='text-center' key={index}>
                        <span>
                          <big>{position.positionName}</big>
                        </span>
                        <Table bordered hover>
                          <thead>
                            <tr>
                              <td>Rank</td>
                              <td>Name</td>
                              <td>Total</td>
                              <td>Percentage</td>
                            </tr>
                          </thead>
                          <tbody>
                            {position.electionWinner.map(
                              (candidate, candidateIndex) => {
                                return (
                                  <tr
                                    key={candidateIndex}
                                    className='bg-success'
                                  >
                                    <td>{candidate.rank}</td>
                                    <td>{`${candidate.userID.firstName} ${candidate.userID.familyName}`}</td>
                                    <td>{candidate.voteHistory.length}</td>
                                    <td>
                                      {getPercentage(
                                        candidate.voteHistory.length,
                                        position.totalVoteCasted
                                      )}
                                    </td>
                                  </tr>
                                );
                              }
                            )}
                            {position.otherCandidate.map(
                              (candidate, candidateIndex) => {
                                return (
                                  <tr key={candidateIndex}>
                                    <td>{candidate.rank}</td>
                                    <td>{`${candidate.userID.firstName} ${candidate.userID.familyName}`}</td>
                                    <td>{candidate.voteHistory.length}</td>
                                    <td>
                                      {getPercentage(
                                        candidate.voteHistory.length,
                                        position.totalVoteCasted
                                      )}
                                    </td>
                                  </tr>
                                );
                              }
                            )}
                          </tbody>
                        </Table>
                        <br />
                      </div>
                    ))}
                  </Container>
                )}
                <Container
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                  }}
                >
                  <span>
                    <small>
                      Canvass By: {selectedCanvassedElection.canvasserFullName}
                    </small>
                  </span>
                  <span>
                    <small>
                      Date and Time: {selectedCanvassedElection.displayedDate}{' '}
                      {selectedCanvassedElection.displayTime}
                    </small>
                  </span>
                </Container>
              </Modal.Body>
            </Modal>
            <Modal
              show={filterElection}
              onHide={() => {
                setFilterElection(false);
                setElectionSortFilter('');
                setElectionFilter([]);
              }}
            >
              <Modal.Header closeButton>
                <Modal.Title className='ms-auto'>Filter Elections</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Container>
                  <big>Select filter: </big>
                  <Container>
                    <Form.Check
                      type='checkbox'
                      id='UniversityLevel'
                      label='University Level'
                      onChange={(e) => {
                        if (e.target.checked) {
                          if (!electionFilter.includes('University')) {
                            setElectionFilter((prevState) => [
                              ...prevState,
                              'University',
                            ]);
                          }
                        } else {
                          const electionFilterTemp = electionFilter.filter(
                            (filter) => filter !== 'University'
                          );
                          setElectionFilter([...electionFilterTemp]);
                        }
                      }}
                    />
                  </Container>
                  <Container>
                    <Form.Check
                      type='checkbox'
                      id='CollegeLevel'
                      label='College Level'
                      onChange={(e) => {
                        if (e.target.checked) {
                          if (!electionFilter.includes('College')) {
                            setElectionFilter((prevState) => [
                              ...prevState,
                              'College',
                            ]);
                          }
                        } else {
                          const electionFilterTemp = electionFilter.filter(
                            (filter) => filter !== 'College'
                          );
                          setElectionFilter([...electionFilterTemp]);
                        }
                      }}
                    />
                  </Container>
                  <Container>
                    <Form.Check
                      type='checkbox'
                      id='DepartmentLevel'
                      label='Department Level'
                      onChange={(e) => {
                        if (e.target.checked) {
                          if (!electionFilter.includes('Department')) {
                            setElectionFilter((prevState) => [
                              ...prevState,
                              'Department',
                            ]);
                          }
                        } else {
                          const electionFilterTemp = electionFilter.filter(
                            (filter) => filter !== 'Department'
                          );
                          setElectionFilter([...electionFilterTemp]);
                        }
                      }}
                    />
                  </Container>
                  <br />
                  <big>Select sort order:</big>
                  <Form.Control
                    value={electionSortFilter}
                    as='select'
                    onChange={(e) => {
                      setElectionSortFilter(e.target.value);
                    }}
                  >
                    <option value={''}>--</option>
                    <option value='ASC'>Name Ascending</option>
                    <option value='DSC'>Name Descending</option>
                    <option value='DCASC'>Date Ascending Order</option>
                    <option value='DCDSC'>Date Descending Order</option>
                  </Form.Control>
                </Container>
              </Modal.Body>
              <Modal.Footer className='justify-content-center'>
                <Button
                  variant='info'
                  onClick={() => {
                    applyFilter();
                  }}
                >
                  Apply Filter
                </Button>
                <Button
                  variant='danger'
                  onClick={() => {
                    setResultElection([]);
                    setFilterElection(false);
                  }}
                >
                  Clear Filter
                </Button>
              </Modal.Footer>
            </Modal>
          </div>
        )}
      </>
    );
  }
};

export default ViewElection;
