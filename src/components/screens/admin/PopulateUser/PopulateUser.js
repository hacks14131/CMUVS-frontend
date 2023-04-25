import React, { useState } from 'react';
import axios from 'axios';
import { Button, Container, Modal, Stack, Table } from 'react-bootstrap';
import Loading from '../../../Loading/Loading';
import './PopulateUser.css';
const PopulateUser = () => {
  const [data, setData] = useState([]);
  const [warning, setWarning] = useState(false);
  const [loading, setLoading] = useState(false);

  const fileReader = new FileReader();

  const csvFileToArray = (string) => {
    try {
      const csvHeader = string.slice(0, string.indexOf('\n')).split(',');
      const csvRows = string.slice(string.indexOf('\n') + 1).split('\n');

      const information = csvRows.map((i) => {
        const values = i.split(',');
        const obj = csvHeader.reduce((object, header, index) => {
          object[header] = values[index];
          return object;
        }, {});
        return obj;
      });
      setData(information);
    } catch (error) {}
  };

  const handleOnClick = (e) => {
    try {
      e.preventDefault();
      let file = e.target.files[0];
      if (file) {
        fileReader.onload = function (e) {
          const text = e.target.result;
          csvFileToArray(text);
        };
        fileReader.readAsText(file);
      }
    } catch (error) {}
  };
  const populateDatabase = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-type': 'application/json',
        },
      };
      const studentDeactivationURL = `http://localhost:5000/api/user/deactivate-students/status`;
      await axios.patch(studentDeactivationURL, {}, config);
      if (data.length !== 0) {
        let addVotersPromise = [];
        for (let i = 0; i < data.length - 1; i++) {
          addVotersPromise.push(addVoter(data[i]));
        }
        await Promise.all(addVotersPromise).then();
      } else {
        setWarning(true);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const addVoter = async (voterData) => {
    try {
      // console.log(Object.keys(voterData));
      // console.log(voterData['Registration Number\r']);
      let yearLevel = voterData['Year Level\r'];
      const {
        'Student ID': studentID,
        'Registration Number': registrationNumber,
        'First Name': firstName,
        'Middle Name': middleName,
        'Family Name': familyName,
        College: college,
        Department: department,
        Program: program,
      } = voterData;
      const username = `${studentID}_${familyName
        .toLowerCase()
        .replace(/\s+/g, '')}`;
      const accountPassword = 'cmuvsdefaultpassword';
      const addVoterURL = `http://localhost:5000/api/user`;
      const token = sessionStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-type': 'application/json',
        },
      };
      await axios
        .post(
          addVoterURL,
          {
            studentID,
            registrationNumber,
            firstName,
            middleName,
            familyName,
            college,
            department,
            program,
            yearLevel,
            username,
            accountPassword,
          },
          config
        )
        .then()
        .catch();
    } catch (error) {}
  };

  // const headerKeys = Object.keys(Object.assign({}, ...data));

  return (
    <>
      {loading && <Loading />}
      <div className='page-container'>
        <h1 className='text-center'>POPULATE VOTERS</h1>
        <Container>
          <Stack gap={2} className='col-md-2 mx-auto'>
            <input
              type={'file'}
              id={'votersData'}
              accept={'.csv'}
              onChange={handleOnClick}
            />
            <Button
              variant='outline-success'
              onClick={async () => {
                await populateDatabase();
                setLoading(false);
              }}
              className='text-black'
            >
              IMPORT
            </Button>
          </Stack>
          <br />
        </Container>
        <Container>
          <Table responsive striped bordered>
            <thead>
              <tr>
                <td>No.</td>
                <td>Student ID</td>
                <td>Registration Number</td>
                <td>First Name</td>
                <td>Middle Name</td>
                <td>Family Name</td>
                <td>College</td>
                <td>Department</td>
                <td>Program</td>
                <td>Year Level</td>
                <td>Username</td>
                <td>Password</td>
              </tr>
            </thead>
            <tbody>
              {data.map((voter, index, row) => {
                if (index < 10 && index + 1 !== row.length) {
                  return (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{voter['Student ID']}</td>
                      <td>{voter['Registration Number']}</td>
                      <td>{voter['First Name']}</td>
                      <td>{voter['Middle Name']}</td>
                      <td>{voter['Family Name']}</td>
                      <td>{voter['College']}</td>
                      <td>{voter['Department']}</td>
                      <td>{voter['Program']}</td>
                      <td>{voter['Year Level\r']}</td>
                      <td>{`${voter['Student ID']}_${voter[
                        'Family Name'
                      ].toLowerCase()}`}</td>
                      <td>default</td>
                    </tr>
                  );
                }
                if (index + 1 === row.length && index > 9) {
                  return (
                    <tr key={index}>
                      <td colSpan={12} className='text-center mb-0'>
                        {`and ${row.length - 11} more data...`}
                      </td>
                    </tr>
                  );
                }
                return true;
              })}
            </tbody>
          </Table>
        </Container>
      </div>
      <Modal
        show={warning}
        onHide={() => {
          setWarning(false);
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className='ms-auto'>Message</Modal.Title>
        </Modal.Header>
        <Modal.Body>No CSV File Found. No data to upload.</Modal.Body>
      </Modal>
    </>
  );
};

export default PopulateUser;
