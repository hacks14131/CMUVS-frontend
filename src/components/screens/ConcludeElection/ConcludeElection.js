import React, { useRef, useState, useEffect } from 'react';
import DateTimePicker from 'react-datetime-picker';
import axios from 'axios';
import {
  Button,
  Col,
  Container,
  FloatingLabel,
  Form,
  ListGroup,
  Modal,
  Row,
  Table,
} from 'react-bootstrap';
import Loading from '../../Loading/Loading';
import './ConcludeElection.css';

const ConcludeElection = () => {
  const [allActiveElectionList, setAllActiveElectionList] = useState([]);
  const [election, setElection] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showElectionDetail, setShowElectionDetail] = useState(false);
  const [extendElection, setExtendElection] = useState(false);
  const [extendedElectionDate, setExtendedElectionDate] = useState('');
  const [successfulPatch, setSuccessfulPatch] = useState(false);
  const selectedElection = useRef(null);

  useEffect(() => {
    setLoading(true);
    let source = axios.CancelToken.source();
    const token = sessionStorage.getItem('token');
    const fetchActiveElectionURL = `https://cmuvs-api.onrender.com/api/election/get-election/active`;
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-type': 'application/json',
      },
      cancelToken: source.token,
    };

    axios
      .get(fetchActiveElectionURL, config)
      .then((docs) => {
        if (docs) {
          setAllActiveElectionList(docs.data);
          setElection(docs.data);
          setLoading(false);
        } else {
          setLoading(false);
        }
      })
      .catch((error) => {
        console.log(error);
        setLoading(false);
      });

    return () => {
      source.cancel();
    };
  }, []);

  const handleSearch = (e) => {
    try {
      e.preventDefault();
      const newElectionList = allActiveElectionList.filter((el) =>
        el.electionName.includes(search)
      );
      setElection([...newElectionList]);
    } catch (error) {
      console.log(error);
    }
  };

  const patchSelectedElection = async () => {
    try {
      setLoading(true);
      const source = axios.CancelToken.source();
      const token = sessionStorage.getItem('token');
      const patchElectionURL = `https://cmuvs-api.onrender.com/api/election/update-election/${
        election[selectedElection.current]._id
      }`;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-type': 'application/json',
        },
        cancelToken: source.token,
      };

      const electionStatus = 'Finished';

      await axios
        .patch(patchElectionURL, { electionStatus }, config)
        .then(() => {
          setShowElectionDetail(false);
          setLoading(false);
        })
        .catch((error) => {
          console.log(error);
          setLoading(false);
        });
    } catch (error) {
      console.log(error);
    }
  };

  const updateElection = async (elec) => {
    try {
      const extendElectionURL = `https://cmuvs-api.onrender.com/api/election/extend-election/${elec._id}`;
      const source = axios.CancelToken.source();
      const token = sessionStorage.getItem('token');
      const electionClosingDate = extendedElectionDate;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-type': 'application/json',
        },
        cancelToken: source.token,
      };
      setLoading(true);
      await axios.patch(extendElectionURL, { electionClosingDate }, config);
      setLoading(false);
      setExtendElection(false);
      setShowElectionDetail(false);
      setSuccessfulPatch(true);
    } catch (error) {}
  };

  return (
    <>
      {loading && <Loading />}
      {!loading && (
        <div className='page-container'>
          <center>
            <h2 className='electionHistory'>Select Election to Conclude</h2>
          </center>
          <Container className='form1 p-4'>
            <Container className='container-fluid'>
              <Row>
                <Col xs={12} sm={12} md={6} lg={6}>
                  <Form>
                    <FloatingLabel label='Election Name'>
                      <Form.Control
                        type='text'
                        placeholder='Search Election'
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                          backgroundColor: '#ececec',
                          borderColor: 'black',
                        }}
                      />
                    </FloatingLabel>
                  </Form>
                </Col>
                <Col
                  xs={6}
                  sm={6}
                  md={6}
                  lg={6}
                  className='py-2 px-3 d-flex flex-row'
                >
                  <div className='p-1'>
                    <Button variant='info' onClick={(e) => handleSearch(e)}>
                      Search
                    </Button>
                  </div>
                  <div className='p-1'>
                    <Button
                      variant='danger'
                      onClick={() => {
                        setElection([...allActiveElectionList]);
                        setSearch('');
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                </Col>
              </Row>
              <Row className='mt-3'>
                <Table bordered hover variant='dark' responsive>
                  <thead>
                    <tr>
                      <th>No.</th>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Level</th>
                      <th>SY</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {election.length === 0 ? (
                      <tr>
                        <td colSpan={8} className='text-center mb-0'>
                          No Election Found
                        </td>
                      </tr>
                    ) : (
                      election.map((el, index) => (
                        <tr
                          key={index}
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            selectedElection.current = index;
                            setShowElectionDetail(true);
                          }}
                        >
                          <th>{index + 1}</th>
                          <th>{el._id}</th>
                          <th>{el.electionName}</th>
                          <th>{el.electionLevel}</th>
                          <th>{el.schoolYear}</th>
                          <th>
                            {new Date(el.electionOpeningDate).toDateString()} -
                            {new Date(el.electionClosingDate).toDateString()}
                          </th>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </Row>
            </Container>
          </Container>
          {election.length !== 0 && (
            <Modal
              show={showElectionDetail}
              onHide={() => {
                setShowElectionDetail(false);
              }}
              keyboard={false}
              backdrop='static'
            >
              <Modal.Header closeButton>
                <Modal.Title>
                  <big>
                    <center>
                      {selectedElection.current === null
                        ? ''
                        : `${election[selectedElection.current].electionName}`}
                    </center>
                  </big>
                </Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <ListGroup variant='flush'>
                  <ListGroup.Item>
                    ID:{' '}
                    {selectedElection.current === null
                      ? ''
                      : election[selectedElection.current]._id}
                  </ListGroup.Item>
                  {/* <ListGroup.Item>
                    Name:{' '}
                    {selectedElection.current === null
                      ? ''
                      : election[selectedElection.current].electionName}
                  </ListGroup.Item> */}
                  <ListGroup.Item>
                    Level:{' '}
                    {selectedElection.current === null
                      ? ''
                      : election[selectedElection.current].electionLevel}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    SY:{' '}
                    {selectedElection.current === null
                      ? ''
                      : election[selectedElection.current].schoolYear}
                  </ListGroup.Item>
                  {!extendElection && (
                    <ListGroup.Item>
                      Date:{' '}
                      {selectedElection.current === null
                        ? ''
                        : `${new Date(
                            election[
                              selectedElection.current
                            ].electionOpeningDate
                          ).toDateString()} - ${new Date(
                            election[
                              selectedElection.current
                            ].electionClosingDate
                          ).toDateString()}`}
                    </ListGroup.Item>
                  )}
                </ListGroup>
                {extendElection && (
                  <div className='d-grid gap-2 mt-3 px-3'>
                    Select Extended Closing Date
                    <DateTimePicker
                      onChange={(value) => {
                        setExtendedElectionDate(value);
                      }}
                      value={
                        extendedElectionDate === ''
                          ? null
                          : extendedElectionDate
                      }
                    />
                    <Row>
                      <Col
                        xs={{ span: 8, offset: 2 }}
                        md={{ span: 6, offset: 3 }}
                      >
                        <div className='d-grid gap-2'>
                          <Button
                            variant='outline-info'
                            size='lg'
                            disabled={
                              extendedElectionDate === '' ? true : false
                            }
                            onClick={() => {
                              updateElection(
                                election[selectedElection.current]
                              );
                            }}
                          >
                            Extend Election
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </div>
                )}
                {!extendElection && (
                  <Container>
                    <br />
                    <Row>
                      <Col md={{ span: 4, offset: 2 }} className='mb-2'>
                        <div className='d-grid gap-2'>
                          <Button
                            variant='outline-info'
                            size='lg'
                            onClick={() => {
                              setExtendElection(true);
                            }}
                          >
                            Extend
                          </Button>
                        </div>
                      </Col>
                      <Col md={{ span: 4, offset: 0 }}>
                        <div className='d-grid gap-2'>
                          <Button
                            variant='outline-info'
                            size='lg'
                            onClick={() => patchSelectedElection()}
                          >
                            Conclude
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </Container>
                )}
              </Modal.Body>
              {/* <Modal.Footer>
                <Row>
                  <Col>
                    <div className='d-grid gap-2'>
                      <Button
                        variant='outline-danger'
                        size='lg'
                        onClick={() => setShowElectionDetail(false)}
                      >
                        Close
                      </Button>
                    </div>
                  </Col>
                </Row>
              </Modal.Footer> */}
            </Modal>
          )}
          <Modal
            size='lg'
            show={successfulPatch}
            onHide={() => setSuccessfulPatch(false)}
            centered
          >
            <Modal.Header closeButton>
              <Modal.Title>
                {selectedElection.current === null
                  ? ''
                  : `${election[selectedElection.current].electionName}`}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>Election deadline has been extended.</Modal.Body>
          </Modal>
        </div>
      )}
    </>
  );
};

export default ConcludeElection;
