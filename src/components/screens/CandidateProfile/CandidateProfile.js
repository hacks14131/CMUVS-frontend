import React, { useState, useEffect } from 'react';
import Loading from '../../Loading/Loading';
import {
  Button,
  Card,
  CardGroup,
  Col,
  Container,
  Figure,
  Form,
  ListGroup,
  Modal,
  Row,
  Stack,
} from 'react-bootstrap';
import './CandidateProfile.css';
import { MDBContainer } from 'mdb-react-ui-kit';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEraser, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';

const CandidateProfile = () => {
  const [loading, setLoading] = useState(true);
  const [election, setElection] = useState([]);
  const [selectedElection, setSelectedElection] = useState(0);
  const [text, setText] = useState('');
  const [displayCandidates, setDisplayCandidates] = useState(false);
  const [editProfile, setEditProfile] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState({});
  const [candidate, setCandidate] = useState({ motto: '', platform: [''] });
  // const [selectedFile, setSelectedFile] = useState(null);
  const [displayImage, setDisplayImage] = useState(null);
  const [image, setImage] = useState(null);

  useEffect(() => {
    const source = axios.CancelToken.source();
    const token = sessionStorage.getItem('token');
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-type': 'application/json',
      },
      cancelToken: source.token,
    };
    const getElectionURL = `https://cmuvs-api.onrender.com/api/election/get-elections`;
    const getCandidatesURL = `https://cmuvs-api.onrender.com/api/electionCandidate`;
    const getElectionPositionURL = `https://cmuvs-api.onrender.com/api/electionPosition`;

    const getAllOngoingElections = axios.get(getElectionURL, config);
    const getCandidates = axios.get(getCandidatesURL, config);
    const getElectionPosition = axios.get(getElectionPositionURL, config);

    Promise.all([
      getAllOngoingElections,
      getCandidates,
      getElectionPosition,
    ]).then(
      ([
        getAllOngoingElectionsResult,
        getCandidatesResult,
        getElectionPositionResult,
      ]) => {
        // organize election data
        let filteredData = getAllOngoingElectionsResult.data;
        const candidatesTemp = getCandidatesResult.data;
        const positionsTemp = getElectionPositionResult.data;
        // console.log('Elections: ', filteredData);
        // console.log('Candidates: ', candidatesTemp);
        // console.log('Positions: ', positionsTemp);

        for (let i = 0; i < filteredData.length; i++) {
          filteredData[i].positions = positionsTemp.filter(
            (pos) => pos.electionID._id === filteredData[i]._id
          );
          for (let j = 0; j < filteredData[i].positions.length; j++) {
            filteredData[i].positions[j].candidates = candidatesTemp.filter(
              (candidate) =>
                filteredData[i].positions[j]._id === candidate.positionID._id
            );
          }
        }
        setElection([...filteredData]);
        setLoading(false);
      }
    );

    return () => {
      source.cancel();
    };
  }, []);

  const uploadFileHandler = (e) => {
    try {
      if (e.target.files[0]) {
        const file = e.target.files[0];
        setFileToBase(file);
        // setSelectedFile(file);
        setDisplayImage(URL.createObjectURL(file));
      }
    } catch (error) {
      console.log(error);
    }
  };

  const setFileToBase = (file) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setImage(reader.result);
    };
  };

  const updateCandidateProfile = async () => {
    try {
      setLoading(true);
      const updateProfilePicURL = `https://cmuvs-api.onrender.com/api/candidatePicture/admin-candidate-profile-update`;
      const updateMottoURL = `https://cmuvs-api.onrender.com/api/motto/admin-update-motto`;
      const updatePlatformURL = `https://cmuvs-api.onrender.com/api/platform/admin-platform-update`;
      const source = axios.CancelToken.source();
      const token = sessionStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-type': 'application/json',
        },
        cancelToken: source.token,
      };

      //add promises
      let updatePromise = [];
      if (candidate.motto !== '') {
        const mottoPromise = await axios.post(
          updateMottoURL,
          {
            electionCandidateID: selectedCandidate._id,
            motto: candidate.motto,
          },
          config
        );
        updatePromise.push(mottoPromise);
      }
      if (candidate.platform[0] !== '') {
        const platformPromise = await axios.post(
          updatePlatformURL,
          {
            electionCandidateID: selectedCandidate._id,
            platform: candidate.platform,
          },
          config
        );
        updatePromise.push(platformPromise);
      }
      if (image) {
        const picturePromise = await axios.post(
          updateProfilePicURL,
          {
            userID: selectedCandidate.userID,
            profilePicture: image,
          },
          config
        );
        updatePromise.push(picturePromise);
      }

      Promise.all(updatePromise).then(() => {
        setEditProfile(false);
        setLoading(false);
      });
      setDisplayImage(null);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      {loading && <Loading />}
      {!loading && (
        <div className='view'>
          <div className='titleDiv'>
            <h1 className='componentTitle'>Manage Candidate Profile Page</h1>
          </div>
          <Container className='footerFix'>
            <MDBContainer
              fluid
              className='square border border-2 border-dark p-2'
            >
              <Container className='mb-1 mt-3'>
                <header>
                  <Form className='search'>
                    <input
                      className='searchInput'
                      placeholder='Search Election ...'
                      type='text'
                      id='searchInput'
                      onChange={(e) => {
                        console.log('typing');
                      }}
                    />

                    <button className='searchButton'>
                      <FontAwesomeIcon
                        icon={faEraser}
                        shake
                        size='lg'
                        style={{
                          color: '#2f4050',
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          console.log('clicked');
                        }}
                      />
                    </button>
                  </Form>
                </header>
              </Container>
              <Container className='mt-3'>
                <Row xs={1} md={2} lg={3} className='g-5'>
                  {election.map((el, index) => (
                    <Col
                      key={el._id}
                      onClick={() => {
                        setDisplayCandidates(true);
                        setSelectedElection(index);
                      }}
                      style={{
                        cursor: 'pointer',
                      }}
                    >
                      <CardGroup>
                        <Card>
                          <Card.Body
                            className='cardBody'
                            style={{ minHeight: '88px' }}
                          >
                            <Card.Title className='cardTitle text-center'>
                              {el.electionName}
                            </Card.Title>
                          </Card.Body>
                          <ListGroup
                            className='list-group-flush'
                            style={{ minHeight: '220px' }}
                          >
                            <ListGroup.Item>{`Election Status: ${el.electionStatus}`}</ListGroup.Item>
                            <ListGroup.Item>{`Election Level: ${el.electionLevel}`}</ListGroup.Item>
                            <ListGroup.Item>{`Election Scope: ${el.electionScope}`}</ListGroup.Item>
                            <ListGroup.Item>{`School Year: ${el.schoolYear}`}</ListGroup.Item>
                          </ListGroup>
                        </Card>
                      </CardGroup>
                    </Col>
                  ))}
                </Row>
              </Container>
            </MDBContainer>
          </Container>
          <Modal
            show={displayCandidates}
            onHide={() => {
              setDisplayCandidates(false);
            }}
          >
            <Modal.Header
              style={{
                justifyContent: 'center',
                background: '#2f4050',
                color: 'white',
              }}
            >
              <Modal.Title>Candidates Profile</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Container>
                {election[selectedElection].positions.map((posName, index) => (
                  <Row key={posName._id} className='m-1 mb-3'>
                    <big>{posName.positionName}</big>

                    <Container>
                      <ListGroup className='text-dark'>
                        {posName.candidates.map((candidate) => (
                          <ListGroup.Item
                            style={{ cursor: 'pointer' }}
                            key={candidate._id}
                            onClick={() => {
                              setDisplayCandidates(false);
                              setSelectedCandidate({
                                _id: candidate._id,
                                userID: candidate.userID._id,
                                name: `${candidate.userID.firstName} ${candidate.userID.familyName}`,
                              });
                              setEditProfile(true);
                            }}
                          >{`${candidate.userID.firstName} ${candidate.userID.familyName}`}</ListGroup.Item>
                        ))}
                      </ListGroup>
                    </Container>
                  </Row>
                ))}
              </Container>
            </Modal.Body>
            <Modal.Footer style={{ justifyContent: 'center' }}>
              <span className='note'>
                <small>Note: Select candidate to update their profile.</small>
              </span>
            </Modal.Footer>
          </Modal>
          <Modal
            show={editProfile}
            onHide={() => {
              setEditProfile(false);
              setCandidate({ motto: '', platform: [''] });
              // setSelectedFile(null);
              setDisplayImage(null);
            }}
          >
            <Modal.Header
              style={{
                justifyContent: 'center',
                alignItems: 'center',
                background: '#2f4050',
                color: 'white',
              }}
            >
              <Modal.Title>
                {selectedCandidate.name}
                <br />
                <center>Profile</center>
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Container className='mb-3'>
                <Stack>
                  <center>
                    {displayImage !== null && (
                      <Figure>
                        <Figure.Image
                          width={130}
                          height={70}
                          alt='image'
                          thumbnail
                          src={displayImage}
                        />
                      </Figure>
                    )}
                  </center>
                  {displayImage !== null && (
                    <FontAwesomeIcon
                      icon={faTrash}
                      className='text-danger mt-2'
                      size='lg'
                      onClick={() => {
                        // setSelectedFile(null);
                        setDisplayImage(null);
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                  )}
                  {displayImage === null && (
                    <input
                      type='file'
                      name='profilePic'
                      id='files'
                      accept='image/png'
                      onChange={uploadFileHandler}
                    />
                  )}
                </Stack>
                <hr />
                <Form>
                  <Row>
                    <Col xs={11}>
                      <Form.Group className='mb-3'>
                        <Form.Label>Motto</Form.Label>
                        <Form.Control
                          type='text'
                          placeholder='Enter motto'
                          value={candidate.motto}
                          onChange={(e) => {
                            setCandidate((prevState) => {
                              let temp = prevState;
                              temp.motto = e.target.value;
                              return { ...temp };
                            });
                          }}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Form.Group className='mb-3'>
                    <Form.Label>
                      Platform{' '}
                      <FontAwesomeIcon
                        icon={faPlus}
                        className='ml-2 text-info'
                        fade
                        size='sm'
                        onClick={() => {
                          let temp = candidate;
                          temp.platform.push('');
                          setCandidate({ ...temp });
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                    </Form.Label>
                    {candidate.platform.map((platform, key) => (
                      <Row key={key}>
                        <Col xs={11}>
                          <Form.Control
                            className='mb-2'
                            type='text'
                            placeholder='Enter platform'
                            value={candidate.platform[key]}
                            onChange={(e) => {
                              setCandidate((prevState) => {
                                let temp = prevState;
                                temp.platform[key] = e.target.value;
                                return { ...temp };
                              });
                            }}
                          />
                        </Col>
                        <Col xs={1}>
                          <FontAwesomeIcon
                            icon={faTrash}
                            className='text-danger mt-2'
                            size='sm'
                            onClick={() => {
                              if (candidate.platform.length !== 1) {
                                let temp = candidate;
                                temp.platform.splice(key, 1);
                                setCandidate({ ...temp });
                              }
                            }}
                            style={{ cursor: 'pointer' }}
                          />
                        </Col>
                      </Row>
                    ))}
                  </Form.Group>
                </Form>
              </Container>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Button
                  variant='info'
                  onClick={() => {
                    updateCandidateProfile();
                  }}
                >
                  Update profile
                </Button>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <span className='note'>
                <small>
                  Note: Clicking update will update the profile of the selected
                  candidate.
                </small>
              </span>
            </Modal.Footer>
          </Modal>
        </div>
      )}
    </>
  );
};

export default CandidateProfile;
