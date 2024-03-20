import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import Packages from './Packages';

function SelectPackage() {

  const location = useLocation();
  const { studentInfo } = location.state || { studentInfo: { userId: '', name: '', educationLevel: '' } }; // Set default values accordingly

  console.log('Student Info being payed for: ', studentInfo)

  return (
    <>
      <Packages studentInfo={studentInfo}></Packages>
    </>
  );
}

export default SelectPackage;
