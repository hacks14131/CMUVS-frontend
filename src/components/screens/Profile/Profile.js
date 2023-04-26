import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Loading from '../../Loading/Loading';
import axios from 'axios';
import {
  Button,
  Col,
  Container,
  Figure,
  Form,
  Modal,
  Row,
  Stack,
} from 'react-bootstrap';
import defaultImage from '../../../defaultImage/defaultProfilePic.jpg';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import './Profile.css';

/*
  Logic is first check if the user type is election candidate before enabling them to see how to 
  update their election profile. If the user type is not an election candidate then don't let them 
  see the profile update button beside the logout button
*/

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [basicInfo, setBasicInfo] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [postedProfilePic, setPostedProfilePic] = useState(null);
  const [displayImage, setDisplayImage] = useState(null);
  const [motto, setMotto] = useState('');
  const [platform, setPlatform] = useState(['']);
  const [hasMotto, setHasMotto] = useState(null);
  const [hasProfilePic, setHasProfilePic] = useState(null);
  const [prevMotto, setPrevMotto] = useState('');
  const [successfullUpdateModal, setSuccessfullUpdateModal] = useState(false);
  const [image, setImage] = useState(null);

  const history = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    let source = axios.CancelToken.source();
    let electionCandidateID = null;
    const studentID = sessionStorage.getItem('studentID');
    const userID = sessionStorage.getItem('userID');
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-type': 'application/json',
      },
      cancelToken: source.token,
    };

    const getElectionCandidateIDURL = `https://cmuvs-api.onrender.com/api/electionCandidate/${userID}`;

    axios
      .get(getElectionCandidateIDURL, config)
      .then((docs) => {
        electionCandidateID = docs.data._id;
        const checkCandidateMottoInstanceURL = `https://cmuvs-api.onrender.com/api/motto/${electionCandidateID}`;
        axios
          .get(checkCandidateMottoInstanceURL, config)
          .then((checkCandidateMottoInstanceResult) => {
            if (!checkCandidateMottoInstanceResult.data.message) {
              setHasMotto((prevState) => true);
              setPrevMotto(checkCandidateMottoInstanceResult.data.motto);
            } else {
              setHasMotto((prevState) => false);
              setLoading((prevState) => false);
            }
          })
          .catch((error) => {});
      })
      .catch((error) => {
        console.log(error);
        history('/home');
      });
    const fetchUserBasicInfoURL = `https://cmuvs-api.onrender.com/api/user/${studentID}`;

    const checkUserProfilePicURL = `https://cmuvs-api.onrender.com/api/candidatePicture/${userID}`;

    axios
      .get(checkUserProfilePicURL, config)
      .then((checkUserProfilePicResult) => {
        if (checkUserProfilePicResult.data === null) {
          setHasProfilePic((prevState) => false);
        } else {
          const profilePic = checkUserProfilePicResult.data.profilePicture.url;
          setPostedProfilePic(profilePic);
          setHasProfilePic((prevState) => true);
        }
        setLoading((prevState) => false);
      })
      .catch((error) => {
        console.log(error);
      });

    axios
      .get(fetchUserBasicInfoURL, config)
      .then((fetchUserBasicInfoPromiseResult) => {
        const candidateInfo = { ...fetchUserBasicInfoPromiseResult.data };
        setBasicInfo((prevState) => {
          let temp = { ...candidateInfo };
          return temp;
        });
        setLoading((prevState) => false);
      })
      .catch((error) => console.log(error));

    return () => {
      source.cancel();
    };
  }, [history]);

  const formValidator = (str) => {
    try {
      if (str !== '') {
        if (str.trim().length > 0) {
          return true;
        }
        return false;
      } else {
        return false;
      }
    } catch (error) {
      console.log(error);
    }
  };

  const updateCandidateProfile = async () => {
    try {
      const userID = sessionStorage.getItem('userID');
      const token = sessionStorage.getItem('token');
      if (selectedFile) {
        const fileType = selectedFile['type'];
        const validFileTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        if (!validFileTypes.includes(fileType)) {
          alert('Invalid file type. Only upload png, jpg, jpeg');
          window.location.reload(false);
        }
      }

      setLoading((prevState) => true);

      let postCandidateMotto = null;
      let candidatePlatforms = null;
      let electionCandidateID = null;
      let source = axios.CancelToken.source();
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-type': 'application/json',
        },
        cancelToken: source.cancelToken,
      };

      const getElectionCandidateIDURL = `https://cmuvs-api.onrender.com/api/electionCandidate/${userID}`;

      await axios
        .get(getElectionCandidateIDURL, config)
        .then((candidate) => {
          electionCandidateID = candidate.data._id;
        })
        .catch((error) => console.log(error));
      const postCandidateMottoURL = `https://cmuvs-api.onrender.com/api/motto`;
      const postCandidatePlatformURL = `https://cmuvs-api.onrender.com/api/platform`;
      const postCandidateProfilePictureURL = `https://cmuvs-api.onrender.com/api/candidatePicture`;

      const promises = [];
      if (selectedFile !== null) {
        if (hasProfilePic) {
          const postCandidateProfilePicture = axios.patch(
            `${postCandidateProfilePictureURL}/${userID}`,
            {
              profilePicture: image,
            },
            config
          );
          promises.push(postCandidateProfilePicture);
        } else {
          const postCandidateProfilePicture = axios.post(
            postCandidateProfilePictureURL,
            {
              userID,
              profilePicture: image,
            },
            config
          );
          promises.push(postCandidateProfilePicture);
        }
      }
      if (formValidator(motto)) {
        if (hasMotto) {
          postCandidateMotto = axios.patch(
            `${postCandidateMottoURL}/${electionCandidateID}`,
            {
              motto,
            },
            config
          );
          promises.push(postCandidateMotto);
        } else {
          postCandidateMotto = axios.post(
            postCandidateMottoURL,
            {
              electionCandidateID,
              motto,
            },
            config
          );
          promises.push(postCandidateMotto);
        }
      }
      for (let i = 0; i < platform.length; i++) {
        if (formValidator(platform[i])) {
          candidatePlatforms = axios.post(
            postCandidatePlatformURL,
            { electionCandidateID, platform: platform[i] },
            config
          );
          promises.push(candidatePlatforms);
        }
      }
      Promise.all(promises)
        .then(() => {
          setLoading((prevState) => false);
          //display a modal
          setSuccessfullUpdateModal(true);
        })
        .catch((error) => console.log(error));
    } catch (error) {
      console.log(error.message);
    }
  };

  const removePlatform = (i) => {
    try {
      setPlatform((prevState) => {
        let temp = [...prevState];
        if (temp.length > 1) {
          temp.splice(i, 1);
        }
        return temp;
      });
    } catch (error) {
      console.log(error);
    }
  };

  const addPlatform = (event) => {
    try {
      setPlatform((prevState) => {
        let temp = [...prevState];
        temp.push('');
        return temp;
      });
    } catch (error) {
      console.log(error);
    }
  };

  const uploadFileHandler = (event) => {
    try {
      if (event.target.files[0]) {
        const file = event.target.files[0];
        setFileToBase(file);
        setSelectedFile((prevState) => event.target.files[0]);
        setDisplayImage((prevState) =>
          URL.createObjectURL(event.target.files[0])
        );
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

  return (
    <>
      <div className='profile'>
        {loading && <Loading />}
        {!loading && (
          <Container>
            <Row className='py-4'>
              <Col sm={12} md={6} lg={6}>
                <Container>
                  <Stack>
                    <Stack>
                      {selectedFile !== null && (
                        <Figure>
                          <Figure.Image
                            width={130}
                            height={70}
                            alt='171x180'
                            thumbnail
                            src={
                              displayImage !== null
                                ? displayImage
                                : defaultImage
                            }
                          />
                        </Figure>
                      )}
                      {postedProfilePic !== null && selectedFile === null && (
                        <Figure>
                          <Figure.Image
                            width={130}
                            height={70}
                            alt='171x180'
                            thumbnail
                            src={postedProfilePic}
                          />
                        </Figure>
                      )}

                      <input
                        type='file'
                        name='profilePic'
                        id='files'
                        onChange={uploadFileHandler}
                      />
                    </Stack>

                    <br />
                    <h6>
                      <b>Name:</b>{' '}
                      <u>
                        {`${basicInfo.familyName}, ${basicInfo.firstName} ${
                          basicInfo.middleName
                            ? basicInfo.middleName.charAt(0)
                            : ' '
                        }.`}
                      </u>
                    </h6>
                    <h6>
                      <b>College:</b> <u>{basicInfo.college}</u>
                    </h6>
                    <h6>
                      <b>Department:</b> <u>{basicInfo.department}</u>
                    </h6>
                    <h6>
                      <b>Year Level:</b> <u>{basicInfo.yearLevel}</u>
                    </h6>
                    <h6>
                      <b>Program:</b> <u>{basicInfo.program}</u>
                    </h6>
                  </Stack>

                  <hr />

                  <Form>
                    <h5>Motto</h5>

                    <Form.Group controlId='candidateMotto'>
                      <Form.Control
                        className='mb-1'
                        required={false}
                        value={motto}
                        as='textarea'
                        placeholder={
                          prevMotto !== '' ? prevMotto : 'Input Motto'
                        }
                        onChange={(e) => {
                          setMotto((prevState) => e.target.value);
                        }}
                      />
                    </Form.Group>

                    {/* {hasMotto && (
                      <Button className='float-end' variant='info'>
                        Update motto
                      </Button>
                    )} */}
                  </Form>
                </Container>
              </Col>
              <Col sm={12} md={6} lg={6} className='mt-2'>
                <Container>
                  <Form>
                    <h5 className='platform' onClick={addPlatform}>
                      Platform➕
                    </h5>
                    <Form.Group controlId='candidateMotto'>
                      <Row>
                        <Col>
                          {Array.from({ length: platform.length }).map(
                            (_, i) => (
                              <Row key={`platform#${i + 1}`} xs={12} sm={12}>
                                <Col xs={10} sm={11} md={11} lg={11}>
                                  <Form.Control
                                    required={false}
                                    as='textarea'
                                    className='mb-1'
                                    placeholder='Input platform'
                                    onChange={(e) => {
                                      setPlatform((prevState) => {
                                        let temp = [...prevState];
                                        temp[i] = e.target.value;
                                        return temp;
                                      });
                                    }}
                                  />
                                </Col>
                                <Col xs={2} sm={1} md={1} lg={1}>
                                  <FontAwesomeIcon
                                    icon={faTrash}
                                    className='text-danger fa-1x float-end my-4 mx-2'
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => {
                                      removePlatform(i);
                                    }}
                                  />
                                </Col>
                              </Row>
                            )
                          )}
                        </Col>
                      </Row>
                    </Form.Group>
                  </Form>
                </Container>
              </Col>
            </Row>
            <Container className='p-2'>
              <Container className='d-grid gap-2'>
                <Button
                  variant='primary'
                  size='lg'
                  onClick={() => {
                    updateCandidateProfile();
                  }}
                >
                  UPDATE INFO
                </Button>
              </Container>
            </Container>
          </Container>
        )}
        <Modal
          show={successfullUpdateModal}
          backdrop='static'
          centered
          keyboard={false}
        >
          <Modal.Header>
            <Modal.Title>Profile updated successfully.</Modal.Title>
          </Modal.Header>
          <Modal.Body>Click 'OK' to navigate home.</Modal.Body>
          <Modal.Footer>
            <Button
              variant='info'
              onClick={() => {
                setSuccessfullUpdateModal(false);
                history('/home');
              }}
            >
              OK
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </>
  );
};

export default Profile;
