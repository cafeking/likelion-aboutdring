pragma solidity >=0.4.24 < 0.5.6;

contract NFTSimple {
    string public name = "KlayLion";
    string public symbol = "KL";

    mapping (uint256 => address) public tokenOwner;
    mapping (uint256 => string) public tokenURIs;

    // 소유한 토큰 리스트, 토큰리스트 배열을 return
    mapping (address => uint256[]) private _ownedTokens;

    // onKIP17Received bytes value
    bytes4 private constant _KIP17_RECEIVED = 0x6745782b;

    function mintWithTokenURI(address to, uint256 tokenId, string memory tokenURI) public returns (bool) {
        // return은 사실 없어도 된다.
        // to 에게 tokenId(일련번호)를 발행한다.
        // 적힐글자는 tokenURI
        tokenOwner[tokenId] = to;
        tokenURIs[tokenId] = tokenURI;

        // add token to the list
        // 토큰리스트에 추가
        _ownedTokens[to].push(tokenId);

        return true;
    }

    // 토큰을 전송
    // owner가 from에서 to로 바뀐다. tokenId 를 바꾼다. 
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory _data) public {

        // 보낸사람이 from 가 같아야한다.
        require(from == msg.sender, "from != msg.sender");
        // 보낸사람이 tokwn 의 소유주여야한다.
        require(from == tokenOwner[tokenId], "You are not the owner of the token");

        _removeTokenFromList(from, tokenId);    // 원래사람거는 뺏고
        _ownedTokens[to].push(tokenId);         // 새로받는사람은 더해줌

        // tokenowner 변경
        tokenOwner[tokenId] = to;

        // 만약에 받는 쪽이 실행할 코드가 있는 스마트 컨트랙트이면 코드를 실행할 것
        require(
            _checkOnKIP17Received(from, to, tokenId, _data), "KIP17 : transfer to non KIP17Receiver implementer"
        );
    }

    // 안에서만 호출할 수 있도록 internal
    function _checkOnKIP17Received(address from, address to, uint256 tokenId, bytes memory _data) internal returns (bool) {
        bool success;
        bytes memory returndata;

        // 보낼사람이 스마트컨트랙트 코드가 아니라면 넘어가도록
        if (!isContract(to)) {
            return true;
        }

        // 스마트컨트렉트 라면 주소에가서 call
        // solidity 가 알아보기쉽게 onKIP17Received 를 0x6745782b 로 설정

        (success, returndata) = to.call(
            abi.encodeWithSelector(
                _KIP17_RECEIVED,
                msg.sender,
                from,
                tokenId,
                _data
            )
        );

        if(
            returndata.length != 0 &&
            abi.decode(returndata, (bytes4)) == _KIP17_RECEIVED
        ) {
            return true;
        }
        return false;
    }

    // 스마트 컨트랙트인지 아닌지 판별하기 위해서 -> 코드가 있으면 스마트 컨트랙트임
    function isContract(address account) internal view returns (bool) {
        uint256 size;
        assembly { size := extcodesize(account)}    // 코드가 존재하는지
        return size > 0; // true or false 리턴
    }

    // 스마트컨트렉스 안에서만 호출할 수 있도록 private
    function _removeTokenFromList(address from, uint256 tokenId) private {
        // [10, 15, 19, 20] --> 19번을 삭제하고 싶어요
        // [10, 15, 20, 19]
        // [10, 15, 20] , 길이만 줄이는 방식
        uint256 lastTokenIndex = _ownedTokens[from].length - 1;

        for(uint256 i=0; i<_ownedTokens[from].length;i++){
            // 삭제하려는 토큰을 찾은경우
            if(tokenId == _ownedTokens[from][i]) {
                // swap 
                _ownedTokens[from][i] = _ownedTokens[from][lastTokenIndex];
                _ownedTokens[from][lastTokenIndex] = tokenId;
                break;
            }
        }
        _ownedTokens[from].length--;
    }

    // owner가 가진 token을 보는 함수
    function ownedTokens(address owner) public view returns (uint256[] memory) {
        return _ownedTokens[owner];
    }

    function setTokenUri(uint256 id, string memory uri) public {
        tokenURIs[id] = uri;
    }
}

contract NFTMarket {
    // 구매자를 기억할 주소
    // uint256 : tokenid
    // address : 판매자
    mapping(uint256 => address) public seller;

    // sc 도 토큰소유가 가능하다 (token, klay ...)
    // klay 보낼 액션을 할 함수에도 payable 이 필요하다
    function buyNFT(uint256 tokenId, address NFTAddress) public payable returns (bool) {
        // 3자에게 token을 전송받고
        // 3자에세 token을 전달하는 sc
        // NFTAddress 에는 NFT Simple이 배포된 주소를 세팅
        // 해당 주소에서 NFTSimple이 가진 function 호출이 가능
        // address(this)는 나 자신을 가리키는 변수
        // function safeTransferFrom function 호출, 나자신 > to 에게 tokenId 전송
        // 돈을받을사람은 receiver, 이 사람은 seller에 저장된 address 이다 (판매자)
        // 그냥 address 에는 돈을 전달할 수 없다. payable 이 붙어야 돈을 전달할 수 있다. 
        address payable receiver = address(uint160(seller[tokenId]));

        // 10 ** 18 PEB = 1 KLAY
        // 10 ** 16 PEB = 0.01 KLAY
        receiver.transfer(10 ** 16);

        // address this 는 스마트컨트랜드 자신(NFTSimple자신) 의 주소를 의미한다.
        // NFTAddress주소로 NFTSimple컨트렉트 호출한다
        // msg.sender 를 이용해서 무조건 구매한사람이 세팅되도록
        NFTSimple(NFTAddress).safeTransferFrom(address(this), msg.sender, tokenId, '0x00');
        return true;
    }

    // // Market이 토큰을 받았을 때(판매대에 올라왔을 때), 판매자가 누구인지를 기록해야함
    // function onKIP17Received(address operator, address from, uint256 tokenId, bytes memory data) public returns (bytes4){
    //     seller[tokenId] = from;
    
    //     // 스마트 컨트랙트 토큰 받았을 때 실행할 것에 대한 수신호
    //     // 실행하는 자는 이런 글자를 리턴해라 라는 의미 
    //     return bytes4(keccak256("onKIP17Received(address,address,uint256,bytes)"));

    //     // 아래 코드가 정의되어있는데, 결국 0x6745782b 를 리턴한다고 보면됨
    //     // Equals to `bytes4(keccak256("onKIP17Received(address,address,uint256,bytes)"))`
    //     // which can be also obtained as `IKIP17Receiver(0).onKIP17Received.selector`
    //     //bytes4 private constant _KIP17_RECEIVED = 0x6745782b;
    // }

        // Market이 토큰을 받았을 때(판매대에 올라왔을 때), 판매자가 누구인지를 기록해야함
    function onKIP17Received(address operator, address from, uint256 tokenId, bytes memory data) public returns (bytes4){
        seller[tokenId] = from;
    
        //스마트 컨트랙트 토큰 받았을 때 실행할 것에 대한 수신호 - ~~한 글자를 리턴하고 싶다는 것의 수신호라고 생각하면 된다
        return bytes4(keccak256("onKIP17Received(address,address,uint256,bytes)"));
    }

}