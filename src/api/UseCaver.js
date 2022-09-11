import Caver from 'caver-js'; // caverjs library import
// import CounterABI from '../abi/CounterABI.json';
import KIP17ABI from '../abi/KIP17TokenABI.json';
import {
    ACCESS_KEY_ID, 
    SECRET_ACCESS_KEY, 
    COUNT_CONTRACT_ADDRESS, 
    CHAIN_ID, NFT_CONTRACT_ADDRESS, 
    MARKET_CONTRACT_ADDRESS
} from '../constants';

const option = {
    headers: [
      {
        name: "Authorization",
        value:
          "Basic " +
          Buffer.from(ACCESS_KEY_ID + ":" + SECRET_ACCESS_KEY).toString("base64"),
      },
      { name: "x-chain-id", value: CHAIN_ID },
    ],
  };
  
const caver = new Caver(
new Caver.providers.HttpProvider(
    "https://node-api.klaytnapi.com/v1/klaytn",
    option
)
);

const NFTContract = new caver.contract(KIP17ABI, NFT_CONTRACT_ADDRESS);
const MarketContract = new caver.contract(KIP17ABI, MARKET_CONTRACT_ADDRESS);

// 외부호출함수이므로 async
export const fetchCardOf = async (address) => {
    // fetch Balance
    const balance = await NFTContract.methods.balanceOf(address).call();
    console.log(`NFT BALANCE : ${balance}`);

    // fetch Token IDs
    const tokenIds = [];
    for (let i=0; i<balance; i++){
        const id = await NFTContract.methods.tokenOfOwnerByIndex(address, i).call();
        tokenIds.push(id);
    };

    // fetch Token URIs
    const tokenUris = [];
    for (let i=0; i<balance; i++){
        const uri = await NFTContract.methods.tokenURI(tokenIds[i]).call();
        tokenUris.push(uri);
    };

    const nfts = [];
    for (let i=0; i<balance; i++){
        nfts.push({
            uri: tokenUris[i],
            id: tokenIds[i]
        });
    }
    // console.log(nfts);
    return nfts;
}

export const getBalance = (address) => {
    return caver.rpc.klay.getBalance(address).then((response) => {
    const balance = caver.utils.convertFromPeb(caver.utils.hexToNumberString(response));
    console.log(`BALANCE: ${balance}`);
    return balance;
})
}




// const CountContract = new caver.contract(CounterABI, COUNT_CONTRACT_ADDRESS);

// export const readCount = async () => {
//     const _count = await CountContract.methods.count().call();
//     console.log(_count);
// }

// export const setCount = async (newCount) => {
// // 외부함수호출이므로 try-catch

//     try{
//         // 사용할 account 설정
//         const privatekey = '';
//         const deployer = caver.wallet.keyring.createFromPrivateKey(privatekey);
//         caver.wallet.add(deployer);

//         // sc 실행 트랜잭션 날리기
//         // 결과 확인

//         // readCount 와 다르게 call() 이 아닌 send()가 사용된다.
//         const receipt = await CountContract.methods.setCount(newCount).send({
//         from: deployer.address,
//         gas: "0x4bfd200"  // 적당량의 gas, 아무숫자를 넣어도 트랜잭션에 필요한만큼 사용되고 되돌아온다
//         });

//         console.log(receipt);


//     } catch(e) {
//         console.log(`[ERROR_SET_COUNT] ${e}`);
//     } 
// }