import React from "react";
import axios from "axios";
import { BASE_URL } from "../../api/BASE_URL";

export const ClickStart = (roomId, userList, userName) => {
  //게임 초기 정보 db에 넣어주기
  console.log("필요 파라미터 잘 받았는지 확인!", roomId, userList, userName);
  const data = {
    roomId: roomId,
    users: userList,
  };
  axios
    .post(`${BASE_URL}/games`, JSON.stringify(data), {
      headers: {
        "Content-Type": `application/json`,
      },
    })
    .then((res) => {
      console.log("post로 게임 유저, 룸 정보 잘 넘겨짐!", res.data);
      // 방의 상태를 게임 중 상태로 변경
      axios
        .put(`${BASE_URL}/rooms/update/status/start/${roomId}`, {
          headers: {
            "Content-Type": `application/json`,
          },
        })
        .then((res) => console.log("게임 중으로 변경 성공!", res.data))
        .catch((err) => console.log("게임 중으로 변경 실패!", err));
    })
    .catch((err) => console.log(err));
  // 방의 상태를 게임 중 상태로 변경
  // axios.put(`${BASE_URL}/rooms/update/status/start/${roomId}`, {
  //     headers: {
  //     "Content-Type": `application/json`,
  //     }})
  //     .then((res) => console.log("게임 중으로 변경 성공!", res.data))
  //     .catch((err) => console.log("게임 중으로 변경 실패!", err))
};
export default ClickStart;
