import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, Form, Button, Container } from 'react-bootstrap';
import 'react-phone-number-input/style.css';
import PhoneInput from "react-phone-number-input";
import { isValidPhoneNumber } from "react-phone-number-input";
// import PropTypes from 'prop-types';
import {
    databases,
    database_id,
    transactionTable_id,
} from "../../appwriteConfig.js";
import { updatePointsTable } from '../../utilities/otherUtils'
import { useAuth } from '../../context/AuthContext';

const MTNMomo = ({ propPrice, propPaymentFor, propStudentInfo }) => {
    const { userInfo, fetchUserPoints } = useAuth();
    const isStudent = userInfo.labels.includes("student");
    const isNextOfKin = userInfo.labels.includes("kin");

    const navigate = useNavigate();
    const location = useLocation();
    const { price, paymentFor, points, studentInfo } = location.state || { price: null, paymentFor: 'points', points: 0, studentInfo: { userId: '', name: '', educationLevel: '' } }; // Set default values accordingly

    //Check if price is not null, or else navigate back
    useEffect(() => {
        console.log('Price passed to MTN: ', price)
        if (!price) {
            navigate(-1);
        }
    }, []);

    const serverUrl = "https://2wkvf7-3000.csb.app"
    const serverMomoRoute = `${serverUrl}/mtnMomo`

    const [phone, setPhone] = useState(userInfo.phone || '');
    const [amount, setAmount] = useState(price);
    const [message, setMessage] = useState('');
    const [phoneError, setPhoneError] = useState(false); // Error flag for user's phone
    const [receiptInfo, setReceiptInfo] = useState({});
    const [paymentStatus, setPaymentStatus] = useState('');

    // Create a new MTN MoMo API user
    const createApiUser = async () => {
        console.log('Creating API user...');
        const response = await fetch(`${serverMomoRoute}/create-api-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        return response.json();
    };

    // Returns created user details if exists
    const getCreatedUser = async (userId) => {
        console.log('Retrieving created user...');
        const response = await fetch(`${serverMomoRoute}/get-created-user/${userId}`);
        return response.json();
    };

    // Retrieve API key for the user used to generate a token
    const retrieveApiKey = async (userId) => {
        console.log('Retrieving API key...');
        const response = await fetch(`${serverMomoRoute}/retrieve-api-key/${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        return response.json();
    };

    //Generates a token required for transaction
    const generateApiToken = async (userId, apiKey) => {
        console.log('Generating MoMo token...');
        const response = await fetch(`${serverMomoRoute}/generate-api-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, apiKey })
        });
        return response.json();
    }

    // Request to make a payment using the generated token
    const requestToPay = async (phone, amount, momoTokenId) => {
        console.log('Making payment request...');
        const response = await fetch(`${serverMomoRoute}/request-to-pay`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${momoTokenId}`
            },
            body: JSON.stringify({ phone, total: amount, momoTokenId })
        });
        return response.json();
    };

    // Verify payment status
    const verifyPaymentStatus = async (transactionId, momoTokenId) => {
        try {
            const response = await fetch(`${serverMomoRoute}/payment-status/${transactionId}/${momoTokenId}`);
            const data = await response.json();
            if (data.status === "SUCCESSFUL") {
                setPaymentStatus('success')
                console.log('MTN Payment statuds: ', paymentStatus)
                const receiptDetails = {
                    id: data.financialTransactionId,
                    tx_ref: data.externalId,
                    payment_type: 'MTN Mobile Money Uganda',
                    charged_amount: data.amount,
                    currency: data.currency,
                    phone: data.payer.partyId,
                    transactionStatus: 'success',
                    description: `Points Purchase${isStudent ? '.' : ` for ${studentInfo.name}`}`,
                    created_at: new Date().toLocaleString(), // or extract date from the response if available
                    points: points
                };

                //Save to database
                await saveTransactionData(receiptDetails);

                /*** ----------- Update Points tables ----------- ***/
                //Update the points table in the database
                await updatePointsTable({
                    created_at: receiptDetails.created_at,
                    paymentFor: paymentFor,
                    transactionID: data.externalId,
                    userId: isStudent ? userInfo.userId : studentInfo.id,
                    points: points,
                    educationLevel: isStudent ? userInfo.userId : studentInfo.educationLevel,
                    message: `Points Purchase with MTN MoMo`
                })

                //Update client side points
                if (isStudent) {
                    await fetchUserPoints(userInfo.userId, userInfo.educationLevel);
                }
                /*** ----------- END: Update Points tables ----------- ***/

                setReceiptInfo(receiptDetails);

                return receiptDetails;
            } else {
                // Handle unsuccessful transaction
                console.error("Payment Unsuccessful:", data);
                return
            }
        } catch (error) {
            console.error("Error verifying payment status:", error);
        }
    };

    // Phone number validation function
    const validatePhoneNumber = (phoneNumber) => {
        return phoneNumber && !isValidPhoneNumber(phoneNumber);
    };

    //Function to save transaction data to transaction database table
    const saveTransactionData = async (data) => {
        try {
            console.log('Points purchased: ', points);
            const response = await databases.createDocument(database_id, transactionTable_id, "unique()",
                {
                    userID: userInfo.userId,
                    transactionDate: data.created_at,
                    transactionAmount: data.charged_amount,
                    currency: data.currency,
                    paymentMethod: data.payment_type,
                    paymentGateway: 'MTN Mobile Money Payment Gateway',
                    paymentSatus: data.transactionStatus,
                    transactionReference: data.tx_ref,
                    transactionId: `${data.id}`,
                    paymentFor: paymentFor,
                    description: 'Points Purchase',
                    points: points
                }
            )
        } catch (error) {
            console.error('Error saving transaction data:', error);
        }
    };

    const handlePayment = async () => {
        if (!phone || !amount) {
            setMessage('Please enter both phone number and amount.');
            return;
        }

        // Validate phone numbers
        const isUserPhoneValid = !validatePhoneNumber(phone);

        if (!isUserPhoneValid) {
            setPhoneError(!isUserPhoneValid);
            return;
        }

        try {
            const userCreationResponse = await createApiUser();
            const userId = userCreationResponse.userId;
            console.log('User ID: ', userId);

            // await getCreatedUser(userId);

            const apiKeyResponse = await retrieveApiKey(userId);
            const apiKey = apiKeyResponse.apiKey;
            console.log('API key: ' + apiKey)

            const tokenResponse = await generateApiToken(userId, apiKey);
            const momoTokenId = tokenResponse.access_token;
            console.log('API token: ' + momoTokenId)

            const paymentResponse = await requestToPay(phone, amount, momoTokenId);

            if (paymentResponse.success) {
                setMessage('Payment successful!');
                console.log('Finshed to make payment...', paymentResponse);

                // Verify payment status
                const verificatioStatusResponse = await verifyPaymentStatus(paymentResponse.paymentRefId, paymentResponse.momoTokenId);
                console.log('Verification status:', verificatioStatusResponse);
            } else {
                setMessage('Payment failed.');
            }
        } catch (error) {
            console.error('An error occurred:', error);
            setMessage('An error occurred while processing the payment.');
        }
    };

    const viewReceipt = () => {
        navigate(`/payment/receipt`, { state: { receiptData: receiptInfo } });
    };

    return (
        <Container>
            <Card>
                <Form.Group className="mb-3">
                    <Form.Label>Phone Number*</Form.Label>
                    <PhoneInput
                        className={`form-control ${phoneError ? "is-invalid" : "custom-phone-input "
                            }`}
                        placeholder="Enter phone number"
                        international
                        defaultCountry="UG"
                        countryCallingCodeEditable={false}
                        value={phone}
                        onChange={setPhone}
                        required
                    />
                    {phoneError && (
                        <Form.Control.Feedback type="invalid">
                            Invalid phone number
                        </Form.Control.Feedback>
                    )}
                </Form.Group>
                <Button onClick={handlePayment} disabled={!phone}>Pay</Button>
                {message && <p>{message}</p>}
            </Card>
            {paymentStatus === "success" ? <Button onClick={viewReceipt} >View Your Receipt</Button> : null}
        </Container>
    );
};

// MTNMomo.propTypes = {
//     price: PropTypes.number
// };

// MTNMomo.defaultProps = {
//     price: 2000
// };

export default MTNMomo;
