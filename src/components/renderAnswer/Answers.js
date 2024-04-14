//  AnswerContainer.js
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, ButtonGroup, } from 'react-bootstrap';
import AnswerContainer from './AnswerContainer';

const Answers = () => {

    const location = useLocation();
    const navigate = useNavigate();
    const { questionsData, subjectName, totalMarks, attemptDate } = location.state || { questionsData: [], subjectName: '', totalMarks: 0, attemptDate: '' };

    return (
        <Container fluid style={{ marginTop: "100px" }}>
            <AnswerContainer questionsData={questionsData} subjectName={subjectName} totalMarks={totalMarks} attemptDate={attemptDate} />
            <Row >
                <Col xs={12} className="" style={{ marginBottom: '1.8rem' }}>
                    <div className="d-flex justify-content-center">
                        <ButtonGroup className="w-75">
                            <Button
                                variant="success"
                                onClick={() => { navigate('/exam-page') }}
                            >
                                Attempt another Exam
                            </Button>
                            <Button
                                variant="info"
                                onClick={() => { navigate('/') }}
                            >
                                Back to Dashboard
                            </Button>
                        </ButtonGroup>
                    </div>
                </Col>
            </Row>
        </Container>
    );
};

export default Answers;
