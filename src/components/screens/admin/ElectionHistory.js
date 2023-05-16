import React, { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faPrint } from '@fortawesome/free-solid-svg-icons';
import {
  Button,
  Col,
  Container,
  FloatingLabel,
  Form,
  FormGroup,
  Modal,
  Row,
  Table,
} from 'react-bootstrap';
import {
  MDBTable,
  MDBTableHead,
  MDBTableBody,
  MDBRow,
  MDBCol,
  MDBContainer,
} from 'mdb-react-ui-kit';
import axios from 'axios';

import Loading from '../../Loading/Loading';

import './ElectionHistory.css';

function ElectionHistory() {
  const [allElectionList, setAllElectionList] = useState([]);
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [sortValue, setSortValue] = useState('');
  const [previewLogs, setPreviewLogs] = useState(false);
  // const [selectionElection, setSelectionElection] = useState({});
  const [logData, setLogData] = useState([]);
  const printLogData = useRef();
  const sortOptions = ['Election Name', 'School Year'];

  useEffect(() => {
    setLoading(true);
    const source = axios.CancelToken.source();
    const token = sessionStorage.getItem('token');
    const fetchElectionsHistoryURL = `https://cmuvs-api.onrender.com/api/election/get-election/history`;
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-type': 'application/json',
      },
      cancelToken: source.token,
    };

    axios
      .get(fetchElectionsHistoryURL, config)
      .then((docs) => {
        if (docs) {
          setAllElectionList(docs.data);
          setElections(docs.data);
          setLoading(false);
        } else {
          setLoading(false);
        }
      })
      .catch((error) => {
        setLoading(false);
        console.log(error);
      });

    return () => {
      source.cancel();
    };
  }, []);

  const handleSearch = async (e) => {
    try {
      e.preventDefault();
      const newElection = allElectionList.filter((election) =>
        election.electionName.includes(search)
      );
      setElections([...newElection]);
    } catch (error) {}
  };
  const handleReset = () => {
    try {
      setSearch('');
      setSortValue('');
      setElections([...allElectionList]);
    } catch (error) {}
  };

  const handleSort = (e) => {
    try {
      const value = e.target.value;
      setSortValue(value);

      switch (value) {
        case 'Election Name': {
          let electionsCopy = [...elections];
          const sortedElectionByName = electionsCopy.sort((a, b) =>
            a.electionName > b.electionName ? 1 : -1
          );
          setElections([...sortedElectionByName]);
          break;
        }
        case 'School Year': {
          let electionsCopy = [...elections];
          const sortedElectionBySchoolYear = electionsCopy.sort((a, b) => {
            let arrA = a.schoolYear.split('-');
            let arrB = b.schoolYear.split('-');

            return new Date(arrA[0]) > new Date(arrB[0]) ? 1 : -1;
          });
          setElections([...sortedElectionBySchoolYear]);
          break;
        }
        default: {
          console.log('some sort of bug occured');
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const printLogs = (id) => {
    try {
      setPreviewLogs(true);
    } catch (error) {}
  };

  const displayBody = async (election) => {
    try {
      const logURL = `https://cmuvs-api.onrender.com/api/userVoteHistory/${election._id}`;
      const source = axios.CancelToken.source();
      const token = sessionStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-type': 'application/json',
        },
        cancelToken: source.token,
      };
      setLoading(true);
      const logs = await axios.get(logURL, config);
      setLogData([...logs.data]);
      setLoading(false);
    } catch (error) {}
  };

  const handlePrint = useReactToPrint({
    content: () => printLogData.current,
    documentTitle: 'vote-logs',
  });

  const getDateFormat = (opening, closing) => {
    try {
      const openingDate = new Date(opening);
      const closingDate = new Date(closing);
      const month = [
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
      const openingMonth = month[openingDate.getMonth()];
      const closingMonth = month[closingDate.getMonth()];
      const structuredDate = `${openingMonth} ${openingDate.getDate()}, ${openingDate.getFullYear()} - ${closingMonth} ${closingDate.getDate()}, ${closingDate.getFullYear()}`;
      return structuredDate;
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      {loading && <Loading />}
      {!loading && (
        <div className='page-container'>
          <center>
            <h2 className='electionHistory'>Election History</h2>
          </center>
          <Container className='footerFix'>
            <MDBContainer
              fluid
              className='square border border-2 border-dark p-2'
            >
              <Container className='mt-1'>
                <Form onSubmit={handleSearch}>
                  <Row className='mb-2'>
                    <Col xs={12} sm={12} md={6} lg={6}>
                      <FormGroup>
                        <FloatingLabel label='Election Name'>
                          <Form.Control
                            type='text'
                            placeholder='Search Election'
                            value={search}
                            onChange={(e) => {
                              setSearch(e.target.value);
                            }}
                            style={{
                              backgroundColor: 'transparent',
                              borderColor: 'black',
                            }}
                          />
                        </FloatingLabel>
                      </FormGroup>
                    </Col>
                    <Col
                      xs={6}
                      sm={6}
                      md={6}
                      lg={6}
                      className='py-2 px-3 d-flex flex-row'
                    >
                      <div className='p-1'>
                        <Button type='submit' variant='info'>
                          Search
                        </Button>
                      </div>
                      <div className='p-1'>
                        <Button
                          variant='danger'
                          onClick={() => {
                            handleReset();
                          }}
                        >
                          Clear
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </Form>

                <MDBRow>
                  <MDBCol size='12'>
                    <MDBTable responsive>
                      <MDBTableHead dark className='text-center'>
                        <tr>
                          <th>No.</th>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Level</th>
                          <th>SY</th>
                          <th>Date</th>
                          {/* <th></th> */}
                        </tr>
                      </MDBTableHead>
                      {elections.length === 0 ? (
                        <MDBTableBody className='text-center'>
                          <tr>
                            <td colSpan={8} className='text-center mb-0'>
                              No Election Found
                            </td>
                          </tr>
                        </MDBTableBody>
                      ) : (
                        <MDBTableBody className='text-center'>
                          {elections.map((election, index) => (
                            <tr
                              key={index}
                              onClick={() => {
                                printLogs(election._id);
                                displayBody(election);
                              }}
                              style={{ cursor: 'pointer' }}
                            >
                              <th>{index + 1}</th>
                              <th>{election._id}</th>
                              <th>{election.electionName}</th>
                              <th>{election.electionLevel}</th>
                              <th>{election.schoolYear}</th>
                              <th>
                                {getDateFormat(
                                  election.electionOpeningDate,
                                  election.electionClosingDate
                                )}
                              </th>
                              {/* <th>
                                {new Date(
                                  election.electionOpeningDate
                                ).toDateString() +
                                  ' - ' +
                                  new Date(
                                    election.electionClosingDate
                                  ).toDateString()}
                              </th> */}
                            </tr>
                          ))}
                        </MDBTableBody>
                      )}
                    </MDBTable>
                  </MDBCol>
                </MDBRow>
                <MDBRow className='my-3'>
                  <MDBCol size={8}>
                    <h5>Sort By:</h5>
                    <select
                      style={{
                        width: '50%',
                        borderRadius: '2px',
                        height: '35px',
                        backgroundColor: 'transparent',
                        borderColor: 'black',
                      }}
                      onChange={handleSort}
                      value={sortValue}
                    >
                      <option>--Select sort option--</option>
                      {sortOptions.map((option, index) => (
                        <option key={index} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </MDBCol>
                </MDBRow>
              </Container>
            </MDBContainer>
          </Container>
          <Modal
            size='lg'
            show={previewLogs}
            onHide={() => {
              setPreviewLogs(false);
            }}
          >
            <Modal.Header closeButton>
              <Modal.Title className='ms-auto'>
                <Button variant='warning' onClick={handlePrint}>
                  Download
                </Button>
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div ref={printLogData}>
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <td>No.</td>
                      <td>Vote ID</td>
                      <td>IP Address</td>
                      <td>Device</td>
                      <td>Date</td>
                    </tr>
                  </thead>
                  <tbody>
                    {logData.map((data, index) => (
                      <tr key={data._id}>
                        <td>{index + 1}</td>
                        <td>{data._id}</td>
                        <td>{data.IPv4}</td>
                        <td>{data.deviceModel}</td>
                        <td>{data.timestamp}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Modal.Body>
          </Modal>
        </div>
      )}
    </>
  );
}

export default ElectionHistory;
