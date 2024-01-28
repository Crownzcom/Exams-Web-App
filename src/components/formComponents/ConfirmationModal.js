// ConfirmationModal.js
import React from "react";
import { Modal, Button } from "react-bootstrap";

const ConfirmationModal = ({
  show,
  onHide,
  handleAddNextOfKin,
  handleNoNextOfKin,
}) => (
  <Modal show={show} onHide={onHide}>
    <Modal.Header closeButton>
      <Modal.Title>Add Next of Kin</Modal.Title>
    </Modal.Header>
    <Modal.Body>Would you like to add a Next of Kin?</Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={handleNoNextOfKin}>
        No
      </Button>
      <Button variant="primary" onClick={handleAddNextOfKin}>
        Yes
      </Button>
    </Modal.Footer>
  </Modal>
);

export default ConfirmationModal;
