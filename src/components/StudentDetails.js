import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Card,
  Table,
  ListGroup,
  Container,
  Row,
  Col,
  Tabs,
  Tab,
  Button,
} from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserGraduate,
  faBookOpen,
  faClock,
  faPercentage,
  faSchool,
  faVenusMars,
  faPhone,
  faEnvelope,
  faGraduationCap,
  faMapMarkerAlt,
  faPaperPlane,
} from "@fortawesome/free-solid-svg-icons";

const StudentDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const student = location.state?.student;
  const [key, setKey] = useState("details"); // State to manage active tab key

  if (!student) {
    return (
      <Container className="mt-5">
        <h4>No student details available.</h4>
      </Container>
    );
  }

  // Helper function to display a value or a placeholder if it's null
  const displayValue = (value) => value || "Not provided";

  //To view student results
  function viewResults(resultDetails) {
    navigate("/quiz-results", { state: { results: resultDetails } });
  }

  return (
    <Container className="mt-5">
      <Row>
        <Col md={12}>
          <Tabs
            id="student-details-tabs"
            activeKey={key}
            onSelect={(k) => setKey(k)}
            className="mb-3"
          >
            <Tab eventKey="details" title="Student Details">
              <Card className="mb-4" bg="light">
                <Card.Body>
                  <Card.Title>
                    <FontAwesomeIcon icon={faUserGraduate} className="me-2" />
                    {student.studName}'s Details
                  </Card.Title>
                  <ListGroup variant="flush">
                    <ListGroup.Item>
                      <FontAwesomeIcon icon={faUserGraduate} className="me-2" />
                      <strong>Name:</strong> {displayValue(student.studName)}
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <FontAwesomeIcon icon={faVenusMars} className="me-2" />
                      <strong>Gender:</strong> {displayValue(student.gender)}
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <FontAwesomeIcon icon={faPhone} className="me-2" />
                      <strong>Phone:</strong> {displayValue(student.phone)}
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                      <strong>Email:</strong> {displayValue(student.email)}
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <FontAwesomeIcon
                        icon={faGraduationCap}
                        className="me-2"
                      />
                      <strong>Education Level:</strong>{" "}
                      {displayValue(student.educationLevel)}
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <FontAwesomeIcon icon={faSchool} className="me-2" />
                      <strong>School Name:</strong>{" "}
                      {displayValue(student.schoolName)}
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2" />
                      <strong>School Address:</strong>{" "}
                      {displayValue(student.schoolAddress)}
                    </ListGroup.Item>
                  </ListGroup>
                </Card.Body>
              </Card>
            </Tab>

            <Tab eventKey="results" title="Exam Results">
              <h3>
                <FontAwesomeIcon icon={faBookOpen} className="me-2" />
                Exam Results
              </h3>
              <Table striped bordered hover responsive>
                <thead className="table-secondary">
                  <tr>
                    <th>
                      <FontAwesomeIcon icon={faBookOpen} className="me-2" />
                      Subject
                    </th>
                    <th>
                      <FontAwesomeIcon icon={faPercentage} className="me-2" />
                      Score
                    </th>
                    <th>
                      <FontAwesomeIcon icon={faClock} className="me-2" />
                      Date & Time
                    </th>
                    <th>
                      <FontAwesomeIcon icon={faPaperPlane} className="me-2" />
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {student.Results.map((result, index) => (
                    <tr key={index}>
                      <td>{result.subject}</td>
                      <td>{result.score}%</td>
                      <td>{result.dateTime}</td>
                      <td>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => viewResults(result.resultDetails)}
                        >
                          Exam Results
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Tab>
          </Tabs>
        </Col>
      </Row>
    </Container>
  );
};

export default StudentDetails;
