import "bootstrap/dist/css/bootstrap.min.css";

// import './index.css';
import './App.css';
import './market.css';

import {getBalance, readCount, setCount, fetchCardOf} from './api/UseCaver';
import * as KlipAPI from "./api/UseKlip";
// import * as KasAPI from "./api/UseKAS";

import React, {useState, useEffect} from "react";
import QRCode from "qrcode.react";

import { Alert, Container, Card, Nav, Button, Form, Modal, Row, Col } from "react-bootstrap";
// import { getByPlaceholderText } from '@testing-library/react';
import { MARKET_CONTRACT_ADDRESS } from './constants';

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faHome, faWallet, faPlus } from "@fortawesome/free-solid-svg-icons";
import { faHome, faWallet, faPlus, faComment, faStore, faUser, faCirclePlus} from "@fortawesome/free-solid-svg-icons";



const DEFAULT_QR_CODE = "DEFAULT";
const DEFAULT_ADDRESS = "0x00000000000000000000000";

function App() {
  // nft 변수
  const [nfts, setNfts] = useState([]); // 가져온 nft 정보들을 저장할 배열, tokenId:'101', tokenURI: '~'
  const [myBalance, setMyBalance] = useState('0');
  const [myAddress, setMyAddress] = useState(DEFAULT_ADDRESS); // for test

  // UI
  const [qrvalue, setQrvalue] = useState(DEFAULT_QR_CODE);
  const [tab, setTab] = useState("MARKET"); // MARKET, MINT, WALLET
  const [mintImageUrl, setMintImageUrl] = useState("");
  const [mintDescription, setMintDescription] = useState("");
  const [mintTokenID, setMintTokenID] = useState("");

  // 갤러리 정리를 위함
  const rows = nfts.slice(nfts.length / 2);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [modalProps, setModalProps] = useState({
    title: "MODAL",
    onConfirm: () => {},
  });
  
  const getUserData = () => {
    setModalProps({
      title: "Klip 지갑을 연동하시겠습니까?",
        onConfirm: () => {
            // callback(res.data.result.klaytn_address); 의 결과가 address 로 삽입
          KlipAPI.getAddress(setQrvalue, async (address) => {
          setMyAddress(address);

          const _balance = await getBalance(address);
          setMyBalance(_balance);

          // console.log(`${address}`);
          // console.log(`${_balance}`);
        });
      },
    });
    setShowModal(true);
  };

  // nft 가져올 함수 fetchNFT - 나의NFT
  const fetchMyNFTs = async () => {
    // tokenId:100, tokenUri:~ 를 가져오려함 (배열로)
    // tokenId:101, tokenUri:~ 를 가져오려함 (배열로)
    // balanceOf : 가진 NFT의 총 갯수
    // tokenOfOwnerByIndex : index 넣으면 각 토큰의ID get (배열) (0>100, 1>101)
    // tokenURI : tokenID를 이용하여 tokenURI를 하나씩 가져온다

    if(myAddress === DEFAULT_ADDRESS) {
      alert ("NO ADDRESS");
      return;
    }
    const _nfts = await fetchCardOf(myAddress);
    setNfts(_nfts);
  }

  // nft 가져올 함수 fetchNFT - 마켓NFT
  const fetchMarketNFTs = async () => {
    const _nfts = await fetchCardOf(MARKET_CONTRACT_ADDRESS);
    setNfts(_nfts);
  }

  // 발행버튼시 mint할 NFT함수
  const onClickMint = async (uri) => {
    // 주소가 연결되지 않았다면 error
    if(myAddress === DEFAULT_ADDRESS) {
      alert ("NO ADDRESS");
      return;
    }

    // Math.random : 0.XXXXX 랜덤값
    const randomTokenId = parseInt(Math.random() * 1000000);
    
    KlipAPI.mintCardWithURI(myAddress, randomTokenId, uri, setQrvalue, (result) => {
      alert(JSON.stringify(result));
    });
  };

  // 카드클릭시 이벤트
  const onClickCard = (id) =>{
    if (tab === 'WALLET') {
      setModalProps({
        title:"NFT를 마켓에 올리시겠습니까 ?",
        onConfirm: () => {
          onClickMyCard(id);
        },
      });
      setShowModal(true);
    }
    if (tab === 'MARKET') {
      setModalProps({
        title:"NFT를 구매하시겠어요 ?",
        onConfirm: () => {
          onClickMarketCard(id);
        },
      });
      setShowModal(true);
    }
  };

  // 카드클릭시 마켓에 올릴 함수 - 나의NFT
  const onClickMyCard = (tokenId) =>{
    KlipAPI.listingCard(myAddress, tokenId, setQrvalue, (result) => {
      alert(JSON.stringify(result));
    });
  };

  // 카드클릭시 구매할 할수 - 마켓NFT
  const onClickMarketCard = (tokenId) =>{
    KlipAPI.buyCard(tokenId, setQrvalue, (result) => {
      alert(JSON.stringify(result));
    });
  };

  // getUserData
  // 앱이 시작하자마자 NFT MARKET의 NFT카드를 가져오도록 한다.
  useEffect(() => {
    // getUserData();
    fetchMarketNFTs();
  }, [])
  return (
    <div className="App">
      <div style={{backgroundColor: "black", padding: 10}}>
        {/* 로고 */}
        <div style={{fontSize: 30,fontStyle:"italic",marginLeft:10,}}>
          About Drink
        </div>

        {/*주소 잔고*/}
        <div className="my_wallet_basic" style={{backgroundColor: "#FF6E6E", padding:23,borderRadius:10,margin:20,}}>       
          <div style={{fontSize: 22, fontWeight: "bold", paddingLeft: 5, marginTop: 10, }}>내지갑</div>
          {myAddress}
          <br />
          <br />
          <Alert 
          onClick={getUserData}
          variant={"balance"} 
          style={{backgroundColor: "#F54848", fontSize: 17, textAlign:"center",}}>
            {myAddress !== DEFAULT_ADDRESS
              ? `${myBalance} KLAY` 
              : "지갑 연동하기"}
          </Alert>
        </div>
      </div>

      {/* QR */}
      {qrvalue !== "DEFAULT" ? (
        // QR VALUE가 DEFAULT 가 아닌경우에만 표시
        <Container style={{ backgroundColor:'white', width:200, height:200, padding:20, textAlign:"center", }} >
          <QRCode value={qrvalue} size={156} style={{ margin: "auto" }} />
        </Container>
      ) : null}

      {/* MARKET TAB */}
      {tab === "MARKET" ? (
        <div className="container" style={{ padding: 0, width: "100%", margin:10, }}>
          <div className="tab_title" style={{fontSize:30, fontWeight:"bold",paddingTop:34, paddingBottom:29,marginLeft:7,}}>드링크 마켓</div>
          {rows.map((o, rowIndex) => (
            <Row key={`rowkey${rowIndex}`}>
              <Col style={{marginRight:0, paddingRight:0}}>
                <Card onClick={()=> {
                  onClickCard(nfts[rowIndex * 2].id);
                }}
                >
                  <Card.Img src={nfts[rowIndex * 2].uri} />
                </Card>
                [{nfts[rowIndex *2].id}]NFT
                <Form>
                <div style={{margin:7,}}>
                  <FontAwesomeIcon color="white" size="lg" icon={faComment} />
                </div>
                  <Form.Control style={{marginBottom:20}}
                  type="text"
                  placeholder="코멘트를 입력해주세요"
                  />
                </Form>
              </Col>

              <Col style={{marginRight:0, paddingRight:0}}>
                { nfts.length > rowIndex * 2 + 1 ? ( 
                <Card onClick={()=> {
                  onClickCard(nfts[rowIndex * 2+1].id);
                }}
                >
                  <Card.Img src={nfts[rowIndex * 2+1].uri} />
                </Card>
                ) : null}

                {nfts.length > rowIndex * 2 + 1 ? (<>[{nfts[rowIndex * 2 + 1].id}]NFT</>
                ) : null }

                {nfts.length > rowIndex * 2 + 1 ? (
                <Form>
                  <div style={{margin:7,}}>
                  <FontAwesomeIcon color="white" size="lg" icon={faComment} />
                  </div>
                  <Form.Control style={{marginBottom:20}}
                  type="text"
                  placeholder="코멘트를 입력해주세요"
                  />
                  </Form>
                ) : null }

              </Col>
            </Row>
          ))}
          {/* {nfts.map((nft, index) => (
            <Card.Img 
            key={`imagekey${index}`}
            onClick={()=>{onClickCard(nft.id)}} 
            className="img-responsive" 
            src={nfts[index].uri} 
            />
          ))} */}
        </div>
      ) : null}

        {/* WALLET TAB */}
        {tab === "WALLET" ? (
        <div className="container" style={{ padding: 0, width: "100%", margin:10, }}>
          <div className="tab_title" style={{fontSize:30, fontWeight:"bold",paddingTop:34, paddingBottom:29,marginLeft:7,}}>My 드링크 보관함</div>
          {rows.map((o, rowIndex) => (
            <Row key={`rowkey${rowIndex}`}>
              <Col style={{marginRight:0, paddingRight:0}}>
                <Card onClick={()=> {
                  onClickCard(nfts[rowIndex * 2].id);
                }}
                >
                  <Card.Img src={nfts[rowIndex * 2].uri} />
                </Card>
                [{nfts[rowIndex *2].id}]NFT
              </Col>

              <Col style={{marginRight:0, paddingRight:0}}>
                { nfts.length > rowIndex * 2 + 1 ? ( 
                <Card onClick={()=> {
                  onClickCard(nfts[rowIndex * 2+1].id);
                }}
                >
                  <Card.Img src={nfts[rowIndex * 2+1].uri} />
                </Card>
                  ) : null}
                {nfts.length > rowIndex * 2 + 1 ? (<>[{nfts[rowIndex * 2 + 1].id}]NFT</>
                ) : null }
              </Col>
            </Row>
          ))}
          {/* {nfts.map((nft, index) => (
            <Card.Img 
            key={`imagekey${index}`}
            onClick={()=>{onClickCard(nft.id)}} 
            className="img-responsive" 
            src={nfts[index].uri} 
            />
          ))} */}
        </div>
      ) : null}


      {/* MINT TAB */}
           {/*발행페이지*/}
           {tab === "MINT" ? (
        <div className="container" style={{padding:0, width:"100%"}}>
          <div className="tab_title" style={{fontSize:30, fontWeight:"bold",paddingTop:34, paddingBottom:29,marginLeft:7,}}>내 레시피 발행하기</div>
          <Card 
          className="text-center"
          style={{color:"black", height: "50%",marginLeft:20, marginRight:20,}}>
            <Card.Body style={{opacity: 0.9, backgroundColor: "#7DED9D",}}>
              {mintImageUrl !== "" ? (
                <Card.Img src={mintImageUrl} height={"50%"} />
                ) : null}
              <Form>
                <Form.Group>
                  <Form.Control
                  value={mintImageUrl}
                  onChange={(e)=>{
                    console.log(e.target.value);
                    setMintImageUrl(e.target.value);
                  }}
                  type="text"
                  placeholder="이미지 주소를 입력해주세요"
                  />
                <br />

                <Form.Control
                  value={mintTokenID}
                  onChange={(e)=>{
                    console.log(e.target.value);
                    setMintTokenID(e.target.value);
                  }}
                  type="text"
                  placeholder="토큰 ID를 입력해주세요"
                  />  
                  <br />
                
                <Form.Control
                  value={mintDescription}
                  onChange={(e)=>{
                    console.log(e.target.value);
                    setMintDescription(e.target.value);
                  }}
                  type="text"
                  placeholder="드링크에 대한 레시피와 설명을 입력해주세요"
                  />  


                </Form.Group>
                <br/>
                <Button 
                onClick={()=>{onClickMint(mintImageUrl, mintTokenID);}}
                variant="primary" style={{backgroundColor:"#1ECB82", borderColor:"white", fontSize:16, fontWeight:"bold", }}>발행하기</Button>
              </Form>
            </Card.Body>
          </Card>
        </div>
      ): null} 

      {/* MODAL */}
      <Modal
        centered
        size="sm"
        show={showModal}
        onHide={() => {
          setShowModal(false);
        }}
      >
        <Modal.Header
          style={{ border: 0, backgroundColor: "black", opacity: 0.8 }}
        >
          <Modal.Title>{modalProps.title}</Modal.Title>
        </Modal.Header>
        <Modal.Footer
          style={{ border: 0, backgroundColor: "black", opacity: 0.8 }}
        >
          <Button
            variant="secondary"
            onClick={() => {
              setShowModal(false);
            }}
          >
            닫기
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              modalProps.onConfirm();
              setShowModal(false);
            }}
            style={{ backgroundColor: "#810034", borderColor: "#810034" }}
          >
            진행
          </Button>
        </Modal.Footer>
      </Modal>

      {/* TAB */}
      <nav
        style={{ backgroundColor: "#1b1717", height: 45 }}
        className="navbar fixed-bottom navbar-light"
        role="navigation"
      >
        <Nav className="w-100">
          <div className="d-flex flex-row justify-content-around w-100">
            <div
              onClick={() => {
                setTab("MARKET");
                fetchMarketNFTs();
              }}
              className="row d-flex flex-column justify-content-center align-items-center"
            >
              <div>
                <FontAwesomeIcon color="white" size="lg" icon={faStore} />
              </div>
            </div>
            <div
              onClick={() => {
                setTab("MINT");
              }}
              className="row d-flex flex-column justify-content-center align-items-center"
            >
              <div>
                <FontAwesomeIcon color="white" size="lg" icon={faCirclePlus} />
              </div>
            </div>
            <div
              onClick={() => {
                setTab("WALLET");
                fetchMyNFTs();
              }}
              className="row d-flex flex-column justify-content-center align-items-center"
            >
              <div>
                <FontAwesomeIcon color="white" size="lg" icon={faUser} />
              </div>
            </div>
          </div>
        </Nav>
      </nav>            
    </div>
  );
}

export default App;
