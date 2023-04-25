import React, { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import {
  Button,
  Card,
  Col,
  Container,
  ListGroup,
  Modal,
  Row,
  Table,
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDownload,
  faCheck,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import Loading from '../../Loading/Loading';
import './Canvass.css';
import axios from 'axios';
const Canvass = () => {
  const [loading, setLoading] = useState(true);
  const [canvassOfficerTaskList, setCanvassOfficerTaskList] = useState([]);
  const [electionCanvassList, setElectionCanvassList] = useState([]);
  const [finalCanvassData, setFinalCanvassData] = useState([]);
  const [showCanvassData, setShowCanvassData] = useState(false);
  const [pdfTitle, setPdfTitle] = useState('');
  const [electionLevel, setElectionLevel] = useState('');
  const [filteredCanvassData, setFilteredCanvassData] = useState([]);
  const [result, setResult] = useState([]);
  const printCanvassDate = useRef();
  const tieBreaker = useRef([]);
  const selectedElection = useRef(0);
  const [proceedCanvass, setProceedCanvass] = useState(false);
  const [viewCanvassFinal, setViewCanvassFinal] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [canvasserName, setCanvasserName] = useState('');
  const [today, setToday] = useState('');
  const printed = useRef(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [displayCanvassNote, setDisplayCanvassNote] = useState(true);
  const selectedElectionID = useRef('');
  const selectedElectionCanvassTask = useRef(0);

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    const userID = sessionStorage.getItem('userID');
    let source = axios.CancelToken.source();
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-type': 'application/json',
      },
      CancelToken: source.token,
    };

    let todayTemp = new Date();
    let day = todayTemp.getDate();
    let month = todayTemp.getMonth() + 1;
    let year = todayTemp.getFullYear();
    let hour = todayTemp.getHours();
    let minute = todayTemp.getMinutes();
    setToday(
      `${month}/${day}/${year} ${hour % 12}: ${
        minute > 9 ? minute : `0${minute}`
      } ${hour > 11 ? 'pm' : 'am'}`
    );

    const checkAndUpdateCanvassStatus = async (id) => {
      try {
        const getCanvassStatusURL = `http://localhost:5000/api/canvassingOfficer/canvass-status/${id}`;
        const canvassStatus = await axios.get(getCanvassStatusURL, config);
        if (canvassStatus) {
          let status = true;
          for (let i = 0; i < canvassStatus.data.length; i++) {
            if (canvassStatus.data[i].taskStatus === 'Pending') {
              status = false;
            }
          }
          if (status) {
            const updateCanvassStatusURL = `http://localhost:5000/api/electionCanvass/update-canvass-status/${id}`;
            await axios
              .patch(updateCanvassStatusURL, { message: 'nothing' }, config)
              .then((docs) => {});
          }
        } else {
          console.log('no match');
        }
      } catch (error) {
        console.log(error);
      }
    };

    const fetchCanvassOfficerData = async () => {
      try {
        const fetchCanvassOfficerDataURL = `http://localhost:5000/api/canvassingOfficer/canvass-list/${userID}`;
        let tempCanvassOfficerTaskListCopy = [];
        await axios.get(fetchCanvassOfficerDataURL, config).then((docs) => {
          if (docs) {
            // setCanvassOfficerTaskList((prevData) => {
            let temp = [...docs.data];
            for (let i = 0; i < temp.length; i++) {
              checkAndUpdateCanvassStatus(temp[i].electionCanvassID);

              const getCanvasPositionDataURL = `http://localhost:5000/api/canvassPosition/canvass-get-positions/${temp[i]._id}`;
              axios.get(getCanvasPositionDataURL, config).then((docs) => {
                if (docs) {
                  temp[i].canvassPositionTask = [...docs.data];
                } else {
                  temp[i].canvassPositionTask = [];
                }
              });
            }

            // get all positions in this election for sorting purposes
            // console.log(temp);
            tempCanvassOfficerTaskListCopy = temp;
            //   return temp;
            // });
          }
        });

        let finalCanvassList = [];

        for (let i = 0; i < tempCanvassOfficerTaskListCopy.length; i++) {
          const getElectionCanvassDataURL = `http://localhost:5000/api/electionCanvass/get-canvass-data/${tempCanvassOfficerTaskListCopy[i].electionCanvassID}`;
          await axios.get(getElectionCanvassDataURL, config).then((docs) => {
            if (docs) {
              finalCanvassList.push(docs.data);
              // setElectionCanvassList((prevState) => {
              //   let temp = [...prevState];
              //   temp.push(docs.data);
              //   return temp;
              // });
            }
          });
        }

        setElectionCanvassList(finalCanvassList);
        let positionListPromise = [];
        const getAllElectionPositionsURL =
          'http://localhost:5000/api/electionPosition/';
        for (let i = 0; i < finalCanvassList.length; i++) {
          const candidatePositionPromise = await axios.get(
            `${getAllElectionPositionsURL}${finalCanvassList[i].electionID._id}`,
            config
          );
          if (candidatePositionPromise) {
            positionListPromise.push(candidatePositionPromise.data);
          }
        }

        // sort the fetch position first to ensure positions will be ordered properly when displaying
        for (let i = 0; i < positionListPromise.length; i++) {
          positionListPromise[i] = positionListPromise[i].sort((a, b) =>
            a.positionNumber > b.positionNumber ? 1 : -1
          );
        }
        // console.log('before', tempCanvassOfficerTaskListCopy);
        // console.log(positionListPromise);
        for (let i = 0; i < tempCanvassOfficerTaskListCopy.length; i++) {
          let sortedPositions = [];
          for (let j = 0; j < positionListPromise[i].length; j++) {
            let item = tempCanvassOfficerTaskListCopy[
              i
            ].canvassPositionTask.filter(
              (task) =>
                task.positionToCanvass ===
                positionListPromise[i][j].positionName
            );
            // console.log('item', item);
            sortedPositions.push(item[0]);
          }
          // console.log('sorted', sortedPositions);
          tempCanvassOfficerTaskListCopy[i].canvassPositionTask =
            sortedPositions;
        }
        setCanvassOfficerTaskList([...tempCanvassOfficerTaskListCopy]);
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };

    fetchCanvassOfficerData();

    return () => {
      source.cancel();
    };
  }, []);

  //next task is to trace why the latest election was not found

  const createCardBody = (index) => {
    try {
      // console.log(canvassOfficerTaskList);
      let item = [];
      canvassOfficerTaskList.map((task) => {
        if (electionCanvassList[index]._id === task.electionCanvassID) {
          // console.log(task);
          task.canvassPositionTask.map((name) => {
            item.push(name.positionToCanvass);
            return '';
          });
          return '';
        } else {
          return '';
        }
      });
      return item.map((posName, index) => (
        <ListGroup.Item key={index}>
          {index + 1}. {posName}
        </ListGroup.Item>
      ));
    } catch (error) {
      console.log(error);
    }
  };

  // const buttonLabel = (index, type) => {
  //   try {
  //     let label = '';
  //     for (let i = 0; i < canvassOfficerTaskList.length; i++) {
  //       if (
  //         electionCanvassList[index]._id ===
  //         canvassOfficerTaskList[i].electionCanvassID
  //       ) {
  //         if (canvassOfficerTaskList[i].taskStatus === 'Finished') {
  //           label = 'View';
  //         } else {
  //           label = 'Canvass';
  //         }
  //       }
  //     }
  //     if (type === 'label') {
  //       return label;
  //     } else {
  //       if (label === 'View') {
  //         return 'info';
  //       }
  //       return 'success';
  //     }
  //   } catch (error) {}
  // };

  const canvassElection = async (election, ind) => {
    try {
      let canvassData = [...canvassOfficerTaskList[ind].canvassPositionTask];
      // console.log(canvassData);
      for (let i = 0; i < canvassData.length; i++) {
        canvassData[i].candidates = [];
      }
      let courseList = JSON.parse(
        sessionStorage.getItem('College and Department List')
      );
      const token = sessionStorage.getItem('token');
      const voteHistoryURL = `http://localhost:5000/api/userVoteHistory/canvass-data/`;
      const electionCandidatesURL = `http://localhost:5000/api/electionCandidate/candidate/`;
      let source = axios.CancelToken.source();
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-type': 'application/json',
        },
        CancelToken: source.token,
      };

      let posToCanvass = [];
      canvassOfficerTaskList[ind].canvassPositionTask.map((pos, index) => {
        posToCanvass.push({
          _id: pos._id,
          positionName: pos.positionToCanvass,
          candidates: [],
        });
        return '';
      });

      let registeredVotes = await axios.get(
        `${voteHistoryURL}${election.electionID._id}`,
        config
      );
      let electionCandidates = await axios.get(
        `${electionCandidatesURL}${election.electionID._id}`,
        config
      );

      for (let i = 0; i < canvassData.length; i++) {
        // console.log(canvassData);
        electionCandidates.data.map((candidate) => {
          if (
            canvassData[i].positionToCanvass ===
            candidate.positionID.positionName
          ) {
            canvassData[i].candidates.push(candidate);
            canvassData[i].candidates[
              canvassData[i].candidates.length - 1
            ].voteHistory = [];

            switch (election.electionID.electionLevel) {
              case 'University': {
                canvassData[i].collegeVoteBreakdown = [];
                for (let j = 0; j < courseList.length; j++) {
                  const item = {
                    collegeName: courseList[j]._id,
                    breakdown: [],
                  };

                  canvassData[i].collegeVoteBreakdown.push(item);
                  for (let k = 0; k < electionCandidates.data.length; k++) {
                    if (
                      canvassData[i].positionToCanvass ===
                      electionCandidates.data[k].positionID.positionName
                    ) {
                      canvassData[i].collegeVoteBreakdown[j].breakdown.push({
                        candidateID: electionCandidates.data[k]._id,
                        voteGarnered: 0,
                      });
                    }
                  }
                }
                break;
              }
              case 'College': {
                canvassData[i].departmentVoteBreakdown = [];
                for (let j = 0; j < courseList.length; j++) {
                  if (
                    electionCanvassList[ind].electionID.electionScope ===
                    courseList[j]._id
                  ) {
                    for (let k = 0; k < courseList[j].departments.length; k++) {
                      let itemDep = {
                        departmentName: courseList[j].departments[k],
                        breakdown: [],
                      };
                      canvassData[i].departmentVoteBreakdown.push(itemDep);
                      // console.log(electionCandidates.data);
                      for (let l = 0; l < electionCandidates.data.length; l++) {
                        if (
                          canvassData[i].positionToCanvass ===
                          electionCandidates.data[l].positionID.positionName
                        ) {
                          let candidateItem = {
                            candidateID: electionCandidates.data[l]._id,
                            voteGarnered: 0,
                          };
                          canvassData[i].departmentVoteBreakdown[
                            k
                          ].breakdown.push(candidateItem);
                        }
                      }
                    }
                  }
                }
                break;
              }
              case 'Department': {
                canvassData[i].majorVoteBreakdown = [];
                for (let j = 0; j < canvassData[i].candidates.length; j++) {
                  canvassData[i].majorVoteBreakdown.push({
                    candidateID: canvassData[i].candidates[j]._id,
                    voteGarnered: 0,
                  });
                }
                break;
              }
              default: {
                console.log('Not university, college, or department level');
                break;
              }
            }
          }
          return '';
        });
      }

      //below lines are the logic for vote tallying
      /* 
        logic for tallyting votes
        => use switch statement to determine if election is university, college, or department level
        => loop and enter voteBreakdown and use loop to enter another detailed vote breakdown in each college or department and
           use another loop to enter each candidate under that college or department then check if the vote matches the voters
           college or department if match then add 1 to the current candidate garnered vote
      */
      switch (election.electionID.electionLevel) {
        case 'University': {
          for (let i = 0; i < canvassData.length; i++) {
            for (
              let j = 0;
              j < canvassData[i].collegeVoteBreakdown.length;
              j++
            ) {
              //get college or department name in here
              for (
                let k = 0;
                k < canvassData[i].collegeVoteBreakdown[j].breakdown.length;
                k++
              ) {
                for (let l = 0; l < registeredVotes.data.length; l++) {
                  if (
                    canvassData[i].collegeVoteBreakdown[j].collegeName ===
                    registeredVotes.data[l].userID.college
                  ) {
                    if (
                      canvassData[i].collegeVoteBreakdown[j].breakdown[k]
                        .candidateID ===
                      registeredVotes.data[l].votedCandidateID._id
                    ) {
                      canvassData[i].collegeVoteBreakdown[j].breakdown[k]
                        .voteGarnered++;
                    }
                  }
                }
              }
              // canvassData[i].collegeVoteBreakdown[j].breakdown.sort((a, b) =>
              //   a.voteGarnered < b.voteGarnered ? 1 : -1
              // );
            }
          }
          for (let i = 0; i < canvassData.length; i++) {
            for (let j = 0; j < canvassData[i].candidates.length; j++) {
              for (let k = 0; k < registeredVotes.data.length; k++) {
                if (
                  registeredVotes.data[k].votedCandidateID._id ===
                  canvassData[i].candidates[j]._id
                ) {
                  canvassData[i].candidates[j].voteHistory.push(
                    registeredVotes.data[k]
                  );
                }
              }
              // canvassData[i].candidates.sort((a, b) =>
              //   a.voteHistory.length < b.voteHistory.length ? 1 : -1
              // );
            }
          }
          break;
        }
        case 'College': {
          for (let i = 0; i < canvassData.length; i++) {
            for (
              let j = 0;
              j < canvassData[i].departmentVoteBreakdown.length;
              j++
            ) {
              //get department name in this loop level
              for (
                let k = 0;
                k < canvassData[i].departmentVoteBreakdown[j].breakdown.length;
                k++
              ) {
                for (let l = 0; l < registeredVotes.data.length; l++) {
                  if (
                    canvassData[i].departmentVoteBreakdown[j].departmentName ===
                      registeredVotes.data[l].userID.department &&
                    canvassData[i].departmentVoteBreakdown[j].breakdown[k]
                      .candidateID ===
                      registeredVotes.data[l].votedCandidateID._id
                  ) {
                    canvassData[i].departmentVoteBreakdown[j].breakdown[k]
                      .voteGarnered++;
                  }
                }
              }
              // canvassData[i].departmentVoteBreakdown[j].breakdown.sort((a, b) =>
              //   a.voteGarnered < b.voteGarnered ? 1 : -1
              // );
            }
          }
          for (let i = 0; i < canvassData.length; i++) {
            for (let j = 0; j < canvassData[i].candidates.length; j++) {
              for (let k = 0; k < registeredVotes.data.length; k++) {
                if (
                  registeredVotes.data[k].votedCandidateID._id ===
                  canvassData[i].candidates[j]._id
                ) {
                  canvassData[i].candidates[j].voteHistory.push(
                    registeredVotes.data[k]
                  );
                }
              }
              // canvassData[i].candidates.sort((a, b) =>
              //   a.voteHistory.length < b.voteHistory.length ? 1 : -1
              // );
            }
          }
          break;
        }
        case 'Department': {
          for (let i = 0; i < canvassData.length; i++) {
            for (let j = 0; j < canvassData[i].candidates.length; j++) {
              for (let k = 0; k < registeredVotes.data.length; k++) {
                if (
                  registeredVotes.data[k].votedCandidateID._id ===
                  canvassData[i].candidates[j]._id
                ) {
                  canvassData[i].candidates[j].voteHistory.push(
                    registeredVotes.data[k]
                  );
                }
              }
              // canvassData[i].candidates.sort((a, b) =>
              //   a.voteHistory.length < b.voteHistory.length ? 1 : -1
              // );
            }
            let total = 0;
            for (let j = 0; j < canvassData[i].candidates.length; j++) {
              total = total + canvassData[i].candidates[j].voteHistory.length;
            }
            canvassData[i].totalVote = total;
          }
          break;
        }
        default: {
          console.log('Not university, college, or department level');
        }
      }

      /*
          logic for getting the votes details of the selected election from the database
    
          => get the selected election details using the election id and save on page.
          => get the positions that the election canvasser is allowed to canvass.
          => get all votes registered to the same selected election, populate the user ID field with its corresponding first name, family name, student id, college, department, program, 
             and year level.
          => get all candidates from the selected election
          => store candidates in an array of objects then organize them accordig to positions they participated
          => create a property (voteHistory) that will store all the voting data that belong to to each candidate
          => check if election level is department, college, or university
          => if election level is department then continue
          => if election level is college then create a property (departmentVoteBreakdown) which will be an array of object that will contain every department in the election scope college
             and each departmentVoteBreakdown instance will have a property (voteCount) describing the total vote casted to the candidate in this department
          => if election level is university then create a property (collegeVoteBreakdown) which will be an array of object that will contain every college in the CMU and each collegeVoteBreakdown
             instance will have a property (voteCount) describing the total vote casted to the candidate in this college
          => filter documents so that only positions that the electon canvasser is allowed to canvass will be left.
          => create a printable document containing the canvass information
          => update canvasser task status to done
          => create a printable/downloadable document.

          Note: last task was structuring college vote breakdown
    
      */

      /* 
        Logic for removing vote breakdown for college that are not included in the current position
      */

      switch (election.electionID.electionLevel) {
        case 'University': {
          for (let i = 0; i < canvassData.length; i++) {
            let item = [];
            for (
              let j = 0;
              j < canvassData[i].collegeVoteBreakdown.length;
              j++
            ) {
              if (
                canvassData[i].candidates[0].positionID.allowedCollege ===
                  'ALL' ||
                canvassData[i].candidates[0].positionID.allowedCollege ===
                  canvassData[i].collegeVoteBreakdown[j].collegeName
              ) {
                item.push(canvassData[i].collegeVoteBreakdown[j]);
              }
            }
            canvassData[i].collegeVoteBreakdown = [...item];
          }

          break;
        }
        case 'College': {
          for (let i = 0; i < canvassData.length; i++) {
            let item = [];
            for (
              let j = 0;
              j < canvassData[i].departmentVoteBreakdown.length;
              j++
            ) {
              if (
                canvassData[i].candidates[0].positionID.allowedDepartment ===
                  'ALL' ||
                canvassData[i].candidates[0].positionID.allowedDepartment ===
                  canvassData[i].departmentVoteBreakdown[j].codepartmentName
              ) {
                item.push(canvassData[i].departmentVoteBreakdown[j]);
              }
            }
            canvassData[i].departmentVoteBreakdown = [...item];
          }

          break;
        }
        case 'Department': {
          for (let i = 0; i < canvassData.length; i++) {
            canvassData[i].maximumVote =
              canvassData[i].candidates[0].positionID.maximumVotes;
          }
          break;
        }
        default: {
          console.log('something wrong');
        }
      }
      // console.log(canvassData);
      setFinalCanvassData([...canvassData]);
      let printableCanvassInformation = [];
      switch (election.electionID.electionLevel) {
        case 'University': {
          for (let i = 0; i < canvassData.length; i++) {
            let totalVote = 0;
            for (let c = 0; c < canvassData[i].candidates.length; c++) {
              totalVote =
                totalVote + canvassData[i].candidates[c].voteHistory.length;
            }
            // console.log(canvassData[i]);
            // console.log(canvassData[i].candidates[0].positionID);
            printableCanvassInformation.push({
              positionName: canvassData[i].positionToCanvass,
              totalVote,
              maximumVote: canvassData[i].candidates[0].positionID.maximumVotes,
              expectedTotalVoter:
                canvassData[i].candidates[0].positionID.expectedMaximumVoter,
              fullfilled: false,
              positionRank:
                canvassData[i].candidates[0].positionID.positionNumber,
              data: [],
            });
            for (let j = 0; j < canvassData[i].candidates.length; j++) {
              let percentage = 0;
              let percentagTemp =
                Math.round(
                  canvassData[i].candidates[j].voteHistory.length * 100
                ) / printableCanvassInformation[i].totalVote;
              if (percentagTemp % 1 === 0) {
                percentage = percentagTemp;
              } else {
                percentage = percentagTemp.toFixed(2);
              }
              let item = [];
              item.push([
                {
                  header: 'Rank',
                  value: j + 1,
                },
                {
                  header: 'Candidate ID',
                  value: canvassData[i].candidates[j]._id,
                },
                {
                  header: 'Name',
                  value: `${canvassData[i].candidates[j].userID.firstName} ${canvassData[i].candidates[j].userID.familyName}`,
                },
                {
                  header: 'Total',
                  value: canvassData[i].candidates[j].voteHistory.length,
                },
                {
                  header: 'Percentage',
                  value: `${percentage}%`,
                },
              ]);
              // console.log(item);
              printableCanvassInformation[i].data.push(item);
              // printableCanvassInformation[i].data.push({
              //   Rank: j + 1,
              //   'Candidate ID': canvassData[i].candidates[j]._id,
              //   Name: `${canvassData[i].candidates[j].userID.familyName}, ${canvassData[i].candidates[j].userID.firstName}`,
              //   Total: canvassData[i].candidates[j].voteHistory.length,
              //   'Vote Percentage': `${percentage}%`,
              // });
            }
            //loop in each candidate then loop in each college vote breakdown and get their voting data breakdown
            for (
              let k = 0;
              k < printableCanvassInformation[i].data.length;
              k++
            ) {
              for (
                let l = 0;
                l < canvassData[i].collegeVoteBreakdown.length;
                l++
              ) {
                let collegeName =
                  canvassData[i].collegeVoteBreakdown[l].collegeName;
                for (
                  let m = 0;
                  m < canvassData[i].collegeVoteBreakdown[l].breakdown.length;
                  m++
                ) {
                  // console.log(
                  //   printableCanvassInformation[i].data[k][0][1].value
                  // );
                  // console.log(
                  //   canvassData[i].collegeVoteBreakdown[l].breakdown[m]
                  //     .candidateID
                  // );
                  if (
                    printableCanvassInformation[i].data[k][0][1].value ===
                    canvassData[i].collegeVoteBreakdown[l].breakdown[m]
                      .candidateID
                  ) {
                    // printableCanvassInformation[i].data[k][collegeName] = canvassData[i].collegeVoteBreakdown[l].breakdown[m].voteGarnered;//insert object here
                    for (
                      let n = 0;
                      n < printableCanvassInformation[i].data[k].length;
                      n++
                    ) {
                      if (collegeName === 'Education') {
                        collegeName = 'COEd';
                      } else if (/\s/.test(collegeName)) {
                        let abbreviation = collegeName
                          .match(/\b([A-Z])/g)
                          .join('');
                        collegeName = 'C' + abbreviation;
                      } else {
                        let abbreviation = collegeName
                          .match(/\b([A-Z])/g)
                          .join('');
                        collegeName = 'CO' + abbreviation;
                      }
                      printableCanvassInformation[i].data[k][0].push({
                        header: collegeName,
                        value:
                          canvassData[i].collegeVoteBreakdown[l].breakdown[m]
                            .voteGarnered,
                      });
                    }
                  }
                }
              }
            }
          }

          // shitfting;
          for (let i = 0; i < printableCanvassInformation.length; i++) {
            for (
              let j = 0;
              j < printableCanvassInformation[i].data.length;
              j++
            ) {
              // console.log(printableCanvassInformation[i].data[j][0][printableCanvassInformation[i].data[j][0].length - 1]);

              let temp1 = printableCanvassInformation[i].data[j][0][3];
              let temp2 = printableCanvassInformation[i].data[j][0][4];
              let temp3 =
                printableCanvassInformation[i].data[j][0][
                  printableCanvassInformation[i].data[j][0].length - 1
                ];

              // console.log('temp1', temp1);
              // console.log('temp2', temp2);
              // console.log('temp3', temp3);

              printableCanvassInformation[i].data[j][0][
                printableCanvassInformation[i].data[j][0].length - 1
              ] = temp2;
              printableCanvassInformation[i].data[j][0][4] = temp3;

              let temp4 =
                printableCanvassInformation[i].data[j][0][
                  printableCanvassInformation[i].data[j][0].length - 2
                ];

              printableCanvassInformation[i].data[j][0][
                printableCanvassInformation[i].data[j][0].length - 2
              ] = temp1;
              printableCanvassInformation[i].data[j][0][3] = temp4;

              // printableCanvassInformation[i].data[j][0][3] =
              //   printableCanvassInformation[i].data[j][0][
              //     printableCanvassInformation[i].data[j][0].length - 2
              //   ];
              // printableCanvassInformation[i].data[j][0][4] =
              //   printableCanvassInformation[i].data[j][0][
              //     printableCanvassInformation[i].data[j][0].length - 1
              //   ];
              // printableCanvassInformation[i].data[j][0][
              //   printableCanvassInformation[i].data[j][0].length - 2
              // ] = temp1;
              // printableCanvassInformation[i].data[j][0][
              //   printableCanvassInformation[i].data[j][0].length - 1
              // ] = temp2;
            }
          }

          for (let i = 0; i < printableCanvassInformation.length; i++) {
            printableCanvassInformation[i].data.sort((a, b) =>
              a[0][a[0].length - 2].value < b[0][b[0].length - 2].value ? 1 : -1
            );
          }
          for (let i = 0; i < printableCanvassInformation.length; i++) {
            let headers = [];
            for (
              let j = 0;
              j < printableCanvassInformation[i].data[0][0].length;
              j++
            ) {
              headers.push(printableCanvassInformation[i].data[0][0][j].header);
            }
            // console.log(headers);
            printableCanvassInformation[i].fields = [...headers];
          }
          // printableCanvassInformation = printableCanvassInformation.sort(
          //   (a, b) => (a.positionRank < b.positionRank ? 1 : -1)
          // );
          // console.log(printableCanvassInformation);
          setFilteredCanvassData([...printableCanvassInformation]);
          // console.log(printableCanvassInformation);
          break;
        }
        case 'College': {
          for (let i = 0; i < canvassData.length; i++) {
            let totalVote = 0;
            for (let c = 0; c < canvassData[i].candidates.length; c++) {
              totalVote =
                totalVote + canvassData[i].candidates[c].voteHistory.length;
            }
            // console.log(canvassData[i].candidates[0].positionID);
            printableCanvassInformation.push({
              positionName: canvassData[i].positionToCanvass,
              totalVote,
              maximumVote: canvassData[i].candidates[0].positionID.maximumVotes,
              expectedTotalVoter:
                canvassData[i].candidates[0].positionID.expectedMaximumVoter,
              fullfilled: false,
              positionRank:
                canvassData[i].candidates[0].positionID.positionNumber,
              data: [],
            });
            for (let j = 0; j < canvassData[i].candidates.length; j++) {
              let percentage = 0;
              let percentagTemp =
                Math.round(
                  canvassData[i].candidates[j].voteHistory.length * 100
                ) / printableCanvassInformation[i].totalVote;
              if (percentagTemp % 1 === 0) {
                percentage = percentagTemp;
              } else {
                percentage = percentagTemp.toFixed(2);
              }
              let item = [];
              item.push([
                {
                  header: 'Rank',
                  value: j + 1,
                },
                {
                  header: 'Candidate ID',
                  value: canvassData[i].candidates[j]._id,
                },
                {
                  header: 'Name',
                  value: `${canvassData[i].candidates[j].userID.firstName} ${canvassData[i].candidates[j].userID.familyName}`,
                },
                {
                  header: 'Total',
                  value: canvassData[i].candidates[j].voteHistory.length,
                },
                {
                  header: 'Percentage',
                  value: `${percentage}%`,
                },
              ]);
              printableCanvassInformation[i].data.push(item);
            }
            //loop in each candidate then loop in each college vote breakdown and get their voting data breakdown
            for (
              let k = 0;
              k < printableCanvassInformation[i].data.length;
              k++
            ) {
              for (
                let l = 0;
                l < canvassData[i].departmentVoteBreakdown.length;
                l++
              ) {
                let departmentName =
                  canvassData[i].departmentVoteBreakdown[l].departmentName;
                for (
                  let m = 0;
                  m <
                  canvassData[i].departmentVoteBreakdown[l].breakdown.length;
                  m++
                ) {
                  // console.log('some data');
                  // console.log(printableCanvassInformation[i].data[k][0][1]);
                  if (
                    printableCanvassInformation[i].data[k][0][1].value ===
                    canvassData[i].departmentVoteBreakdown[l].breakdown[m]
                      .candidateID
                  ) {
                    // printableCanvassInformation[i].data[k][collegeName] = canvassData[i].collegeVoteBreakdown[l].breakdown[m].voteGarnered;//insert object here
                    for (
                      let n = 0;
                      n < printableCanvassInformation[i].data[k].length;
                      n++
                    ) {
                      // if (departmentName === 'Education') {
                      //   departmentName = 'COEd';
                      // } else if (/\s/.test(departmentName)) {
                      //   let abbreviation = departmentName
                      //     .match(/\b([A-Z])/g)
                      //     .join('');
                      //   departmentName = abbreviation;
                      // } else {
                      //   let abbreviation = departmentName
                      //     .match(/\b([A-Z])/g)
                      //     .join('');
                      //   departmentName = abbreviation;
                      // }
                      printableCanvassInformation[i].data[k][0].push({
                        header: departmentName,
                        value:
                          canvassData[i].departmentVoteBreakdown[l].breakdown[m]
                            .voteGarnered,
                      });
                    }
                  }
                }
              }
            }
          }
          for (let i = 0; i < printableCanvassInformation.length; i++) {
            for (
              let j = 0;
              j < printableCanvassInformation[i].data.length;
              j++
            ) {
              if (printableCanvassInformation[i].data[j][0].length === 6) {
                let temp1 = printableCanvassInformation[i].data[j][0][4];
                let temp2 = printableCanvassInformation[i].data[j][0][3];

                printableCanvassInformation[i].data[j][0][4] =
                  printableCanvassInformation[i].data[j][0][
                    printableCanvassInformation[i].data[j][0].length - 1
                  ];
                printableCanvassInformation[i].data[j][0][
                  printableCanvassInformation[i].data[j][0].length - 1
                ] = temp1;

                printableCanvassInformation[i].data[j][0][3] =
                  printableCanvassInformation[i].data[j][0][4];
                printableCanvassInformation[i].data[j][0][4] = temp2;
              } else {
                let temp1 = printableCanvassInformation[i].data[j][0][3];
                let temp2 = printableCanvassInformation[i].data[j][0][4];
                printableCanvassInformation[i].data[j][0][3] =
                  printableCanvassInformation[i].data[j][0][
                    printableCanvassInformation[i].data[j][0].length - 2
                  ];
                printableCanvassInformation[i].data[j][0][4] =
                  printableCanvassInformation[i].data[j][0][
                    printableCanvassInformation[i].data[j][0].length - 1
                  ];
                printableCanvassInformation[i].data[j][0][
                  printableCanvassInformation[i].data[j][0].length - 2
                ] = temp1;
                printableCanvassInformation[i].data[j][0][
                  printableCanvassInformation[i].data[j][0].length - 1
                ] = temp2;
              }
            }
          }

          for (let i = 0; i < printableCanvassInformation.length; i++) {
            printableCanvassInformation[i].data.sort((a, b) =>
              a[0][a[0].length - 2].value < b[0][b[0].length - 2].value ? 1 : -1
            );
          }
          for (let i = 0; i < printableCanvassInformation.length; i++) {
            let headers = [];
            for (
              let j = 0;
              j < printableCanvassInformation[i].data[0][0].length;
              j++
            ) {
              headers.push(printableCanvassInformation[i].data[0][0][j].header);
            }
            printableCanvassInformation[i].fields = [...headers];
          }
          // console.log(printableCanvassInformation);
          setFilteredCanvassData([...printableCanvassInformation]);
          break;
        }
        default: {
          // sort candidates in every position in descending order
          // for(let i = 0; i < canvassData.length; i++) {

          // }
          // look for tie breakers
          // add winners per position
          // add other candidates
          let temp = [];
          for (let i = 0; i < canvassData.length; i++) {
            // console.log(canvassData[i]);
            canvassData[i].candidates.sort((a, b) =>
              a.voteHistory.length > b.voteHistory.length ? -1 : 1
            );
            let winners = [];
            for (let j = 0; j < canvassData[i].maximumVote; j++) {
              winners.push(canvassData[i].candidates[j]);
            }
            let winnersFinal = winners.filter((candidate) => {
              if (
                typeof canvassData[i].candidates[canvassData[i].maximumVote] !==
                'undefined'
              ) {
                return (
                  candidate.voteHistory.length !==
                  canvassData[i].candidates[canvassData[i].maximumVote]
                    .voteHistory.length
                );
              }
              return candidate;
            });
            // console.log(winnersFinal.length);
            if (winnersFinal.length === canvassData[i].maximumVote) {
              tieBreaker.current[i] = true;
            } else {
              tieBreaker.current[i] = false;
            }
            let data = {
              positionName: canvassData[i].positionToCanvass,
              totalVoteCasted: canvassData[i].totalVote,
              expectedMaximumVoter:
                canvassData[i].candidates[0].positionID.expectedMaximumVoter,
              maximumVote: canvassData[i].maximumVote,
              electionWinner: winnersFinal,
              otherCandidate: [],
            };
            temp.push(data);
          }
          setResult([...temp]);
          // console.log(temp);
          break;
        }
      }

      // console.log(printableCanvassInformation);
      if (election.electionID.electionLevel !== 'Department') {
        let temp = [];
        for (let i = 0; i < printableCanvassInformation.length; i++) {
          let winners = [];
          for (let j = 0; j < printableCanvassInformation[i].maximumVote; j++) {
            winners.push(printableCanvassInformation[i].data[j][0]);
          }
          let winnersFinal = winners.filter((candidate) => {
            if (
              typeof printableCanvassInformation[i].data[
                printableCanvassInformation[i].maximumVote
              ] !== 'undefined'
            ) {
              return (
                candidate[candidate.length - 2].value !==
                printableCanvassInformation[i].data[
                  printableCanvassInformation[i].maximumVote
                ][0][
                  printableCanvassInformation[i].data[
                    printableCanvassInformation[i].maximumVote - 1
                  ][0].length - 2
                ].value
              );
            }
            return candidate;
          });
          if (
            winnersFinal.length === printableCanvassInformation[i].maximumVote
          ) {
            tieBreaker.current[i] = true;
          } else {
            tieBreaker.current[i] = false;
          }
          let data = {
            positionName: printableCanvassInformation[i].positionName,
            totalVoteCasted: printableCanvassInformation[i].totalVote,
            expectedMaximumVoter:
              printableCanvassInformation[i].expectedTotalVoter,
            maximumVote: printableCanvassInformation[i].maximumVote,
            electionWinner: winnersFinal,
            otherCandidate: [],
          };
          temp.push(data);
        }

        // temp = temp.filter((a, b) => a.positionNumber < b.positionNumber);
        // console.log(temp);
        setResult([...temp]);
      }

      // console.log(printableCanvassInformation);
      // console.log(courseList);
      // console.log('Position Details:');
      // console.log(canvassData);
      // console.log('Election Details:');
      // console.log(electionCanvassList[ind]);
      // console.log('Task Details:');
      // console.log(canvassOfficerTaskList[ind]);
      // console.log('registered Vote:');
      // console.log(registeredVotes.data);
      // console.log('Election Candidates:');
      // console.log(electionCandidates.data);
      // generateCanvassResult(canvassData, electionCanvassList[ind]);

      //update task status of the canvassing officer
      // console.log(electionCanvassList[ind]);
      setLoading(false);
      setShowCanvassData(true);
    } catch (error) {
      console.log(error);
    }
  };

  const handlePrint = useReactToPrint({
    content: () => printCanvassDate.current,
    documentTitle: 'canvass-data',
  });

  const getTableBody = (positions, finder) => {
    try {
      // let winner = false;
      // let total = 0;
      // let otherTotal = 0;
      let maxVote = positions.maximumVote;
      let count = 0;
      return Array.from({ length: positions.data.length }).map((_, i) => {
        // let checker = [...result];
        return (
          <tr
            key={i}
            className={checkIfCheck(
              finder,
              positions.data[i][0][2].value,
              'University/College',
              tieBreaker.current[finder],
              positions.data[i][0][positions.data[i][0].length - 2].value,
              positions.data[positions.maximumVote - 1][0][
                positions.data[positions.maximumVote - 1][0].length - 2
              ].value
            )}
          >
            {positions.data[i][0].map((data, index) => {
              if (data.header !== 'Candidate ID') {
                return (
                  <td key={index}>
                    {data.header === 'Rank' ? (
                      <div style={{ position: 'relative' }}>
                        {!tieBreaker.current[finder] &&
                          positions.data[i][0][positions.data[i][0].length - 2]
                            .value ===
                            positions.data[positions.maximumVote - 1][0][
                              positions.data[positions.maximumVote - 1][0]
                                .length - 2
                            ].value && (
                            <FontAwesomeIcon
                              icon={faCheck}
                              style={{
                                position: 'absolute',
                                top: 'auto',
                                left: '0',
                                cursor: 'pointer',
                              }}
                              onClick={() => {
                                let newState = [...result];
                                let match = false;
                                let removeIndex = 0;

                                if (
                                  newState[finder].electionWinner.length === 0
                                ) {
                                  newState[finder].electionWinner.push(
                                    positions.data[i][0]
                                  );
                                } else {
                                  if (
                                    maxVote !==
                                    newState[finder].electionWinner.length
                                  ) {
                                    for (
                                      let j = 0;
                                      j <
                                      newState[finder].electionWinner.length;
                                      j++
                                    ) {
                                      if (
                                        newState[finder].electionWinner[j][2]
                                          .value ===
                                        positions.data[i][0][2].value
                                      ) {
                                        match = true;
                                        removeIndex = j;
                                      }
                                    }
                                    if (!match) {
                                      newState[finder].electionWinner.push(
                                        positions.data[i][0]
                                      );
                                    } else {
                                      newState[finder].electionWinner.splice(
                                        removeIndex,
                                        1
                                      );
                                    }
                                  } else {
                                    for (
                                      let j = 0;
                                      j <
                                      newState[finder].electionWinner.length;
                                      j++
                                    ) {
                                      if (
                                        newState[finder].electionWinner[j][2]
                                          .value ===
                                        positions.data[i][0][2].value
                                      ) {
                                        match = true;
                                        removeIndex = j;
                                      }
                                    }
                                    if (match) {
                                      newState[finder].electionWinner.splice(
                                        removeIndex,
                                        1
                                      );
                                    }
                                  }
                                }

                                let added = 0;
                                let max = 0;
                                for (
                                  let proceedChecker = 0;
                                  proceedChecker < newState.length;
                                  proceedChecker++
                                ) {
                                  added =
                                    added +
                                    newState[proceedChecker].electionWinner
                                      .length;
                                  max =
                                    max + newState[proceedChecker].maximumVote;
                                }
                                if (added === max) {
                                  setProceedCanvass(true);
                                } else {
                                  setProceedCanvass(false);
                                }
                                // console.log(newState);
                                setResult(newState);
                                ++count;
                                if (count === maxVote) {
                                  let updatedData = [...filteredCanvassData];
                                  updatedData[finder].fullfilled = true;
                                  setFilteredCanvassData([...updatedData]);
                                }
                              }}
                            />
                          )}
                        <span
                          style={{
                            position: 'absolute',
                            top: 'auto',
                            left: 'auto',
                          }}
                        >
                          {i + 1}
                        </span>
                      </div>
                    ) : data.value === 'NaN%' ? (
                      '0%'
                    ) : (
                      data.value
                    )}
                  </td>
                );
              }
              return true;
            })}
          </tr>
        );
      });
    } catch (error) {
      console.log(error);
    }
  };

  const checkIfCheck = (posIndex, name, electionLevel, tie, a, b) => {
    try {
      let match = false;
      if (electionLevel !== 'Department') {
        result[posIndex].electionWinner.filter((a) => {
          if (a[2].value === name) {
            match = true;
          }
          return true;
        });
      } else {
        result[posIndex].electionWinner.filter((a) => {
          if (`${a.userID.firstName} ${a.userID.familyName}` === name) {
            match = true;
          }
          return true;
        });
      }

      if (match) {
        return 'bg-success';
      } else {
        if (!tie && a === b) {
          return 'bg-danger';
        }
        return 'bg-light';
      }
    } catch (error) {}
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

  const previewResult = async () => {
    try {
      let finalCanvassInformation = [];
      if (electionLevel === 'Department') {
        if (result.length !== 0) {
          let temp = [...result];
          temp.map((position, index) => {
            let winners = [...position.electionWinner];
            let otherCandidates = [...finalCanvassData[index].candidates];
            position.electionWinner.map((candidate) => {
              // let others = finalCanvassData.filter(a => a.) //mag add sa other candidates
              otherCandidates = otherCandidates.filter(
                (otherCandidate) =>
                  otherCandidate.userID._id !== candidate.userID._id
              );
              return true;
            });

            //label ranking
            let currentRank = 1;
            for (let i = 0; i < winners.length; i++) {
              if (i === 0) {
                winners[i].rank = currentRank;
              } else {
                if (
                  winners[i].voteHistory.length !==
                  winners[i - 1].voteHistory.length
                ) {
                  winners[i].rank = ++currentRank;
                } else {
                  winners[i].rank = currentRank;
                }
              }
            }

            temp[index].electionWinner = [...winners];

            for (let i = 0; i < otherCandidates.length; i++) {
              if (i === 0) {
                if (
                  winners[winners.length - 1].voteHistory.length ===
                  otherCandidates[i].voteHistory.length
                ) {
                  otherCandidates[i].rank = currentRank;
                } else {
                  otherCandidates[i].rank = ++currentRank;
                }
              } else {
                if (
                  otherCandidates[i].voteHistory.length ===
                  otherCandidates[i - 1].voteHistory.length
                ) {
                  otherCandidates[i].rank = currentRank;
                } else {
                  otherCandidates[i].rank = ++currentRank;
                }
              }
            }

            temp[index].otherCandidate = [...otherCandidates];
            return true;
          });
          finalCanvassInformation = [...temp];
          setResult([...temp]);
        }
      } else {
        if (result.length !== 0) {
          let temp = [...result];
          temp.map((position, index) => {
            let winners = [...position.electionWinner];
            let otherCandidates = [...filteredCanvassData[index].data];
            let otherCandidateFilter = [];
            position.electionWinner.map((candidate) => {
              otherCandidates = otherCandidates.filter(
                (otherCandidate) =>
                  otherCandidate[0][1].value !== candidate[1].value
              );

              return true;
            });
            for (let i = 0; i < otherCandidates.length; i++) {
              otherCandidateFilter.push(otherCandidates[i][0]);
            }

            //label rank
            let currentRank = 1;
            for (let i = 0; i < winners.length; i++) {
              if (i === 0) {
                winners[i][0].value = currentRank;
              } else {
                if (
                  winners[i][winners[i].length - 2].value ===
                  winners[i - 1][winners[i].length - 2].value
                ) {
                  winners[i][0].value = currentRank;
                } else {
                  winners[i][0].value = ++currentRank;
                }
              }
            }

            for (let i = 0; i < otherCandidateFilter.length; i++) {
              if (i === 0) {
                if (
                  otherCandidateFilter[i][otherCandidateFilter[i].length - 2]
                    .value ===
                  winners[winners.length - 1][
                    winners[winners.length - 1].length - 2
                  ].value
                ) {
                  otherCandidateFilter[i][0].value = currentRank;
                } else {
                  otherCandidateFilter[i][0].value = ++currentRank;
                }
              } else {
                if (
                  otherCandidateFilter[i][otherCandidateFilter[i].length - 2]
                    .value ===
                  otherCandidateFilter[i - 1][
                    otherCandidateFilter[i].length - 2
                  ].value
                ) {
                  otherCandidateFilter[i][0].value = currentRank;
                } else {
                  otherCandidateFilter[i][0].value = ++currentRank;
                }
              }
            }

            temp[index].electionWinner = [...winners];
            temp[index].otherCandidate = [...otherCandidateFilter];
            return true;
          });
          for (let i = 0; i < filteredCanvassData.length; i++) {
            temp[i].fields = [...filteredCanvassData[i].fields];
          }
          // console.log(temp);
          // temp.fields = [...filteredCanvassData.fields];
          // console.log(temp.fields);
          finalCanvassInformation = [...temp];
          setResult([...temp]);
        }
      }
      // console.log(finalCanvassInformation);
      const token = sessionStorage.getItem('token');
      let source = axios.CancelToken.source();
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-type': 'application/json',
        },
        CancelToken: source.token,
      };

      const userID = sessionStorage.getItem('userID');
      const taskStatus = 'Finished';
      const updateCanvassOfficerTaskStatusURL = `http://localhost:5000/api/canvassingOfficer/update-task-status/${userID}/${
        electionCanvassList[selectedElection.current]._id
      }`;
      //const updateCanvassOfficerTaskStatus =
      await axios.patch(
        updateCanvassOfficerTaskStatusURL,
        { taskStatus },
        config
      );

      const getCanvasserInfoURL = `http://localhost:5000/api/canvassingOfficer/info/${userID}/${
        electionCanvassList[selectedElection.current]._id
      }`;
      let electionCanvassID = null;
      const canvasserFullName = await axios.get(getCanvasserInfoURL, config);
      if (canvasserFullName) {
        electionCanvassID = canvasserFullName.data.electionCanvassID;
        setCanvasserName(
          `${canvasserFullName.data.userID.firstName} ${canvasserFullName.data.userID.familyName}`
        );
      }

      const postCanvassResultURL = `http://localhost:5000/api/election-canvass/post-canvass-result`;
      const resultInformation = JSON.stringify(finalCanvassInformation);
      // const canvassDate = new Date();

      //post canvass result
      await axios
        .post(
          postCanvassResultURL,
          {
            electionCanvassID,
            resultInformation,
          },
          config
        )
        .then(async () => {
          //last task here
          const updateElectionStatusURL = `http://localhost:5000/api/election/update-election/${
            electionCanvassList[selectedElectionCanvassTask.current].electionID
              ._id
          }`;
          const updateCanvassStatusURL = `http://localhost:5000/api/electionCanvass/update-canvass-status/${electionCanvassID}`;
          const electionStatus = 'Finished';
          // console.log(electionCanvassList);
          await axios
            .patch(updateElectionStatusURL, { electionStatus }, config)
            .then(() => {
              console.log('election updated');
            });
          await axios
            .patch(updateCanvassStatusURL, { message: 'nothing' }, config)
            .then((docs) => {});
        });

      // const checkAndUpdateCanvassStatus = async (id) => {
      //   try {
      //     const getCanvassStatusURL = `http://localhost:5000/api/canvassingOfficer/canvass-status/${id}`;
      //     const canvassStatus = await axios.get(getCanvassStatusURL, config);
      //     if (canvassStatus) {
      //       let status = true;
      //       for (let i = 0; i < canvassStatus.data.length; i++) {
      //         if (canvassStatus.data[i].taskStatus === 'Pending') {
      //           status = false;
      //         }
      //       }
      //       if (status) {
      //         const updateCanvassStatusURL = `http://localhost:5000/api/electionCanvass/update-canvass-status/${id}`;
      //         await axios
      //           .patch(updateCanvassStatusURL, { message: 'nothing' }, config)
      //           .then((docs) => {});
      //       }
      //     } else {
      //       console.log('no match');
      //     }
      //   } catch (error) {
      //     console.log(error);
      //   }
      // };
      setViewCanvassFinal(true);

      // add all candidate not declared as winner into the other candidates field
      // convert the array into a string format using JSON.stringify() method
      // upload in db
    } catch (error) {
      console.log(error);
    }
  };

  const checkOfficerCanvassStatus = (electionIndex) => {
    try {
      let temp = [...canvassOfficerTaskList];
      if (temp[electionIndex].taskStatus === 'Finished') {
        return true;
      }
      return false;
    } catch (error) {}
  };

  return (
    <>
      {loading && <Loading />}
      {!loading && (
        <div className='page-container'>
          <Container>
            <Row>
              {electionCanvassList.map((canvass, index) => (
                <Col xs={12} sm={12} md={4} lg={4} key={index} className='mt-3'>
                  {/* {console.log(canvass.canvassStatus)} */}
                  <Card className='my-1 h-100'>
                    <Card.Header className='canvassHeader h-100'>
                      <Card.Title className='canvassTitle text-center'>
                        <h5>{canvass.electionID.electionName}</h5>
                      </Card.Title>
                    </Card.Header>
                    <Card.Body>
                      <h5>Positions to canvass:</h5>
                      <ListGroup variant='flush'>
                        {createCardBody(index)}
                      </ListGroup>
                    </Card.Body>

                    <Card.Footer className='text-center'>
                      <Button
                        variant='info'
                        size='lg'
                        disabled={checkOfficerCanvassStatus(index)}
                        onClick={() => {
                          setLoading(true);
                          setPdfTitle(
                            `${electionCanvassList[index].electionID.electionName}`
                          );
                          setElectionLevel(
                            electionCanvassList[index].electionID.electionLevel
                          );
                          let newState = [...result];
                          let added = 0;
                          let max = 0;
                          for (
                            let proceedChecker = 0;
                            proceedChecker < newState.length;
                            proceedChecker++
                          ) {
                            added =
                              added +
                              newState[proceedChecker].electionWinner.length;
                            max = max + newState[proceedChecker].maximumVote;
                          }
                          if (added === max) {
                            setProceedCanvass(true);
                          } else {
                            setProceedCanvass(false);
                          }
                          selectedElectionCanvassTask.current = index;
                          canvassElection(canvass, index);
                          selectedElection.current = index;
                          selectedElectionID.current = canvass.electionID._id;
                        }}
                      >
                        view
                      </Button>
                      {/* i prep ang body sa election canvass result */}
                    </Card.Footer>
                  </Card>
                </Col>
              ))}
            </Row>

            <Modal
              show={showCanvassData}
              fullscreen={true}
              // keyboard={false}
              // backdrop='static'
              // centered
              // size='lg'
              onHide={() => {
                setDisplayCanvassNote(true);
                if (viewCanvassFinal && !printed.current) {
                  setShowWarning(true);
                } else if (!viewCanvassFinal && !printed.current) {
                  setShowCanvassData(false);
                } else {
                  window.location.reload(true);
                }
              }}
            >
              <Modal.Header closeButton>
                <Modal.Title className='ms-auto'>Canvass Election</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                {!viewCanvassFinal && displayCanvassNote && (
                  <Container className='noteDialog text-secondary position-relative'>
                    <FontAwesomeIcon
                      icon={faXmark}
                      className='text-danger fa-2x'
                      style={{
                        cursor: 'pointer',
                        position: 'absolute',
                        top: '0px',
                        right: '3px',
                      }}
                      onClick={() => {
                        setDisplayCanvassNote(false);
                      }}
                    />
                    <span>
                      {`Note: If two or more candidates in the same position have garnered the same amount of vote, the election committee or the candidates will decide for a tie-breaker. After deciding the tie-breaker winner then the election canvasser can declare the official winners of the said election. In order to declare a candidate as winner, click the check icon beside candidate rank. After resolving all tie-breaker, click the 'CANVASS' button to view final canvass result.`}
                    </span>
                  </Container>
                )}
                {!viewCanvassFinal && (
                  <Container>
                    <br />

                    <span>
                      <center>
                        <big>
                          <b>{pdfTitle}</b>
                        </big>
                      </center>
                    </span>
                    {electionLevel === 'University' &&
                      filteredCanvassData.map((position, i) => (
                        <Container key={position.positionName}>
                          {/* {console.log(filteredCanvassData)} */}
                          <br />
                          <center>
                            {result.length > 1 && (
                              <h5>
                                {position.positionName}
                                {result[i].electionWinner.length === 0
                                  ? position.maximumVote === 1
                                    ? ` ( Select 1)`
                                    : ` ( Select ${position.maximumVote} )`
                                  : position.maximumVote === 1
                                  ? ``
                                  : `${
                                      position.maximumVote -
                                        result[i].electionWinner.length ===
                                      0
                                        ? ``
                                        : ` ( Select ${
                                            position.maximumVote -
                                            result[i].electionWinner.length
                                          } more )`
                                    }`}
                              </h5>
                            )}
                          </center>
                          <Table bordered hover>
                            <thead className='text-center'>
                              <tr>
                                {position.fields.map((name, index) => {
                                  if (name !== 'Candidate ID') {
                                    if (name === 'Rank') {
                                      return <td key={index}>No.</td>;
                                    }
                                    return <td key={index}>{name}</td>;
                                  }
                                  return true;
                                })}
                              </tr>
                            </thead>
                            <tbody className='text-center'>
                              {getTableBody(position, i)}
                            </tbody>
                          </Table>
                        </Container>
                      ))}
                    {electionLevel === 'College' &&
                      filteredCanvassData.map((position, i) => (
                        <Container key={position.positionName}>
                          <br />
                          <center>
                            {result.length > 1 && (
                              <h5>
                                {position.positionName}
                                {result[i].electionWinner.length === 0
                                  ? position.maximumVote === 1
                                    ? ` ( Select 1 )`
                                    : ` ( Select ${position.maximumVote} )`
                                  : position.maximumVote === 1
                                  ? ``
                                  : `${
                                      position.maximumVote -
                                        result[i].electionWinner.length ===
                                      0
                                        ? ``
                                        : ` ( Select ${
                                            position.maximumVote -
                                            result[i].electionWinner.length
                                          } more )`
                                    }`}
                              </h5>
                            )}
                          </center>
                          <Table bordered hover>
                            <thead className='text-center'>
                              <tr>
                                {position.fields.map((name, index) => {
                                  if (name !== 'Candidate ID') {
                                    if (name === 'Rank') {
                                      return <td key={index}>No.</td>;
                                    }
                                    return <td key={index}>{name}</td>;
                                  }
                                  return true;
                                })}
                              </tr>
                            </thead>
                            <tbody className='text-center'>
                              {getTableBody(position, i)}
                            </tbody>
                          </Table>
                        </Container>
                      ))}
                    {electionLevel === 'Department' &&
                      finalCanvassData.map((position, index) => (
                        <Container key={index}>
                          <br />
                          <center>
                            {result.length > 1 && (
                              <h5>
                                {position.positionToCanvass}
                                {result[index].electionWinner.length === 0
                                  ? position.maximumVote === 1
                                    ? ` ( Select 1 )`
                                    : ` ( Select ${position.maximumVote} )`
                                  : position.maximumVote === 1
                                  ? ``
                                  : `${
                                      position.maximumVote -
                                        result[index].electionWinner.length ===
                                      0
                                        ? ``
                                        : ` ( Select ${
                                            position.maximumVote -
                                            result[index].electionWinner.length
                                          } more )`
                                    }`}
                              </h5>
                            )}
                          </center>
                          <Table bordered hover>
                            <thead className='text-center'>
                              <tr>
                                <td>No.</td>
                                <td>Name</td>
                                <td>Total</td>
                                <td>Percentage</td>
                              </tr>
                            </thead>
                            <tbody className='text-center'>
                              {position.candidates.map((candidate, ind) => {
                                let display = false;
                                if (result.length !== 0) {
                                  if (
                                    position.maximumVote ===
                                    result[index].electionWinner.length
                                  ) {
                                    if (
                                      candidate.voteHistory.length ===
                                      result[index].electionWinner[
                                        position.maximumVote - 1
                                      ].voteHistory.length
                                    ) {
                                      display = true;
                                    }
                                  } else {
                                    if (
                                      candidate.voteHistory.length ===
                                      position.candidates[
                                        position.maximumVote - 1
                                      ].voteHistory.length
                                    ) {
                                      display = true;
                                    }
                                  }
                                }

                                return (
                                  <tr
                                    key={ind}
                                    className={checkIfCheck(
                                      index,
                                      `${candidate.userID.firstName} ${candidate.userID.familyName}`,
                                      'Department',
                                      tieBreaker.current[index],
                                      candidate.voteHistory.length,
                                      position.candidates[
                                        position.maximumVote - 1
                                      ].voteHistory.length
                                    )}
                                  >
                                    {!tieBreaker.current[index] &&
                                      candidate.voteHistory.length ===
                                        position.candidates[
                                          position.maximumVote - 1
                                        ].voteHistory.length && (
                                        <td>
                                          <div style={{ position: 'relative' }}>
                                            {display && (
                                              <FontAwesomeIcon
                                                icon={faCheck}
                                                style={{
                                                  position: 'absolute',
                                                  top: 'auto',
                                                  left: '0',
                                                  cursor: 'pointer',
                                                }}
                                                onClick={() => {
                                                  let temp = [...result];
                                                  let tempFinal = [
                                                    ...temp[index]
                                                      .electionWinner,
                                                  ];
                                                  if (
                                                    temp[index].electionWinner
                                                      .length !==
                                                    position.maximumVote
                                                  ) {
                                                    let match = false;
                                                    temp[
                                                      index
                                                    ].electionWinner.map(
                                                      (checker) => {
                                                        if (
                                                          checker.userID._id ===
                                                          candidate.userID._id
                                                        ) {
                                                          match = true;
                                                        }
                                                        return true;
                                                      }
                                                    );
                                                    if (match) {
                                                      tempFinal = temp[
                                                        index
                                                      ].electionWinner.filter(
                                                        (checker) =>
                                                          checker.userID._id !==
                                                          candidate.userID._id
                                                      );
                                                    } else {
                                                      tempFinal.push(candidate);
                                                    }
                                                  } else {
                                                    let match = false;
                                                    let candidateIndexFinder = 0;
                                                    tempFinal.map(
                                                      (
                                                        checker,
                                                        candidateIndex
                                                      ) => {
                                                        if (
                                                          checker.userID._id ===
                                                          candidate.userID._id
                                                        ) {
                                                          match = true;
                                                          candidateIndexFinder =
                                                            candidateIndex;
                                                        }
                                                        return true;
                                                      }
                                                    );
                                                    if (match) {
                                                      tempFinal.splice(
                                                        candidateIndexFinder,
                                                        1
                                                      );
                                                    }
                                                  }
                                                  temp[index].electionWinner = [
                                                    ...tempFinal,
                                                  ];
                                                  let added = 0;
                                                  let max = 0;
                                                  for (
                                                    let proceedChecker = 0;
                                                    proceedChecker <
                                                    temp.length;
                                                    proceedChecker++
                                                  ) {
                                                    added =
                                                      added +
                                                      temp[proceedChecker]
                                                        .electionWinner.length;
                                                    max =
                                                      max +
                                                      temp[proceedChecker]
                                                        .maximumVote;
                                                  }
                                                  if (added === max) {
                                                    setProceedCanvass(true);
                                                  } else {
                                                    setProceedCanvass(false);
                                                  }
                                                  setResult([...temp]);
                                                }}
                                              />
                                            )}
                                            <span
                                              style={{
                                                position: 'absolute',
                                                top: 'auto',
                                                left: '50%',
                                              }}
                                            >
                                              {ind + 1}
                                            </span>
                                          </div>
                                        </td>
                                      )}

                                    {!tieBreaker.current[index] &&
                                      candidate.voteHistory.length !==
                                        position.candidates[
                                          position.maximumVote - 1
                                        ].voteHistory.length && (
                                        <td>
                                          <div style={{ position: 'relative' }}>
                                            <span
                                              style={{
                                                position: 'absolute',
                                                top: 'auto',
                                                left: '50%',
                                              }}
                                            >
                                              {ind + 1}
                                            </span>
                                          </div>
                                        </td>
                                      )}
                                    {tieBreaker.current[index] && (
                                      <td>
                                        <div style={{ position: 'relative' }}>
                                          <span
                                            style={{
                                              position: 'absolute',
                                              top: 'auto',
                                              left: '50%',
                                            }}
                                          >
                                            {ind + 1}
                                          </span>
                                        </div>
                                      </td>
                                    )}
                                    <td>{`${candidate.userID.firstName} ${candidate.userID.familyName}`}</td>
                                    <td>{candidate.voteHistory.length}</td>
                                    <td>
                                      {getPercentage(
                                        candidate.voteHistory.length,
                                        position.totalVote
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </Table>
                        </Container>
                      ))}
                  </Container>
                )}
                {viewCanvassFinal && (
                  <Container className='text-center'>
                    {electionLevel !== 'Department' && (
                      <Container className='text-center' ref={printCanvassDate}>
                        <span>
                          <h2>{`${pdfTitle} Official Canvass Result`}</h2>
                        </span>
                        <br />
                        {filteredCanvassData.map((position, positionIndex) => (
                          <div key={positionIndex}>
                            <span>
                              <big>{position.positionName}</big>
                            </span>
                            <Table bordered hover>
                              <thead>
                                <tr>
                                  {position.fields.map((name) => {
                                    if (name === 'Candidate ID') {
                                      return true;
                                    } else {
                                      return <td key={name}>{name}</td>;
                                    }
                                  })}
                                </tr>
                              </thead>
                              <tbody>
                                {result[positionIndex].electionWinner.map(
                                  (candidate, candidateIndex) => {
                                    return (
                                      <tr
                                        key={`${candidateIndex}`}
                                        className='bg-success'
                                      >
                                        {candidate.map((fieldValue) => {
                                          if (
                                            fieldValue.header !== 'Candidate ID'
                                          ) {
                                            return (
                                              <td key={`${fieldValue.header}`}>
                                                {fieldValue.value}
                                              </td>
                                            );
                                          } else {
                                            return true;
                                          }
                                        })}
                                      </tr>
                                    );
                                  }
                                )}
                                {result[positionIndex].otherCandidate.map(
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
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                          }}
                        >
                          <span>
                            <small>Canvass By: {canvasserName}</small>
                          </span>
                          <span>
                            <small>Date and Time: {today}</small>
                          </span>
                        </div>
                      </Container>
                    )}
                    {electionLevel === 'Department' && (
                      <Container className='text-center' ref={printCanvassDate}>
                        <span>
                          <h2>{`${pdfTitle} Result`}</h2>
                        </span>
                        <br />
                        {finalCanvassData.map((position, positionIndex) => {
                          return (
                            <div key={positionIndex}>
                              <span>
                                <big>{position.positionToCanvass}</big>
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
                                  {result[positionIndex].electionWinner.map(
                                    (candidate, candidateIndex) => {
                                      return (
                                        <tr
                                          key={candidateIndex}
                                          className='bg-success'
                                        >
                                          <td>{candidate.rank}</td>
                                          <td>{`${candidate.userID.firstName} ${candidate.userID.familyName}`}</td>
                                          <td>
                                            {candidate.voteHistory.length}
                                          </td>
                                          <td>
                                            {getPercentage(
                                              candidate.voteHistory.length,
                                              position.totalVote
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    }
                                  )}
                                  {result[positionIndex].otherCandidate.map(
                                    (candidate, candidateIndex) => {
                                      return (
                                        <tr key={candidateIndex}>
                                          <td>{candidate.rank}</td>
                                          <td>{`${candidate.userID.firstName} ${candidate.userID.familyName}`}</td>
                                          <td>
                                            {candidate.voteHistory.length}
                                          </td>
                                          <td>
                                            {getPercentage(
                                              candidate.voteHistory.length,
                                              position.totalVote
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
                          );
                        })}
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                          }}
                        >
                          <span>
                            <small>Canvass By: {canvasserName}</small>
                          </span>
                          <span>
                            <small>Date and Time: {today}</small>
                          </span>
                        </div>
                      </Container>
                    )}
                  </Container>
                )}
              </Modal.Body>
              <Modal.Footer
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {!viewCanvassFinal && (
                  <Button
                    variant='outline-info'
                    onClick={() => {
                      setShowConfirmation(true);
                    }}
                    disabled={!proceedCanvass}
                  >
                    CANVASS
                  </Button>
                )}
                {viewCanvassFinal && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faDownload}
                      className='text-info fa-2x'
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        printed.current = true;
                        handlePrint();
                      }}
                    />
                    <span>
                      <small>
                        <b>DOWNLOAD</b>
                      </small>
                    </span>
                  </div>
                )}
              </Modal.Footer>
            </Modal>
            <Modal
              show={showWarning}
              backdrop='static'
              keyboard={false}
              size='lg'
              centered
            >
              <Modal.Body className='text-center'>
                <span>Exit without downloading canvass result?</span>
              </Modal.Body>
              <Modal.Footer
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Button
                  variant='outline-info'
                  onClick={() => {
                    window.location.reload(true);
                  }}
                >
                  Yes
                </Button>
                <Button
                  variant='outline-info'
                  onClick={() => {
                    setShowWarning(false);
                    setShowCanvassData(true);
                  }}
                >
                  No
                </Button>
              </Modal.Footer>
            </Modal>
            <Modal
              show={showConfirmation}
              backdrop='static'
              keyboard={false}
              size='lg'
              centered
            >
              <Modal.Body>
                <span>
                  {' '}
                  <big>
                    Note: Before clicking the confirmation button, make sure
                    that all candidates with tie-breaker has been resolved and
                    there are no mistake in declaring the tie-breaker. If you
                    are unsure, click cancel to edit.
                  </big>
                </span>
              </Modal.Body>
              <Modal.Footer
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    flexBasis: '100%',
                  }}
                >
                  <span>
                    <small className='text-secondary'>
                      Reminder: Clicking confirm will finalized the canvass
                      information and cannot be undone.
                    </small>
                  </span>
                </div>
                <Button
                  variant='outline-info'
                  onClick={() => {
                    previewResult();
                    setShowConfirmation(false);
                  }}
                >
                  CONFIRM
                </Button>
                <Button
                  variant='outline-info'
                  onClick={() => {
                    setShowConfirmation(false);
                  }}
                >
                  CANCEL
                </Button>
              </Modal.Footer>
            </Modal>
          </Container>
        </div>
      )}
    </>
  );
};

export default Canvass;
