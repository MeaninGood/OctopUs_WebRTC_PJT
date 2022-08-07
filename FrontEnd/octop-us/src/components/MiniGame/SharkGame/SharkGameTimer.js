import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
// import { BASE_URL, config } from "../../../api/BASE_URL";
// import axios from "axios";

const Container = styled.div`
  margin-top: 30px;
  width: 100px;
  height: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 30px;
`;

const Front = styled.div`
  text-align: right;
`;

function SharkGameTimer({ isFinish }) {
  const [timeElapsed, setTimeElapsed] = useState(30); // 30초 제한
  const [playTime, setPlayTime] = useState(0); // 1초씩 줄어들기
  const record = useRef();
  record.current = playTime;

  // 보드판 위에 뜨는 타이머
  useEffect(() => {
    const timer = setInterval(() => {
      if (timeElapsed > 0) {
        setTimeElapsed((timeElapsed) => timeElapsed - 1);
      }
      if (timeElapsed === 0) {
        clearInterval(timer);
      }
    }, 1000);
    return () => {
      clearInterval(timer);
      console.log("지금 몇초인지" + record.current / 1000);
    };
  }, [timeElapsed]);

  // 본인 playTime 기록
  useEffect(() => {
    const playtimecount = setInterval(() => {
      setPlayTime((playTime) => playTime + 30);
    }, 30);
    return () => {
      clearInterval(playtimecount);
    };
  }, []);

  // 게임 끝났을 때 내 기록 보내기
  useEffect(() => {
    if (isFinish) {
      const time = playTime / 1000;
      console.log(`게임 끝! 내 기록: ${time}`);
      // axios.post(BASE_URL + "games/mini/shark", { time }, config);
    }
  }, [isFinish]);

  return (
    <Container>
      <Front>{timeElapsed}</Front>
    </Container>
  );
}

export default SharkGameTimer;
