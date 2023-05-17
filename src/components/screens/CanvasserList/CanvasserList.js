import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Form } from 'react-bootstrap';
import Loading from '../../Loading/Loading';
import './CanvasserList.css';
import {
  MDBCol,
  MDBContainer,
  MDBRow,
  MDBTable,
  MDBTableBody,
  MDBTableHead,
} from 'mdb-react-ui-kit';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEraser } from '@fortawesome/free-solid-svg-icons';

const CanvasserList = () => {
  const [loading, setLoading] = useState(false);
  const [officerData, setOfficerData] = useState([]);
  const [officerDataClone, setOfficerDataClone] = useState([]);
  const [text, setText] = useState('');

  useEffect(() => {
    setLoading(true);
    let officerList = [];
    let canvassedElectionList = [];
    const getElectionCanvassURL = `https://cmuvs-api.onrender.com/api/canvassingOfficer`;
    const getElectionCanvassOfficerURL = `https://cmuvs-api.onrender.com/api/electionCanvass`;
    // const userID = sessionStorage.getItem('userID');
    const axiosID = axios.CancelToken.source();
    const token = sessionStorage.getItem('token');
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-type': 'application/json',
      },
      cancelToken: axiosID.token,
    };

    const getAllCanvassOfficer = async () => {
      try {
        await axios.get(getElectionCanvassURL, config).then((docs) => {
          officerList = docs.data;
        });
      } catch (error) {
        console.log(error);
      }
    };

    const getAllCanvassElection = async () => {
      try {
        await axios.get(getElectionCanvassOfficerURL, config).then((docs) => {
          canvassedElectionList = docs.data;
          setLoading(false);
        });
      } catch (error) {
        console.log(error);
      }
    };
    Promise.all([getAllCanvassOfficer(), getAllCanvassElection()]).then(() => {
      let temp = officerList;
      for (let i = 0; i < temp.length; i++) {
        temp[i].election = canvassedElectionList.filter(
          (el) => el._id === temp[i].electionCanvassID._id
        );
      }
      setOfficerData([...temp]);
      setOfficerDataClone([...temp]);
      setLoading(false);
    });
  }, []);

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
          <div className='titleDiv'>
            <h1 className='componentTitle'>
              Viewing of Election Canvassing Officer Page
            </h1>
          </div>
          <Container className='footerFix'>
            <MDBContainer
              fluid
              className='square border border-2 border-dark p-2'
            >
              <Container className='mt-1'>
                <header>
                  <Form className='search'>
                    <input
                      className='searchInput'
                      placeholder='Search Election ...'
                      type='text'
                      value={text}
                      id='searchInput'
                      onChange={(e) => {
                        setText(e.target.value);
                        if (e.target.value) {
                          let searchResult = officerData.filter((data) =>
                            data.election[0].electionID.electionName
                              .toLowerCase()
                              .includes(e.target.value.toLowerCase())
                          );
                          setOfficerData([...searchResult]);
                          // console.log(searchResult);
                        } else {
                          setOfficerData([...officerDataClone]);
                        }
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
                          setOfficerData([...officerDataClone]);
                          setText('');
                        }}
                      />
                    </button>
                  </Form>
                </header>
                <MDBRow className='mt-2'>
                  <MDBCol size='12'>
                    <MDBTable responsive>
                      <MDBTableHead dark className='text-center'>
                        <tr>
                          <td>Election Name</td>
                          <td>Canvassing Officer</td>
                          <td>Election Level</td>
                          <td>SY</td>
                          <td>Date</td>
                        </tr>
                      </MDBTableHead>
                      <MDBTableBody className='text-center'>
                        {officerData.map((data) => (
                          <tr key={data._id}>
                            <th>{data.election[0].electionID.electionName}</th>
                            <th>{`${data.userID.firstName} ${data.userID.familyName}`}</th>
                            <th>{data.election[0].electionID.electionLevel}</th>
                            <th>{data.election[0].electionID.schoolYear}</th>
                            <th>
                              {getDateFormat(
                                data.election[0].electionID.electionOpeningDate,
                                data.election[0].electionID.electionClosingDate
                              )}
                            </th>
                          </tr>
                        ))}
                      </MDBTableBody>
                    </MDBTable>
                  </MDBCol>
                </MDBRow>
              </Container>
            </MDBContainer>
          </Container>
        </div>
      )}
    </>
  );
};

export default CanvasserList;
