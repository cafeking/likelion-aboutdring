import axios from "axios";
import { COUNT_CONTRACT_ADDRESS, MARKET_CONTRACT_ADDRESS, NFT_CONTRACT_ADDRESS } from "../constants";

const A2P_API_PREPARE_URL='https://a2a-api.klipwallet.com/v2/a2a/prepare';
const APP_NAME = "KLAY_MARKET";

export const buyCard = async(tokenId, setQrvalue, callback) =>{
    // 마켓 > 구매자에게 보내는 함수
    const functionJSON = 
        '{ "constant": false, "inputs": [ { "name": "tokenId", "type": "uint256" }, { "name": "NFTAddress", "type": "address" } ], "name": "buyNFT", "outputs": [ { "name": "", "type": "bool" } ], "payable": true, "stateMutability": "payable", "type": "function" }';

    executeContract(
        MARKET_CONTRACT_ADDRESS, 
        functionJSON,
        "10000000000000000",    // 0.01 KLAY를 주기로 산다 (solidity), 10 의 16승
        `[\"${tokenId}\",\"${NFT_CONTRACT_ADDRESS}\"]`, 
        setQrvalue, 
        callback);
};

export const listingCard = async(fromAddress, tokenId, setQrvalue, callback) =>{
    // 마켓에게 보내는 함수
    const functionJSON = 
        '{ "constant": false, "inputs": [ { "name": "from", "type": "address" }, { "name": "to", "type": "address" }, { "name": "tokenId", "type": "uint256" } ], "name": "safeTransferFrom", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }';
    executeContract(
        NFT_CONTRACT_ADDRESS, 
        functionJSON, 
        "0", 
        `[\"${fromAddress}\",\"${MARKET_CONTRACT_ADDRESS}\",\"${tokenId}\"]`, 
        setQrvalue, 
        callback);
};

export const mintCardWithURI = async(toAddress, tokenId, uri, setQrvalue, callback) =>{
    // 누구에게 발행할지, tokenID, URI, QRCODE셋업, 콜백용함수
    // single(') 로 둘러쌓아야 안에있는 double(") 를 문자열로 인식할 수 있다.
    const functionJSON = 
        '{ "constant": false, "inputs": [ { "name": "to", "type": "address" }, { "name": "tokenId", "type": "uint256" }, { "name": "tokenURI", "type": "string" } ], "name": "mintWithTokenURI", "outputs": [ { "name": "", "type": "bool" } ], "payable": false, "stateMutability": "nonpayable", "type": "function" }';
    executeContract(
        NFT_CONTRACT_ADDRESS, 
        functionJSON, 
        "0", 
        `[\"${toAddress}\",\"${tokenId}\",\"${uri}\"]`, 
        setQrvalue, 
        callback);
};

// 추상화
export const executeContract = (txTo, functionJSON, value, params, setQrvalue, callback) => {
    // axios 는 rest api function 을 사용할 수 있도록 도와준다.
    axios
    .post(A2P_API_PREPARE_URL, {
            bapp: {
                name: APP_NAME,
            },
            // type 이 contract
            type: "execute_contract",
            // tracsaction 실행을 위함
            transaction: {
                to: txTo,
                // value 는 문자열로, 사용시킬 klay값 
                value: value, 
                // 실행할 함수에 대한 abi, count.sol abi 에서 실행할 함수에 대한 abi를 입력
                abi: functionJSON, 
                // setcount 실행시 필요한 input param
                params: params
            }
        })
    .then((response) => {
        // then 앞의 결과값이 response 로 리턴
        // prepare 하게되면 (유저가 인증하게되면) request key 가 생김.
        const { request_key } = response.data;
        const qrcode = `https://klipwallet.com/?target=/a2a?request_key=${request_key}`;
        setQrvalue(qrcode);

        // 1초에 한번씩 호출해주는식으로 (setInterval)
        // 가져오다가 값을 가져올경우 timer를 해제
        // clea
        let timerId = setInterval(() => {
            axios
            .get(
                `https://a2a-api.klipwallet.com/v2/a2a/result?request_key=${request_key}`
            )
            .then((res) => {
                // result 값이 존재할경우
                if(res.data.result) {
                    console.log(`[RESULT] ${JSON.stringify(res.data.result)}`);
                    callback(res.data.result);
                    clearInterval(timerId);
                }
            });
        }, 1000);
    });
};


// // setCount를 하도록 qrvalue를 변경해주는 함수
// export const setCount = (count, setQrvalue) => {
//     // axios 는 rest api function 을 사용할 수 있도록 도와준다.
//     axios
//     .post(A2P_API_PREPARE_URL, {
//             bapp: {
//                 name: APP_NAME,
//             },
//             // type 이 contract
//             type: "execute_contract",
//             // tracsaction 실행을 위함
//             transaction: {
//                 to: COUNT_CONTRACT_ADDRESS,
//                 // value 는 문자열로, 사용시킬 klay값 
//                 value: "0", 
//                 // 실행할 함수에 대한 abi, count.sol abi 에서 실행할 함수에 대한 abi를 입력
//                 abi: `{ "constant": false, "inputs": [ { "name": "_count", "type": "uint256" } ], "name": "setCount", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }`, 
//                 // setcount 실행시 필요한 input param
//                 params: `[\"${count}\"]`
//             }
//         })
//     .then((response) => {
//         // then 앞의 결과값이 response 로 리턴
//         // prepare 하게되면 (유저가 인증하게되면) request key 가 생김.
//         const { request_key } = response.data;
//         const qrcode = `https://klipwallet.com/?target=/a2a?request_key=${request_key}`;
//         setQrvalue(qrcode);

//         // 1초에 한번씩 호출해주는식으로 (setInterval)
//         // 가져오다가 값을 가져올경우 timer를 해제
//         // clea
//         let timerId = setInterval(() => {
//             axios
//             .get(
//                 `https://a2a-api.klipwallet.com/v2/a2a/result?request_key=${request_key}`
//             )
//             .then((res) => {
//                 // result 값이 존재할경우
//                 if(res.data.result) {
//                     console.log(`[RESULT] ${JSON.stringify(res.data.result)}`);
//                     if(res.data.result.status === "success"){
//                         clearInterval(timerId);
//                     }
//                 }
//             });
//         }, 1000);
//     });
// };

// 주소를 가져오독 qrvalue를 변경해주는 함수
export const getAddress = (setQrvalue, callback) => {
    // axios 는 rest api function 을 사용할 수 있도록 도와준다.
    axios
    .post(A2P_API_PREPARE_URL, {
            bapp: {
                name: APP_NAME,
            },
            type: "auth",
        })
    .then((response) => {
        // then 앞의 결과값이 response 로 리턴
        // prepare 하게되면 (유저가 인증하게되면) request key 가 생김.
        const { request_key } = response.data;
        const qrcode = `https://klipwallet.com/?target=/a2a?request_key=${request_key}`;
        setQrvalue(qrcode);

        // 1초에 한번씩 호출해주는식으로 (setInterval)
        // 가져오다가 값을 가져올경우 timer를 해제
        let timerId = setInterval(() => {
            axios
            .get(
                `https://a2a-api.klipwallet.com/v2/a2a/result?request_key=${request_key}`
            )
            .then((res) => {
                // result 값이 존재할경우
                if(res.data.result) {
                    console.log(`[RESULT] ${JSON.stringify(res.data.result)}`);
                    callback(res.data.result.klaytn_address);
                    clearInterval(timerId);
                }
            });
        }, 1000);
    });
};