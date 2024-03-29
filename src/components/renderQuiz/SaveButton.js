// SaveButton.js
import React, { useState, forwardRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { resetAnswers } from './redux/actions';
import { Button, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useNavigate } from "react-router-dom";
import { faSave } from '@fortawesome/free-solid-svg-icons';
import {
    databases,
    database_id,
    studentMarksTable_id,
} from "../../appwriteConfig.js";
import {
    fetchAndUpdateResults, formatDate
} from "../../utilities/resultsUtil";
import { sendEmailToNextOfKin } from "../../utilities/otherUtils.js";
import { useAuth } from '../../context/AuthContext';

const SaveButton = forwardRef(({ selectedQuestions, onSubmit, disabled, buttonDisplay, subject_Name }, ref) => {

    // console.log('selectedQuestions on submit', selectedQuestions)

    const dispatch = useDispatch();

    const { userInfo, updateUserPoints, fetchUserPoints, } = useAuth();
    let studentID = userInfo.userId;

    let subjectName;
    if (userInfo.educationLevel === 'PLE') {
        subjectName = subject_Name === 'sst_ple' ? 'Social Studies' : (subject_Name === 'math_ple' ? 'Mathematics' : (subject_Name === 'sci_ple' ? 'Science' : 'English Language'));
    }
    else {
        subjectName = subject_Name
    }

    const navigate = useNavigate();

    const reduxState = useSelector(state => state.answers);

    // console.log('Redux state on submit', reduxState)

    const [isLoading, setIsLoading] = useState(false);

    //Function to submit data the database
    const createDocument = async (data) => {
        try {
            setIsLoading(true); // Start loading
            const result = await databases.createDocument(
                database_id,
                studentMarksTable_id,
                "unique()",
                data
            );
        } catch (error) {
            console.error("Error creating document:", error);
        } finally {
            setIsLoading(false); // Stop loading regardless of success or error
        }
    };

    //Calculating marks
    const calculateMarks = (question, userAnswer) => {
        const { type, answer, mark, sub_questions } = question;
        const correctAnswer = Array.isArray(answer) ? answer : [answer];
        let score = 0;

        switch (type) {
            case 'multipleChoice':
            case 'text':
                if (userAnswer && correctAnswer.map(a => a.trim().toLowerCase()).includes(userAnswer.trim().toLowerCase())) {
                    score = mark || 1; // Use mark if provided, otherwise default to 1
                }
                break;
            case 'check_box':
                const maxScore = mark || correctAnswer.length;
                if (userAnswer && userAnswer.length <= maxScore) {
                    userAnswer.forEach(userOption => {
                        if (correctAnswer.map(a => a.trim().toLowerCase()).includes(userOption.trim().toLowerCase())) {
                            score += 1;
                        }
                    });
                }
                break;
            default:
                break;
        }

        // Calculate marks for subquestions
        if (sub_questions) {
            sub_questions.forEach(subQ => {
                score += calculateMarks(subQ, subQ.user_answer);
            });
        }

        return score;
    };

    const findUserAnswer = (questionId, categoryId, questionType) => {
        const reduxAnswers = reduxState.filter(answer => answer.id === questionId && answer.category === categoryId);
        if (reduxAnswers.length === 0) return null;

        // Handle different types of questions
        switch (questionType) {
            case 'multipleChoice':
            case 'text':
                // For multiple choice and text questions, return the last user answer
                return reduxAnswers[reduxAnswers.length - 1].user_answer;
            case 'check_box':
                // For checkbox questions, return the options that are checked
                const userAnswer = reduxAnswers[reduxAnswers.length - 1].user_answer;
                const checkedOptions = Object.keys(userAnswer).filter(option => userAnswer[option]);
                return checkedOptions;
            default:
                return null;
        }
    };

    const appendUserAnswersToSubQuestions = (subQuestions, categoryId) => {
        return subQuestions.map(subQ => ({
            ...subQ,
            user_answer: findUserAnswer(subQ.id, categoryId, subQ.type),
        }));
    };

    const formatAnswersForEitherOrQuestion = (questionPart, categoryId) => {
        return {
            ...questionPart,
            user_answer: findUserAnswer(questionPart.id, categoryId, questionPart.type),
            sub_questions: questionPart.sub_questions
                ? appendUserAnswersToSubQuestions(questionPart.sub_questions, categoryId)
                : []
        };
    };

    const formatAnswersForSaving = () => {
        let totalMarks = 0;
        const formattedAnswers = selectedQuestions.map(category => ({
            ...category,
            questions: category.questions.flatMap(question => {
                if (question.either && question.or) {
                    // Process each part of the either/or question
                    const updatedEither = formatAnswersForEitherOrQuestion(question.either, category.category);
                    const updatedOr = formatAnswersForEitherOrQuestion(question.or, category.category);

                    // Include the part with a user answer, or both if both are answered
                    const partsToInclude = [];
                    if (updatedEither.user_answer !== null) {
                        partsToInclude.push(updatedEither);
                        totalMarks += calculateMarks(updatedEither, updatedEither.user_answer);
                    }
                    if (updatedOr.user_answer !== null) {
                        partsToInclude.push(updatedOr);
                        totalMarks += calculateMarks(updatedOr, updatedOr.user_answer);
                    }
                    return partsToInclude;
                } else {
                    // Handle normal questions
                    const updatedQuestion = {
                        ...question,
                        user_answer: findUserAnswer(question.id, category.category, question.type),
                        sub_questions: question.sub_questions
                            ? appendUserAnswersToSubQuestions(question.sub_questions, category.category)
                            : [],
                    };
                    totalMarks += calculateMarks(updatedQuestion, updatedQuestion.user_answer);
                    return [updatedQuestion];
                }
            }).flat(),
        }));

        // console.log('Total Marks:', totalMarks);
        // console.log('Formatted Answers:', formattedAnswers);
        return { formattedAnswers, totalMarks };
    };

    const handleSave = async () => {
        let { formattedAnswers, totalMarks } = formatAnswersForSaving();

        onSubmit();

        // Create a document in Appwrite Collection
        const resultsString = JSON.stringify(formattedAnswers);

        const userResultsData = {
            studID: studentID,
            marks: totalMarks,
            subject: subjectName,
            results: resultsString,
        }

        await createDocument(userResultsData);

        if (userInfo.kinEmail) {
            await sendEmailToNextOfKin(userInfo, subjectName, totalMarks, formatDate((new Date())));
        }

        // Update user Points
        await updateUserPoints(20, userInfo.userId);

        // Update the local storage with user information
        await fetchAndUpdateResults(userInfo.userId);

        //Rendering user attempts to them
        const questionsData = formattedAnswers;

        // Dispatch the action to reset the answers
        dispatch(resetAnswers());

        let attemptDate = formatDate((new Date()));

        if (totalMarks === 0) { totalMarks = '0' }
        navigate('/answers', { state: { questionsData, subjectName, totalMarks, attemptDate } });
    };

    return (
        <>
            {
                !disabled ?
                    < Button ref={ref} onClick={handleSave} disabled={disabled} variant="primary" style={{ display: buttonDisplay ? buttonDisplay : 'false' }
                    }>
                        <FontAwesomeIcon icon={faSave} /> Submit Exam
                    </Button >
                    :
                    <>
                        <Spinner animation="grow" variant="primary" />
                        <Spinner animation="grow" variant="secondary" />
                        <Spinner animation="grow" variant="success" />
                    </>
            }
        </>

    );
});

export default SaveButton;
