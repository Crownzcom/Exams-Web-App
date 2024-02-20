import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import QuizContainer from './sst_ple/QuizContainer';
import AnswerContainer from './renderAnswer/AnswerContainer';
// import SaveButton from './renderQuiz/SaveButton';
import { sst_ple, math_ple, sci_ple, sst_ple_ans, math_ple_ans } from '../otherFiles/questionsData';

function App() {
  return (
    <div className="App">
      {/* Social studies questions */}
      <QuizContainer questionsData={sst_ple} subjectName={'sst_ple'} />

      {/* Maths-ple questions */}
      {/* <QuizContainer questionsData={math_ple} subjectName={'math_ple'} /> */}

      {/* Sci-ple questions */}
      {/* <QuizContainer questionsData={sci_ple} subjectName={'sci_ple'} /> */}

      {/* <SaveButton questionsData={sst_ple} /> */}

      {/* -------display answers-------- */}

      {/* Maths answers */}
      {/* <AnswerContainer questionsData={math_ple_ans} subjectName={'math_ple'} /> */}

      {/* sst-ple answers */}
      {/* <AnswerContainer questionsData={sst_ple_ans} subjectName={'sst_ple'} /> */}
    </div>
  );
}

export default App;
