import React from 'react';
import { Card, Container } from 'react-bootstrap';
import './ViewProfile.css';

const ViewProfile = () => {
  return (
    <>
      <div className='profileContainer'>
        <Container>
          <Container className='containerHeader'>
            <h1 style={{ margin: '0px' }} className='text-center'>
              for {`{Position}`}
            </h1>
          </Container>
          <Container className='containerContent'>
            <Container className='p-4'>
              <Card className='text-center'>
                <Card.Header>
                  <Card.Title>Candidate Profile</Card.Title>
                </Card.Header>
                <Card.Body>dsds</Card.Body>
              </Card>
            </Container>
          </Container>
        </Container>
      </div>
    </>
  );
};

export default ViewProfile;
