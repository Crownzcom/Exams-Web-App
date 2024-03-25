//This component is only meant to run after a transaction is made for ONLY FLUTTERWAVE transactions
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Alert, Spinner, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import {
    databases,
    database_id,
    transactionTable_id,
    pointsBatchTable_id,
    pointsTable_id,
    Query
} from "../../appwriteConfig.js";
import { updatePointsTable } from '../../utilities/otherUtils'
import { updateStudentDataInLocalStorage } from '../../utilities/fetchStudentData'
import './PaymentResult.css'; // Path to your custom CSS file
import moment from 'moment';
import { serverUrl } from '../../config.js';

const PaymentResult = () => {

    const [transactionData, setTransactionData] = useState({});
    const [paymentStatus, setPaymentStatus] = useState('Verifying...');
    const [loading, setLoading] = useState(true);

    const { userInfo, fetchUserPoints } = useAuth();
    const isStudent = userInfo.labels.includes("student");
    const isNextOfKin = userInfo.labels.includes("kin");

    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const transactionId = queryParams.get('transaction_id') || parseTransactionIdFromResp(queryParams.get('resp'));

    useEffect(() => {
        const verifyPayment = async () => {
            if (transactionId) {
                try {
                    const response = await fetch(`${serverUrl}/flutterwave/verify-payment/${transactionId}`);
                    const data = await response.json();

                    console.log('Verified Data from Flutterwave: ', data);

                    //Saving to database
                    await saveTransactionData(data.transactionData);

                    console.log('Transaction data - Client side: ', data);
                    setPaymentStatus(data.status);
                    console.log('Payment status - Client side: ', paymentStatus);

                    try {
                        // Data to send to receipt
                        const receiptData = {
                            tx_ref: data.transactionData.tx_ref,
                            id: data.transactionData.id,
                            charged_amount: data.transactionData.amount,
                            currency: data.transactionData.currency,
                            payment_type: data.transactionData.payment_type,
                            name: data.transactionData.customer.name,
                            email: data.transactionData.customer.email,
                            phone: data.transactionData.customer.phone_number,
                            created_at: data.transactionData.customer.created_at,
                            card: data.transactionData.card || {},
                            description: data.transactionData.meta.description,
                            paymentFor: data.transactionData.meta.service,
                            points: data.transactionData.meta.points,
                        }
                        setTransactionData(receiptData);
                    }
                    catch (e) {
                        console.log("error in recepit ..", e)
                        throw new Error
                    }

                } catch (error) {
                    setPaymentStatus('Verification failed. Please contact support.');
                } finally {
                    setLoading(false);
                }
            } else {
                setPaymentStatus('No transaction ID provided.');
                setLoading(false);
            }
        };

        verifyPayment();
    }, [transactionId]);

    // Function to parse and extract transactionId from 'resp'
    function parseTransactionIdFromResp(resp) {
        if (!resp) return null;
        try {
            const decodedResp = JSON.parse(decodeURIComponent(resp));
            return decodedResp?.data?.id || null;
        } catch (error) {
            console.error('Error parsing resp:', error);
            return null;
        }
    }

    //Function to save transaction data to transaction table
    const saveTransactionData = async (data) => {
        try {
            console.log('Saving transaction data: ', data);
            // Check if transaction already exists
            const existingTransaction = await databases.listDocuments(database_id, transactionTable_id, [Query.equal('transactionId', [`${data.id}`])]);

            if (existingTransaction.documents.length > 0) {
                console.log('Transaction already saved.');
                return;
            }

            console.log('transaction status: ', data.status);
            console.log('Points purchased: ', data.meta.points);

            console.log('original date: ', data.created_at)

            const created_at_formattedDate = moment(data.created_at, 'DD/MM/YYYY, HH:mm:ss').toDate();
            console.log('formattedDate - moment: ', created_at_formattedDate);

            console.log('Transaction Table - Flutterwave - Purchased points on: ', created_at_formattedDate);

            try {

                const response = await databases.createDocument(database_id, transactionTable_id, "unique()",
                    {
                        userID: userInfo.userId,
                        transactionDate: new Date(data.created_at),
                        transactionAmount: data.amount,
                        currency: data.currency,
                        paymentMethod: data.payment_type,
                        paymentGateway: 'Flutterwave Gateway',
                        paymentSatus: data.status === 'successful' ? 'success' : 'failed',
                        transactionReference: data.tx_ref,
                        transactionId: `${data.id}`,
                        paymentFor: data.meta.service,
                        description: data.meta.description,
                        points: data.meta.points
                    }
                )

            } catch (e) { console.log('Update Transaction table error: ', e); throw e; }

            /*** ----------- Update Points tables ----------- ***/
            if (data.status === 'successful') {
                //Update the points table in the database
                try {
                    await updatePointsTable({
                        created_at: new Date(data.created_at),
                        paymentFor: data.meta.service,
                        transactionID: data.tx_ref, //USED tx_ref because it's unique for all, but transactionId in transaction table can be duplicated
                        userId: `${isStudent ? userInfo.userId : data.meta.studentId}`,
                        points: data.meta.points,
                        educationLevel: `${isStudent ? userInfo.userId : data.meta.educationLevel}`,
                        message: `Points Purchase with Flutterwave Gateway - PaymentVerification`
                    })
                } catch (e) { console.error('Update Points table error: ', e); throw e; }

                //Update student side points
                if (isStudent) {
                    await fetchUserPoints(userInfo.userId, userInfo.educationLevel);
                }
                else { //Update next-of-kin side points
                    let newPointsBalance
                    //Query a Appwrite Database Table for user
                    try {

                        const response = await databases.listDocuments(database_id, pointsTable_id, [Query.equal('UserID', data.meta.studentId)]);

                        console.log('Checking points table: ', response)

                        if (response.documents.length > 0) {

                            newPointsBalance = response.documents[0].PointsBalance

                            //update Student Points via local storage
                            await updateStudentDataInLocalStorage(data.meta.studentId, { pointsBalance: newPointsBalance });

                        }
                    } catch (err) {
                        console.error('Failed to Fetch points from Database for update after Payment verification: ', err);
                    }

                }
            }
            /*** ----------- END: Update Points tables ----------- ***/

        } catch (error) {
            console.error('Error saving transaction data:', error);
        }
    };

    const viewReceipt = (method) => {
        navigate(`/payment/receipt`, { state: { receiptData: transactionData } });
    };

    return (
        <Container className="payment-result-container" style={{ marginTop: "100px" }} >
            <h2 className="text-center">Payment Status for {userInfo.firstName}</h2>
            {loading ? (
                <div className="text-center">
                    {/* <Spinner animation="border" role="status">
                        <span className="sr-only">Loading...</span>
                    </Spinner> */}
                    <Spinner animation="grow" variant="primary" />
                    <Spinner animation="grow" variant="secondary" />
                    <Spinner animation="grow" variant="success" />
                    <p className="sr-only">Loading...</p>
                </div>
            ) : (
                <Alert variant={paymentStatus === "success" ? 'success' : 'danger'}>
                    <FontAwesomeIcon
                        icon={paymentStatus === "success" ? faCheckCircle : faTimesCircle}
                        size="3x"
                    />
                    <p className="payment-status-message">{paymentStatus}</p>
                </Alert>
            )}
            {paymentStatus === "success" ? <Button onClick={viewReceipt} >View Your Receipt</Button> : null}
        </Container>
    );
};

export default PaymentResult;
