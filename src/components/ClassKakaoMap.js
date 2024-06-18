/*global kakao*/
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {Link} from "react-router-dom";

class KakaoMap extends Component {
    constructor(props) {
        super(props);

        //현재클래스의state 상태변수값초기화
        this.state = {
            keyword: '성남시', //검색어상태입력예
            pageNo: 1,
            totalCount: 0,
        } //json 1차원 데이터객체. getData함수에서this클래스객체를사용하기위해아래코드추가
        this.getData = this.getData.bind(this); //this 바인딩
        this.onSearch = this.onSearch.bind(this);
        this.onChange = this.onChange.bind(this);
        this.removeAllChildNods = this.removeAllChildNods.bind(this);
        this.repeatPage = this.repeatPage.bind(this);
        this.onPage = this.onPage.bind(this);

    }

    onSearch() { // 검색버튼이벤트함수
        var mapContainer = document.getElementById('map');
        this.removeAllChildNods(mapContainer);//기존카카오맵겍체지우기
        this.state.pageNo = 1;//js처리
        this.getData();
    }
    onChange(e) { // 검색어수정이벤트함수
        this.setState({ [e.target.id]: e.target.value });//화면처리-재랜더링
        this.state.keyword = e.target.value;//js처리
    }
        removeAllChildNods(el) { //기존지도지우기
            while (el.hasChildNodes()) {
                el.removeChild(el.lastChild);
            }//기술참조:https://apis.map.kakao.com/web/sample/keywordList/
        }

        onPage = (e) => { //페이지선택이벤트함수
            this.setState({ [e.target.id]: e.target.value });//화면처리
            this.state.pageNo = e.target.value;//js처리
            var mapContainer = document.getElementById('map');
            this.removeAllChildNods(mapContainer);//기존카카오맵겍체지우기
            this.getData();
        }; //위치무관

        repeatPage(totalCount) { //검색된전체갯수를10개씩나누어출력될디자인페이지를구한다.
            var pagingNo = Math.ceil(this.state.totalCount / 10);
            var arr = [];
            for (var i = 1; i <= pagingNo; i++) {
                arr.push(
                    <option key={i} value={i}>{i}</option>
                );
            }
            return arr;
        }
        getData() {

            var url = 'http://localhost:4000/openapi/getdata?keyword=' + this.state.keyword + '&pageNo=' +
                this.state.pageNo;;
            fetch(url, { method: 'get' }) //체인방식으로 실행. 장점은 줄 순서대로각각실행결과가마무리된후다음줄이실행된다.
                .then(response => response.json()) //응답데이터를 json 형태로 변환
                .then(contents => { //json으로 변환된 응답데이터인 contents 를가지고 구현하는내용

                    this.state.totalCount = contents['response']['body']['totalCount']['_text'];//js처리
                    this.setState({ totalCount: contents['response']['body']['totalCount']['_text'] });//화면처리
                    var positions = [];//빈 배열 선언
                    var jsonData;
                    jsonData = contents['response']['body']['items'];
                    console.log(jsonData);
                    jsonData['item'].forEach((element) => {//람다식 사용 function(element) {}
                        positions.push(
                            {
                                content: "<div>" + element["csNm"]['_text'] + "</div>",//충전소 이름
                                latlng: new kakao.maps.LatLng(element["lat"]['_text'], element["longi"]['_text']) // 위도(latitude), 경도longitude)
                            }
                        );
                    });
                    // 기존코드부분중략…

                    var index = parseInt(positions.length / 2);//배열은 인덱스순서 값을 필수로 가지고, 여기서는 반환값의개수로구한다.
                    console.log(jsonData["item"][index]["lat"]['_text']);
                    var mapContainer = document.getElementById('map'), // 지도를 표시할 div  
                        mapOption = {
                            center: new kakao.maps.LatLng(jsonData["item"][index]["lat"]['_text'], jsonData["item"][index]["longi"]['_text']),
                            //    center: new kakao.maps.LatLng(33.450701, 126.570667), // 지도의 중심좌표
                            level: 10 // 지도의 확대 레벨
                        };

                    var map = new kakao.maps.Map(mapContainer, mapOption); // 지도를 생성합니다


                    // 마커를 표시할 위치와 내용을 가지고 있는 객체 배열입니다 
                    // var positions = [
                    //     {
                    //         content: '<div>카카오</div>', 
                    //         latlng: new kakao.maps.LatLng(33.450705, 126.570677)
                    //     },
                    //     {
                    //         content: '<div>생태연못</div>', 
                    //         latlng: new kakao.maps.LatLng(33.450936, 126.569477)
                    //     },
                    //     {
                    //         content: '<div>텃밭</div>', 
                    //         latlng: new kakao.maps.LatLng(33.450879, 126.569940)
                    //     },
                    //     {
                    //         content: '<div>근린공원</div>',
                    //         latlng: new kakao.maps.LatLng(33.451393, 126.570738)
                    //     }
                    // ];

                    for (var i = 0; i < positions.length; i++) {
                        // 마커를 생성합니다
                        var marker = new kakao.maps.Marker({
                            map: map, // 마커를 표시할 지도
                            position: positions[i].latlng // 마커의 위치
                        });

                        // 마커에 표시할 인포윈도우를 생성합니다 
                        var infowindow = new kakao.maps.InfoWindow({
                            content: positions[i].content // 인포윈도우에 표시할 내용
                        });

                        // 마커에 mouseover 이벤트와 mouseout 이벤트를 등록합니다
                        // 이벤트 리스너로는 클로저를 만들어 등록합니다 
                        // for문에서 클로저를 만들어 주지 않으면 마지막 마커에만 이벤트가 등록됩니다
                        kakao.maps.event.addListener(marker, 'mouseover', makeOverListener(map, marker, infowindow));
                        kakao.maps.event.addListener(marker, 'mouseout', makeOutListener(infowindow));
                    }

                    // 인포윈도우를 표시하는 클로저를 만드는 함수입니다 
                    function makeOverListener(map, marker, infowindow) {
                        return function () {
                            infowindow.open(map, marker);
                        };
                    }

                    // 인포윈도우를 닫는 클로저를 만드는 함수입니다 
                    function makeOutListener(infowindow) {
                        return function () {
                            infowindow.close();
                        };
                    }

                })
                .catch((err) => console.log('에러: ' + err + '때문에 접속할 수 없습니다.')); //.then함수 끝 추가.위 기존 코드 중략 부분 중 positions 변수부분지운다.

        }//getdata() 함수 끝

        componentDidMount() {
            this.getData();

        }

        render() {

            return (
                <div>
                    <h2><a href='/'>클래스형 전기차 충전소 위치</a></h2>
                    <span>충전소도시검색(아래검색할시를입력하고검색버튼을누른다.)</span>
                    <input className="form-control" type="text" id="keyword" onChange={this.onChange}
                        value={this.state.keyword} />
                    <input className="form-control btn btn-primary" type="button" onClick={this.onSearch} value="검색" />
                    
                    <span>페이지이동(아래번호를선택하면화면이전환된다.)</span>
                    <select className="form-select"
                        id="pageNo" onChange={this.onPage} value={this.state.pageNo}>

                        {this.repeatPage(this.state.totalCount)}

                    </select>{ /*  //--리액트링크태그를사용하기위해서상단에import {Link} from "react-router-dom"; --> */}
                    <Link to="/"><button className="form-control btn btn-primary" id="btnHome">홈으로</button></Link>
                    <div id="map" style={{ width: "100%", height: "80vh" }}></div>
                </div>
            );
        }
    }
    
KakaoMap.propTypes = {

    };

export default KakaoMap;